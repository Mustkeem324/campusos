export type StudentStudyMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type HostelOwnershipMode = 'INSTITUTION' | 'THIRD_PARTY' | 'MIXED';
export type HostelAvailabilityReason = 'AVAILABLE' | 'MODULE_DISABLED' | 'ONLINE_ONLY' | 'HYBRID_DISABLED' | 'NOT_ENROLLED' | 'ROLE_NOT_SUPPORTED' | 'STORE_UNAVAILABLE' | 'UNCLASSIFIED';

export type HostelModuleSettings = {
  storeReady: boolean;
  enabled: boolean;
  ownershipMode: HostelOwnershipMode;
  allowHybridStudents: boolean;
  requireParentOutpassApproval: boolean;
  requireWardenOutpassApproval: boolean;
  facultyWelfareVisibility: boolean;
  thirdPartySyncEnabled: boolean;
  currency: string;
};

export type HostelAvailability = {
  visible: boolean;
  reason: HostelAvailabilityReason;
  studyMode?: StudentStudyMode | 'UNCLASSIFIED';
};

export type HostelCharge = {
  id: string;
  category: 'HOSTEL' | 'MESS' | 'MAINTENANCE' | 'SECURITY_DEPOSIT' | 'DAMAGE' | 'OTHER';
  description: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  status: 'DUE' | 'PARTIAL' | 'PAID' | 'WAIVED' | 'DISPUTED';
  source: 'INSTITUTION' | 'THIRD_PARTY';
};

export type HostelAllocationView = {
  id: string;
  facilityName: string;
  ownership: 'INSTITUTION' | 'THIRD_PARTY';
  building: string | null;
  roomNumber: string | null;
  bedLabel: string | null;
  mealPlan: string | null;
  status: 'ACTIVE' | 'RESERVED' | 'CHECKED_OUT';
  providerName: string | null;
};

export type HostelOutpassView = {
  id: string;
  destination: string;
  reason: string | null;
  departureAt: string;
  expectedReturnAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OUT' | 'RETURNED' | 'CANCELLED';
  parentApproval: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  wardenApproval: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
};

export type HostelIncidentView = {
  id: string;
  kind: 'DAMAGE' | 'DISCIPLINE' | 'SAFETY' | 'MAINTENANCE';
  title: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  occurredAt: string;
  chargeAmount: number | null;
  currency: string | null;
};

export type HostelStudentSummary = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  studyMode: StudentStudyMode | 'UNCLASSIFIED';
  eligible: boolean;
  enrolled: boolean;
  allocation: HostelAllocationView | null;
  balanceDue: number;
  currentOutpassStatus: string | null;
};

export type HostelWorkspaceData = {
  role: string;
  settings: HostelModuleSettings;
  availability: HostelAvailability;
  student?: HostelStudentSummary | null;
  allocation?: HostelAllocationView | null;
  charges: HostelCharge[];
  outpasses: HostelOutpassView[];
  incidents: HostelIncidentView[];
  operations?: {
    totalEligible: number;
    activeResidents: number;
    roomsOccupied: number;
    pendingOutpasses: number;
    outstandingAmount: number;
    thirdPartyResidents: number;
    students: HostelStudentSummary[];
  };
};
