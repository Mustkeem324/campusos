import type { RoleType } from '@prisma/client';

export type HelpdeskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type HelpdeskStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_REQUESTER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type HelpdeskCategory =
  | 'ACADEMIC'
  | 'EXAMINATION'
  | 'FACULTY_CONCERN'
  | 'ATTENDANCE'
  | 'FEES'
  | 'ADMISSIONS'
  | 'LIBRARY'
  | 'HOSTEL'
  | 'TRANSPORT'
  | 'PLACEMENT'
  | 'HR'
  | 'TECHNICAL'
  | 'REGISTRAR'
  | 'OTHER';

export type HelpdeskMessage = {
  id: string;
  authorUserId: string;
  authorName: string;
  authorRole: RoleType;
  type: 'REPLY' | 'INTERNAL_NOTE' | 'SYSTEM' | 'ESCALATION';
  body: string;
  createdAt: string;
};

export type HelpdeskTicket = {
  id: string;
  caseNumber: string;
  requesterUserId: string;
  requesterName: string;
  requesterRole: RoleType;
  relatedStudentId: string | null;
  relatedStudentName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  category: HelpdeskCategory;
  subject: string;
  description: string;
  priority: HelpdeskPriority;
  status: HelpdeskStatus;
  currentQueueRole: RoleType;
  assignedUserId: string | null;
  assignedUserName: string | null;
  slaDueAt: string;
  slaBreached: boolean;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canHandle: boolean;
  canEscalate: boolean;
  canReply: boolean;
  escalationTargets: RoleType[];
  messages: HelpdeskMessage[];
};

export type HelpdeskRelatedStudent = {
  id: string;
  name: string;
  rollNumber: string;
  departmentName: string | null;
};

export type HelpdeskWorkspaceData = {
  generatedAt: string;
  storeReady: boolean;
  institutionName: string;
  userName: string;
  role: RoleType;
  roleLabel: string;
  tickets: HelpdeskTicket[];
  relatedStudents: HelpdeskRelatedStudent[];
  categories: Array<{ value: HelpdeskCategory; label: string; description: string }>;
  metrics: {
    visibleTickets: number;
    openTickets: number;
    waitingTickets: number;
    resolvedTickets: number;
    slaBreached: number;
    myQueue: number;
  };
  canCreatePlatformSupport: boolean;
  platformTickets: CompanySupportTicket[];
};

export type CompanySupportMessage = {
  id: string;
  authorSide: 'INSTITUTION' | 'CAMPUSOS';
  authorName: string;
  body: string;
  createdAt: string;
};

export type CompanySupportTicket = {
  id: string;
  reference: string;
  institutionId: string;
  institutionName: string;
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string;
  category: string;
  subject: string;
  description: string;
  priority: HelpdeskPriority;
  status: 'NEW' | 'OPEN' | 'WAITING_INSTITUTION' | 'RESOLVED' | 'CLOSED';
  assignedSuperAdminUserId: string | null;
  assignedSuperAdminName: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: CompanySupportMessage[];
};

export type CompanySupportInboxData = {
  generatedAt: string;
  tickets: CompanySupportTicket[];
  metrics: {
    total: number;
    newCount: number;
    openCount: number;
    waitingCount: number;
    resolvedCount: number;
    urgentCount: number;
  };
};
