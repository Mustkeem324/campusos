'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  LifeBuoy, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Lock, 
  Zap,
  ChevronRight,
  FileText,
  Activity,
  Layers
} from 'lucide-react';

interface WorkflowStep {
  stepNumber: number;
  title: string;
  actor: string;
  description: string;
  systemAction: string;
  badge: string;
}

interface WorkflowData {
  id: string;
  title: string;
  shortLabel: string;
  icon: React.ElementType;
  roleContext: string;
  headline: string;
  description: string;
  metrics: { label: string; value: string; detail: string }[];
  steps: WorkflowStep[];
  eventLog: { timestamp: string; event: string; payload: string; status: string };
  schemaMutation: string;
}

const WORKFLOWS: WorkflowData[] = [
  {
    id: 'admissions',
    title: 'Admissions to Enrollment',
    shortLabel: 'Admissions',
    icon: UserCheck,
    roleContext: 'Admissions Officer & Registrar',
    headline: 'Zero-touch student onboarding from application to class assignment',
    description: 'When an applicant is approved, CampusOS instantly provisions the student ERP profile, generates the initial semester fee invoice, and assigns academic batches without manual re-entry.',
    metrics: [
      { label: 'Applications Processed', value: '1,420', detail: '100% verified digital submissions' },
      { label: 'Auto-Provision Time', value: '< 2.4s', detail: 'Instant ERP profile creation' },
      { label: 'Data Accuracy Rate', value: '100%', detail: 'Zero manual transcription errors' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Application Verification',
        actor: 'Admissions Officer',
        description: 'Digital document verification and eligibility check completed.',
        systemAction: 'VALIDATE_DOCUMENTS',
        badge: 'Verified'
      },
      {
        stepNumber: 2,
        title: 'Seat Allocation & Approval',
        actor: 'Selection Committee',
        description: 'Applicant granted admission to B.Tech Computer Science.',
        systemAction: 'APPROVE_ADMISSION',
        badge: 'Approved'
      },
      {
        stepNumber: 3,
        title: 'Student Profile & ID Generation',
        actor: 'CampusOS Engine',
        description: 'Created STU-2026-892 with roll number CS2026-042.',
        systemAction: 'CREATE_STUDENT_RECORD',
        badge: 'Provisioned'
      },
      {
        stepNumber: 4,
        title: 'Fee Invoice & Timetable Sync',
        actor: 'Finance & Academic Hub',
        description: 'Semester 1 fee invoice ₹65,000 issued & Section A schedule assigned.',
        systemAction: 'GENERATE_INVOICE_AND_SCHEDULE',
        badge: 'Active'
      }
    ],
    eventLog: {
      timestamp: '09:41:02.812',
      event: 'ADMISSION_APPROVED',
      payload: '{ tenantId: "cdu-demo", studentId: "STU-2026-892", program: "B.Tech CSE", feeAmount: 65000 }',
      status: 'HANDLED_SUCCESSFULLY'
    },
    schemaMutation: 'INSERT INTO "Student" ("id", "tenantId", "rollNumber", "status") VALUES (\'stu_892\', \'cdu\', \'CS2026-042\', \'ACTIVE\');'
  },
  {
    id: 'academics',
    title: 'Academics & Attendance',
    shortLabel: 'Academics',
    icon: BookOpen,
    roleContext: 'Department Head & Faculty',
    headline: 'Automated course delivery, daily attendance and early at-risk intervention',
    description: 'Faculty mark attendance via mobile or kiosk; low attendance automatically triggers academic warnings to students and parents while updating eligibility metrics.',
    metrics: [
      { label: 'Active Course Offerings', value: '320', detail: 'Mapped to outcome frameworks' },
      { label: 'Daily Attendance Rate', value: '94.2%', detail: 'Real-time biometric & app logs' },
      { label: 'Early Warning Flags', value: '12', detail: 'Proactive student support alerts' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Course & Syllabus Setup',
        actor: 'HOD / Curriculum Lead',
        description: 'CS301 Data Structures mapped to Bloom Bloom taxonomy outcomes.',
        systemAction: 'MAP_CURRICULUM_OUTCOMES',
        badge: 'Configured'
      },
      {
        stepNumber: 2,
        title: 'Biometric & Mobile Check-In',
        actor: 'Faculty & Students',
        description: 'Attendance recorded for 58 students in Lecture Hall 302.',
        systemAction: 'RECORD_ATTENDANCE_SESSION',
        badge: 'Recorded'
      },
      {
        stepNumber: 3,
        title: 'Threshold Monitoring',
        actor: 'CampusOS Rules Engine',
        description: 'Student STU-892 attendance calculated at 72.5% (Below 75% threshold).',
        systemAction: 'EVALUATE_ELIGIBILITY_RULE',
        badge: 'Flagged'
      },
      {
        stepNumber: 4,
        title: 'Automated Notification',
        actor: 'Notification Hub',
        description: 'SMS & App alert sent to student and advisor for remediation.',
        systemAction: 'DISPATCH_AT_RISK_ALERT',
        badge: 'Notified'
      }
    ],
    eventLog: {
      timestamp: '10:15:44.109',
      event: 'ATTENDANCE_THRESHOLD_BREACH',
      payload: '{ tenantId: "cdu-demo", studentId: "STU-892", courseId: "CS301", currentRate: 72.5 }',
      status: 'HANDLED_SUCCESSFULLY'
    },
    schemaMutation: 'UPDATE "CourseRegistration" SET "attendancePercentage" = 72.5, "isEligibleForExam" = false WHERE "id" = \'reg_104\';'
  },
  {
    id: 'examinations',
    title: 'Examinations & Results',
    shortLabel: 'Examinations',
    icon: GraduationCap,
    roleContext: 'Controller of Examinations',
    headline: 'Tamper-proof grade compilation, multi-step verification and CGPA release',
    description: 'Marks are securely submitted by faculty, verified by department heads, and processed through automated SGPA/CGPA rules with instant hall tickets and verified grade cards.',
    metrics: [
      { label: 'Answer Scripts Graded', value: '18,500', detail: '100% audit verifiable' },
      { label: 'Result Processing Time', value: '1.2 Days', detail: 'Down from 3 weeks legacy' },
      { label: 'Grade Card Integrity', value: 'SHA-256', detail: 'Cryptographically signed' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Exam Schedule & Hall Tickets',
        actor: 'Exam Controller',
        description: 'Timetable published and digital hall tickets generated for 4,200 students.',
        systemAction: 'GENERATE_HALL_TICKETS',
        badge: 'Issued'
      },
      {
        stepNumber: 2,
        title: 'Double-Blind Marks Entry',
        actor: 'Evaluating Faculty',
        description: 'Mid-term and end-term marks uploaded with audit logging.',
        systemAction: 'SUBMIT_MARKS_BATCH',
        badge: 'Submitted'
      },
      {
        stepNumber: 3,
        title: 'Board Moderation & Verification',
        actor: 'Academic Board',
        description: 'Statistical moderation applied and batch approved by Controller.',
        systemAction: 'APPROVE_RESULT_BATCH',
        badge: 'Verified'
      },
      {
        stepNumber: 4,
        title: 'SGPA Release & Transcript Sync',
        actor: 'Student Portal',
        description: 'Semester 4 SGPA 8.65 released with QR-coded grade sheet.',
        systemAction: 'PUBLISH_SEMESTER_RESULT',
        badge: 'Published'
      }
    ],
    eventLog: {
      timestamp: '14:20:10.540',
      event: 'SEMESTER_RESULTS_PUBLISHED',
      payload: '{ tenantId: "cdu-demo", batchId: "BTECH-CSE-2024", totalStudents: 120, avgSGPA: 8.12 }',
      status: 'HANDLED_SUCCESSFULLY'
    },
    schemaMutation: 'INSERT INTO "StudentSemesterResult" ("id", "studentId", "sgpa", "cgpa", "status") VALUES (\'res_441\', \'stu_892\', 8.65, 8.42, \'PUBLISHED\');'
  },
  {
    id: 'finance',
    title: 'Finance & Treasury',
    shortLabel: 'Finance',
    icon: CreditCard,
    roleContext: 'Finance Director & Bursar',
    headline: 'Real-time revenue recognition, UPI payment gateways and automated ledger posts',
    description: 'Automate fee schedules, scholarship deductions, online payment collection, and instant receipt generation while maintaining strict general ledger compliance.',
    metrics: [
      { label: 'Term Revenue Collected', value: '₹4.8 Cr', detail: 'Direct bank reconciliation' },
      { label: 'On-time Payments', value: '99.1%', detail: 'Automated SMS/WhatsApp reminders' },
      { label: 'Reconciliation Effort', value: '0 Hours', detail: 'Instant payment gateway sync' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Fee Structure Definition',
        actor: 'Finance Committee',
        description: 'Tuition, hostel, and lab fees configured per batch with installment rules.',
        systemAction: 'CONFIGURE_FEE_TEMPLATE',
        badge: 'Configured'
      },
      {
        stepNumber: 2,
        title: 'Scholarship Deduction',
        actor: 'Scholarship Board',
        description: '25% Merit Waiver applied automatically to tuition balance.',
        systemAction: 'APPLY_SCHOLARSHIP_CREDIT',
        badge: 'Adjusted'
      },
      {
        stepNumber: 3,
        title: 'UPI / Card Payment Gateway',
        actor: 'Parent / Student',
        description: '₹48,750 paid online via Razorpay/UPI gateway with zero fee drop.',
        systemAction: 'PROCESS_ONLINE_PAYMENT',
        badge: 'Settled'
      },
      {
        stepNumber: 4,
        title: 'Ledger Post & Receipt Issue',
        actor: 'Accounting Hub',
        description: 'General Ledger posted & GST tax receipt RCT-9902 emailed to parent.',
        systemAction: 'POST_LEDGER_TRANSACTION',
        badge: 'Reconciled'
      }
    ],
    eventLog: {
      timestamp: '11:05:30.220',
      event: 'PAYMENT_SETTLED_AND_POSTED',
      payload: '{ tenantId: "cdu-demo", invoiceId: "INV-2026-104", amount: 48750, method: "UPI" }',
      status: 'HANDLED_SUCCESSFULLY'
    },
    schemaMutation: 'INSERT INTO "Payment" ("id", "invoiceId", "amount", "status", "transactionRef") VALUES (\'pay_9902\', \'inv_104\', 48750, \'SUCCESS\', \'TXN_9902817\');'
  },
  {
    id: 'services',
    title: 'Student Services & Helpdesk',
    shortLabel: 'Student Services',
    icon: LifeBuoy,
    roleContext: 'Dean of Student Affairs & Warden',
    headline: 'SLA-driven requests, hostel passes, digital certificates and transparent tracking',
    description: 'Students submit requests for certificates, hostel leave, or IT help; requests are intelligently routed with guaranteed SLA timelines and parent notifications.',
    metrics: [
      { label: 'Avg Resolution Time', value: '4.2 Hours', detail: 'Down from 5 days legacy' },
      { label: 'Student Satisfaction', value: '96%', detail: 'Post-service rating average' },
      { label: 'SLA Compliance Rate', value: '100%', detail: 'Strict escalation triggers' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Digital Request Lodged',
        actor: 'Student (Mobile App)',
        description: 'Bonafide Certificate request submitted for passport renewal.',
        systemAction: 'CREATE_SERVICE_TICKET',
        badge: 'Submitted'
      },
      {
        stepNumber: 2,
        title: 'Intelligent Role Routing',
        actor: 'CampusOS Router',
        description: 'Ticket assigned to Registrar Desk with 24-hour SLA countdown.',
        systemAction: 'ROUTE_TO_DEPARTMENT',
        badge: 'Assigned'
      },
      {
        stepNumber: 3,
        title: 'Digital Approval & Seal',
        actor: 'Assistant Registrar',
        description: 'Verified academic record and applied cryptographic digital signature.',
        systemAction: 'SIGN_DOCUMENT_DIGITALLY',
        badge: 'Approved'
      },
      {
        stepNumber: 4,
        title: 'Instant Document Release',
        actor: 'Student Vault',
        description: 'PDF certificate delivered to student app with verification link.',
        systemAction: 'DELIVER_SERVICE_OUTPUT',
        badge: 'Completed'
      }
    ],
    eventLog: {
      timestamp: '16:30:15.654',
      event: 'SERVICE_REQUEST_RESOLVED',
      payload: '{ tenantId: "cdu-demo", ticketId: "TCK-8812", type: "BONAFIDE_CERTIFICATE", slaRemaining: "19h 40m" }',
      status: 'HANDLED_SUCCESSFULLY'
    },
    schemaMutation: 'UPDATE "ServiceTicket" SET "status" = \'RESOLVED\', "resolvedAt" = NOW() WHERE "id" = \'tck_8812\';'
  }
];

