export const SUPPORT_CATEGORIES = [
  'PRODUCT_ENQUIRY',
  'INSTITUTION_ONBOARDING',
  'TECHNICAL_SUPPORT',
  'ACCOUNT_ACCESS',
  'BILLING_ENQUIRY',
  'PARTNERSHIP',
  'DATA_PRIVACY',
  'SECURITY_REPORT',
  'CAREERS',
  'GENERAL_ENQUIRY',
] as const;

export const SUPPORT_STATUSES = [
  'NEW',
  'ACKNOWLEDGED',
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_CUSTOMER',
  'WAITING_FOR_INTERNAL_TEAM',
  'ESCALATED',
  'RESOLVED',
  'CLOSED',
  'SPAM',
  'ARCHIVED',
] as const;

export const SUPPORT_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'] as const;
export const SUPPORT_LOCALES = ['en-IN', 'hi-IN', 'ur-IN', 'ar', 'mr-IN', 'te-IN', 'kn-IN'] as const;
export const SUPPORT_CONTACT_METHODS = ['EMAIL', 'PHONE', 'CHAT'] as const;
export const SUPPORT_REQUESTER_TYPES = [
  'PROSPECTIVE_INSTITUTION',
  'INSTITUTION_ADMINISTRATOR',
  'FACULTY_MEMBER',
  'STUDENT',
  'PARENT_GUARDIAN',
  'FINANCE_TEAM',
  'PARTNER',
  'JOB_APPLICANT',
  'OTHER',
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export type SupportLocale = (typeof SUPPORT_LOCALES)[number];
export type SupportContactMethod = (typeof SUPPORT_CONTACT_METHODS)[number];
export type SupportRequesterType = (typeof SUPPORT_REQUESTER_TYPES)[number];

export type SupportRequestInput = {
  fullName: string;
  email: string;
  phone?: string;
  institutionName: string;
  institutionCode?: string;
  requesterType: SupportRequesterType;
  category: SupportCategory;
  subject: string;
  message: string;
  preferredContactMethod: SupportContactMethod;
  preferredLocale: SupportLocale;
  consent: true;
  consentVersion: string;
  source: string;
  website?: string;
  startedAt: number;
};

export type SupportRequestRecord = {
  id: string;
  tenantId: string | null;
  requesterUserId: string | null;
  referenceCode: string;
  fullName: string;
  emailDisplay: string;
  phone: string | null;
  institutionName: string;
  institutionCode: string | null;
  requesterType: SupportRequesterType;
  category: SupportCategory;
  subject: string;
  message: string;
  preferredContactMethod: SupportContactMethod;
  preferredLocale: SupportLocale;
  source: string;
  status: SupportStatus;
  priority: SupportPriority;
  assignedTeam: string;
  assignedAgentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SupportPublicView = {
  reference: string;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    authorType: 'CUSTOMER' | 'SUPPORT_AGENT' | 'SYSTEM' | 'CHATBOT';
    body: string;
    createdAt: string;
  }>;
};

export type SupportChatIntent =
  | 'GREETING'
  | 'ACCOUNT_ACCESS'
  | 'BILLING'
  | 'SECURITY'
  | 'PRIVACY'
  | 'CAREERS'
  | 'ONBOARDING'
  | 'TECHNICAL'
  | 'HUMAN_HANDOFF'
  | 'TICKET_STATUS'
  | 'GENERAL';

export type SupportAssistantResult = {
  answer: string;
  intent: SupportChatIntent;
  confidence: number;
  sourceReferences: Array<{ title: string; href: string }>;
  recommendedActions: Array<{ label: string; href: string }>;
  handoffRecommended: boolean;
  safetyStatus: 'SAFE' | 'REDACTED' | 'BLOCKED';
};

export type SupportAdminListItem = {
  id: string;
  referenceCode: string;
  fullName: string;
  emailDisplay: string;
  institutionName: string;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  priority: SupportPriority;
  assignedTeam: string;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailSendResult = {
  accepted: boolean;
  providerMessageId?: string;
  failureType?: 'temporary' | 'permanent';
  safeErrorCode?: string;
};
