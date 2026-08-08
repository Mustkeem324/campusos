import 'server-only';

import { prisma } from './db';
import { CommunicationError, requireCommunicationAdmin } from './communications';
import { COMMUNICATION_CATEGORIES, SECURITY_CLASSIFICATIONS, isCommunicationChannel } from './communications-types';

export async function createCommunicationTemplateVersion(input: {
  templateKey: string;
  channel: string;
  category: string;
  classification: string;
  locale?: string;
  subject?: string | null;
  preheader?: string | null;
  html?: string | null;
  text: string;
  variablesSchema?: Record<string, unknown>;
  providerTemplateName?: string | null;
}) {
  const context = await requireCommunicationAdmin();
  if (!isCommunicationChannel(input.channel)) throw new CommunicationError('Unsupported template channel.', 400, 'INVALID_CHANNEL');
  if (!(COMMUNICATION_CATEGORIES as readonly string[]).includes(input.category)) throw new CommunicationError('Unsupported template category.', 400, 'INVALID_CATEGORY');
  if (!(SECURITY_CLASSIFICATIONS as readonly string[]).includes(input.classification)) throw new CommunicationError('Unsupported security classification.', 400, 'INVALID_CLASSIFICATION');
  const key = input.templateKey.trim().toLowerCase().replace(/[^a-z0-9_:-]/g, '_').slice(0, 120);
  const text = input.text.trim();
  if (!key || !text) throw new CommunicationError('Template key and text body are required.', 400, 'INVALID_TEMPLATE');
  if (input.subject && /[\r\n]/.test(input.subject)) throw new CommunicationError('Email subject cannot contain line breaks.', 400, 'INVALID_SUBJECT');

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_communications.templates
        (tenant_id, template_key, channel, category, security_classification, created_by)
      VALUES
        (${context.tenantId}::uuid, ${key}, ${input.channel}, ${input.category}, ${input.classification}, ${context.userId}::uuid)
      ON CONFLICT DO NOTHING
    `;
    const templates = await tx.$queryRaw<Array<{ id: string; locked_by_platform: boolean }>>`
      SELECT id, locked_by_platform FROM campusos_communications.templates
      WHERE tenant_id=${context.tenantId}::uuid AND template_key=${key} AND channel=${input.channel} LIMIT 1 FOR UPDATE
    `;
    const template = templates[0];
    if (!template) throw new CommunicationError('Unable to resolve the communication template.', 500, 'TEMPLATE_STORAGE_FAILED');
    if (template.locked_by_platform && context.activeRole !== 'SUPER_ADMIN') throw new CommunicationError('This template is platform locked.', 403, 'TEMPLATE_LOCKED');
    const versions = await tx.$queryRaw<Array<{ next_version: number }>>`
      SELECT COALESCE(MAX(version),0)::int+1 AS next_version
      FROM campusos_communications.template_versions WHERE template_id=${template.id}::uuid
    `;
    const version = versions[0]?.next_version ?? 1;
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_communications.template_versions
        (template_id, version, locale, status, subject_template, preheader_template, html_template, text_template, variables_schema, provider_template_name)
      VALUES
        (${template.id}::uuid, ${version}, ${input.locale ?? 'en-IN'}, 'DRAFT', ${input.subject ?? null}, ${input.preheader ?? null}, ${input.html ?? null}, ${text}, ${JSON.stringify(input.variablesSchema ?? {})}::jsonb, ${input.providerTemplateName ?? null})
      RETURNING id
    `;
    return { templateId: template.id, versionId: rows[0]!.id, version };
  });
}

export async function configureProviderMetadata(input: {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
  providerKey: string;
  displayName: string;
  providerMode: 'PLATFORM_MANAGED' | 'INSTITUTION_MANAGED';
  secretRef?: string | null;
  config?: Record<string, unknown>;
  status?: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'MISCONFIGURED';
}) {
  const context = await requireCommunicationAdmin();
  const providerKey = input.providerKey.trim().toUpperCase().slice(0, 80);
  if (!providerKey) throw new CommunicationError('Provider key is required.', 400, 'INVALID_PROVIDER');
  if (input.secretRef && !/^[a-zA-Z0-9_./:@-]{1,200}$/.test(input.secretRef)) throw new CommunicationError('Provider secret reference is invalid.', 400, 'INVALID_SECRET_REFERENCE');
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_communications.provider_accounts
      (tenant_id, scope, channel, provider_key, display_name, secret_ref, config, status, is_primary)
    VALUES
      (${context.tenantId}::uuid, 'INSTITUTION', ${input.channel}, ${providerKey}, ${input.displayName.slice(0, 120)}, ${input.secretRef ?? null}, ${JSON.stringify(input.config ?? {})}::jsonb, ${input.status ?? 'MISCONFIGURED'}, true)
    RETURNING id
  `;
  return { providerAccountId: rows[0]!.id };
}

export async function getTemplateCatalog() {
  const context = await requireCommunicationAdmin();
  const rows = await prisma.$queryRaw<Array<{
    template_id: string;
    template_key: string;
    channel: string;
    category: string;
    security_classification: string;
    version_id: string | null;
    version: number | null;
    locale: string | null;
    status: string | null;
    subject_template: string | null;
    text_template: string | null;
    provider_template_name: string | null;
  }>>`
    SELECT t.id AS template_id,t.template_key,t.channel,t.category,t.security_classification,
           tv.id AS version_id,tv.version,tv.locale,tv.status,tv.subject_template,tv.text_template,tv.provider_template_name
    FROM campusos_communications.templates t
    LEFT JOIN LATERAL (
      SELECT * FROM campusos_communications.template_versions v
      WHERE v.template_id=t.id ORDER BY v.version DESC LIMIT 1
    ) tv ON true
    WHERE t.tenant_id=${context.tenantId}::uuid
    ORDER BY t.category,t.template_key,t.channel LIMIT 500
  `;
  return rows;
}

export async function getCommunicationAudit(limit = 100) {
  const context = await requireCommunicationAdmin();
  const bounded = Math.min(200, Math.max(1, limit));
  const rows = await prisma.$queryRaw<Array<{ id: string; actor_role: string | null; action: string; target_type: string; target_id: string | null; reason: string | null; created_at: Date }>>`
    SELECT id,actor_role,action,target_type,target_id,reason,created_at
    FROM campusos_communications.audit_events
    WHERE tenant_id=${context.tenantId}::uuid
    ORDER BY created_at DESC LIMIT ${bounded}
  `;
  return rows.map((row) => ({ ...row, createdAt: row.created_at.toISOString() }));
}
