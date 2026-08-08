import type { MoneyMinor } from './finance-money';

export type ResearchSettings = {
  timezone: string;
  currency: string;
  supervisorCapacity: number;
  proposalRequiresReview: boolean;
  similarityThresholdOk: number;
  similarityThresholdReview: number;
  repositoryRequiresApproval: boolean;
  defaultEmbargoDays: number | null;
};

export type ResearchProjectView = {
  id: string;
  title: string;
  abstract: string | null;
  researchType: string;
  departmentId: string | null;
  departmentName: string | null;
  researchArea: string | null;
  status: string;
  startDate: string | null;
  expectedCompletion: string | null;
  fundingSource: string | null;
  keywords: unknown[];
  myRole: string | null;
  members: Array<{ id: string; userId: string; memberRole: string; userName: string }>;
  supervisors: Array<{ id: string; supervisorId: string; role: string; status: string; supervisorName: string }>;
  proposalStatus: string | null;
  milestoneSummary: { total: number; completed: number; pending: number };
};

export type ThesisView = {
  id: string;
  studentUserId: string;
  studentName: string;
  projectId: string | null;
  title: string;
  status: string;
  registeredAt: string | null;
  finalSubmittedAt: string | null;
  approvedAt: string | null;
  versions: Array<{ id: string; version: number; fileName: string | null; submittedAt: string; status: string }>;
  similarity: Array<{
    id: string;
    provider: string;
    similarityScore: number | null;
    reportStatus: string;
    outcome: string | null;
    reviewedAt: string | null;
  }>;
  viva: Array<{ id: string; scheduledAt: string; mode: string; status: string; outcome: string | null }>;
};

export type RepositoryItemView = {
  id: string;
  title: string;
  authors: unknown[];
  resourceType: string;
  accessLevel: string;
  submissionStatus: string;
  permanentId: string;
  publicationYear: number | null;
  abstract: string | null;
  license: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  versions: Array<{ id: string; version: number; fileName: string | null; uploadedAt: string }>;
  embargo: Array<{ id: string; embargoStart: string; embargoEnd: string | null; releasedAt: string | null }>;
};

export type PublicationView = {
  id: string;
  title: string;
  publicationType: string;
  venue: string | null;
  year: number | null;
  doi: string | null;
  verificationStatus: string;
  createdAt: string;
};

export type GrantView = {
  id: string;
  projectId: string | null;
  projectTitle: string | null;
  fundingAgency: string;
  grantReference: string;
  title: string;
  approvedBudgetMinor: MoneyMinor;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
};

export type ResearchWorkspaceView = {
  settings: ResearchSettings;
  role: string;
  currentUserId: string;
  canOperate: boolean;
  canApprove: boolean;
  canAssignSupervisors: boolean;
  myProjects: ResearchProjectView[];
  myTheses: ThesisView[];
  myPublications: PublicationView[];
  supervisedProjects: ResearchProjectView[];
  pendingForReview: Array<{ id: string; kind: string; title: string; status: string; createdAt: string }>;
  repositoryMine: RepositoryItemView[];
  metrics: Array<{ id: string; label: string; value: number; hint: string; tone: 'positive' | 'warning' | 'danger' | 'neutral' }>;
};

export type ResearchAdminOverview = {
  settings: ResearchSettings;
  canApprove: boolean;
  canAssignSupervisors: boolean;
  canReview: boolean;
  projects: ResearchProjectView[];
  theses: ThesisView[];
  repository: RepositoryItemView[];
  publications: PublicationView[];
  grants: GrantView[];
  pendingReviews: Array<{ id: string; kind: string; title: string; status: string; createdAt: string }>;
  metrics: Array<{ id: string; label: string; value: number; hint: string; tone: 'positive' | 'warning' | 'danger' | 'neutral' }>;
};
