import 'server-only';

import crypto from 'node:crypto';

import { Prisma, type RoleType } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import {
  BASE_COMMUNICATION_TEMPLATES,
  calculateSmsSegments,
  renderBaseTemplate,
  renderText,
} from './communications-templates';
import {
  COMMUNICATION_CATEGORIES,
  COMMUNICATION_CHANNELS,
  EVENT_POLICIES,
  isCommunicationChannel,
  isCommunicationEventType,
  type CommunicationCategory,
  type CommunicationChannel,
  type CommunicationEventInput,
  type CommunicationEventType,
  type CommunicationRecipientType,
  type RecipientTarget,
} from './communications-types';

export class CommunicationError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = 'COMMUNICATION_ERROR') {
    super(message);
    this.name = 'CommunicationError';
    this.status = status;
    this.code = code;
  }
}

const ADMIN_ROLES = new Set<RoleType>(['INSTITUTION_ADMIN', 'REGISTRAR', 'DEAN', 'SUPER_ADMIN']);
const PLATFORM_ADMIN_ROLES = new Set<RoleType>(['SUPER_ADMIN']);
const CAMPAIGN_ROLES = new Set<RoleType>(['INSTITUTION_ADMIN', 'REGISTRAR', 'DEAN', 'HOD', 'SUPER_ADMIN']);
const CRITICAL_CATEGORIES = new Set<CommunicationCategory>(['SECURITY', 'EMERGENCY']);

function asNumber(value: bigint | number | null | undefined) {
  return typeof value === 'bigint' ? Number(value) : Number(value ?? 0);
}

function asStringRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function dedupeTargets(targets: RecipientTarget[]) {
  return Array.from(new Map(targets.map((target) => [`${target.userId}:${target.recipientType}`, target])).values());
}

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyInternalCommunicationSecret(value: string | null) {
  const configured = process.env.NAVEMORA_COMMUNICATION_INTERNAL_SECRET || '';
  if (configured.length < 32 || !value || !safeEqual(configured, value)) {
    throw new CommunicationError('Trusted communication event authentication failed.', 401, 'INVALID_INTERNAL_CREDENTIAL');
  }
}

export async function requireCommunicationAdmin() {
  const context = await requireActiveUserContext();
  if (!ADMIN_ROLES.has(context.activeRole)) throw new CommunicationError('Communication administration is not available for this role.', 403, 'FORBIDDEN');
  return context;
}

export async function requirePlatformCommunicationAdmin() {
  const context = await requireActiveUserContext();
  if (!PLATFORM_ADMIN_ROLES.has(context.activeRole)) throw new CommunicationError('Platform communication administration requires Super Admin authority.', 403, 'FORBIDDEN');
  return context;
}

async function ensureTenantDefaults(tenantId: string) {
  await prisma.$transaction([
    prisma.$executeRaw`INSERT INTO campusos_communications.settings (tenant_id) VALUES (${tenantId}::uuid) ON CONFLICT (tenant_id) DO NOTHING`,
    prisma.$executeRaw`INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled) VALUES (${tenantId}::uuid, 'EMAIL', true) ON CONFLICT (tenant_id, channel) DO NOTHING`,
    prisma.$executeRaw`INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled) VALUES (${tenantId}::uuid, 'IN_APP', true) ON CONFLICT (tenant_id, channel) DO NOTHING`,
    prisma.$executeRaw`INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled) VALUES (${tenantId}::uuid, 'SMS', false) ON CONFLICT (tenant_id, channel) DO NOTHING`,
    prisma.$executeRaw`INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled) VALUES (${tenantId}::uuid, 'WHATSAPP', false) ON CONFLICT (tenant_id, channel) DO NOTHING`,
  ]);
}

async function audit(context: ActiveUserContext | null, input: { tenantId?: string | null; action: string; targetType: string; targetId?: string | null; before?: unknown; after?: unknown; reason?: string | null; correlationId?: string | null }) {
  const tenantId = input.tenantId ?? context?.tenantId ?? null;
  await prisma.$executeRaw`
    INSERT INTO campusos_communications.audit_events
      (tenant_id, actor_user_id, actor_role, action, target_type, target_id, before_state, after_state, reason, correlation_id)
    VALUES
      (${tenantId}::uuid, ${context?.userId ?? null}::uuid, ${context?.activeRole ?? null}, ${input.action}, ${input.targetType}, ${input.targetId ?? null}, ${JSON.stringify(input.before ?? null)}::jsonb, ${JSON.stringify(input.after ?? null)}::jsonb, ${input.reason ?? null}, ${input.correlationId ?? null})
  `;
}

function templateKeyForEvent(eventType: CommunicationEventType) {
  const direct: Partial<Record<CommunicationEventType, string>> = {
    USER_ACCOUNT_CREATED: 'welcome_account_created',
    EMAIL_VERIFICATION_REQUESTED: 'email_verification',
    PASSWORD_RESET_REQUESTED: 'password_reset',
    PASSWORD_CHANGED: 'security_alert',
    LOGIN_SECURITY_ALERT: 'security_alert',
    ADMISSION_APPLICATION_SUBMITTED: 'admission_application_received',
    ADMISSION_DOCUMENT_REQUIRED: 'admission_documents_required',
    ADMISSION_OFFERED: 'admission_offer',
    ADMISSION_CONFIRMED: 'admission_confirmed',
    STUDENT_ENROLLED: 'enrollment_confirmation',
    ATTENDANCE_SHORTAGE_WARNING: 'attendance_warning',
    ATTENDANCE_CRITICAL_WARNING: 'attendance_critical_warning',
    ATTENDANCE_DAILY_SUMMARY: 'attendance_digest',
    ATTENDANCE_WEEKLY_SUMMARY: 'attendance_digest',
    ATTENDANCE_MONTHLY_SUMMARY: 'attendance_digest',
    ATTENDANCE_DIGEST_READY: 'attendance_digest',
    TIMETABLE_PUBLISHED: 'timetable_published',
    CLASS_RESCHEDULED: 'class_rescheduled',
    CLASS_CANCELLED: 'class_cancelled',
    EXAM_SCHEDULE_PUBLISHED: 'exam_schedule',
    EXAM_REMINDER: 'exam_reminder',
    EXAM_ADMIT_CARD_RELEASED: 'admit_card_available',
    ADMIT_CARD_AVAILABLE: 'admit_card_available',
    EXAM_RESCHEDULED: 'exam_rescheduled',
    SECURE_EXAM_READINESS_REMINDER: 'secure_exam_readiness',
    RESULT_PUBLISHED: 'result_published',
    REVALUATION_UPDATED: 'revaluation_update',
    INVOICE_GENERATED: 'invoice_issued',
    INVOICE_ISSUED: 'invoice_issued',
    INSTALLMENT_DUE: 'fee_due',
    PAYMENT_DUE: 'fee_due',
    PAYMENT_DUE_SOON: 'fee_due',
    FEE_DUE_REMINDER: 'fee_due',
    FEE_OVERDUE: 'fee_overdue',
    PAYMENT_RECEIVED: 'payment_confirmation',
    PAYMENT_CONFIRMED: 'payment_confirmation',
    PAYMENT_SUCCESS: 'payment_confirmation',
    PAYMENT_FAILED: 'payment_failure',
    RECEIPT_GENERATED: 'payment_receipt',
    RECEIPT_AVAILABLE: 'payment_receipt',
    REFUND_UPDATED: 'refund_update',
    SCHOLARSHIP_UPDATED: 'scholarship_update',
    HOSTEL_ROOM_ALLOCATED: 'hostel_allocation',
    ROOM_ALLOCATED: 'hostel_allocation',
    HOSTEL_OUTPASS_APPROVED: 'hostel_outpass_update',
    HOSTEL_OUTPASS_REJECTED: 'hostel_outpass_update',
    OUTPASS_STATUS_CHANGED: 'hostel_outpass_update',
    HOSTEL_NOTICE: 'hostel_notice',
    TRANSPORT_ROUTE_ASSIGNED: 'transport_assignment',
    TRANSPORT_BUS_DELAYED: 'transport_delay',
    BUS_DELAYED: 'transport_delay',
    TRANSPORT_ROUTE_CHANGED: 'transport_route_update',
    ROUTE_CHANGED: 'transport_route_update',
    LIBRARY_DUE_REMINDER: 'library_due',
    LOAN_DUE_SOON: 'library_due',
    LIBRARY_OVERDUE: 'library_overdue',
    LOAN_OVERDUE: 'library_overdue',
    LIBRARY_RESERVATION_READY: 'library_reservation_ready',
    RESERVATION_READY: 'library_reservation_ready',
    RESEARCH_MILESTONE_DUE: 'research_milestone',
    MILESTONE_DUE: 'research_milestone',
    THESIS_REVIEW_UPDATED: 'thesis_review',
    VIVA_SCHEDULED: 'viva_schedule',
    HELPDESK_CASE_CREATED: 'helpdesk_update',
    HELPDESK_CASE_UPDATED: 'helpdesk_update',
    HELPDESK_CASE_RESOLVED: 'helpdesk_update',
    LEAVE_REQUEST_UPDATED: 'leave_decision',
    PAYSLIP_AVAILABLE: 'payslip_available',
    EVENT_INVITATION: 'event_invitation',
    EVENT_REMINDER: 'event_reminder',
    EVENT_CANCELLED: 'event_cancelled',
    EMERGENCY_ALERT: 'emergency_alert',
    CAMPUS_CLOSURE: 'emergency_alert',
    WEATHER_ALERT: 'emergency_alert',
    SECURITY_ALERT: 'emergency_alert',
    TRANSPORT_EMERGENCY: 'emergency_alert',
    HEALTH_NOTICE: 'emergency_alert',
    EXAM_EMERGENCY: 'emergency_alert',
    SYSTEM_MAINTENANCE: 'platform_maintenance',
    INSTITUTION_SUBSCRIPTION_UPDATED: 'institution_subscription',
    COMMUNICATION_CREDITS_LOW: 'communication_credits_low',
    COMMUNICATION_PROVIDER_CONFIGURATION_FAILED: 'provider_configuration_failure',
  };
  const selected = direct[eventType] ?? EVENT_POLICIES[eventType].templateKey;
  return BASE_COMMUNICATION_TEMPLATES[selected] ? selected : 'platform_maintenance';
}

