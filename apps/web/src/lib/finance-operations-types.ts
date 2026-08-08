import type { MoneyMinor } from './finance-money';

export type FinanceClearanceStatus = 'CLEAR' | 'PARTIALLY_DUE' | 'OVERDUE' | 'HOLD' | 'REVIEW_REQUIRED';

export type FinanceInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID' | 'REFUNDED';

export type RefundStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ScholarshipApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type FinanceSettings = {
  currency: string;
  timezone: string;
  invoicePrefix: string;
  invoiceYearFormat: string;
  allowPartialPayments: boolean;
  allowOverpaymentCredit: boolean;
  lateFeeModel: 'NONE' | 'FIXED' | 'PERCENTAGE' | 'DAILY';
  lateFeeAmountMinor: MoneyMinor;
  lateFeePercentage: number;
  lateFeeDaily: boolean;
  lateFeeGraceDays: number;
  lateFeeMaxMinor: MoneyMinor;
  scholarshipStackingPolicy: 'NO_STACKING' | 'LIMITED' | 'UNLIMITED';
  scholarshipMaxDiscountPct: number;
  refundRequiresMakerChecker: boolean;
  refundHighValueMinor: MoneyMinor;
  examRequiresClearance: boolean;
};

export type FeeCategory = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  isRefundable: boolean;
  isMandatory: boolean;
  isActive: boolean;
};

export type FeeStructureHead = {
  name: string;
  categoryCode: string | null;
  amountMinor: MoneyMinor;
  isRecurring: boolean;
};

export type FeeStructureView = {
  id: string;
  version: number;
  name: string;
  categoryCode: string | null;
  amountMinor: MoneyMinor;
  currency: string;
  academicYearId: string | null;
  campusId: string | null;
  programIds: string[];
  batchIds: string[];
  semester: string | null;
  studyModes: string[];
  recurring: boolean;
  isRefundable: boolean;
  isMandatory: boolean;
  taxApplicable: boolean;
  taxRate: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  installmentEligibility: boolean;
  maxInstallments: number;
  scholarshipEligible: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  heads: FeeStructureHead[];
  createdAt: string;
};

export type FinanceInvoiceView = {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  description: string;
  categoryCode: string | null;
  grossMinor: MoneyMinor;
  scholarshipMinor: MoneyMinor;
  creditsMinor: MoneyMinor;
  lateFeeMinor: MoneyMinor;
  paidMinor: MoneyMinor;
  outstandingMinor: MoneyMinor;
  dueDate: string;
  status: FinanceInvoiceStatus;
  installments: Array<{ number: number; amountMinor: MoneyMinor; paidMinor: MoneyMinor; dueDate: string; status: string }>;
};

export type LedgerEntryView = {
  id: string;
  entryType: string;
  debitMinor: MoneyMinor;
  creditMinor: MoneyMinor;
  reference: string | null;
  reason: string | null;
  actorRole: string | null;
  createdAt: string;
};

export type RefundView = {
  id: string;
  paymentId: string;
  invoiceId: string | null;
  requestedMinor: MoneyMinor;
  approvedMinor: MoneyMinor | null;
  status: RefundStatus;
  reason: string;
  requestedRole: string;
  reviewNote: string | null;
  completionReference: string | null;
  createdAt: string;
};

export type ScholarshipProgramView = {
  id: string;
  name: string;
  provider: string | null;
  valueType: string;
  fixedAmountMinor: MoneyMinor;
  percentage: number;
  capMinor: MoneyMinor;
  budgetMinor: MoneyMinor;
  awardedMinor: MoneyMinor;
  programIds: string[];
  status: string;
  applicationOpens: string | null;
  applicationCloses: string | null;
  appliesToComponents: string[];
  stackingAllowed: boolean;
};

export type ScholarshipApplicationView = {
  id: string;
  programId: string;
  programName: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: ScholarshipApplicationStatus;
  statement: string | null;
  documentRefs: string[];
  createdAt: string;
};

export type FinancialHoldView = {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  reason: string;
  amountMinor: MoneyMinor;
  impactScope: string[];
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
};

export type StudentFinanceWorkspace = {
  role: string;
  institution: { id: string; name: string; subdomain: string } | null;
  student: { id: string; name: string; rollNumber: string } | null;
  settings: FinanceSettings;
  clearance: FinanceClearanceStatus;
  summary: {
    totalOutstandingMinor: MoneyMinor;
    overdueMinor: MoneyMinor;
    nextDueDate: string | null;
    paidMinor: MoneyMinor;
    scholarshipAwardedMinor: MoneyMinor;
  };
  invoices: FinanceInvoiceView[];
  ledger: LedgerEntryView[];
  refunds: RefundView[];
  scholarships: {
    programs: ScholarshipProgramView[];
    applications: ScholarshipApplicationView[];
  };
  receipts: Array<{
    id: string;
    receiptNumber: string;
    verifyReference: string;
    amountMinor: MoneyMinor;
    currency: string;
    paymentMethod: string;
    issuedAt: string;
  }>;
  canPay: boolean;
};

export type InvoiceGenerationPreview = {
  structure: FeeStructureView;
  candidateCount: number;
  grossMinor: MoneyMinor;
  scholarshipMinor: MoneyMinor;
  netMinor: MoneyMinor;
  excludedStudents: number;
  existingInvoiceCount: number;
  sampleStudents: Array<{ id: string; name: string; rollNumber: string }>;
};

export type AdminFinanceOverview = {
  role: string;
  institution: { id: string; name: string; subdomain: string } | null;
  settings: FinanceSettings;
  currency: string;
  summary: {
    billedMinor: MoneyMinor;
    collectedMinor: MoneyMinor;
    outstandingMinor: MoneyMinor;
    overdueMinor: MoneyMinor;
    collectedTodayMinor: MoneyMinor;
    collectedThisMonthMinor: MoneyMinor;
    pendingRefundCount: number;
    scholarshipCommittedMinor: MoneyMinor;
    creditNoteOutstandingMinor: MoneyMinor;
    activeHoldCount: number;
    unreconciledManualCount: number;
    failedAttemptCount: number;
    partiallyPaidInvoiceCount: number;
  };
  feeCategories: FeeCategory[];
  feeStructures: FeeStructureView[];
  pendingRefunds: RefundView[];
  scholarshipPrograms: ScholarshipProgramView[];
  pendingScholarshipApplications: ScholarshipApplicationView[];
  activeHolds: FinancialHoldView[];
  recentAudit: Array<{ id: string; action: string; targetType: string; actorRole: string; createdAt: string }>;
};

export type ReceiptVerification = {
  status: 'VALID' | 'REVOKED' | 'SUPERSEDED';
  institutionName: string;
  receiptNumber: string;
  amountMinor: MoneyMinor;
  currency: string;
  paymentMethod: string;
  issuedAt: string;
};
