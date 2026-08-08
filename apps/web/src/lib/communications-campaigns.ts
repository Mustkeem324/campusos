import 'server-only';

import crypto from 'node:crypto';
import type { RoleType } from '@prisma/client';

import { requireActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { CommunicationError } from './communications';
import { calculateSmsSegments } from './communications-templates';
import { isCommunicationChannel, type CommunicationChannel } from './communications-types';

const DISPATCH_ROLES = new Set<RoleType>(['INSTITUTION_ADMIN', 'REGISTRAR', 'DEAN', 'SUPER_ADMIN']);

function asNumber(value: bigint | number | null | undefined) {
  return typeof value === 'bigint' ? Number(value) : Number(value ?? 0);
}

async function resolveAudience(tenantId: string, audience: Record<string, unknown>) {
  const type = String(audience.type || '').toUpperCase();
  const scopeId = audience.scopeId ? String(audience.scopeId) : null;
  if (type === 'ALL_STUDENTS') return prisma.user.findMany({ where: { tenantId, role: 'STUDENT', isActive: true }, select: { id: true, role: true }, take: 50_000 });
  if (type === 'ALL_PARENTS') return prisma.user.findMany({ where: { tenantId, role: 'PARENT', isActive: true }, select: { id: true, role: true }, take: 50_000 });
  if (type === 'ALL_FACULTY') return prisma.user.findMany({ where: { tenantId, role: 'FACULTY', isActive: true }, select: { id: true, role: true }, take: 20_000 });
  if (type === 'ALL_STAFF') return prisma.user.findMany({ where: { tenantId, isActive: true, role: { notIn: ['STUDENT', 'PARENT'] } }, select: { id: true, role: true }, take: 20_000 });
  if (type === 'DEPARTMENT' && scopeId) {
    const staff = await prisma.staff.findMany({ where: { tenantId, departmentId: scopeId }, include: { user: { select: { id: true, role: true, isActive: true } } }, take: 20_000 });
    return staff.filter((item) => item.user.isActive).map((item) => item.user);
  }
  if (type === 'SECTION' && scopeId) {
    const students = await prisma.student.findMany({ where: { tenantId, sectionId: scopeId }, include: { user: { select: { id: true, role: true, isActive: true } } }, take: 20_000 });
    return students.filter((item) => item.user.isActive).map((item) => item.user);
  }
  throw new CommunicationError('Campaign audience is invalid or unsupported.', 400, 'INVALID_AUDIENCE');
}

async function paidChannelState(tenantId: string, channel: 'SMS' | 'WHATSAPP') {
  const rows = await prisma.$queryRaw<Array<{
    lifecycle: string;
    billing_mode: string;
    available_units: bigint | number | null;
    sms_unit_cost_minor: bigint | number | null;
    whatsapp_unit_cost_minor: bigint | number | null;
    currency: string | null;
  }>>`
    SELECT s.lifecycle, s.billing_mode, w.available_units,
           pv.sms_unit_cost_minor, pv.whatsapp_unit_cost_minor, pv.currency
    FROM campusos_communications.tenant_channel_subscriptions s
    LEFT JOIN campusos_communications.credit_wallets w ON w.tenant_id=s.tenant_id AND w.channel=s.channel
    LEFT JOIN campusos_communications.pricing_versions pv ON pv.id=s.pricing_version_id
    WHERE s.tenant_id=${tenantId}::uuid AND s.channel=${channel} LIMIT 1
  `;
  return rows[0] ?? null;
}

function recipientType(role: RoleType) {
  if (role === 'STUDENT') return 'STUDENT';
  if (role === 'PARENT') return 'PARENT';
  if (role === 'FACULTY') return 'FACULTY';
  if (role === 'INSTITUTION_ADMIN') return 'INSTITUTION_ADMIN';
  return 'OTHER_STAFF';
}

export async function estimateCommunicationCampaign(campaignId: string) {
  const context = await requireActiveUserContext();
  if (!DISPATCH_ROLES.has(context.activeRole)) throw new CommunicationError('Campaign estimation is not available for this role.', 403, 'FORBIDDEN');
  const rows = await prisma.$queryRaw<Array<{ channels: string[]; audience_spec: unknown; content_spec: unknown; status: string }>>`
    SELECT channels, audience_spec, content_spec, status
    FROM campusos_communications.campaigns
    WHERE id=${campaignId}::uuid AND tenant_id=${context.tenantId}::uuid LIMIT 1
  `;
  const campaign = rows[0];
  if (!campaign) throw new CommunicationError('Campaign not found.', 404, 'NOT_FOUND');
  const audience = await resolveAudience(context.tenantId, campaign.audience_spec as Record<string, unknown>);
  const content = campaign.content_spec as Record<string, unknown>;
  const body = String(content.body || '');
  const smsSegments = calculateSmsSegments(body).segments;
  let estimatedCostMinor = 0;
  const perChannel: Record<string, { recipients: number; units: number; estimatedCostMinor: number; currency: string }> = {};
  for (const raw of campaign.channels) {
    if (!isCommunicationChannel(raw)) continue;
    const channel = raw as CommunicationChannel;
    const units = channel === 'SMS' ? audience.length * smsSegments : channel === 'WHATSAPP' ? audience.length : 0;
    let cost = 0;
    let currency = 'INR';
    if (channel === 'SMS' || channel === 'WHATSAPP') {
      const state = await paidChannelState(context.tenantId, channel);
      if (!state || state.lifecycle !== 'ACTIVE') throw new CommunicationError(`${channel} add-on is not active.`, 402, 'PAID_CHANNEL_NOT_ACTIVE');
      const unitCost = asNumber(channel === 'SMS' ? state.sms_unit_cost_minor : state.whatsapp_unit_cost_minor);
      cost = units * unitCost;
      currency = state.currency ?? 'INR';
      if (state.billing_mode === 'PREPAID' && asNumber(state.available_units) < units) throw new CommunicationError(`Insufficient ${channel} credits for this campaign.`, 402, 'INSUFFICIENT_CREDITS');
    }
    perChannel[channel] = { recipients: audience.length, units, estimatedCostMinor: cost, currency };
    estimatedCostMinor += cost;
  }
  return { recipients: audience.length, smsSegmentsPerRecipient: smsSegments, estimatedCostMinor, perChannel };
}

async function reserveCampaignCredits(tenantId: string, campaignId: string, channel: 'SMS' | 'WHATSAPP', units: number, estimatedCostMinor: number, currency: string) {
  const state = await paidChannelState(tenantId, channel);
  if (!state || state.lifecycle !== 'ACTIVE') throw new CommunicationError(`${channel} add-on is not active.`, 402, 'PAID_CHANNEL_NOT_ACTIVE');
  if (state.billing_mode !== 'PREPAID') return;
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.$queryRaw<Array<{ available_units: bigint | number }>>`
      SELECT available_units FROM campusos_communications.credit_wallets
      WHERE tenant_id=${tenantId}::uuid AND channel=${channel} FOR UPDATE
    `;
    if (asNumber(wallet[0]?.available_units) < units) throw new CommunicationError(`Insufficient ${channel} credits.`, 402, 'INSUFFICIENT_CREDITS');
    await tx.$executeRaw`
      UPDATE campusos_communications.credit_wallets
      SET available_units=available_units-${units}, reserved_units=reserved_units+${units}, updated_at=now()
      WHERE tenant_id=${tenantId}::uuid AND channel=${channel}
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_communications.credit_transactions
        (tenant_id, channel, transaction_type, units, cost_minor, currency, reference_type, reference_id)
      VALUES (${tenantId}::uuid, ${channel}, 'RESERVE', ${units}, ${estimatedCostMinor}, ${currency}, 'CAMPAIGN', ${campaignId})
    `;
  });
}

