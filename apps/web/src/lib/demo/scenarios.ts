import { RoleType } from '@prisma/client';

export interface DemoStepDefinition {
  stepNumber: number;
  role: RoleType;
  actorPersona: 'Aarav Mehta' | 'Dr. Priya Sharma' | 'Rohan Verma' | 'Anita Verma';
  title: string;
  description: string;
  module: string;
  actionKey: string;
  expectedResult: string;
  nextRole?: RoleType;
  nextPersona?: string;
  explanation: string;
}

export interface DemoScenarioDefinition {
  id: string;
  title: string;
  purpose: string;
  startingRole: RoleType;
  startingPersona: 'Aarav Mehta' | 'Dr. Priya Sharma' | 'Rohan Verma' | 'Anita Verma';
  participatingRoles: string[];
  totalSteps: number;
  category: 'Academics' | 'Attendance' | 'Finance' | 'Student Services' | 'Examinations' | 'Admissions';
  steps: DemoStepDefinition[];
}

export const SCENARIO_CATALOGUE: DemoScenarioDefinition[] = [
  {
    id: 'assignment-workflow',
    title: 'Assignment Submission and Grading',
    purpose: 'Submit a fictional assignment, grade it as Faculty and review the updated result as Student.',
    startingRole: 'STUDENT',
    startingPersona: 'Rohan Verma',
    participatingRoles: ['Student', 'Faculty', 'Student'],
    totalSteps: 5,
    category: 'Academics',
    steps: [
      {
        stepNumber: 1,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Review Assignment',
        description: 'Review the details for CS-301 Data Structures & Algorithms Homework 2.',
        module: 'Smart LMS',
        actionKey: 'VIEW_ASSIGNMENT',
        expectedResult: 'Assignment details loaded with due date and 100 max marks.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Rohan Verma can access CS-301 assignment because he is enrolled in Section A.'
      },
      {
        stepNumber: 2,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Submit Demo Solution',
        description: 'Submit PDF homework solution for CS-301 assignment.',
        module: 'Smart LMS',
        actionKey: 'SUBMIT_ASSIGNMENT',
        expectedResult: 'Submission record created; status updated to SUBMITTED.',
        nextRole: 'FACULTY',
        nextPersona: 'Dr. Priya Sharma',
        explanation: 'Submitting homework notifies course instructor Dr. Priya Sharma.'
      },
      {
        stepNumber: 3,
        role: 'FACULTY',
        actorPersona: 'Dr. Priya Sharma',
        title: 'Grade Submission',
        description: 'Review Rohan\'s submission and enter grade 94/100 with rubric feedback.',
        module: 'Faculty Workspace',
        actionKey: 'GRADE_SUBMISSION',
        expectedResult: 'Submission graded; score stored; student notification dispatched.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Dr. Priya Sharma is authorized to grade because she is the assigned faculty for CS-301.'
      },
      {
        stepNumber: 4,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'View Grade Notification',
        description: 'Open notification center and review score release alert.',
        module: 'Notification Centre',
        actionKey: 'VIEW_NOTIFICATION',
        expectedResult: 'Grade notification marked read; score verified.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Rohan receives an automated notification upon grade publication.'
      },
      {
        stepNumber: 5,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Review Academic Standing',
        description: 'Verify updated gradebook entry and course completion progress.',
        module: 'Gradebook & LMS',
        actionKey: 'VERIFY_GRADEBOOK',
        expectedResult: 'Score 94/100 reflected in Rohan\'s academic record.',
        explanation: 'All course marks directly calculate into SGPA and course gradebook.'
      }
    ]
  },
  {
    id: 'attendance-workflow',
    title: 'Attendance Session and Student Update',
    purpose: 'Record daily lecture attendance as Faculty, review subject status as Student, and monitor threshold as Parent.',
    startingRole: 'FACULTY',
    startingPersona: 'Dr. Priya Sharma',
    participatingRoles: ['Faculty', 'Student', 'Parent'],
    totalSteps: 4,
    category: 'Attendance',
    steps: [
      {
        stepNumber: 1,
        role: 'FACULTY',
        actorPersona: 'Dr. Priya Sharma',
        title: 'Mark Lecture Attendance',
        description: 'Start CS-301 attendance session and mark Rohan Verma present.',
        module: 'Faculty Attendance',
        actionKey: 'MARK_ATTENDANCE',
        expectedResult: 'Attendance session finalized; student presence recorded.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Dr. Priya Sharma takes attendance for assigned CS-301 Section A.'
      },
      {
        stepNumber: 2,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Check Subject Attendance',
        description: 'Verify CS-301 attendance percentage (maintained at 88%).',
        module: 'Student Attendance',
        actionKey: 'VIEW_STUDENT_ATTENDANCE',
        expectedResult: 'Updated attendance count and 88% threshold status displayed.',
        nextRole: 'PARENT',
        nextPersona: 'Anita Verma',
        explanation: 'Students track their own attendance to stay above the 75% examination threshold.'
      },
      {
        stepNumber: 3,
        role: 'PARENT',
        actorPersona: 'Anita Verma',
        title: 'View Linked Ward Attendance',
        description: 'Review Rohan Verma\'s parent-authorized attendance summary.',
        module: 'Parent Portal',
        actionKey: 'VIEW_PARENT_ATTENDANCE',
        expectedResult: 'Parent summary loaded showing Rohan\'s 88% attendance.',
        nextRole: 'PARENT',
        nextPersona: 'Anita Verma',
        explanation: 'Anita Verma accesses Rohan\'s record via verified GuardianStudent relation.'
      },
      {
        stepNumber: 4,
        role: 'PARENT',
        actorPersona: 'Anita Verma',
        title: 'Verify Attendance Compliance',
        description: 'Confirm no low-attendance warning alerts exist for Rohan.',
        module: 'Parent Portal',
        actionKey: 'VERIFY_ATTENDANCE_COMPLIANCE',
        expectedResult: 'Compliance status verified green (>75%).',
        explanation: 'CampusOS automatically alerts parents if ward attendance drops below 75%.'
      }
    ]
  },
  {
    id: 'fee-payment-workflow',
    title: 'Fee Invoice and Sandbox Payment',
    purpose: 'Review tuition invoice as Student, complete synthetic sandbox payment, download receipt, and verify ledger as Admin.',
    startingRole: 'INSTITUTION_ADMIN',
    startingPersona: 'Aarav Mehta',
    participatingRoles: ['Admin', 'Student', 'Parent', 'Admin'],
    totalSteps: 5,
    category: 'Finance',
    steps: [
      {
        stepNumber: 1,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Review Term Fee Demands',
        description: 'Inspect term 1 tuition invoice for B.Tech CS Batch 2024-2028.',
        module: 'Finance Hub',
        actionKey: 'REVIEW_FEE_DEMAND',
        expectedResult: 'Fee structure and active student invoices verified.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Institution admin manages fee structures and batch billing cycles.'
      },
      {
        stepNumber: 2,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Initiate Sandbox Payment',
        description: 'Execute synthetic demo UPI payment of ₹48,750.',
        module: 'Student Payments',
        actionKey: 'PAY_FEE_SANDBOX',
        expectedResult: 'Sandbox payment transaction processed; invoice marked PAID.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Sandbox mode simulates bank settlement without real monetary movement.'
      },
      {
        stepNumber: 3,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Download Tax Receipt',
        description: 'Generate official GST digital fee payment receipt.',
        module: 'Digital Receipts',
        actionKey: 'DOWNLOAD_RECEIPT',
        expectedResult: 'PDF receipt with digital signature and QR verification code generated.',
        nextRole: 'PARENT',
        nextPersona: 'Anita Verma',
        explanation: 'Receipts are immutable financial documents linked to transaction IDs.'
      },
      {
        stepNumber: 4,
        role: 'PARENT',
        actorPersona: 'Anita Verma',
        title: 'Verify Zero Outstanding Balance',
        description: 'Review updated zero-dues statement for Rohan Verma.',
        module: 'Parent Finance',
        actionKey: 'VIEW_PARENT_FINANCE',
        expectedResult: 'Outstanding balance updated to ₹0.00; fee receipt archived.',
        nextRole: 'INSTITUTION_ADMIN',
        nextPersona: 'Aarav Mehta',
        explanation: 'Parents receive real-time visibility into fee clearings.'
      },
      {
        stepNumber: 5,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Reconcile General Ledger',
        description: 'Confirm transaction entry in institutional fee collections ledger.',
        module: 'Treasury Ledger',
        actionKey: 'RECONCILE_LEDGER',
        expectedResult: 'Collection total updated; audit log entry verified.',
        explanation: 'Admin dashboards aggregate real-time revenue collection feeds.'
      }
    ]
  },
  {
    id: 'service-request-workflow',
    title: 'Student Service Request & Resolution',
    purpose: 'Submit a campus helpdesk ticket as Student, resolve it as Admin, and provide feedback.',
    startingRole: 'STUDENT',
    startingPersona: 'Rohan Verma',
    participatingRoles: ['Student', 'Admin', 'Student'],
    totalSteps: 4,
    category: 'Student Services',
    steps: [
      {
        stepNumber: 1,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Submit Service Request',
        description: 'Create request for Library Access Badge Replacement.',
        module: 'Student Helpdesk',
        actionKey: 'CREATE_SERVICE_REQUEST',
        expectedResult: 'Ticket CAS-2026-901 generated; status set to OPEN.',
        nextRole: 'INSTITUTION_ADMIN',
        nextPersona: 'Aarav Mehta',
        explanation: 'Students submit support requests directly to administrative teams.'
      },
      {
        stepNumber: 2,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Assign and Resolve Ticket',
        description: 'Review ticket CAS-2026-901 and issue digital badge approval.',
        module: 'Admin Helpdesk',
        actionKey: 'RESOLVE_SERVICE_REQUEST',
        expectedResult: 'Resolution note attached; status set to RESOLVED.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Admins handle SLAs, student services, and facility operations.'
      },
      {
        stepNumber: 3,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'View Resolution Details',
        description: 'Open ticket response and review badge activation instructions.',
        module: 'Student Helpdesk',
        actionKey: 'VIEW_RESOLUTION',
        expectedResult: 'Ticket resolution note loaded; feedback form enabled.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Students are notified immediately upon ticket resolution.'
      },
      {
        stepNumber: 4,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'Submit Service Feedback',
        description: 'Rate service resolution 5/5 stars.',
        module: 'Student Helpdesk',
        actionKey: 'SUBMIT_FEEDBACK',
        expectedResult: 'Feedback recorded; ticket closed successfully.',
        explanation: 'Service feedback feeds into institutional quality metrics.'
      }
    ]
  },
  {
    id: 'exam-result-workflow',
    title: 'Examination Marks and Result Review',
    purpose: 'Enter marks as Faculty, approve & publish result as Admin, and view grade card as Student & Parent.',
    startingRole: 'FACULTY',
    startingPersona: 'Dr. Priya Sharma',
    participatingRoles: ['Faculty', 'Admin', 'Student', 'Parent'],
    totalSteps: 5,
    category: 'Examinations',
    steps: [
      {
        stepNumber: 1,
        role: 'FACULTY',
        actorPersona: 'Dr. Priya Sharma',
        title: 'Enter Mid-Term Marks',
        description: 'Enter 88/100 mid-term marks for Rohan Verma in CS-301.',
        module: 'Faculty Examinations',
        actionKey: 'ENTER_MARKS',
        expectedResult: 'Marks batch updated; status set to VERIFIED.',
        nextRole: 'INSTITUTION_ADMIN',
        nextPersona: 'Aarav Mehta',
        explanation: 'Faculty enter course marks subject to moderation and approval.'
      },
      {
        stepNumber: 2,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Approve & Publish Results',
        description: 'Run SGPA calculation and publish B.Tech CS Term 1 results.',
        module: 'Examination Controller',
        actionKey: 'PUBLISH_RESULTS',
        expectedResult: 'Results published; SGPA 3.8 calculated; grade cards generated.',
        nextRole: 'STUDENT',
        nextPersona: 'Rohan Verma',
        explanation: 'Only authorized examination admins can release official grade cards.'
      },
      {
        stepNumber: 3,
        role: 'STUDENT',
        actorPersona: 'Rohan Verma',
        title: 'View Published Grade Sheet',
        description: 'Inspect verified digital semester grade card.',
        module: 'Student Results',
        actionKey: 'VIEW_STUDENT_RESULT',
        expectedResult: 'SGPA 3.8 and Grade A in CS-301 displayed with QR proof.',
        nextRole: 'PARENT',
        nextPersona: 'Anita Verma',
        explanation: 'Students view published semester grade cards.'
      },
      {
        stepNumber: 4,
        role: 'PARENT',
        actorPersona: 'Anita Verma',
        title: 'View Linked Grade Sheet',
        description: 'Inspect Rohan Verma\'s parent-authorized result summary.',
        module: 'Parent Results',
        actionKey: 'VIEW_PARENT_RESULT',
        expectedResult: 'Official SGPA 3.8 and grade summary loaded for Rohan.',
        nextRole: 'PARENT',
        nextPersona: 'Anita Verma',
        explanation: 'Parents access published grade sheets via verified relationship.'
      },
      {
        stepNumber: 5,
        role: 'PARENT',
        actorPersona: 'Anita Verma',
        title: 'Verify Academic Transcript',
        description: 'Confirm transcript authenticity seal and credits earned.',
        module: 'Parent Results',
        actionKey: 'VERIFY_TRANSCRIPT',
        expectedResult: 'Transcript seal verified valid.',
        explanation: 'Academic records carry cryptographic verification hashes.'
      }
    ]
  },
  {
    id: 'admissions-workflow',
    title: 'Admissions Application to Enrollment',
    purpose: 'Review an applicant, verify documents, issue offer letter, and convert to student record as Admin.',
    startingRole: 'INSTITUTION_ADMIN',
    startingPersona: 'Aarav Mehta',
    participatingRoles: ['Admin'],
    totalSteps: 4,
    category: 'Admissions',
    steps: [
      {
        stepNumber: 1,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Review Admission Application',
        description: 'Open application APP-2026-104 for B.Tech Computer Science.',
        module: 'Admissions Portal',
        actionKey: 'REVIEW_APPLICATION',
        expectedResult: 'Application details and entrance exam score loaded.',
        nextRole: 'INSTITUTION_ADMIN',
        nextPersona: 'Aarav Mehta',
        explanation: 'Admissions admin evaluates candidate merit and documents.'
      },
      {
        stepNumber: 2,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Verify Fictional Documents',
        description: 'Approve 10th/12th grade marksheets and ID proof.',
        module: 'Admissions Portal',
        actionKey: 'VERIFY_DOCUMENTS',
        expectedResult: 'Document status updated to VERIFIED.',
        nextRole: 'INSTITUTION_ADMIN',
        nextPersona: 'Aarav Mehta',
        explanation: 'Document verification ensures regulatory compliance.'
      },
      {
        stepNumber: 3,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Issue Admission Offer',
        description: 'Generate provisional offer letter with 7-day fee deadline.',
        module: 'Admissions Portal',
        actionKey: 'ISSUE_OFFER',
        expectedResult: 'Offer letter issued; applicant notified.',
        nextRole: 'INSTITUTION_ADMIN',
        nextPersona: 'Aarav Mehta',
        explanation: 'Offer letters specify programme, fee deadline, and scholarship waivers.'
      },
      {
        stepNumber: 4,
        role: 'INSTITUTION_ADMIN',
        actorPersona: 'Aarav Mehta',
        title: 'Convert Applicant to Student',
        description: 'Accept offer and provision new student roll number and batch assignment.',
        module: 'Admissions Portal',
        actionKey: 'ENROLL_STUDENT',
        expectedResult: 'Student account created; batch assigned; welcome kit dispatched.',
        explanation: 'Enrollment automatically provisions LMS workspace, library card, and email.'
      }
    ]
  }
];
