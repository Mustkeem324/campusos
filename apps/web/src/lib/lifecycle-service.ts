export interface AdmissionLead {
  id: string;
  tenantId: string;
  applicantName: string;
  email: string;
  phone: string;
  programInterested: string;
  leadScore: number;
  entranceScore: number;
  status: 'LEAD_CAPTURED' | 'DOCUMENT_VERIFIED' | 'OFFER_ISSUED' | 'CONVERTED_STUDENT';
}

export interface StudentRecord {
  id: string;
  tenantId: string;
  leadId?: string;
  rollNumber: string;
  name: string;
  email: string;
  program: string;
  batchYear: number;
  cgpa: number;
  backlogs: number;
  status: 'ACTIVE_STUDENT' | 'ALUMNI';
}

export interface AlumniRecord {
  id: string;
  tenantId: string;
  studentId: string;
  name: string;
  email: string;
  graduationYear: number;
  companyName?: string;
  designation?: string;
  isVerified: boolean;
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  roleTitle: string;
  ctcPackageLPA: number; // in Lakhs Per Annum
  minCgpaRequired: number;
  maxBacklogsAllowed: number;
  eligibleBranches: string[];
}

// 1. Convert Admission Lead into Active Student Record (Phase 7 Exit Criteria 1)
export function convertLeadToStudent(
  lead: AdmissionLead,
  assignedRollNumber: string,
  batchYear = 2026
): StudentRecord {
  lead.status = 'CONVERTED_STUDENT';

  return {
    id: `stud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tenantId: lead.tenantId,
    leadId: lead.id,
    rollNumber: assignedRollNumber,
    name: lead.applicantName,
    email: lead.email,
    program: lead.programInterested,
    batchYear,
    cgpa: 0.0,
    backlogs: 0,
    status: 'ACTIVE_STUDENT',
  };
}

// 2. Convert Student into Alumni Record upon Graduation (Phase 7 Exit Criteria 2)
export function convertStudentToAlumnus(
  student: StudentRecord,
  graduationYear = 2026,
  companyName = 'Tech Corp',
  designation = 'Software Engineer'
): AlumniRecord {
  student.status = 'ALUMNI';

  return {
    id: `alum_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tenantId: student.tenantId,
    studentId: student.id,
    name: student.name,
    email: student.email,
    graduationYear,
    companyName,
    designation,
    isVerified: true,
  };
}

// 3. Placement Drive Eligibility Filter
export function checkPlacementEligibility(
  student: StudentRecord,
  drive: PlacementDrive
): { eligible: boolean; reason?: string } {
  if (student.cgpa < drive.minCgpaRequired) {
    return {
      eligible: false,
      reason: `Ineligible: Student CGPA is ${student.cgpa.toFixed(2)} (Min required: ${drive.minCgpaRequired.toFixed(2)})`,
    };
  }

  if (student.backlogs > drive.maxBacklogsAllowed) {
    return {
      eligible: false,
      reason: `Ineligible: Student has ${student.backlogs} active backlogs (Max allowed: ${drive.maxBacklogsAllowed})`,
    };
  }

  return { eligible: true };
}
