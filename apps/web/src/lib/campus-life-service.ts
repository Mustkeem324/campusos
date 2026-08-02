export interface HostelRoom {
  id: string;
  block: string;
  roomNumber: string;
  capacity: number;
  occupied: number;
}

export interface OutpassRequest {
  id: string;
  studentId: string;
  studentName: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  parentApproved: boolean;
  wardenApproved: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE_OUT';
}

export interface LibraryItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  copiesAvailable: number;
  totalCopies: number;
}

export interface LibraryLoan {
  id: string;
  studentId: string;
  bookTitle: string;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  fineAmount: number;
}

export interface HelpdeskTicket {
  id: string;
  studentId: string;
  subject: string;
  category: 'HOSTEL' | 'FINANCE' | 'ACADEMIC' | 'IT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  slaHoursRemaining: number;
  createdAt: Date;
}

// 1. Dual Approval Outpass Workflow Engine
export function evaluateOutpassStatus(request: OutpassRequest): 'APPROVED' | 'PENDING' {
  if (request.parentApproved && request.wardenApproved) {
    request.status = 'APPROVED';
    return 'APPROVED';
  }
  return 'PENDING';
}

// 2. Library Fine Auto-Calculator ($1/day overdue)
export function calculateLibraryFine(
  dueDateStr: string,
  returnDate: Date = new Date(),
  finePerDay = 1.0
): number {
  const dueDate = new Date(dueDateStr);
  if (returnDate <= dueDate) return 0;

  const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * finePerDay;
}

// 3. Automated Certificate Generator Data Structure (Bonafide / TC / Migration / NOC)
export interface CertificateRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  certificateType: 'BONAFIDE' | 'TRANSFER_CERTIFICATE' | 'MIGRATION' | 'NOC';
  verificationHash: string;
  issuedAt: Date;
}

export function generateBonafideCertificate(
  studentId: string,
  studentName: string,
  rollNumber: string,
  type: 'BONAFIDE' | 'TRANSFER_CERTIFICATE' | 'MIGRATION' | 'NOC' = 'BONAFIDE'
): CertificateRequest {
  const verificationHash = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  return {
    id: `cert_${Date.now()}`,
    studentId,
    studentName,
    rollNumber,
    certificateType: type,
    verificationHash,
    issuedAt: new Date(),
  };
}
