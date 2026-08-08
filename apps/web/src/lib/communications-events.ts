import 'server-only';

import crypto from 'node:crypto';

import { publishCommunicationEvent } from './communications';
import type { CommunicationEventType } from './communications-types';

function stableKey(parts: Array<string | number | null | undefined>) {
  return parts.map((part) => String(part ?? '')).join(':').replace(/\s+/g, '-').toLowerCase();
}

function correlation(prefix: string, existing?: string | null) {
  return existing || `${prefix}:${crypto.randomUUID()}`;
}

async function emit(input: {
  tenantId: string;
  eventType: CommunicationEventType;
  subjectType: string;
  subjectId: string;
  sourceModule: string;
  keyParts: Array<string | number | null | undefined>;
  data?: Record<string, unknown>;
  occurredAt?: Date;
  correlationId?: string | null;
}) {
  return publishCommunicationEvent({
    eventType: input.eventType,
    tenantId: input.tenantId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    occurredAt: input.occurredAt ?? new Date(),
    correlationId: correlation(input.sourceModule, input.correlationId),
    idempotencyKey: stableKey([input.sourceModule, ...input.keyParts]),
    sourceModule: input.sourceModule,
    data: input.data ?? {},
  });
}

export const communicationEvents = {
  accountCreated(input: { tenantId: string; userId: string; accountVersion?: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'USER_ACCOUNT_CREATED', subjectType:'USER', subjectId:input.userId, sourceModule:'AUTH', keyParts:['account-created',input.userId,input.accountVersion ?? 'v1'] });
  },
  securityAlert(input: { tenantId: string; userId: string; alertId: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'LOGIN_SECURITY_ALERT', subjectType:'USER', subjectId:input.userId, sourceModule:'AUTH', keyParts:['security-alert',input.alertId] });
  },
  admissionUpdate(input: { tenantId: string; applicantUserId: string; applicationId: string; revision: string | number; eventType: 'ADMISSION_APPLICATION_SUBMITTED' | 'ADMISSION_APPLICATION_UPDATED' | 'ADMISSION_DOCUMENT_REQUIRED' | 'ADMISSION_OFFERED' | 'ADMISSION_CONFIRMED'; data?: Record<string, unknown> }) {
    return emit({ ...input, subjectType:'USER', subjectId:input.applicantUserId, sourceModule:'ADMISSIONS', keyParts:[input.eventType,input.applicationId,input.revision] });
  },
  attendanceWarning(input: { tenantId: string; studentId: string; courseOfferingId: string; thresholdBand: string; academicDate: string; percentage: number; requiredPercentage: number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'ATTENDANCE_SHORTAGE_WARNING', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'ATTENDANCE', keyParts:['shortage',input.studentId,input.courseOfferingId,input.thresholdBand,input.academicDate], data:{ ...(input.data??{}), attendance:{ percentage:input.percentage, requiredPercentage:input.requiredPercentage } } });
  },
  attendanceCritical(input: { tenantId: string; studentId: string; courseOfferingId: string; thresholdBand: string; academicDate: string; percentage: number; requiredPercentage: number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'ATTENDANCE_CRITICAL_WARNING', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'ATTENDANCE', keyParts:['critical',input.studentId,input.courseOfferingId,input.thresholdBand,input.academicDate], data:{ ...(input.data??{}), attendance:{ percentage:input.percentage, requiredPercentage:input.requiredPercentage } } });
  },
  attendanceDigest(input: { tenantId: string; studentId: string; cadence: 'DAILY'|'WEEKLY'|'MONTHLY'; periodKey: string; data?: Record<string, unknown> }) {
    const eventType = input.cadence === 'DAILY' ? 'ATTENDANCE_DAILY_SUMMARY' : input.cadence === 'WEEKLY' ? 'ATTENDANCE_WEEKLY_SUMMARY' : 'ATTENDANCE_MONTHLY_SUMMARY';
    return emit({ ...input, eventType, subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'ATTENDANCE', keyParts:['digest',input.cadence,input.studentId,input.periodKey] });
  },
  timetablePublished(input: { tenantId: string; studentId: string; publicationVersion: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'TIMETABLE_PUBLISHED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'TIMETABLE', keyParts:['published',input.studentId,input.publicationVersion] });
  },
  classChanged(input: { tenantId: string; studentId: string; timetableSlotId: string; revision: string | number; cancelled?: boolean; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:input.cancelled?'CLASS_CANCELLED':'CLASS_RESCHEDULED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'TIMETABLE', keyParts:[input.cancelled?'cancelled':'rescheduled',input.timetableSlotId,input.revision,input.studentId] });
  },
  examPublished(input: { tenantId: string; studentId: string; examId: string; scheduleVersion: string | number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'EXAM_SCHEDULE_PUBLISHED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'EXAMINATION', keyParts:['schedule',input.examId,input.scheduleVersion,input.studentId] });
  },
  examReminder(input: { tenantId: string; studentId: string; examId: string; reminderWindow: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'EXAM_REMINDER', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'EXAMINATION', keyParts:['reminder',input.examId,input.reminderWindow,input.studentId] });
  },
  secureExamReadiness(input: { tenantId: string; studentId: string; examId: string; reminderWindow: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'SECURE_EXAM_READINESS_REMINDER', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'EXAMINATION', keyParts:['secure-readiness',input.examId,input.reminderWindow,input.studentId] });
  },
  resultPublished(input: { tenantId: string; studentId: string; resultPublicationVersion: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'RESULT_PUBLISHED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'RESULTS', keyParts:['result-published',input.resultPublicationVersion,input.studentId] });
  },
  cgpaUpdated(input: { tenantId: string; studentId: string; resultPublicationVersion: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'CGPA_UPDATED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'RESULTS', keyParts:['cgpa',input.resultPublicationVersion,input.studentId] });
  },
  invoiceIssued(input: { tenantId: string; studentId: string; invoiceId: string; invoiceVersion?: string | number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'INVOICE_ISSUED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'FINANCE', keyParts:['invoice',input.invoiceId,input.invoiceVersion ?? 'v1'] });
  },
  feeReminder(input: { tenantId: string; studentId: string; invoiceId: string; duePeriod: string; overdue?: boolean; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:input.overdue?'FEE_OVERDUE':'FEE_DUE_REMINDER', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'FINANCE', keyParts:[input.overdue?'overdue':'due',input.invoiceId,input.duePeriod] });
  },
  paymentConfirmed(input: { tenantId: string; studentId: string; paymentId: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'PAYMENT_CONFIRMED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'FINANCE', keyParts:['payment-confirmed',input.paymentId] });
  },
  refundUpdated(input: { tenantId: string; studentId: string; refundId: string; revision: string | number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'REFUND_UPDATED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'FINANCE', keyParts:['refund',input.refundId,input.revision] });
  },
  hostelAllocation(input: { tenantId: string; studentId: string; allocationId: string; revision?: string | number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'HOSTEL_ROOM_ALLOCATED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'HOSTEL', keyParts:['allocation',input.allocationId,input.revision??'v1'] });
  },
  hostelOutpass(input: { tenantId: string; studentId: string; outpassId: string; state: 'APPROVED'|'REJECTED'|'UPDATED'; revision: string | number; data?: Record<string, unknown> }) {
    const eventType = input.state==='APPROVED'?'HOSTEL_OUTPASS_APPROVED':input.state==='REJECTED'?'HOSTEL_OUTPASS_REJECTED':'OUTPASS_STATUS_CHANGED';
    return emit({ ...input, eventType, subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'HOSTEL', keyParts:['outpass',input.outpassId,input.state,input.revision] });
  },
  transportDelay(input: { tenantId: string; studentId: string; tripId: string; delayRevision: string | number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'TRANSPORT_BUS_DELAYED', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'TRANSPORT', keyParts:['delay',input.tripId,input.delayRevision,input.studentId] });
  },
  transportArrival(input: { tenantId: string; studentId: string; tripId: string; stopId: string; thresholdBucket: string; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'TRANSPORT_BUS_ARRIVING', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'TRANSPORT', keyParts:['arrival',input.tripId,input.stopId,input.thresholdBucket,input.studentId] });
  },
  libraryDue(input: { tenantId: string; studentId: string; loanId: string; reminderWindow: string; overdue?: boolean; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:input.overdue?'LIBRARY_OVERDUE':'LIBRARY_DUE_REMINDER', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'LIBRARY', keyParts:[input.overdue?'overdue':'due',input.loanId,input.reminderWindow] });
  },
  researchMilestone(input: { tenantId: string; studentId: string; milestoneId: string; revision: string | number; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:'RESEARCH_MILESTONE_DUE', subjectType:'STUDENT', subjectId:input.studentId, sourceModule:'RESEARCH', keyParts:['milestone',input.milestoneId,input.revision] });
  },
  workforceUpdate(input: { tenantId: string; staffId: string; workflowId: string; revision: string | number; eventType: 'EMPLOYEE_ONBOARDING'|'LEAVE_REQUEST_UPDATED'|'PAYROLL_PROCESSED'|'PAYSLIP_AVAILABLE'|'EMPLOYEE_TRANSFER_UPDATED'|'EXIT_CLEARANCE_UPDATED'; data?: Record<string, unknown> }) {
    return emit({ ...input, subjectType:'STAFF', subjectId:input.staffId, sourceModule:'WORKFORCE', keyParts:[input.eventType,input.workflowId,input.revision] });
  },
  helpdeskUpdate(input: { tenantId: string; userId: string; caseId: string; revision: string | number; resolved?: boolean; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:input.resolved?'HELPDESK_CASE_RESOLVED':'HELPDESK_CASE_UPDATED', subjectType:'USER', subjectId:input.userId, sourceModule:'HELPDESK', keyParts:[input.resolved?'resolved':'updated',input.caseId,input.revision] });
  },
  institutionEvent(input: { tenantId: string; eventId: string; revision: string | number; eventType: 'EVENT_CREATED'|'EVENT_INVITATION'|'EVENT_REMINDER'|'EVENT_VENUE_CHANGED'|'EVENT_CANCELLED'; data?: Record<string, unknown> }) {
    return emit({ ...input, subjectType:'INSTITUTION', subjectId:input.tenantId, sourceModule:'EVENTS', keyParts:[input.eventType,input.eventId,input.revision] });
  },
  emergency(input: { tenantId: string; alertId: string; revision: string | number; eventType?: 'EMERGENCY_ALERT'|'CAMPUS_CLOSURE'|'WEATHER_ALERT'|'SECURITY_ALERT'|'TRANSPORT_EMERGENCY'|'HEALTH_NOTICE'|'EXAM_EMERGENCY'; data?: Record<string, unknown> }) {
    return emit({ ...input, eventType:input.eventType??'EMERGENCY_ALERT', subjectType:'INSTITUTION', subjectId:input.tenantId, sourceModule:'EMERGENCY', keyParts:[input.eventType??'EMERGENCY_ALERT',input.alertId,input.revision] });
  },
};
