CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS campusos_communications;

CREATE TABLE IF NOT EXISTS campusos_communications.settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  default_locale text NOT NULL DEFAULT 'en-IN',
  quiet_hours_start time,
  quiet_hours_end time,
  emergency_bypass_quiet_hours boolean NOT NULL DEFAULT true,
  default_email_enabled boolean NOT NULL DEFAULT true,
  default_in_app_enabled boolean NOT NULL DEFAULT true,
  default_sms_enabled boolean NOT NULL DEFAULT false,
  default_whatsapp_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_communications.channel_settings (
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','IN_APP','PUSH')),
  enabled boolean NOT NULL DEFAULT false,
  provider_key text,
  provider_mode text NOT NULL DEFAULT 'PLATFORM_MANAGED' CHECK (provider_mode IN ('PLATFORM_MANAGED','INSTITUTION_MANAGED')),
  fallback_channel text CHECK (fallback_channel IS NULL OR fallback_channel IN ('EMAIL','SMS','WHATSAPP','IN_APP','PUSH')),
  regulatory_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  rate_limit_per_minute integer CHECK (rate_limit_per_minute IS NULL OR rate_limit_per_minute > 0),
  daily_limit integer CHECK (daily_limit IS NULL OR daily_limit > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, channel)
);

CREATE TABLE IF NOT EXISTS campusos_communications.provider_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'INSTITUTION' CHECK (scope IN ('PLATFORM','INSTITUTION')),
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','PUSH')),
  provider_key text NOT NULL,
  display_name text NOT NULL,
  secret_ref text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'MISCONFIGURED' CHECK (status IN ('AVAILABLE','DEGRADED','UNAVAILABLE','MISCONFIGURED')),
  is_primary boolean NOT NULL DEFAULT false,
  is_fallback boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_accounts_tenant_channel_idx ON campusos_communications.provider_accounts(tenant_id, channel, status);

CREATE TABLE IF NOT EXISTS campusos_communications.provider_health_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  provider_account_id uuid REFERENCES campusos_communications.provider_accounts(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL CHECK (status IN ('AVAILABLE','DEGRADED','UNAVAILABLE','MISCONFIGURED')),
  sanitized_detail text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_health_events_lookup_idx ON campusos_communications.provider_health_events(provider_account_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.sender_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP')),
  display_name text,
  sender_value text NOT NULL,
  reply_to text,
  domain text,
  status text NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('PENDING_VERIFICATION','VERIFIED','FAILED','DISABLED')),
  provider_reference text,
  verification_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sender_identity_unique_idx ON campusos_communications.sender_identities(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), channel, sender_value);

CREATE TABLE IF NOT EXISTS campusos_communications.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','IN_APP','PUSH')),
  category text NOT NULL,
  security_classification text NOT NULL DEFAULT 'PERSONAL' CHECK (security_classification IN ('PUBLIC','INTERNAL','PERSONAL','CONFIDENTIAL','HIGHLY_CONFIDENTIAL')),
  locked_by_platform boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS template_scope_key_idx ON campusos_communications.templates(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), template_key, channel);

