export type ContractHealth = 'ACTIVE' | 'PENDING' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED' | 'UNCONTRACTED';

export type CompanyAdminContract = {
  id: string;
  institutionId: string;
  contractNumber: string;
  planName: string;
  status: string;
  health: ContractHealth;
  currency: string;
  contractValueMinor: number;
  annualizedValueMinor: number;
  billingCycle: string;
  startsAt: string;
  endsAt: string;
  daysRemaining: number;
  autoRenew: boolean;
  renewalNoticeDays: number;
  licensedStudents: number | null;
  licensedStaff: number | null;
  modules: string[];
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  accountOwner: string | null;
  notes: string | null;
  updatedAt: string;
};

export type CompanyAdminInstitution = {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  logoUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  users: number;
  students: number;
  campuses: number;
  supportCases: number;
  implementationProjects: number;
  contract: CompanyAdminContract | null;
};

export type CompanyAdminEvent = {
  id: string;
  actorUserId: string | null;
  institutionId: string | null;
  eventType: string;
  summary: string;
  detail: Record<string, unknown>;
  createdAt: string;
  institutionName: string | null;
};

export type CompanyAdminMetrics = {
  totalInstitutions: number;
  activeInstitutions: number;
  trialInstitutions: number;
  suspendedInstitutions: number;
  totalUsers: number;
  totalStudents: number;
  totalCampuses: number;
  activeContracts: number;
  pendingContracts: number;
  expiringContracts: number;
  expiredContracts: number;
  uncontractedInstitutions: number;
  annualizedPortfolioValueMinor: number;
  openSupportCases: number;
  implementationProjects: number;
};

export type CompanyAdminDashboardData = {
  generatedAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  metrics: CompanyAdminMetrics;
  institutions: CompanyAdminInstitution[];
  contracts: CompanyAdminContract[];
  events: CompanyAdminEvent[];
  growth: Array<{ label: string; institutions: number }>;
  controlPlaneReady: boolean;
};