async function resolveRecipients(input: CommunicationEventInput): Promise<RecipientTarget[]> {
  const policy = EVENT_POLICIES[input.eventType];
  const targets: RecipientTarget[] = [];

  if (input.subjectType === 'USER') {
    const user = await prisma.user.findFirst({ where: { id: input.subjectId, tenantId: input.tenantId, isActive: true }, select: { id: true, role: true } });
    if (user) targets.push({ userId: user.id, recipientType: roleToRecipient(user.role) });
  }

  if (input.subjectType === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { id: input.subjectId, tenantId: input.tenantId },
      include: { user: { select: { id: true, isActive: true } }, guardian: { include: { user: { select: { id: true, isActive: true } } } } },
    });
    if (student?.user.isActive && policy.student !== false) targets.push({ userId: student.user.id, recipientType: 'STUDENT' });
    if (policy.guardian && student?.guardian?.user.isActive) targets.push({ userId: student.guardian.user.id, recipientType: 'PARENT' });
  }

  if (input.subjectType === 'STAFF') {
    const staff = await prisma.staff.findFirst({ where: { id: input.subjectId, tenantId: input.tenantId }, include: { user: { select: { id: true, role: true, isActive: true } } } });
    if (staff?.user.isActive) targets.push({ userId: staff.user.id, recipientType: roleToRecipient(staff.user.role) });
  }

  if (policy.institutionAdmin) {
    const admins = await prisma.user.findMany({ where: { tenantId: input.tenantId, isActive: true, role: { in: ['INSTITUTION_ADMIN', 'REGISTRAR', 'DEAN'] } }, select: { id: true, role: true }, take: 200 });
    targets.push(...admins.map((user) => ({ userId: user.id, recipientType: roleToRecipient(user.role) })));
  }

  if (policy.faculty && input.subjectType === 'INSTITUTION') {
    const faculty = await prisma.user.findMany({ where: { tenantId: input.tenantId, isActive: true, role: 'FACULTY' }, select: { id: true }, take: 5000 });
    targets.push(...faculty.map((user) => ({ userId: user.id, recipientType: 'FACULTY' as const })));
  }

  if (policy.student && input.subjectType === 'INSTITUTION') {
    const students = await prisma.user.findMany({ where: { tenantId: input.tenantId, isActive: true, role: 'STUDENT' }, select: { id: true }, take: 10000 });
    targets.push(...students.map((user) => ({ userId: user.id, recipientType: 'STUDENT' as const })));
  }

  if (policy.guardian && input.subjectType === 'INSTITUTION') {
    const guardians = await prisma.user.findMany({ where: { tenantId: input.tenantId, isActive: true, role: 'PARENT' }, select: { id: true }, take: 10000 });
    targets.push(...guardians.map((user) => ({ userId: user.id, recipientType: 'PARENT' as const })));
  }

  if (policy.superAdmin && ['SYSTEM_MAINTENANCE','SERVICE_INCIDENT'].includes(input.eventType)) {
    const superAdmins = await prisma.user.findMany({ where: { tenantId: input.tenantId, isActive: true, role: 'SUPER_ADMIN' }, select: { id: true }, take: 50 });
    targets.push(...superAdmins.map((user) => ({ userId: user.id, recipientType: 'SUPER_ADMIN' as const })));
  }

  return dedupeTargets(targets);
}

function roleToRecipient(role: RoleType): CommunicationRecipientType {
  const map: Partial<Record<RoleType, CommunicationRecipientType>> = {
    STUDENT: 'STUDENT', PARENT: 'PARENT', FACULTY: 'FACULTY', HOD: 'HOD', DEAN: 'DEAN',
    EXAMINATION_CONTROLLER: 'EXAMINATION_CONTROLLER', REGISTRAR: 'REGISTRAR', FINANCE_OFFICER: 'FINANCE', ACCOUNTANT: 'FINANCE', HR_ADMIN: 'HR',
    LIBRARIAN: 'LIBRARIAN', WARDEN: 'WARDEN', TRANSPORT_MANAGER: 'TRANSPORT_STAFF', INSTITUTION_ADMIN: 'INSTITUTION_ADMIN', SUPER_ADMIN: 'SUPER_ADMIN',
  };
  return map[role] ?? 'OTHER_STAFF';
}

