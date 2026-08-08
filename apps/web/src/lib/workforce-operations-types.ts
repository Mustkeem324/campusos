import type { MoneyMinor } from './finance-money';

export type EmploymentStatus =
  | 'CANDIDATE'
  | 'OFFERED'
  | 'PRE_JOINING'
  | 'ACTIVE'
  | 'PROBATION'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'NOTICE_PERIOD'
  | 'SEPARATION_PENDING'
  | 'RESIGNED'
  | 'TERMINATED'
  | 'RETIRED'
  | 'CONTRACT_ENDED'
  | 'EXITED';

export type LeaveRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MANAGER_APPROVAL'
  | 'HR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WITHDRAWN';

export type PayrollPeriodStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'REVIEW'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'DISBURSEMENT_PENDING'
  | 'PAID'
  | 'CLOSED'
  | 'REOPENED';

export type StaffAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'WEEK_OFF'
  | 'OFFICIAL_DUTY'
  | 'WORK_FROM_HOME';

export type WorkforceSettings = {
  timezone: string;
  employeeNumberPrefix: string;
  employeeNumberYearFormat: string;
  attendanceDayStart: string;
  overnightShiftAllowed: boolean;
  missingCheckoutGraceMinutes: number;
  leaveBalanceEnforced: boolean;
  leaveApprovalMakerChecker: boolean;
  leaveDeductionOnApproval: boolean;
  leaveCancellationRestores: boolean;
  unpaidLeaveBasis: 'CALENDAR_DAYS' | 'WORKING_DAYS';
  payrollMakerChecker: boolean;
  payrollMonthlyDivisor: number;
  payrollProtectClosed: boolean;
  payrollRequireDisbursementConfirmation: boolean;
  finalSettlementMakerChecker: boolean;
  probationDays: number;
  noticePeriodDays: number;
};

export type EmployeeProfileView = {
  id: string;
  staffId: string;
  userId: string;
  employeeNumber: string;
  employeeType: string;
  employmentType: string;
  designation: string;
  grade: string | null;
  departmentId: string | null;
  departmentName: string | null;
  campusId: string | null;
  reportingManagerId: string | null;
  reportingManagerName: string | null;
  joiningDate: string;
  confirmationDate: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  workLocation: string | null;
  workMode: string;
  employmentStatus: EmploymentStatus;
  personalEmail: string | null;
  workEmail: string | null;
  phone: string | null;
  emergencyContact: unknown;
  bankAccountMasked: string | null;
  bankIfsc: string | null;
  lastWorkingDay: string | null;
  exitReason: string | null;
  name: string;
  email: string;
};

export type CompensationVersionView = {
  id: string;
  version: number;
  effectiveFrom: string;
  basePayMinor: MoneyMinor;
  earnings: Array<{ code: string; label: string; amountMinor: MoneyMinor }>;
  deductions: Array<{ code: string; label: string; amountMinor: MoneyMinor; percentage?: number }>;
  employerContributions: Array<{ code: string; label: string; amountMinor: MoneyMinor }>;
  grossMinor: MoneyMinor;
  ctcMinor: MoneyMinor;
  currency: string;
  status: string;
  createdBy: string;
  createdAt: string;
};

export type LeaveBalanceView = {
  policyId: string;
  code: string;
  name: string;
  leaveType: string;
  opening: number;
  earned: number;
  used: number;
  adjusted: number;
  expired: number;
  restored: number;
  closing: number;
  isPaid: boolean;
};

export type LeaveRequestView = {
  id: string;
  employeeId: string;
  employeeName: string;
  policyId: string;
  policyCode: string;
  policyName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  timetableConflicts: unknown[];
  managerReviewedAt: string | null;
  hrReviewedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type StaffAttendanceView = {
  id: string;
  attendanceDate: string;
  shiftName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  workMinutes: number | null;
  status: StaffAttendanceStatus;
  source: string;
  note: string | null;
};

export type AttendanceCorrectionView = {
  id: string;
  employeeId: string;
  employeeName: string;
  attendanceDate: string | null;
  originalState: unknown;
  proposedState: unknown;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedBy: string;
  createdAt: string;
};

export type PayrollPeriodView = {
  id: string;
  periodKey: string;
  periodLabel: string;
  cycle: string;
  startDate: string;
  endDate: string;
  status: PayrollPeriodStatus;
  preparedBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  disbursedAt: string | null;
  notes: string | null;
  entries: PayrollEntryView[];
};

export type PayrollEntryView = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  earnings: Array<{ code: string; label: string; amountMinor: MoneyMinor }>;
  deductions: Array<{ code: string; label: string; amountMinor: MoneyMinor }>;
  grossMinor: MoneyMinor;
  totalDeductionMinor: MoneyMinor;
  netMinor: MoneyMinor;
  currency: string;
  status: 'READY' | 'EXCEPTION' | 'REVIEW' | 'APPROVED' | 'PAID' | 'FAILED';
  exceptions: Array<{ code: string; message: string }>;
};

