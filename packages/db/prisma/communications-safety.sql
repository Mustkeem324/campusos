CREATE SCHEMA IF NOT EXISTS campusos_communications;

CREATE TABLE IF NOT EXISTS campusos_communications.contact_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('EMAIL','PHONE','WHATSAPP')),
  normalized_value text NOT NULL,
  value_hash text NOT NULL,
  status text NOT NULL DEFAULT 'UNVERIFIED' CHECK (status IN ('UNVERIFIED','VERIFICATION_PENDING','VERIFIED','INVALID','BOUNCED','SUPPRESSED','OPTED_IN','OPTED_OUT','BLOCKED')),
  source text NOT NULL DEFAULT 'CORE_PROFILE',
  verified_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id, kind, value_hash)
);
CREATE INDEX IF NOT EXISTS contact_points_lookup_idx ON campusos_communications.contact_points(tenant_id, user_id, kind, status);

-- Sync verified core email identities without making the communications schema a
-- second source of truth for the actual address.
INSERT INTO campusos_communications.contact_points
  (tenant_id, user_id, kind, normalized_value, value_hash, status, source, verified_at)
SELECT
  u.tenant_id,
  u.id,
  'EMAIL',
  lower(trim(u.email)),
  encode(digest(lower(trim(u.email)), 'sha256'), 'hex'),
  CASE WHEN u."emailVerified" IS NOT NULL THEN 'VERIFIED' ELSE 'UNVERIFIED' END,
  'CORE_PROFILE',
  u."emailVerified"
FROM public.users u
WHERE u.email IS NOT NULL AND trim(u.email) <> ''
ON CONFLICT (tenant_id, user_id, kind, value_hash)
DO UPDATE SET
  normalized_value=EXCLUDED.normalized_value,
  status=CASE
    WHEN campusos_communications.contact_points.status IN ('SUPPRESSED','BOUNCED','BLOCKED') THEN campusos_communications.contact_points.status
    ELSE EXCLUDED.status
  END,
  verified_at=COALESCE(campusos_communications.contact_points.verified_at, EXCLUDED.verified_at),
  updated_at=now();

INSERT INTO campusos_communications.contact_points
  (tenant_id, user_id, kind, normalized_value, value_hash, status, source)
SELECT
  u.tenant_id,
  u.id,
  'PHONE',
  regexp_replace(u.phone, '[^0-9+]', '', 'g'),
  encode(digest(regexp_replace(u.phone, '[^0-9+]', '', 'g'), 'sha256'), 'hex'),
  'UNVERIFIED',
  'CORE_PROFILE'
FROM public.users u
WHERE u.phone IS NOT NULL AND trim(u.phone) <> ''
ON CONFLICT (tenant_id, user_id, kind, value_hash) DO NOTHING;

-- A WhatsApp destination starts UNKNOWN/UNVERIFIED and requires an explicit
-- provider/institution opt-in workflow before LIVE sends.
INSERT INTO campusos_communications.contact_points
  (tenant_id, user_id, kind, normalized_value, value_hash, status, source)
SELECT
  u.tenant_id,
  u.id,
  'WHATSAPP',
  regexp_replace(u.phone, '[^0-9+]', '', 'g'),
  encode(digest(regexp_replace(u.phone, '[^0-9+]', '', 'g'), 'sha256'), 'hex'),
  'UNVERIFIED',
  'CORE_PROFILE'
FROM public.users u
WHERE u.phone IS NOT NULL AND trim(u.phone) <> ''
ON CONFLICT (tenant_id, user_id, kind, value_hash) DO NOTHING;

-- Prevent paid usage from carrying fractional or negative units/costs.
ALTER TABLE campusos_communications.usage_ledger
  DROP CONSTRAINT IF EXISTS usage_ledger_nonnegative_cost_ck;
ALTER TABLE campusos_communications.usage_ledger
  ADD CONSTRAINT usage_ledger_nonnegative_cost_ck
  CHECK (billing_units >= 0 AND estimated_cost_minor >= 0 AND (actual_cost_minor IS NULL OR actual_cost_minor >= 0));

-- Provider callbacks can only persist canonical delivery states. UNKNOWN is
-- retained because some provider states cannot safely be mapped.
ALTER TABLE campusos_communications.delivery_events
  DROP CONSTRAINT IF EXISTS delivery_events_canonical_status_ck;
ALTER TABLE campusos_communications.delivery_events
  ADD CONSTRAINT delivery_events_canonical_status_ck
  CHECK (canonical_status IN ('QUEUED','SUBMITTED','SENT','DELIVERED','READ','FAILED','UNDELIVERED','EXPIRED','REJECTED','UNKNOWN'));

-- Ensure a message cannot be marked READ without also having a delivery point.
ALTER TABLE campusos_communications.messages
  DROP CONSTRAINT IF EXISTS messages_read_requires_delivery_ck;
ALTER TABLE campusos_communications.messages
  ADD CONSTRAINT messages_read_requires_delivery_ck
  CHECK (status <> 'READ' OR delivered_at IS NOT NULL);