async function channelAllowed(input: { tenantId: string; userId: string; category: CommunicationCategory; channel: CommunicationChannel; mandatory: boolean; classification: string }) {
  if ((input.classification === 'HIGHLY_CONFIDENTIAL') && ['SMS','WHATSAPP','PUSH'].includes(input.channel)) return { allowed: false, reason: 'CLASSIFICATION_RESTRICTED' };
  const settings = await prisma.$queryRaw<Array<{ enabled: boolean }>>`
    SELECT enabled FROM campusos_communications.channel_settings WHERE tenant_id=${input.tenantId}::uuid AND channel=${input.channel} LIMIT 1
  `;
  if (!settings[0]?.enabled) return { allowed: false, reason: 'TENANT_CHANNEL_DISABLED' };

  const suppression = await prisma.$queryRaw<Array<{ blocked: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM campusos_communications.recipient_suppressions
      WHERE tenant_id=${input.tenantId}::uuid AND user_id=${input.userId}::uuid AND channel=${input.channel}
        AND (expires_at IS NULL OR expires_at > now())
    ) AS blocked
  `;
  if (suppression[0]?.blocked) return { allowed: false, reason: 'SUPPRESSED' };

  if (!input.mandatory && !CRITICAL_CATEGORIES.has(input.category)) {
    const preference = await prisma.$queryRaw<Array<{ enabled: boolean }>>`
      SELECT enabled FROM campusos_communications.communication_preferences
      WHERE tenant_id=${input.tenantId}::uuid AND user_id=${input.userId}::uuid AND category=${input.category} AND channel=${input.channel}
      LIMIT 1
    `;
    if (preference[0] && !preference[0].enabled) return { allowed: false, reason: 'OPTED_OUT' };
  }

  if (input.category === 'MARKETING' && ['EMAIL','SMS','WHATSAPP','PUSH'].includes(input.channel)) {
    const consent = await prisma.$queryRaw<Array<{ state: string }>>`
      SELECT state FROM campusos_communications.communication_consents
      WHERE tenant_id=${input.tenantId}::uuid AND user_id=${input.userId}::uuid AND channel=${input.channel} AND purpose='MARKETING'
      ORDER BY created_at DESC LIMIT 1
    `;
    if (consent[0]?.state !== 'GRANTED') return { allowed: false, reason: 'CONSENT_REQUIRED' };
  }

  if (input.channel === 'SMS' || input.channel === 'WHATSAPP') {
    const subscription = await prisma.$queryRaw<Array<{ lifecycle: string; billing_mode: string }>>`
      SELECT lifecycle, billing_mode FROM campusos_communications.tenant_channel_subscriptions
      WHERE tenant_id=${input.tenantId}::uuid AND channel=${input.channel} LIMIT 1
    `;
    if (subscription[0]?.lifecycle !== 'ACTIVE') return { allowed: false, reason: 'PAID_CHANNEL_NOT_ACTIVE' };
  }

  return { allowed: true, reason: null };
}

async function reservePaidUnits(tenantId: string, channel: 'SMS' | 'WHATSAPP', messageId: string, units: number) {
  return prisma.$transaction(async (tx) => {
    const subscriptions = await tx.$queryRaw<Array<{ billing_mode: string; sms_unit_cost_minor: bigint | number | null; whatsapp_unit_cost_minor: bigint | number | null; currency: string | null }>>`
      SELECT s.billing_mode, pv.sms_unit_cost_minor, pv.whatsapp_unit_cost_minor, pv.currency
      FROM campusos_communications.tenant_channel_subscriptions s
      LEFT JOIN campusos_communications.pricing_versions pv ON pv.id=s.pricing_version_id
      WHERE s.tenant_id=${tenantId}::uuid AND s.channel=${channel} AND s.lifecycle='ACTIVE'
      LIMIT 1 FOR UPDATE OF s
    `;
    const subscription = subscriptions[0];
    if (!subscription) throw new CommunicationError(`${channel} add-on is not active.`, 402, 'PAID_CHANNEL_NOT_ACTIVE');
    const unitCost = asNumber(channel === 'SMS' ? subscription.sms_unit_cost_minor : subscription.whatsapp_unit_cost_minor);
    const estimatedCost = unitCost * units;

    if (subscription.billing_mode === 'PREPAID') {
      const wallets = await tx.$queryRaw<Array<{ available_units: bigint | number; reserved_units: bigint | number }>>`
        SELECT available_units, reserved_units FROM campusos_communications.credit_wallets
        WHERE tenant_id=${tenantId}::uuid AND channel=${channel} FOR UPDATE
      `;
      if (!wallets[0] || asNumber(wallets[0].available_units) < units) throw new CommunicationError(`Insufficient ${channel} credits.`, 402, 'INSUFFICIENT_CREDITS');
      await tx.$executeRaw`
        UPDATE campusos_communications.credit_wallets
        SET available_units=available_units-${units}, reserved_units=reserved_units+${units}, updated_at=now()
        WHERE tenant_id=${tenantId}::uuid AND channel=${channel}
      `;
      await tx.$executeRaw`
        INSERT INTO campusos_communications.credit_transactions (tenant_id, channel, transaction_type, units, cost_minor, currency, reference_type, reference_id)
        VALUES (${tenantId}::uuid, ${channel}, 'RESERVE', ${units}, ${estimatedCost}, ${subscription.currency ?? 'INR'}, 'MESSAGE', ${messageId})
      `;
    }

    await tx.$executeRaw`
      INSERT INTO campusos_communications.usage_ledger (tenant_id, message_id, channel, state, billing_units, estimated_cost_minor, currency)
      VALUES (${tenantId}::uuid, ${messageId}::uuid, ${channel}, 'RESERVED', ${units}, ${estimatedCost}, ${subscription.currency ?? 'INR'})
    `;
    return { units, estimatedCostMinor: estimatedCost, currency: subscription.currency ?? 'INR' };
  });
}

export async function publishCommunicationEvent(input: CommunicationEventInput) {
  if (!isCommunicationEventType(input.eventType)) throw new CommunicationError('Unsupported communication event type.', 400, 'UNSUPPORTED_EVENT');
  if (!input.tenantId || !input.subjectId || !input.correlationId || !input.idempotencyKey || !input.sourceModule) throw new CommunicationError('Communication event is missing required identity fields.', 400, 'INVALID_EVENT');
  const institution = await prisma.institution.findUnique({ where: { id: input.tenantId }, select: { id: true, name: true, logoUrl: true, primaryColor: true } });
  if (!institution) throw new CommunicationError('Institution not found.', 404, 'TENANT_NOT_FOUND');
  await ensureTenantDefaults(input.tenantId);

  const policy = EVENT_POLICIES[input.eventType];
  const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_communications.communication_events
      (tenant_id, event_type, category, subject_type, subject_id, correlation_id, idempotency_key, occurred_at, data, source_module)
    VALUES
      (${input.tenantId}::uuid, ${input.eventType}, ${policy.category}, ${input.subjectType}, ${input.subjectId}, ${input.correlationId}, ${input.idempotencyKey}, ${new Date(input.occurredAt)}, ${JSON.stringify(input.data ?? {})}::jsonb, ${input.sourceModule})
    ON CONFLICT (tenant_id, idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key
    RETURNING id
  `;
  const eventId = inserted[0]?.id;
  if (!eventId) throw new CommunicationError('Unable to persist communication event.', 500, 'EVENT_STORAGE_FAILED');

  const existingCount = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*)::bigint AS count FROM campusos_communications.messages WHERE communication_event_id=${eventId}::uuid`;
  if (asNumber(existingCount[0]?.count) > 0) return { eventId, duplicate: true, queued: 0, suppressed: 0 };

  const recipients = await resolveRecipients(input);
  const templateKey = templateKeyForEvent(input.eventType);
  const variables = { ...asStringRecord(input.data), institution: { name: institution.name } };
  const rendered = renderBaseTemplate({ key: templateKey, variables, institution });
  let queued = 0;
  let suppressed = 0;

  for (const recipient of recipients) {
    for (const channel of policy.defaultChannels) {
      const eligibility = await channelAllowed({ tenantId: input.tenantId, userId: recipient.userId, category: policy.category, channel, mandatory: policy.mandatory, classification: policy.classification });
      const messageId = crypto.randomUUID();
      const idempotencyKey = `${input.idempotencyKey}:${recipient.userId}:${channel}`;
      const channelText = channel === 'SMS' ? rendered.sms : channel === 'WHATSAPP' ? rendered.whatsapp : rendered.text;
      const bodyHash = hash(channelText);

      if (!eligibility.allowed) {
        await prisma.$executeRaw`
          INSERT INTO campusos_communications.messages
            (id, tenant_id, communication_event_id, channel, category, classification, recipient_user_id, recipient_type, subject_snapshot, variables, body_hash, status, failure_code, idempotency_key, correlation_id)
          VALUES
            (${messageId}::uuid, ${input.tenantId}::uuid, ${eventId}::uuid, ${channel}, ${policy.category}, ${policy.classification}, ${recipient.userId}::uuid, ${recipient.recipientType}, ${rendered.subject}, ${JSON.stringify(variables)}::jsonb, ${bodyHash}, 'SUPPRESSED', ${eligibility.reason}, ${idempotencyKey}, ${input.correlationId})
          ON CONFLICT (tenant_id, channel, idempotency_key) DO NOTHING
        `;
        suppressed += 1;
        continue;
      }

      if (channel === 'IN_APP') {
        await prisma.$transaction([
          prisma.$executeRaw`
            INSERT INTO campusos_communications.messages
              (id, tenant_id, communication_event_id, channel, category, classification, recipient_user_id, recipient_type, subject_snapshot, variables, body_hash, status, submitted_at, delivered_at, idempotency_key, correlation_id)
            VALUES
              (${messageId}::uuid, ${input.tenantId}::uuid, ${eventId}::uuid, 'IN_APP', ${policy.category}, ${policy.classification}, ${recipient.userId}::uuid, ${recipient.recipientType}, ${rendered.subject}, ${JSON.stringify(variables)}::jsonb, ${bodyHash}, 'DELIVERED', now(), now(), ${idempotencyKey}, ${input.correlationId})
            ON CONFLICT (tenant_id, channel, idempotency_key) DO NOTHING
          `,
          prisma.$executeRaw`
            INSERT INTO campusos_communications.in_app_notifications
              (tenant_id, user_id, message_id, category, priority, title, body, target_url)
            SELECT ${input.tenantId}::uuid, ${recipient.userId}::uuid, ${messageId}::uuid, ${policy.category}, ${policy.category === 'EMERGENCY' ? 'EMERGENCY' : policy.mandatory ? 'HIGH' : 'NORMAL'}, ${rendered.subject}, ${rendered.text.slice(0, 1200)}, ${BASE_COMMUNICATION_TEMPLATES[templateKey]?.ctaPath ?? '/notifications'}
            WHERE EXISTS (SELECT 1 FROM campusos_communications.messages WHERE id=${messageId}::uuid)
          `,
        ]);
        queued += 1;
        continue;
      }

      await prisma.$executeRaw`
        INSERT INTO campusos_communications.messages
          (id, tenant_id, communication_event_id, channel, category, classification, recipient_user_id, recipient_type, subject_snapshot, variables, body_hash, status, idempotency_key, correlation_id)
        VALUES
          (${messageId}::uuid, ${input.tenantId}::uuid, ${eventId}::uuid, ${channel}, ${policy.category}, ${policy.classification}, ${recipient.userId}::uuid, ${recipient.recipientType}, ${rendered.subject}, ${JSON.stringify(variables)}::jsonb, ${bodyHash}, 'PENDING', ${idempotencyKey}, ${input.correlationId})
        ON CONFLICT (tenant_id, channel, idempotency_key) DO NOTHING
      `;

      if (channel === 'SMS') {
        const sms = calculateSmsSegments(rendered.sms);
        try {
          await reservePaidUnits(input.tenantId, 'SMS', messageId, sms.segments);
        } catch (error) {
          await prisma.$executeRaw`UPDATE campusos_communications.messages SET status='SUPPRESSED', failure_code=${error instanceof CommunicationError ? error.code : 'BILLING_FAILED'}, updated_at=now() WHERE id=${messageId}::uuid`;
          suppressed += 1;
          continue;
        }
      }
      if (channel === 'WHATSAPP') {
        try {
          await reservePaidUnits(input.tenantId, 'WHATSAPP', messageId, 1);
        } catch (error) {
          await prisma.$executeRaw`UPDATE campusos_communications.messages SET status='SUPPRESSED', failure_code=${error instanceof CommunicationError ? error.code : 'BILLING_FAILED'}, updated_at=now() WHERE id=${messageId}::uuid`;
          suppressed += 1;
          continue;
        }
      }
      queued += 1;
    }
  }

  return { eventId, duplicate: false, recipients: recipients.length, queued, suppressed };
}

export async function getCommunicationPreferences() {
  const context = await requireActiveUserContext();
  await ensureTenantDefaults(context.tenantId);
  const rows = await prisma.$queryRaw<Array<{ category: string; channel: string; enabled: boolean }>>`
    SELECT category, channel, enabled FROM campusos_communications.communication_preferences
    WHERE tenant_id=${context.tenantId}::uuid AND user_id=${context.userId}::uuid
  `;
  const consents = await prisma.$queryRaw<Array<{ channel: string; purpose: string; state: string; created_at: Date }>>`
    SELECT DISTINCT ON (channel, purpose) channel, purpose, state, created_at
    FROM campusos_communications.communication_consents
    WHERE tenant_id=${context.tenantId}::uuid AND user_id=${context.userId}::uuid
    ORDER BY channel, purpose, created_at DESC
  `;
  return { categories: COMMUNICATION_CATEGORIES, channels: COMMUNICATION_CHANNELS, preferences: rows, consents };
}

export async function updateCommunicationPreference(input: { category: string; channel: string; enabled: boolean }) {
  const context = await requireActiveUserContext();
  if (!(COMMUNICATION_CATEGORIES as readonly string[]).includes(input.category)) throw new CommunicationError('Unsupported communication category.', 400, 'INVALID_CATEGORY');
  if (!isCommunicationChannel(input.channel)) throw new CommunicationError('Unsupported communication channel.', 400, 'INVALID_CHANNEL');
  if (CRITICAL_CATEGORIES.has(input.category as CommunicationCategory) && !input.enabled) throw new CommunicationError('Security and emergency communications cannot be disabled through optional preferences.', 409, 'MANDATORY_CHANNEL_POLICY');
  await prisma.$executeRaw`
    INSERT INTO campusos_communications.communication_preferences (tenant_id, user_id, category, channel, enabled)
    VALUES (${context.tenantId}::uuid, ${context.userId}::uuid, ${input.category}, ${input.channel}, ${input.enabled})
    ON CONFLICT (tenant_id, user_id, category, channel) DO UPDATE SET enabled=EXCLUDED.enabled, updated_at=now()
  `;
  await audit(context, { action: 'COMMUNICATION_PREFERENCE_UPDATED', targetType: 'USER', targetId: context.userId, after: input });
  return { ok: true };
}

export async function recordCommunicationConsent(input: { channel: string; purpose: string; state: 'GRANTED' | 'WITHDRAWN' }) {
  const context = await requireActiveUserContext();
  if (!isCommunicationChannel(input.channel) || input.channel === 'IN_APP') throw new CommunicationError('Unsupported consent channel.', 400, 'INVALID_CHANNEL');
  const purpose = input.purpose.trim().toUpperCase().slice(0, 80);
  if (!purpose) throw new CommunicationError('Consent purpose is required.', 400, 'INVALID_PURPOSE');
  await prisma.$executeRaw`
    INSERT INTO campusos_communications.communication_consents
      (tenant_id, user_id, channel, purpose, state, source, policy_version, granted_at, withdrawn_at, actor_user_id)
    VALUES
      (${context.tenantId}::uuid, ${context.userId}::uuid, ${input.channel}, ${purpose}, ${input.state}, 'SELF_SERVICE', 'v1', ${input.state === 'GRANTED' ? new Date() : null}, ${input.state === 'WITHDRAWN' ? new Date() : null}, ${context.userId}::uuid)
  `;
  await audit(context, { action: 'COMMUNICATION_CONSENT_RECORDED', targetType: 'USER', targetId: context.userId, after: { ...input, purpose } });
  return { ok: true };
}

export async function getNotificationCenter(limit = 30) {
  const context = await requireActiveUserContext();
  const bounded = Math.min(100, Math.max(1, limit));
  const notifications = await prisma.$queryRaw<Array<{ id: string; category: string; priority: string; title: string; body: string; target_url: string | null; created_at: Date; read_at: Date | null }>>`
    SELECT id, category, priority, title, body, target_url, created_at, read_at
    FROM campusos_communications.in_app_notifications
    WHERE tenant_id=${context.tenantId}::uuid AND user_id=${context.userId}::uuid AND archived_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY created_at DESC LIMIT ${bounded}
  `;
  return notifications.map((item) => ({ id: item.id, category: item.category, priority: item.priority, title: item.title, body: item.body, targetUrl: item.target_url, createdAt: item.created_at.toISOString(), readAt: item.read_at?.toISOString() ?? null }));
}

export async function markNotificationRead(notificationId: string) {
  const context = await requireActiveUserContext();
  const result = await prisma.$executeRaw`
    UPDATE campusos_communications.in_app_notifications SET read_at=COALESCE(read_at, now())
    WHERE id=${notificationId}::uuid AND tenant_id=${context.tenantId}::uuid AND user_id=${context.userId}::uuid
  `;
  if (!result) throw new CommunicationError('Notification not found.', 404, 'NOT_FOUND');
  return { ok: true };
}

export async function configureCommunicationChannel(input: { channel: string; enabled: boolean; providerKey?: string | null; providerMode?: 'PLATFORM_MANAGED' | 'INSTITUTION_MANAGED'; regulatoryConfig?: Record<string, unknown>; rateLimitPerMinute?: number | null; dailyLimit?: number | null }) {
  const context = await requireCommunicationAdmin();
  if (!isCommunicationChannel(input.channel)) throw new CommunicationError('Unsupported channel.', 400, 'INVALID_CHANNEL');
  if ((input.channel === 'SMS' || input.channel === 'WHATSAPP') && input.enabled) {
    const active = await prisma.$queryRaw<Array<{ active: boolean }>>`SELECT EXISTS(SELECT 1 FROM campusos_communications.tenant_channel_subscriptions WHERE tenant_id=${context.tenantId}::uuid AND channel=${input.channel} AND lifecycle='ACTIVE') AS active`;
    if (!active[0]?.active) throw new CommunicationError('Activate the paid channel subscription before enabling delivery.', 402, 'PAID_CHANNEL_NOT_ACTIVE');
  }
  await prisma.$executeRaw`
    INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled, provider_key, provider_mode, regulatory_config, rate_limit_per_minute, daily_limit)
    VALUES (${context.tenantId}::uuid, ${input.channel}, ${input.enabled}, ${input.providerKey ?? null}, ${input.providerMode ?? 'PLATFORM_MANAGED'}, ${JSON.stringify(input.regulatoryConfig ?? {})}::jsonb, ${input.rateLimitPerMinute ?? null}, ${input.dailyLimit ?? null})
    ON CONFLICT (tenant_id, channel) DO UPDATE SET enabled=EXCLUDED.enabled, provider_key=EXCLUDED.provider_key, provider_mode=EXCLUDED.provider_mode, regulatory_config=EXCLUDED.regulatory_config, rate_limit_per_minute=EXCLUDED.rate_limit_per_minute, daily_limit=EXCLUDED.daily_limit, updated_at=now()
  `;
  await audit(context, { action: 'COMMUNICATION_CHANNEL_CONFIGURED', targetType: 'CHANNEL', targetId: input.channel, after: { ...input, regulatoryConfig: input.regulatoryConfig ? '[configured]' : {} } });
  return { ok: true };
}

export async function createCommunicationTemplate(input: { templateKey: string; channel: string; category: string; classification: string; locale?: string; subject?: string | null; preheader?: string | null; html?: string | null; text: string; variablesSchema?: Record<string, unknown>; providerTemplateName?: string | null }) {
  const context = await requireCommunicationAdmin();
  if (!isCommunicationChannel(input.channel)) throw new CommunicationError('Unsupported template channel.', 400, 'INVALID_CHANNEL');
  if (!(COMMUNICATION_CATEGORIES as readonly string[]).includes(input.category)) throw new CommunicationError('Unsupported template category.', 400, 'INVALID_CATEGORY');
  const key = input.templateKey.trim().toLowerCase().replace(/[^a-z0-9_:-]/g, '_').slice(0, 120);
  if (!key || !input.text.trim()) throw new CommunicationError('Template key and text body are required.', 400, 'INVALID_TEMPLATE');
  const result = await prisma.$transaction(async (tx) => {
    const templates = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_communications.templates (tenant_id, template_key, channel, category, security_classification, created_by)
      VALUES (${context.tenantId}::uuid, ${key}, ${input.channel}, ${input.category}, ${input.classification}, ${context.userId}::uuid)
      ON CONFLICT (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), template_key, channel) DO NOTHING
      RETURNING id
    `;
    let templateId = templates[0]?.id;
    if (!templateId) {
      const existing = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM campusos_communications.templates WHERE tenant_id=${context.tenantId}::uuid AND template_key=${key} AND channel=${input.channel} LIMIT 1`;
      templateId = existing[0]?.id;
    }
    if (!templateId) throw new CommunicationError('Unable to resolve communication template.', 500, 'TEMPLATE_STORAGE_FAILED');
    const versions = await tx.$queryRaw<Array<{ next_version: number }>>`SELECT COALESCE(MAX(version),0)::int + 1 AS next_version FROM campusos_communications.template_versions WHERE template_id=${templateId}::uuid`;
    const version = versions[0]?.next_version ?? 1;
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_communications.template_versions
        (template_id, version, locale, status, subject_template, preheader_template, html_template, text_template, variables_schema, provider_template_name)
      VALUES
        (${templateId}::uuid, ${version}, ${input.locale ?? 'en-IN'}, 'DRAFT', ${input.subject ?? null}, ${input.preheader ?? null}, ${input.html ?? null}, ${input.text}, ${JSON.stringify(input.variablesSchema ?? {})}::jsonb, ${input.providerTemplateName ?? null})
      RETURNING id
    `;
    return { templateId, versionId: rows[0]!.id, version };
  });
  await audit(context, { action: 'COMMUNICATION_TEMPLATE_CREATED', targetType: 'TEMPLATE', targetId: result.templateId, after: { key, channel: input.channel, version: result.version } });
  return result;
}