export async function dispatchCommunicationCampaign(campaignId: string) {
  const context = await requireActiveUserContext();
  if (!DISPATCH_ROLES.has(context.activeRole)) throw new CommunicationError('Campaign dispatch is not available for this role.', 403, 'FORBIDDEN');
  const campaigns = await prisma.$queryRaw<Array<{
    name: string;
    category: string;
    classification: string;
    status: string;
    channels: string[];
    audience_spec: unknown;
    content_spec: unknown;
    scheduled_at: Date | null;
  }>>`
    SELECT name, category, classification, status, channels, audience_spec, content_spec, scheduled_at
    FROM campusos_communications.campaigns
    WHERE id=${campaignId}::uuid AND tenant_id=${context.tenantId}::uuid FOR UPDATE
  `;
  const campaign = campaigns[0];
  if (!campaign) throw new CommunicationError('Campaign not found.', 404, 'NOT_FOUND');
  if (!['APPROVED', 'SCHEDULED'].includes(campaign.status)) throw new CommunicationError('Campaign must be approved before dispatch.', 409, 'CAMPAIGN_NOT_APPROVED');
  const estimate = await estimateCommunicationCampaign(campaignId);
  const audience = await resolveAudience(context.tenantId, campaign.audience_spec as Record<string, unknown>);
  const content = campaign.content_spec as Record<string, unknown>;
  const subject = String(content.subject || campaign.name).replace(/[\r\n]+/g, ' ').slice(0, 200);
  const body = String(content.body || '').slice(0, 10_000);
  if (!body) throw new CommunicationError('Campaign body is empty.', 400, 'INVALID_CAMPAIGN');

  for (const raw of campaign.channels) {
    if ((raw === 'SMS' || raw === 'WHATSAPP') && estimate.perChannel[raw]) {
      const item = estimate.perChannel[raw];
      await reserveCampaignCredits(context.tenantId, campaignId, raw, item.units, item.estimatedCostMinor, item.currency);
    }
  }

  let queued = 0;
  const now = new Date();
  const scheduledAt = campaign.scheduled_at && campaign.scheduled_at > now ? campaign.scheduled_at : null;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`UPDATE campusos_communications.campaigns SET status=${scheduledAt ? 'SCHEDULED' : 'SENDING'}, updated_at=now() WHERE id=${campaignId}::uuid`;
    for (const user of audience) {
      for (const raw of campaign.channels) {
        if (!isCommunicationChannel(raw)) continue;
        const channel = raw as CommunicationChannel;
        const id = crypto.randomUUID();
        const key = `campaign:${campaignId}:${user.id}:${channel}`;
        if (channel === 'IN_APP') {
          await tx.$executeRaw`
            INSERT INTO campusos_communications.messages
              (id, tenant_id, channel, category, classification, recipient_user_id, recipient_type, subject_snapshot, variables, body_hash, status, submitted_at, delivered_at, idempotency_key, correlation_id)
            VALUES
              (${id}::uuid, ${context.tenantId}::uuid, 'IN_APP', ${campaign.category}, ${campaign.classification}, ${user.id}::uuid, ${recipientType(user.role)}, ${subject}, ${JSON.stringify({ custom: { subject, body }, campaignId })}::jsonb, ${crypto.createHash('sha256').update(body).digest('hex')}, 'DELIVERED', now(), now(), ${key}, ${`campaign:${campaignId}`})
            ON CONFLICT (tenant_id, channel, idempotency_key) DO NOTHING
          `;
          await tx.$executeRaw`
            INSERT INTO campusos_communications.in_app_notifications (tenant_id, user_id, message_id, category, priority, title, body, target_url)
            SELECT ${context.tenantId}::uuid, ${user.id}::uuid, ${id}::uuid, ${campaign.category}, ${campaign.category === 'EMERGENCY' ? 'EMERGENCY' : 'NORMAL'}, ${subject}, ${body.slice(0, 1200)}, '/notifications'
            WHERE EXISTS (SELECT 1 FROM campusos_communications.messages WHERE id=${id}::uuid)
          `;
        } else {
          await tx.$executeRaw`
            INSERT INTO campusos_communications.messages
              (id, tenant_id, channel, category, classification, recipient_user_id, recipient_type, subject_snapshot, variables, body_hash, status, scheduled_at, next_attempt_at, idempotency_key, correlation_id)
            VALUES
              (${id}::uuid, ${context.tenantId}::uuid, ${channel}, ${campaign.category}, ${campaign.classification}, ${user.id}::uuid, ${recipientType(user.role)}, ${subject}, ${JSON.stringify({ custom: { subject, body }, campaignId })}::jsonb, ${crypto.createHash('sha256').update(body).digest('hex')}, ${scheduledAt ? 'SCHEDULED' : 'PENDING'}, ${scheduledAt}, ${scheduledAt ?? now}, ${key}, ${`campaign:${campaignId}`})
            ON CONFLICT (tenant_id, channel, idempotency_key) DO NOTHING
          `;
          if (channel === 'SMS' || channel === 'WHATSAPP') {
            const units = channel === 'SMS' ? calculateSmsSegments(body).segments : 1;
            const per = estimate.perChannel[channel];
            const perMessageCost = per && per.units ? Math.floor(per.estimatedCostMinor / per.units * units) : 0;
            await tx.$executeRaw`
              INSERT INTO campusos_communications.usage_ledger
                (tenant_id, message_id, channel, state, billing_units, estimated_cost_minor, currency, metadata)
              SELECT ${context.tenantId}::uuid, ${id}::uuid, ${channel}, 'RESERVED', ${units}, ${perMessageCost}, ${per?.currency ?? 'INR'}, ${JSON.stringify({ campaignId })}::jsonb
              WHERE EXISTS (SELECT 1 FROM campusos_communications.messages WHERE id=${id}::uuid)
            `;
          }
        }
        queued += 1;
      }
    }
  });
  return { campaignId, recipients: audience.length, queued, scheduled: Boolean(scheduledAt), estimate };
}