export function ProductTourSection() {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('admissions');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const activeWorkflow = WORKFLOWS.find(w => w.id === activeWorkflowId) || WORKFLOWS[0];
  const activeStep = activeWorkflow.steps[activeStepIndex] || activeWorkflow.steps[0];

  const handleWorkflowChange = (id: string) => {
    setActiveWorkflowId(id);
    setActiveStepIndex(0);
  };

  return (
    <section className="bg-white py-24 md:py-32 border-t border-[#DEE5EF] overflow-hidden" id="product-tour">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-[840px] mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF3FF] border border-[#C6D7FE] text-[#1854E8] text-[12px] md:text-[13px] font-bold tracking-wide uppercase mb-4">
            <Zap size={14} /> Interactive Product Tour
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#101B33] tracking-tight mb-5 leading-tight">
            See how data flows seamlessly across university operations
          </h2>
          <p className="text-[16px] md:text-[18px] text-[#5F6B7A] leading-[1.6]">
            CampusOS connects admissions, academics, examinations, finance, and student services into one unified, permission-governed platform. Click a workflow below to explore real data transitions.
          </p>
        </div>

        {/* Workflow Selection Tabs */}
        <div 
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 max-w-[1100px] mx-auto"
          role="tablist"
          aria-label="CampusOS Connected Workflows"
        >
          {WORKFLOWS.map((wf) => {
            const Icon = wf.icon;
            const isSelected = activeWorkflowId === wf.id;
            return (
              <button
                key={wf.id}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`workflow-panel-${wf.id}`}
                id={`workflow-tab-${wf.id}`}
                onClick={() => handleWorkflowChange(wf.id)}
                className={`flex items-center gap-2.5 px-4 md:px-5 py-3 rounded-xl text-[14px] md:text-[15px] font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#1854E8] ${
                  isSelected
                    ? 'bg-[#101B33] text-white shadow-lg shadow-[#101B33]/15 translate-y-[-1px]'
                    : 'bg-[#F5F7FB] text-[#424E61] hover:bg-[#EEF3FF] hover:text-[#1854E8] border border-[#DEE5EF]'
                }`}
              >
                <Icon size={18} className={isSelected ? 'text-white' : 'text-[#5F6B7A]'} />
                <span>{wf.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Product Preview Console */}
        <div 
          id={`workflow-panel-${activeWorkflow.id}`}
          role="tabpanel"
          aria-labelledby={`workflow-tab-${activeWorkflow.id}`}
          className="bg-white border border-[#DEE5EF] rounded-2xl shadow-xl overflow-hidden mb-12"
        >
          {/* Top Simulated App Header */}
          <div className="bg-[#101B33] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-[#2A3B5C]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              <span className="text-[13px] font-mono text-[#BEC7D7] ml-2 border-l border-white/20 pl-3 hidden sm:inline">
                CampusOS Enterprise ERP • Tenant: <strong className="text-white">CDU (CampusOS Demo University)</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-[12px]">
              <span className="bg-[#182642] px-2.5 py-1 rounded text-[#BEC7D7] border border-[#2A3B5C]">
                Role: <strong className="text-white font-medium">{activeWorkflow.roleContext}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-[#27C93F] font-mono font-semibold">
                <ShieldCheck size={14} /> RLS Active
              </span>
            </div>
          </div>

          {/* Console Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Column: Workflow Description & Steps Timeline */}
            <div className="lg:col-span-5 p-6 md:p-8 bg-[#F5F7FB] border-b lg:border-b-0 lg:border-r border-[#DEE5EF] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold tracking-wider text-[#1854E8] uppercase mb-2">
                  <Activity size={15} /> Active Workflow Track
                </div>
                <h3 className="text-2xl font-bold text-[#101B33] mb-3">
                  {activeWorkflow.headline}
                </h3>
                <p className="text-[14px] md:text-[15px] text-[#5F6B7A] leading-[1.6] mb-6">
                  {activeWorkflow.description}
                </p>

                {/* Live Metrics Summary */}
                <div className="grid grid-cols-3 gap-2.5 mb-8">
                  {activeWorkflow.metrics.map((m, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-[#DEE5EF] shadow-sm">
                      <div className="text-[11px] text-[#5F6B7A] font-medium leading-tight mb-1">{m.label}</div>
                      <div className="text-[16px] md:text-[18px] font-bold text-[#101B33]">{m.value}</div>
                      <div className="text-[10px] text-[#078A57] mt-0.5 font-medium truncate">{m.detail}</div>
                    </div>
                  ))}
                </div>

                {/* Interactive Step Explorer */}
                <div className="mb-6">
                  <h4 className="text-[13px] font-bold text-[#101B33] uppercase tracking-wider mb-3">
                    Click steps to view system execution
                  </h4>
                  <div className="flex flex-col gap-2.5">
                    {activeWorkflow.steps.map((step, idx) => {
                      const isActiveStep = activeStepIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveStepIndex(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            isActiveStep
                              ? 'bg-white border-[#1854E8] shadow-md shadow-[#1854E8]/10 ring-1 ring-[#1854E8]'
                              : 'bg-white/60 hover:bg-white border-[#DEE5EF] text-[#424E61]'
                          }`}
                        >
                          <div className="flex gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5 ${
                              isActiveStep ? 'bg-[#1854E8] text-white' : 'bg-[#DEE5EF] text-[#5F6B7A]'
                            }`}>
                              {step.stepNumber}
                            </span>
                            <div>
                              <div className="text-[14px] font-bold text-[#101B33]">
                                {step.title}
                              </div>
                              <div className="text-[12px] text-[#5F6B7A] mt-0.5">
                                Actor: <span className="font-medium text-[#101B33]">{step.actor}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                            isActiveStep ? 'bg-[#e6f4ed] text-[#078A57]' : 'bg-[#F5F7FB] text-[#5F6B7A] border border-[#DEE5EF]'
                          }`}>
                            {step.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Security Banner at bottom left */}
              <div className="p-3.5 bg-[#EEF3FF] rounded-xl border border-[#C6D7FE] flex items-center gap-3">
                <Lock size={18} className="text-[#1854E8] shrink-0" />
                <p className="text-[12px] text-[#101B33] font-medium leading-tight">
                  All workflow actions execute within strict multi-tenant boundaries with immutable audit logging.
                </p>
              </div>
            </div>

            {/* Right Column: Live Data-Flow & System Execution Preview */}
            <div className="lg:col-span-7 p-6 md:p-8 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-[#101B33]">
                    <Layers size={16} className="text-[#1854E8]" />
                    <span>Selected Step Execution Details</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#5F6B7A] bg-[#F5F7FB] px-2.5 py-1 rounded border border-[#DEE5EF]">
                    Step {activeStep.stepNumber} of {activeWorkflow.steps.length}
                  </span>
                </div>

                {/* Step Card Preview */}
                <div className="bg-[#F5F7FB] rounded-xl p-5 border border-[#DEE5EF] mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-bold text-[#1854E8] bg-white px-2.5 py-1 rounded border border-[#C6D7FE]">
                      {activeStep.systemAction}
                    </span>
                    <span className="text-[12px] text-[#078A57] font-semibold bg-[#e6f4ed] px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 size={13} /> {activeStep.badge}
                    </span>
                  </div>
                  <h4 className="text-[17px] font-bold text-[#101B33] mb-1">
                    {activeStep.title}
                  </h4>
                  <p className="text-[14px] text-[#5F6B7A] leading-relaxed">
                    {activeStep.description}
                  </p>
                </div>

                {/* System Data Flow Event Bus Diagram */}
                <div className="mb-6">
                  <div className="text-[12px] font-bold text-[#101B33] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Zap size={14} className="text-[#1854E8]" /> Automated Event Dispatch & Reaction
                  </div>

                  <div className="bg-[#101B33] text-white rounded-xl p-4 font-mono text-[12px] space-y-2 border border-[#2A3B5C]">
                    <div className="flex items-center justify-between text-[#BEC7D7] border-b border-white/10 pb-2">
                      <span>Event Log Timestamp: {activeWorkflow.eventLog.timestamp}</span>
                      <span className="text-[#27C93F] font-bold">{activeWorkflow.eventLog.status}</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[#FFBD2E]">event: </span>
                      <span className="text-[#27C93F] font-bold">&quot;{activeWorkflow.eventLog.event}&quot;</span>
                    </div>

                    <div>
                      <span className="text-[#FFBD2E]">payload: </span>
                      <span className="text-white/90">{activeWorkflow.eventLog.payload}</span>
                    </div>

                    <div className="border-t border-white/10 pt-2 text-[11px] text-[#BEC7D7] flex items-center gap-2">
                      <Database size={13} className="text-[#1854E8]" />
                      <span>Database Mutation:</span>
                    </div>
                    <div className="text-[#A5D6FF] text-[11px] overflow-x-auto whitespace-pre-wrap bg-[#182642] p-2 rounded border border-[#2A3B5C]">
                      {activeWorkflow.schemaMutation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Exploration Banner */}
              <div className="pt-4 border-t border-[#DEE5EF] flex flex-wrap items-center justify-between gap-4">
                <div className="text-[13px] text-[#5F6B7A]">
                  Want to test this workflow with real sample records?
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/institution-login"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1854E8] hover:bg-[#1140B8] text-white text-[13px] font-semibold transition-colors shadow-sm"
                  >
                    Try Demo Workspace <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Governance & Trust Proof Panel */}
        <div className="bg-[#F5F7FB] border border-[#DEE5EF] rounded-2xl p-6 md:p-8 mb-12">
          <div className="text-center max-w-[600px] mx-auto mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-[#101B33]">
              Enterprise Trust & Governance Guaranteed
            </h3>
            <p className="text-[14px] text-[#5F6B7A] mt-1">
              Every workflow step is built on top of high-assurance security principles for multi-tenant higher education institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#DEE5EF]">
              <div className="w-10 h-10 rounded-lg bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center mb-3">
                <Database size={20} />
              </div>
              <h4 className="text-[15px] font-bold text-[#101B33] mb-1">Tenant Isolation</h4>
              <p className="text-[13px] text-[#5F6B7A] leading-normal">
                Row-level security ensures institutional data remains strictly segregated across all database queries.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#DEE5EF]">
              <div className="w-10 h-10 rounded-lg bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center mb-3">
                <Lock size={20} />
              </div>
              <h4 className="text-[15px] font-bold text-[#101B33] mb-1">Role-Based Access</h4>
              <p className="text-[13px] text-[#5F6B7A] leading-normal">
                Fine-grained permissions ensure users only view and act on data authorized for their university role.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#DEE5EF]">
              <div className="w-10 h-10 rounded-lg bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center mb-3">
                <FileText size={20} />
              </div>
              <h4 className="text-[15px] font-bold text-[#101B33] mb-1">Immutable Audit Log</h4>
              <p className="text-[13px] text-[#5F6B7A] leading-normal">
                Every record edit, approval, and monetary transaction is cryptographically logged for accreditation audits.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#DEE5EF]">
              <div className="w-10 h-10 rounded-lg bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center mb-3">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-[15px] font-bold text-[#101B33] mb-1">Zero-Data Leakage</h4>
              <p className="text-[13px] text-[#5F6B7A] leading-normal">
                Automated continuous testing verifies zero cross-tenant leakages across all API endpoints and background workers.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