export async function activateCommunicationTemplate(versionId: string) {
  const context = await requireCommunicationAdmin();
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ template_id: string; locked_by_platform: boolean }>>`
      SELECT tv.template_id, t.locked_by_platform FROM campusos_communications.template_versions tv
      JOIN campusos_communications.templates t ON t.id=tv.template_id
      WHERE tv.id=${versionId}::uuid AND t.tenant_id=${context.tenantId}::uuid FOR UPDATE
    `;
    const row = rows[0];
    if (!row) throw new CommunicationError('Template version not found.', 404, 'NOT_FOUND');
    if (row.locked_by_platform && context.activeRole !== 'SUPER_ADMIN') throw new CommunicationError('This security template is platform locked.', 403, 'TEMPLATE_LOCKED');
    await tx.$executeRaw`UPDATE campusos_communications.template_versions SET status='ARCHIVED', retired_at=now() WHERE template_id=${row.template_id}::uuid AND status='ACTIVE'`;
    await tx.$executeRaw`UPDATE campusos_communications.template_versions SET status='ACTIVE', approved_by=${context.userId}::uuid, activated_at=now() WHERE id=${versionId}::uuid`;
  });
  await audit(context, { action: 'COMMUNICATION_TEMPLATE_ACTIVATED', targetType: 'TEMPLATE_VERSION', targetId: versionId });
  return { ok: true };
}

