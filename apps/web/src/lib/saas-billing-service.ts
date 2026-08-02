export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'UNIVERSITY_WIDE';

export interface TenantSubscription {
  tenantId: string;
  subdomain: string;
  institutionName: string;
  tier: SubscriptionTier;
  activeStudentCount: number;
  storageGB: number;
  whatsappSent: number;
  isProvisioned: boolean;
}

export interface FeatureFlagMatrix {
  AI_COPILOT: boolean;
  RETENTION_ENGINE: boolean;
  DIGILOCKER_NAD: boolean;
  ADVANCED_ANALYTICS: boolean;
  CUSTOM_DOMAINS: boolean;
}

// 1. Feature Flag Entitlement Evaluator per Plan Tier
export function evaluatePlanFeatureFlags(tier: SubscriptionTier): FeatureFlagMatrix {
  switch (tier) {
    case 'STARTER':
      return { AI_COPILOT: false, RETENTION_ENGINE: false, DIGILOCKER_NAD: true, ADVANCED_ANALYTICS: false, CUSTOM_DOMAINS: false };
    case 'GROWTH':
      return { AI_COPILOT: true, RETENTION_ENGINE: true, DIGILOCKER_NAD: true, ADVANCED_ANALYTICS: true, CUSTOM_DOMAINS: false };
    case 'ENTERPRISE':
    case 'UNIVERSITY_WIDE':
      return { AI_COPILOT: true, RETENTION_ENGINE: true, DIGILOCKER_NAD: true, ADVANCED_ANALYTICS: true, CUSTOM_DOMAINS: true };
  }
}

// 2. Per-Active-Student SaaS Monthly Pricing Calculator ($1/student/month)
export function calculateSaaSMonthlyInvoice(
  activeStudentCount: number,
  tier: SubscriptionTier,
  storageGB = 10,
  includedStorageGB = 50
): { basePrice: number; storageOverage: number; totalMonthly: number } {
  let ratePerStudent = 1.0;
  if (tier === 'GROWTH') ratePerStudent = 1.5;
  if (tier === 'ENTERPRISE') ratePerStudent = 2.0;

  const basePrice = Math.round(activeStudentCount * ratePerStudent);
  const extraStorage = Math.max(0, storageGB - includedStorageGB);
  const storageOverage = extraStorage * 0.50; // $0.50 per extra GB

  const totalMonthly = basePrice + storageOverage;
  return { basePrice, storageOverage, totalMonthly };
}

// 3. Instant 3-Minute Self-Serve Tenant Provisioning Engine (Phase 18 Exit Criteria 1)
export function provisionSelfServeTenant(input: {
  institutionName: string;
  subdomainPrefix: string;
  adminEmail: string;
  tier: SubscriptionTier;
  initialStudentCount: number;
}): TenantSubscription {
  const subdomain = `${input.subdomainPrefix.toLowerCase()}.campusos.app`;
  const tenantId = `inst_${input.subdomainPrefix.toLowerCase()}_${Date.now()}`;

  return {
    tenantId,
    subdomain,
    institutionName: input.institutionName,
    tier: input.tier,
    activeStudentCount: input.initialStudentCount,
    storageGB: 5,
    whatsappSent: 0,
    isProvisioned: true,
  };
}