export type PayslipView = {
  id: string;
  payslipNumber: string;
  verifyReference: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  grossMinor: MoneyMinor;
  netMinor: MoneyMinor;
  currency: string;
  status: string;
  issuedAt: string;
};

export type ReimbursementClaimView = {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amountMinor: MoneyMinor;
  currency: string;
  reason: string;
  status: string;
  createdAt: string;
};

export type ResignationRequestView = {
  id: string;
  employeeId: string;
  employeeName: string;
  submissionDate: string;
  proposedLastWorkingDay: string;
  noticePeriodDays: number;
  reason: string;
  status: string;
  finalLastWorkingDay: string | null;
  createdAt: string;
};

export type ClearanceItemView = {
  id: string;
  resignationId: string | null;
  department: string;
  status: 'PENDING' | 'CLEARED' | 'EXCEPTION' | 'WAIVED';
  note: string | null;
  completedAt: string | null;
};

export type FinalSettlementView = {
  id: string;
  resignationId: string;
  salaryPayableMinor: MoneyMinor;
  leaveEncashmentMinor: MoneyMinor;
  noticeRecoveryMinor: MoneyMinor;
  approvedReimbursementsMinor: MoneyMinor;
  advancesRecoveryMinor: MoneyMinor;
  loanRecoveryMinor: MoneyMinor;
  otherAdjustmentsMinor: MoneyMinor;
  netSettlementMinor: MoneyMinor;
  currency: string;
  status: string;
  preparedBy: string;
  approvedAt: string | null;
};

export type JobRequisitionView = {
  id: string;
  departmentId: string | null;
  departmentName: string | null;
  positionTitle: string;
  employeeType: string;
  requiredCount: number;
  reason: string | null;
  qualifications: string | null;
  experienceYears: number | null;
  compensationRange: unknown;
  targetJoinDate: string | null;
  status: string;
  requestedBy: string;
  requestedRole: string;
  createdAt: string;
};

export type CandidateView = {
  id: string;
  requisitionId: string | null;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  status: string;
  hrNotes: string | null;
  createdAt: string;
  interviews: Array<{
    id: string;
    stage: string;
    scheduledAt: string;
    mode: string;
    status: string;
    score: number | null;
    recommendation: string | null;
  }>;
};

export type InterviewFeedbackInput = {
  score: number;
  recommendation: string;
  feedback: Record<string, unknown>;
};

export type EmployeeSelfServiceWorkspace = {
  profile: EmployeeProfileView | null;
  settings: WorkforceSettings;
  todayAttendance: StaffAttendanceView | null;
  recentAttendance: StaffAttendanceView[];
  leaveBalances: LeaveBalanceView[];
  myLeaveRequests: LeaveRequestView[];
  myPayslips: PayslipView[];
  myReimbursements: ReimbursementClaimView[];
  myResignation: ResignationRequestView | null;
  onboardingTasks: Array<{ id: string; item: string; category: string; status: string }>;
  shifts: Array<{ id: string; name: string; code: string; startTime: string; endTime: string }>;
};

export type WorkforceAdminOverview = {
  settings: WorkforceSettings;
  metrics: Array<{ id: string; label: string; value: number; hint: string; tone: 'positive' | 'warning' | 'danger' | 'neutral' }>;
  employees: EmployeeProfileView[];
  pendingLeaveRequests: LeaveRequestView[];
  pendingCorrections: AttendanceCorrectionView[];
  pendingReimbursements: ReimbursementClaimView[];
  pendingResignations: ResignationRequestView[];
  activePayrollPeriods: PayrollPeriodView[];
  recentHistory: Array<{
    id: string;
    changeType: string;
    employeeName: string;
    effectiveFrom: string;
    reason: string | null;
    createdAt: string;
  }>;
};