export async function previewCommunicationTemplate(input: { key: string; variables?: Record<string, unknown> }) {
  const context = await requireCommunicationAdmin();
  const institution = await prisma.institution.findUnique({ where: { id: context.tenantId }, select: { name: true, logoUrl: true, primaryColor: true } });
  if (!institution) throw new CommunicationError('Institution unavailable.', 404, 'TENANT_NOT_FOUND');
  const variables = { preview: true, student: { name: 'PREVIEW STUDENT' }, course: { title: 'PREVIEW COURSE' }, attendance: { percentage: '72', requiredPercentage: '75' }, invoice: { dueDate: 'PREVIEW DATE' }, exam: { name: 'PREVIEW EXAM', date: 'PREVIEW DATE', time: 'PREVIEW TIME' }, result: { term: 'PREVIEW TERM' }, event: { name: 'PREVIEW EVENT' }, transport: { vehicle: 'PREVIEW VEHICLE', route: 'PREVIEW ROUTE', delay: 'PREVIEW DELAY' }, alert: { message: 'PREVIEW — institution emergency message.' }, ...(input.variables ?? {}) };
  return { preview: true, ...renderBaseTemplate({ key: input.key, variables, institution }) };
}

export async function getCommunicationAdminDashboard() {
  const context = await requireCommunicationAdmin();
  await ensureTenantDefaults(context.tenantId);
  const [counts, channels, usage, templates, failures] = await Promise.all([
    prisma.$queryRaw<Array<{ channel: string; status: string; count: bigint }>>`SELECT channel, status, count(*)::bigint AS count FROM campusos_communications.messages WHERE tenant_id=${context.tenantId}::uuid AND created_at >= date_trunc('month', now()) GROUP BY channel, status`,
    prisma.$queryRaw<Array<{ channel: string; enabled: boolean; provider_key: string | null; provider_mode: string; regulatory_config: unknown }>>`SELECT channel, enabled, provider_key, provider_mode, regulatory_config FROM campusos_communications.channel_settings WHERE tenant_id=${context.tenantId}::uuid ORDER BY channel`,
    prisma.$queryRaw<Array<{ channel: string; billing_units: bigint; estimated_cost_minor: bigint; actual_cost_minor: bigint | null; currency: string }>>`SELECT channel, COALESCE(sum(billing_units),0)::bigint AS billing_units, COALESCE(sum(estimated_cost_minor),0)::bigint AS estimated_cost_minor, sum(actual_cost_minor)::bigint AS actual_cost_minor, max(currency) AS currency FROM campusos_communications.usage_ledger WHERE tenant_id=${context.tenantId}::uuid AND created_at >= date_trunc('month', now()) GROUP BY channel`,
    prisma.$queryRaw<Array<{ template_key: string; channel: string; latest_version: number; active_version: number | null }>>`SELECT t.template_key, t.channel, max(tv.version)::int AS latest_version, max(tv.version) FILTER (WHERE tv.status='ACTIVE')::int AS active_version FROM campusos_communications.templates t LEFT JOIN campusos_communications.template_versions tv ON tv.template_id=t.id WHERE t.tenant_id=${context.tenantId}::uuid GROUP BY t.id ORDER BY t.template_key LIMIT 100`,
    prisma.$queryRaw<Array<{ id: string; channel: string; failure_code: string | null; created_at: Date }>>`SELECT id, channel, failure_code, created_at FROM campusos_communications.messages WHERE tenant_id=${context.tenantId}::uuid AND status IN ('FAILED','DEAD_LETTER') ORDER BY created_at DESC LIMIT 20`,
  ]);
  const wallets = await prisma.$queryRaw<Array<{ channel: string; available_units: bigint; reserved_units: bigint; used_units: bigint }>>`SELECT channel, available_units, reserved_units, used_units FROM campusos_communications.credit_wallets WHERE tenant_id=${context.tenantId}::uuid ORDER BY channel`;
  const subscriptions = await prisma.$queryRaw<Array<{ channel: string; lifecycle: string; billing_mode: string; monthly_spend_limit_minor: bigint | null }>>`SELECT channel, lifecycle, billing_mode, monthly_spend_limit_minor FROM campusos_communications.tenant_channel_subscriptions WHERE tenant_id=${context.tenantId}::uuid ORDER BY channel`;
  return {
    tenantId: context.tenantId,
    role: context.activeRole,
    counts: counts.map((row) => ({ channel: row.channel, status: row.status, count: asNumber(row.count) })),
    channels,
    usage: usage.map((row) => ({ channel: row.channel, billingUnits: asNumber(row.billing_units), estimatedCostMinor: asNumber(row.estimated_cost_minor), actualCostMinor: row.actual_cost_minor === null ? null : asNumber(row.actual_cost_minor), currency: row.currency || 'INR' })),
    wallets: wallets.map((row) => ({ channel: row.channel, availableUnits: asNumber(row.available_units), reservedUnits: asNumber(row.reserved_units), usedUnits: asNumber(row.used_units) })),
    subscriptions: subscriptions.map((row) => ({ channel: row.channel, lifecycle: row.lifecycle, billingMode: row.billing_mode, monthlySpendLimitMinor: row.monthly_spend_limit_minor === null ? null : asNumber(row.monthly_spend_limit_minor) })),
    templates,
    failures: failures.map((row) => ({ ...row, createdAt: row.created_at.toISOString() })),
  };
}

