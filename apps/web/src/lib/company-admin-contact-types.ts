export type ContactInquiryStatus = 'NEW' | 'OPEN' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'SPAM';
export type ContactInquiryPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type ContactMessageDirection = 'INBOUND' | 'OUTBOUND';
export type ContactDeliveryStatus = 'RECEIVED' | 'QUEUED' | 'SENT' | 'FAILED';

export type CompanyContactMessage = {
  id: string;
  inquiryId: string;
  direction: ContactMessageDirection;
  authorUserId: string | null;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  bodyText: string;
  deliveryStatus: ContactDeliveryStatus;
  providerMessageId: string | null;
  createdAt: string;
};

export type CompanyContactInquiry = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  institution: string;
  role: string | null;
  country: string | null;
  inquiryType: string;
  subject: string;
  status: ContactInquiryStatus;
  priority: ContactInquiryPriority;
  assignedTo: string | null;
  assignedToName: string | null;
  consent: boolean;
  source: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messages: CompanyContactMessage[];
};

export type CompanyContactInboxMetrics = {
  total: number;
  new: number;
  open: number;
  waitingCustomer: number;
  resolved: number;
  urgent: number;
};

export type CompanyContactInboxData = {
  generatedAt: string;
  ready: boolean;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  metrics: CompanyContactInboxMetrics;
  inquiries: CompanyContactInquiry[];
};