CREATE TABLE IF NOT EXISTS campusos_communications.template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES campusos_communications.templates(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  locale text NOT NULL DEFAULT 'en-IN',
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW_PENDING','APPROVED','ACTIVE','REJECTED','INACTIVE','ARCHIVED')),
  subject_template text,
  preheader_template text,
  html_template text,
  text_template text NOT NULL,
  variables_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_template_name text,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  activated_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, version, locale)
);
CREATE INDEX IF NOT EXISTS template_versions_active_idx ON campusos_communications.template_versions(template_id, locale, status, version DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.provider_template_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  template_version_id uuid NOT NULL REFERENCES campusos_communications.template_versions(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  provider_template_id text NOT NULL,
  provider_language text,
  approval_status text NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING','APPROVED','REJECTED','DISABLED')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_version_id, provider_key)
);

CREATE TABLE IF NOT EXISTS campusos_communications.communication_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','IN_APP','PUSH')),
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id, category, channel)
);
CREATE INDEX IF NOT EXISTS communication_preferences_user_idx ON campusos_communications.communication_preferences(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS campusos_communications.communication_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','PUSH')),
  purpose text NOT NULL,
  state text NOT NULL CHECK (state IN ('GRANTED','WITHDRAWN','NOT_REQUIRED','PENDING')),
  source text NOT NULL,
  policy_version text,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS communication_consents_lookup_idx ON campusos_communications.communication_consents(tenant_id, user_id, channel, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.recipient_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','PUSH')),
  destination_hash text,
  reason text NOT NULL,
  source text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recipient_suppressions_lookup_idx ON campusos_communications.recipient_suppressions(tenant_id, user_id, channel, expires_at);

CREATE TABLE IF NOT EXISTS campusos_communications.communication_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  category text NOT NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  correlation_id text NOT NULL,
  idempotency_key text NOT NULL,
  occurred_at timestamptz NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS communication_events_tenant_time_idx ON campusos_communications.communication_events(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS communication_events_type_idx ON campusos_communications.communication_events(tenant_id, event_type, occurred_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  communication_event_id uuid REFERENCES campusos_communications.communication_events(id) ON DELETE SET NULL,
  template_version_id uuid REFERENCES campusos_communications.template_versions(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','IN_APP','PUSH')),
  category text NOT NULL,
  classification text NOT NULL DEFAULT 'PERSONAL' CHECK (classification IN ('PUBLIC','INTERNAL','PERSONAL','CONFIDENTIAL','HIGHLY_CONFIDENTIAL')),
  recipient_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_type text NOT NULL,
  subject_snapshot text,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  body_hash text,
  masked_destination text,
  provider_key text,
  provider_reference text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SCHEDULED','PROCESSING','SUBMITTED','SENT','DELIVERED','READ','FAILED','RETRYING','CANCELLED','DEAD_LETTER','SUPPRESSED')),
  failure_code text,
  failure_detail text,
  scheduled_at timestamptz,
  queued_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  lease_owner text,
  leased_until timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 6 CHECK (max_attempts BETWEEN 1 AND 20),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, channel, idempotency_key)
);
CREATE INDEX IF NOT EXISTS messages_queue_idx ON campusos_communications.messages(status, next_attempt_at, scheduled_at) WHERE status IN ('PENDING','SCHEDULED','RETRYING');
CREATE INDEX IF NOT EXISTS messages_tenant_history_idx ON campusos_communications.messages(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_recipient_history_idx ON campusos_communications.messages(tenant_id, recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_provider_ref_idx ON campusos_communications.messages(provider_key, provider_reference) WHERE provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS campusos_communications.message_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES campusos_communications.messages(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL,
  provider_key text NOT NULL,
  state text NOT NULL,
  provider_reference text,
  failure_code text,
  sanitized_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE(message_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS campusos_communications.delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES campusos_communications.messages(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  provider_event_id text NOT NULL,
  canonical_status text NOT NULL,
  provider_status text,
  occurred_at timestamptz NOT NULL,
  payload_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_key, provider_event_id)
);
CREATE INDEX IF NOT EXISTS delivery_events_message_idx ON campusos_communications.delivery_events(message_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES campusos_communications.messages(id) ON DELETE SET NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT','EMERGENCY')),
  title text NOT NULL,
  body text NOT NULL,
  target_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  archived_at timestamptz,
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS in_app_notifications_user_idx ON campusos_communications.in_app_notifications(tenant_id, user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.notification_reads (
  notification_id uuid NOT NULL REFERENCES campusos_communications.in_app_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS campusos_communications.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  classification text NOT NULL DEFAULT 'INTERNAL',
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW_PENDING','APPROVED','SCHEDULED','SENDING','COMPLETED','PARTIALLY_FAILED','CANCELLED')),
  channels text[] NOT NULL DEFAULT ARRAY['EMAIL']::text[],
  audience_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_recipients integer,
  estimated_units integer,
  estimated_cost_minor bigint,
  currency text NOT NULL DEFAULT 'INR',
  scheduled_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaigns_tenant_status_idx ON campusos_communications.campaigns(tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.campaign_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campusos_communications.campaigns(id) ON DELETE CASCADE,
  audience_type text NOT NULL,
  scope_id uuid,
  resolved_count integer,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_communications.campaign_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campusos_communications.campaigns(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  decided_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  reason text,
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_communications.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  schedule_kind text NOT NULL CHECK (schedule_kind IN ('SEND_NOW','SCHEDULED','DIGEST','EVENT_RELATIVE')),
  scheduled_at timestamptz NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','QUEUED','COMPLETED','CANCELLED','FAILED')),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS campusos_communications.digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cadence text NOT NULL CHECK (cadence IN ('DAILY','WEEKLY','MONTHLY')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  event_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','QUEUED','SENT','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id, cadence, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS campusos_communications.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_communications.pricing_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_plan_id uuid NOT NULL REFERENCES campusos_communications.pricing_plans(id) ON DELETE CASCADE,
  version integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  monthly_base_minor bigint NOT NULL DEFAULT 0 CHECK (monthly_base_minor >= 0),
  included_sms_units bigint NOT NULL DEFAULT 0 CHECK (included_sms_units >= 0),
  included_whatsapp_units bigint NOT NULL DEFAULT 0 CHECK (included_whatsapp_units >= 0),
  sms_unit_cost_minor bigint NOT NULL DEFAULT 0 CHECK (sms_unit_cost_minor >= 0),
  whatsapp_unit_cost_minor bigint NOT NULL DEFAULT 0 CHECK (whatsapp_unit_cost_minor >= 0),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pricing_plan_id, version)
);

CREATE TABLE IF NOT EXISTS campusos_communications.tenant_channel_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('EMAIL','SMS','WHATSAPP','IN_APP','PUSH')),
  pricing_version_id uuid REFERENCES campusos_communications.pricing_versions(id) ON DELETE RESTRICT,
  lifecycle text NOT NULL DEFAULT 'AVAILABLE' CHECK (lifecycle IN ('AVAILABLE','SELECTED','PAYMENT_PENDING','ACTIVE','SUSPENDED','EXPIRED','CANCELLED')),
  billing_mode text NOT NULL DEFAULT 'PREPAID' CHECK (billing_mode IN ('PREPAID','POSTPAID','INCLUDED','CUSTOM')),
  monthly_spend_limit_minor bigint CHECK (monthly_spend_limit_minor IS NULL OR monthly_spend_limit_minor >= 0),
  auto_recharge_enabled boolean NOT NULL DEFAULT false,
  auto_recharge_threshold_units bigint,
  auto_recharge_package_units bigint,
  auto_recharge_spend_ceiling_minor bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, channel)
);

CREATE TABLE IF NOT EXISTS campusos_communications.credit_wallets (
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('SMS','WHATSAPP')),
  available_units bigint NOT NULL DEFAULT 0 CHECK (available_units >= 0),
  reserved_units bigint NOT NULL DEFAULT 0 CHECK (reserved_units >= 0),
  used_units bigint NOT NULL DEFAULT 0 CHECK (used_units >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id, channel)
);

CREATE TABLE IF NOT EXISTS campusos_communications.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('SMS','WHATSAPP')),
  transaction_type text NOT NULL CHECK (transaction_type IN ('PURCHASE','RESERVE','SETTLE','RELEASE','ADJUSTMENT','REFUND','EXPIRY')),
  units bigint NOT NULL,
  cost_minor bigint,
  currency text NOT NULL DEFAULT 'INR',
  reference_type text,
  reference_id text,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_transactions_tenant_idx ON campusos_communications.credit_transactions(tenant_id, channel, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  message_id uuid REFERENCES campusos_communications.messages(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('SMS','WHATSAPP')),
  state text NOT NULL CHECK (state IN ('RESERVED','SUBMITTED','DELIVERED','FAILED','REVERSED','ADJUSTED','REFUNDED')),
  provider_key text,
  billing_units bigint NOT NULL DEFAULT 0 CHECK (billing_units >= 0),
  estimated_cost_minor bigint NOT NULL DEFAULT 0 CHECK (estimated_cost_minor >= 0),
  actual_cost_minor bigint CHECK (actual_cost_minor IS NULL OR actual_cost_minor >= 0),
  currency text NOT NULL DEFAULT 'INR',
  provider_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_ledger_tenant_idx ON campusos_communications.usage_ledger(tenant_id, channel, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_communications.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL,
  provider_event_id text NOT NULL,
  signature_valid boolean NOT NULL,
  payload_hash text NOT NULL,
  canonical_status text,
  processed_at timestamptz,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_key, provider_event_id)
);

CREATE TABLE IF NOT EXISTS campusos_communications.dead_letter_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES campusos_communications.messages(id) ON DELETE CASCADE,
  reason_code text NOT NULL,
  sanitized_detail text,
  retry_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(message_id)
);

CREATE TABLE IF NOT EXISTS campusos_communications.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  before_state jsonb,
  after_state jsonb,
  reason text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS communications_audit_tenant_idx ON campusos_communications.audit_events(tenant_id, created_at DESC);

-- Baseline channel entitlements: email and in-app are core. Paid channels remain
-- unavailable until an institution subscription is activated explicitly.
INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled)
SELECT id, 'EMAIL', true FROM public.institutions
ON CONFLICT (tenant_id, channel) DO NOTHING;
INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled)
SELECT id, 'IN_APP', true FROM public.institutions
ON CONFLICT (tenant_id, channel) DO NOTHING;
INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled)
SELECT id, 'SMS', false FROM public.institutions
ON CONFLICT (tenant_id, channel) DO NOTHING;
INSERT INTO campusos_communications.channel_settings (tenant_id, channel, enabled)
SELECT id, 'WHATSAPP', false FROM public.institutions
ON CONFLICT (tenant_id, channel) DO NOTHING;

INSERT INTO campusos_communications.settings (tenant_id)
SELECT id FROM public.institutions
ON CONFLICT (tenant_id) DO NOTHING;