export async function activatePaidChannel(input: { tenantId?: string; channel: 'SMS' | 'WHATSAPP'; pricingVersionId?: string | null; billingMode: 'PREPAID' | 'POSTPAID' | 'INCLUDED' | 'CUSTOM'; initialUnits?: number }) {
  const context = await requirePlatformCommunicationAdmin();
  const tenantId = input.tenantId || context.tenantId;
  if (input.initialUnits !== undefined && (!Number.isInteger(input.initialUnits) || input.initialUnits < 0)) throw new CommunicationError('Initial units must be a non-negative integer.', 400, 'INVALID_CREDITS');
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO campusos_communications.tenant_channel_subscriptions (tenant_id, channel, pricing_version_id, lifecycle, billing_mode, starts_at)
      VALUES (${tenantId}::uuid, ${input.channel}, ${input.pricingVersionId ?? null}::uuid, 'ACTIVE', ${input.billingMode}, now())
      ON CONFLICT (tenant_id, channel) DO UPDATE SET pricing_version_id=EXCLUDED.pricing_version_id, lifecycle='ACTIVE', billing_mode=EXCLUDED.billing_mode, starts_at=COALESCE(campusos_communications.tenant_channel_subscriptions.starts_at, now()), updated_at=now()
    `,
    prisma.$executeRaw`
      INSERT INTO campusos_communications.credit_wallets (tenant_id, channel, available_units)
      VALUES (${tenantId}::uuid, ${input.channel}, ${input.initialUnits ?? 0})
      ON CONFLICT (tenant_id, channel) DO NOTHING
    `,
  ]);
  await audit(context, { tenantId, action: 'PAID_COMMUNICATION_CHANNEL_ACTIVATED', targetType: 'CHANNEL_SUBSCRIPTION', targetId: input.channel, after: { billingMode: input.billingMode, pricingVersionId: input.pricingVersionId ?? null, initialUnits: input.initialUnits ?? 0 } });
  return { ok: true };
}

export async function adjustCommunicationCredits(input: { tenantId?: string; channel: 'SMS' | 'WHATSAPP'; units: number; reason: string }) {
  const context = await requirePlatformCommunicationAdmin();
  const tenantId = input.tenantId || context.tenantId;
  if (!Number.isInteger(input.units) || input.units === 0) throw new CommunicationError('Credit adjustment must be a non-zero integer.', 400, 'INVALID_CREDITS');
  await prisma.$transaction(async (tx) => {
    const wallets = await tx.$queryRaw<Array<{ available_units: bigint }>>`SELECT available_units FROM campusos_communications.credit_wallets WHERE tenant_id=${tenantId}::uuid AND channel=${input.channel} FOR UPDATE`;
    const current = asNumber(wallets[0]?.available_units);
    if (current + input.units < 0) throw new CommunicationError('Credit adjustment cannot create a negative prepaid balance.', 409, 'NEGATIVE_BALANCE');
    await tx.$executeRaw`
      INSERT INTO campusos_communications.credit_wallets (tenant_id, channel, available_units)
      VALUES (${tenantId}::uuid, ${input.channel}, ${Math.max(0, input.units)})
      ON CONFLICT (tenant_id, channel) DO UPDATE SET available_units=campusos_communications.credit_wallets.available_units+${input.units}, updated_at=now()
    `;
    await tx.$executeRaw`INSERT INTO campusos_communications.credit_transactions (tenant_id, channel, transaction_type, units, reference_type, reference_id, actor_user_id) VALUES (${tenantId}::uuid, ${input.channel}, 'ADJUSTMENT', ${input.units}, 'ADMIN', ${input.reason.slice(0, 120)}, ${context.userId}::uuid)`;
  });
  await audit(context, { tenantId, action: 'COMMUNICATION_CREDITS_ADJUSTED', targetType: 'CREDIT_WALLET', targetId: input.channel, reason: input.reason, after: { units: input.units } });
  return { ok: true };
}

export async function createCommunicationPricing(input: { planKey: string; name: string; currency?: string; monthlyBaseMinor?: number; includedSmsUnits?: number; includedWhatsappUnits?: number; smsUnitCostMinor?: number; whatsappUnitCostMinor?: number; effectiveFrom?: string }) {
  const context = await requirePlatformCommunicationAdmin();
  const nonNegative = [input.monthlyBaseMinor, input.includedSmsUnits, input.includedWhatsappUnits, input.smsUnitCostMinor, input.whatsappUnitCostMinor].filter((value) => value !== undefined);
  if (nonNegative.some((value) => !Number.isInteger(value) || Number(value) < 0)) throw new CommunicationError('Pricing values must use non-negative integer minor units.', 400, 'INVALID_PRICING');
  const key = input.planKey.trim().toUpperCase().replace(/[^A-Z0-9_:-]/g, '_').slice(0, 80);
  const result = await prisma.$transaction(async (tx) => {
    const plans = await tx.$queryRaw<Array<{ id: string }>>`INSERT INTO campusos_communications.pricing_plans (plan_key, name) VALUES (${key}, ${input.name.trim()}) ON CONFLICT (plan_key) DO UPDATE SET name=EXCLUDED.name RETURNING id`;
    const planId = plans[0]!.id;
    const versions = await tx.$queryRaw<Array<{ next_version: number }>>`SELECT COALESCE(MAX(version),0)::int+1 AS next_version FROM campusos_communications.pricing_versions WHERE pricing_plan_id=${planId}::uuid`;
    const version = versions[0]?.next_version ?? 1;
    await tx.$executeRaw`UPDATE campusos_communications.pricing_versions SET effective_to=${new Date(input.effectiveFrom ?? Date.now())} WHERE pricing_plan_id=${planId}::uuid AND effective_to IS NULL`;
    const created = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_communications.pricing_versions
        (pricing_plan_id, version, currency, monthly_base_minor, included_sms_units, included_whatsapp_units, sms_unit_cost_minor, whatsapp_unit_cost_minor, effective_from, created_by)
      VALUES (${planId}::uuid, ${version}, ${input.currency ?? 'INR'}, ${input.monthlyBaseMinor ?? 0}, ${input.includedSmsUnits ?? 0}, ${input.includedWhatsappUnits ?? 0}, ${input.smsUnitCostMinor ?? 0}, ${input.whatsappUnitCostMinor ?? 0}, ${new Date(input.effectiveFrom ?? Date.now())}, ${context.userId}::uuid)
      RETURNING id
    `;
    return { planId, pricingVersionId: created[0]!.id, version };
  });
  await audit(context, { action: 'COMMUNICATION_PRICING_VERSION_CREATED', targetType: 'PRICING_PLAN', targetId: result.planId, after: { ...input, version: result.version } });
  return result;
}

