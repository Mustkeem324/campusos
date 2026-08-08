import type { MoneyMinor } from './finance-money';

export type LibrarySettings = {
  timezone: string;
  currency: string;
  accessionPrefix: string;
  accessionYearFormat: string;
  defaultStudentLoanDays: number;
  defaultFacultyLoanDays: number;
  defaultMaxRenewals: number;
  defaultMaxActiveLoans: number;
  defaultFinePerDayMinor: MoneyMinor;
  fineGraceDays: number;
  fineMaxCapMinor: MoneyMinor;
  reservationHoldHours: number;
  reservationMaxActive: number;
  clearanceRequiresFinance: boolean;
};

export type LibraryMembershipView = {
  id: string;
  userId: string;
  memberNumber: string;
  memberType: string;
  status: string;
  programId: string | null;
  departmentId: string | null;
  userName: string;
  email: string;
};

export type CatalogRecordView = {
  id: string;
  title: string;
  subtitle: string | null;
  resourceType: string;
  publisher: string | null;
  edition: string | null;
  publicationYear: number | null;
  isbn: string | null;
  issn: string | null;
  doi: string | null;
  language: string;
  subject: string | null;
  keywords: unknown[];
  description: string | null;
  callNumber: string | null;
  status: string;
  authors: Array<{ id: string; name: string; role: string; position: number }>;
  copies: Array<{
    id: string;
    accessionNumber: string;
    barcode: string | null;
    shelf: string | null;
    locationName: string | null;
    status: string;
    condition: string;
  }>;
  availableCopies: number;
  totalCopies: number;
  activeLoans: number;
  activeReservations: number;
};

export type LoanView = {
  id: string;
  copyId: string;
  memberId: string;
  memberName: string;
  accessionNumber: string;
  title: string;
  issueDate: string;
  dueDate: string;
  returnedAt: string | null;
  renewalCount: number;
  status: string;
  overdueDays: number;
  fineMinor: MoneyMinor;
};

export type ReservationView = {
  id: string;
  recordId: string;
  title: string;
  memberId: string;
  memberName: string;
  queuePosition: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

export type FineEventView = {
  id: string;
  eventType: string;
  amountMinor: MoneyMinor;
  currency: string;
  reason: string | null;
  financeReference: string | null;
  createdAt: string;
};

export type AcquisitionView = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  estimatedPriceMinor: MoneyMinor | null;
  reason: string | null;
  status: string;
  duplicateWarnings: unknown[];
  requestorName: string | null;
  createdAt: string;
};

export type ReadingListView = {
  id: string;
  courseOfferingId: string | null;
  courseTitle: string | null;
  courseCode: string | null;
  title: string;
  listType: string;
  items: Array<{
    id: string;
    recordId: string | null;
    digitalId: string | null;
    resourceTitle: string | null;
    note: string | null;
  }>;
};

export type LibraryClearanceView = {
  id: string;
  memberId: string;
  memberName: string;
  clearanceStatus: string;
  unreturnedCount: number;
  lostCount: number;
  unpaidFineMinor: MoneyMinor;
  notes: string | null;
  checkedAt: string | null;
};

export type LibraryWorkspaceView = {
  settings: LibrarySettings;
  role: string;
  canManage: boolean;
  canBorrow: boolean;
  currentUserId: string;
  currentMembership: LibraryMembershipView | null;
  myLoans: LoanView[];
  myReservations: ReservationView[];
  myFines: FineEventView[];
  myReadingLists: ReadingListView[];
  featuredCatalog: CatalogRecordView[];
  newArrivals: CatalogRecordView[];
  metrics: Array<{ id: string; label: string; value: number; hint: string; tone: 'positive' | 'warning' | 'danger' | 'neutral' }>;
};

export type LibraryAdminOverview = {
  settings: LibrarySettings;
  canCirculate: boolean;
  canAuthorizeFines: boolean;
  canReviewAcquisitions: boolean;
  memberships: LibraryMembershipView[];
  catalog: CatalogRecordView[];
  loans: LoanView[];
  overdueLoans: LoanView[];
  reservations: ReservationView[];
  pendingAcquisitions: AcquisitionView[];
  clearances: LibraryClearanceView[];
  metrics: Array<{ id: string; label: string; value: number; hint: string; tone: 'positive' | 'warning' | 'danger' | 'neutral' }>;
};
