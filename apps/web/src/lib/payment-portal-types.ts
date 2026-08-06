export type PaymentPortalInvoiceStatus = 'DUE' | 'UPCOMING' | 'OVERDUE' | 'PAID' | 'VERIFICATION_PENDING';

export type PaymentPortalInvoice = {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  description: string;
  dueDate: string;
  amount: number;
  paid: number;
  balance: number;
  status: PaymentPortalInvoiceStatus;
};

export type PaymentPortalTransactionStatus =
  | 'SUCCESSFUL'
  | 'PROCESSING'
  | 'FAILED'
  | 'REFUNDED'
  | 'VERIFICATION_PENDING'
  | 'REJECTED';

export type PaymentPortalTransaction = {
  id: string;
  providerReference: string | null;
  date: string;
  method: string;
  invoiceLabel: string;
  amount: number;
  status: PaymentPortalTransactionStatus;
  receiptNo: string | null;
  detail?: string | null;
};

export type PaymentPortalSettings = {
  razorpayEnabled: boolean;
  stripeEnabled: boolean;
  bankTransferEnabled: boolean;
  currency: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;
  paymentInstructions: string;
  gatewayAvailability: {
    razorpay: boolean;
    stripe: boolean;
  };
};

export type ManualPaymentReviewItem = {
  id: string;
  payerUserId: string;
  payerName: string;
  payerEmail: string;
  invoiceIds: string[];
  amount: number;
  currency: string;
  transactionReference: string;
  bankName: string | null;
  transferDate: string;
  payerNote: string | null;
  proofFileName: string;
  proofMimeType: string;
  status: string;
  createdAt: string;
};

export type PaymentPortalData = {
  generatedAt: string;
  role: string;
  institution: {
    id: string;
    name: string;
    subdomain: string;
  };
  payer: {
    userId: string;
    name: string;
    email: string;
  };
  capabilities: {
    canPay: boolean;
    canReviewManualTransfers: boolean;
    canManagePaymentSettings: boolean;
  };
  settings: PaymentPortalSettings;
  summary: {
    outstandingBalance: number;
    nextDueDate: string | null;
    overdueInvoiceCount: number;
    lastPaymentAmount: number | null;
    lastPaymentDate: string | null;
    pendingVerificationCount: number;
  };
  invoices: PaymentPortalInvoice[];
  transactions: PaymentPortalTransaction[];
  reviewQueue: ManualPaymentReviewItem[];
};