async function resolveCampaignAudience(context: ActiveUserContext, audience: { type: string; scopeId?: string | null }) {
  const tenantId = context.tenantId;
  const type = audience.type.toUpperCase();
  if (type === 'ALL_STUDENTS') return prisma.user.findMany({ where: { tenantId, role: 'STUDENT', isActive: true }, select: { id: true }, take: 50000 });
  if (type === 'ALL_PARENTS') return prisma.user.findMany({ where: { tenantId, role: 'PARENT', isActive: true }, select: { id: true }, take: 50000 });
  if (type === 'ALL_FACULTY') return prisma.user.findMany({ where: { tenantId, role: 'FACULTY', isActive: true }, select: { id: true }, take: 20000 });
  if (type === 'ALL_STAFF') return prisma.user.findMany({ where: { tenantId, role: { notIn: ['STUDENT','PARENT'] }, isActive: true }, select: { id: true }, take: 20000 });
  if (type === 'DEPARTMENT' && audience.scopeId) {
    const staff = await prisma.staff.findMany({ where: { tenantId, departmentId: audience.scopeId }, select: { userId: true }, take: 20000 });
    return staff.map((item) => ({ id: item.userId }));
  }
  if (type === 'SECTION' && audience.scopeId) {
    const students = await prisma.student.findMany({ where: { tenantId, sectionId: audience.scopeId }, select: { userId: true }, take: 20000 });
    return students.map((item) => ({ id: item.userId }));
  }
  throw new CommunicationError('Unsupported or incomplete campaign audience.', 400, 'INVALID_AUDIENCE');
}

export async function createCommunicationCampaign(input: { name: string; category: string; classification?: string; channels: string[]; audience: { type: string; scopeId?: string | null }; subject: string; body: string; scheduledAt?: string | null }) {
  const context = await requireActiveUserContext();
  if (!CAMPAIGN_ROLES.has(context.activeRole)) throw new CommunicationError('Your role cannot create communication campaigns.', 403, 'FORBIDDEN');
  if (!(COMMUNICATION_CATEGORIES as readonly string[]).includes(input.category)) throw new CommunicationError('Unsupported campaign category.', 400, 'INVALID_CATEGORY');
  const channels = input.channels.filter(isCommunicationChannel);
  if (!channels.length || channels.length !== input.channels.length) throw new CommunicationError('Campaign channels are invalid.', 400, 'INVALID_CHANNEL');
  const recipients = await resolveCampaignAudience(context, input.audience);
  const highRisk = recipients.length >= 1000 || channels.some((channel) => channel === 'SMS' || channel === 'WHATSAPP') || ['EMERGENCY','FINANCE'].includes(input.category);
  const estimatedUnits = recipients.length * channels.filter((channel) => channel === 'SMS' || channel === 'WHATSAPP').length;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_communications.campaigns
      (tenant_id, name, category, classification, status, channels, audience_spec, content_spec, estimated_recipients, estimated_units, scheduled_at, created_by)
    VALUES
      (${context.tenantId}::uuid, ${input.name.slice(0, 160)}, ${input.category}, ${input.classification ?? 'INTERNAL'}, ${highRisk ? 'REVIEW_PENDING' : 'APPROVED'}, ${channels}::text[], ${JSON.stringify(input.audience)}::jsonb, ${JSON.stringify({ subject: input.subject.slice(0, 200), body: input.body.slice(0, 10000) })}::jsonb, ${recipients.length}, ${estimatedUnits}, ${input.scheduledAt ? new Date(input.scheduledAt) : null}, ${context.userId}::uuid)
    RETURNING id
  `;
  const campaignId = rows[0]!.id;
  await prisma.$executeRaw`INSERT INTO campusos_communications.campaign_audiences (campaign_id, audience_type, scope_id, resolved_count, resolved_at) VALUES (${campaignId}::uuid, ${input.audience.type}, ${input.audience.scopeId ?? null}::uuid, ${recipients.length}, now())`;
  await audit(context, { action: 'COMMUNICATION_CAMPAIGN_CREATED', targetType: 'CAMPAIGN', targetId: campaignId, after: { name: input.name, category: input.category, channels, audience: input.audience, recipientCount: recipients.length, highRisk } });
  return { campaignId, status: highRisk ? 'REVIEW_PENDING' : 'APPROVED', recipientCount: recipients.length, estimatedUnits };
}

export async function approveCommunicationCampaign(campaignId: string, decision: 'APPROVED' | 'REJECTED', reason?: string) {
  const context = await requireCommunicationAdmin();
  const rows = await prisma.$queryRaw<Array<{ created_by: string; status: string }>>`SELECT created_by, status FROM campusos_communications.campaigns WHERE id=${campaignId}::uuid AND tenant_id=${context.tenantId}::uuid FOR UPDATE`;
  const campaign = rows[0];
  if (!campaign) throw new CommunicationError('Campaign not found.', 404, 'NOT_FOUND');
  if (campaign.created_by === context.userId && context.activeRole !== 'SUPER_ADMIN') throw new CommunicationError('High-risk campaigns require maker-checker approval by another authorized user.', 409, 'MAKER_CHECKER_REQUIRED');
  await prisma.$transaction([
    prisma.$executeRaw`INSERT INTO campusos_communications.campaign_approvals (tenant_id, campaign_id, decision, decided_by, reason) VALUES (${context.tenantId}::uuid, ${campaignId}::uuid, ${decision}, ${context.userId}::uuid, ${reason ?? null})`,
    prisma.$executeRaw`UPDATE campusos_communications.campaigns SET status=${decision === 'APPROVED' ? 'APPROVED' : 'CANCELLED'}, updated_at=now() WHERE id=${campaignId}::uuid AND tenant_id=${context.tenantId}::uuid`,
  ]);
  await audit(context, { action: `COMMUNICATION_CAMPAIGN_${decision}`, targetType: 'CAMPAIGN', targetId: campaignId, reason });
  return { ok: true, status: decision === 'APPROVED' ? 'APPROVED' : 'CANCELLED' };
}

export async function getPlatformCommunicationDashboard() {
  const context = await requirePlatformCommunicationAdmin();
  const [subscriptions, providerHealth, usage, plans] = await Promise.all([
    prisma.$queryRaw<Array<{ tenant_id: string; channel: string; lifecycle: string; billing_mode: string }>>`SELECT tenant_id, channel, lifecycle, billing_mode FROM campusos_communications.tenant_channel_subscriptions ORDER BY updated_at DESC LIMIT 500`,
    prisma.$queryRaw<Array<{ provider_key: string; channel: string; status: string; tenant_id: string | null; last_checked_at: Date | null }>>`SELECT provider_key, channel, status, tenant_id, last_checked_at FROM campusos_communications.provider_accounts ORDER BY updated_at DESC LIMIT 100`,
    prisma.$queryRaw<Array<{ tenant_id: string; channel: string; units: bigint; estimated_minor: bigint; actual_minor: bigint | null }>>`SELECT tenant_id, channel, COALESCE(sum(billing_units),0)::bigint AS units, COALESCE(sum(estimated_cost_minor),0)::bigint AS estimated_minor, sum(actual_cost_minor)::bigint AS actual_minor FROM campusos_communications.usage_ledger WHERE created_at >= date_trunc('month', now()) GROUP BY tenant_id, channel ORDER BY units DESC LIMIT 500`,
    prisma.$queryRaw<Array<{ plan_key: string; name: string; version: number; currency: string; sms_unit_cost_minor: bigint; whatsapp_unit_cost_minor: bigint; effective_from: Date }>>`SELECT p.plan_key, p.name, pv.version, pv.currency, pv.sms_unit_cost_minor, pv.whatsapp_unit_cost_minor, pv.effective_from FROM campusos_communications.pricing_plans p JOIN LATERAL (SELECT * FROM campusos_communications.pricing_versions v WHERE v.pricing_plan_id=p.id ORDER BY version DESC LIMIT 1) pv ON true WHERE p.status='ACTIVE' ORDER BY p.plan_key`,
  ]);
  return {
    role: context.activeRole,
    subscriptions,
    providerHealth: providerHealth.map((row) => ({ ...row, lastCheckedAt: row.last_checked_at?.toISOString() ?? null })),
    usage: usage.map((row) => ({ tenantId: row.tenant_id, channel: row.channel, units: asNumber(row.units), estimatedMinor: asNumber(row.estimated_minor), actualMinor: row.actual_minor === null ? null : asNumber(row.actual_minor) })),
    plans: plans.map((row) => ({ planKey: row.plan_key, name: row.name, version: row.version, currency: row.currency, smsUnitCostMinor: asNumber(row.sms_unit_cost_minor), whatsappUnitCostMinor: asNumber(row.whatsapp_unit_cost_minor), effectiveFrom: row.effective_from.toISOString() })),
  };
}

export async function getCommunicationHistory(limit = 50) {
  const context = await requireActiveUserContext();
  const bounded = Math.min(100, Math.max(1, limit));
  const rows = await prisma.$queryRaw<Array<{ id: string; channel: string; category: string; subject_snapshot: string | null; status: string; masked_destination: string | null; created_at: Date; delivered_at: Date | null }>>`
    SELECT id, channel, category, subject_snapshot, status, masked_destination, created_at, delivered_at
    FROM campusos_communications.messages
    WHERE tenant_id=${context.tenantId}::uuid AND recipient_user_id=${context.userId}::uuid
    ORDER BY created_at DESC LIMIT ${bounded}
  `;
  return rows.map((row) => ({ id: row.id, channel: row.channel, category: row.category, subject: row.subject_snapshot, status: row.status, maskedDestination: row.masked_destination, createdAt: row.created_at.toISOString(), deliveredAt: row.delivered_at?.toISOString() ?? null }));
}

export function validateWebhookSecret(rawBody: string, supplied: string | null) {
  const configured = process.env.NAVEMORA_COMMUNICATION_WEBHOOK_SECRET || '';
  if (configured.length < 32 || !supplied) return false;
  const expected = crypto.createHmac('sha256', configured).update(rawBody).digest('hex');
  const normalized = supplied.replace(/^sha256=/i, '');
  return safeEqual(expected, normalized);
}

export async function processProviderDelivery(input: { providerKey: string; providerEventId: string; providerReference: string; status: string; occurredAt: string | Date; payloadHash: string; signatureValid: boolean }) {
  if (!input.signatureValid) throw new CommunicationError('Provider webhook signature is invalid.', 401, 'INVALID_WEBHOOK_SIGNATURE');
  const canonical = canonicalDeliveryStatus(input.status);
  return prisma.$transaction(async (tx) => {
    const inserted = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_communications.webhook_events (provider_key, provider_event_id, signature_valid, payload_hash, canonical_status, processed_at)
      VALUES (${input.providerKey}, ${input.providerEventId}, true, ${input.payloadHash}, ${canonical}, now())
      ON CONFLICT (provider_key, provider_event_id) DO NOTHING RETURNING id
    `;
    if (!inserted[0]) return { duplicate: true, status: canonical };
    const messages = await tx.$queryRaw<Array<{ id: string; tenant_id: string; channel: string }>>`
      SELECT id, tenant_id, channel FROM campusos_communications.messages
      WHERE provider_key=${input.providerKey} AND provider_reference=${input.providerReference} LIMIT 1 FOR UPDATE
    `;
    const message = messages[0];
    if (!message) return { duplicate: false, unmatched: true, status: canonical };
    const timestamp = new Date(input.occurredAt);
    await tx.$executeRaw`
      INSERT INTO campusos_communications.delivery_events (tenant_id, message_id, provider_key, provider_event_id, canonical_status, provider_status, occurred_at, payload_hash)
      VALUES (${message.tenant_id}::uuid, ${message.id}::uuid, ${input.providerKey}, ${input.providerEventId}, ${canonical}, ${input.status}, ${timestamp}, ${input.payloadHash})
    `;
    if (canonical === 'DELIVERED') await tx.$executeRaw`UPDATE campusos_communications.messages SET status='DELIVERED', delivered_at=COALESCE(delivered_at, ${timestamp}), updated_at=now() WHERE id=${message.id}::uuid`;
    else if (canonical === 'READ') await tx.$executeRaw`UPDATE campusos_communications.messages SET status='READ', read_at=COALESCE(read_at, ${timestamp}), delivered_at=COALESCE(delivered_at, ${timestamp}), updated_at=now() WHERE id=${message.id}::uuid`;
    else if (['FAILED','REJECTED','UNDELIVERED','EXPIRED'].includes(canonical)) await tx.$executeRaw`UPDATE campusos_communications.messages SET status='FAILED', failed_at=COALESCE(failed_at, ${timestamp}), failure_code=${canonical}, updated_at=now() WHERE id=${message.id}::uuid AND status NOT IN ('DELIVERED','READ')`;
    return { duplicate: false, unmatched: false, messageId: message.id, status: canonical };
  });
}

export function canonicalDeliveryStatus(status: string) {
  const normalized = status.trim().toUpperCase().replace(/[ .-]+/g, '_');
  if (['DELIVERED','DELIVERY_SUCCESS','DELIVERY_SUCCESSFUL'].includes(normalized)) return 'DELIVERED';
  if (['READ','SEEN'].includes(normalized)) return 'READ';
  if (['SENT','SUBMITTED','QUEUED','ACCEPTED'].includes(normalized)) return normalized === 'QUEUED' ? 'QUEUED' : normalized === 'SENT' ? 'SENT' : 'SUBMITTED';
  if (['BOUNCED','HARD_BOUNCE','SOFT_BOUNCE','FAILED','ERROR'].includes(normalized)) return 'FAILED';
  if (['UNDELIVERED','UNDELIVERABLE'].includes(normalized)) return 'UNDELIVERED';
  if (['EXPIRED'].includes(normalized)) return 'EXPIRED';
  if (['REJECTED','BLOCKED','SPAM_COMPLAINT'].includes(normalized)) return 'REJECTED';
  return 'UNKNOWN';
}

export function renderProviderMessageForWorker(input: { templateKey: string; variables: Record<string, unknown>; institution: { name: string; logoUrl?: string | null; primaryColor?: string | null } }) {
  return renderBaseTemplate(input);
}

export function resolveTemplateKeyForEvent(eventType: string) {
  if (!isCommunicationEventType(eventType)) return 'platform_maintenance';
  return templateKeyForEvent(eventType);
}

export function renderCustomTemplate(template: string, variables: Record<string, unknown>) {
  return renderText(template, variables);
}
