export const COMMUNICATION_CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH'] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_CATEGORIES = [
  'ACADEMIC',
  'ATTENDANCE',
  'EXAMINATION',
  'FINANCE',
  'ADMISSIONS',
  'HOSTEL',
  'TRANSPORT',
  'LIBRARY',
  'RESEARCH',
  'HR',
  'EVENTS',
  'HELPDESK',
  'PLATFORM',
  'SECURITY',
  'EMERGENCY',
  'MARKETING',
] as const;
export type CommunicationCategory = (typeof COMMUNICATION_CATEGORIES)[number];

export const SECURITY_CLASSIFICATIONS = ['PUBLIC', 'INTERNAL', 'PERSONAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL'] as const;
export type SecurityClassification = (typeof SECURITY_CLASSIFICATIONS)[number];

export const RECIPIENT_TYPES = [
  'STUDENT', 'PARENT', 'GUARDIAN', 'FACULTY', 'HOD', 'DEAN', 'EXAMINATION_CONTROLLER',
  'REGISTRAR', 'FINANCE', 'HR', 'LIBRARIAN', 'RESEARCH_COORDINATOR', 'WARDEN',
  'TRANSPORT_STAFF', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'OTHER_STAFF', 'APPLICANT',
] as const;
export type CommunicationRecipientType = (typeof RECIPIENT_TYPES)[number];

export const COMMUNICATION_EVENT_TYPES = [
  'USER_ACCOUNT_CREATED', 'EMAIL_VERIFICATION_REQUESTED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_CHANGED', 'LOGIN_SECURITY_ALERT',
  'ADMISSION_APPLICATION_SUBMITTED', 'ADMISSION_APPLICATION_UPDATED', 'ADMISSION_DOCUMENT_REQUIRED', 'ADMISSION_OFFERED', 'ADMISSION_CONFIRMED',
  'STUDENT_ENROLLED', 'SEMESTER_REGISTRATION_OPEN', 'SEMESTER_REGISTRATION_CONFIRMED',
  'ATTENDANCE_MARKED', 'ATTENDANCE_SHORTAGE_WARNING', 'ATTENDANCE_CRITICAL_WARNING', 'ATTENDANCE_DAILY_SUMMARY', 'ATTENDANCE_WEEKLY_SUMMARY', 'ATTENDANCE_MONTHLY_SUMMARY', 'ATTENDANCE_DIGEST_READY',
  'TIMETABLE_PUBLISHED', 'CLASS_CANCELLED', 'CLASS_RESCHEDULED', 'SUBSTITUTE_FACULTY_ASSIGNED',
  'EXAM_SCHEDULE_PUBLISHED', 'EXAM_APPLICATION_OPEN', 'EXAM_APPLICATION_APPROVED', 'EXAM_ADMIT_CARD_RELEASED', 'ADMIT_CARD_AVAILABLE', 'EXAM_REMINDER', 'EXAM_RESCHEDULED', 'EXAM_CANCELLED', 'SECURE_EXAM_READINESS_REMINDER',
  'RESULT_PUBLISHED', 'GRADE_UPDATED', 'CGPA_UPDATED', 'BACKLOG_IDENTIFIED', 'REVALUATION_UPDATED',
  'INVOICE_GENERATED', 'INVOICE_ISSUED', 'INSTALLMENT_DUE', 'PAYMENT_DUE', 'PAYMENT_DUE_SOON', 'FEE_DUE_REMINDER', 'FEE_OVERDUE', 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_REVERSED', 'RECEIPT_GENERATED', 'RECEIPT_AVAILABLE', 'REFUND_REQUESTED', 'REFUND_APPROVED', 'REFUND_COMPLETED', 'REFUND_UPDATED', 'SCHOLARSHIP_APPLICATION_UPDATED', 'SCHOLARSHIP_APPROVED', 'SCHOLARSHIP_UPDATED',
  'HOSTEL_ROOM_ALLOCATED', 'ROOM_ALLOCATED', 'HOSTEL_OUTPASS_REQUESTED', 'HOSTEL_OUTPASS_APPROVED', 'HOSTEL_OUTPASS_REJECTED', 'OUTPASS_STATUS_CHANGED', 'HOSTEL_INCIDENT_UPDATE', 'HOSTEL_NOTICE', 'MESS_NOTICE',
  'TRANSPORT_ROUTE_ASSIGNED', 'TRANSPORT_PICKUP_REMINDER', 'TRANSPORT_BUS_STARTED', 'TRANSPORT_BUS_DELAYED', 'BUS_DELAYED', 'TRANSPORT_BUS_ARRIVING', 'BUS_APPROACHING_STOP', 'TRANSPORT_ROUTE_CHANGED', 'ROUTE_CHANGED', 'TRIP_CANCELLED',
  'LIBRARY_BOOK_ISSUED', 'LOAN_ISSUED', 'LIBRARY_DUE_REMINDER', 'LOAN_DUE_SOON', 'LIBRARY_OVERDUE', 'LOAN_OVERDUE', 'LIBRARY_RESERVATION_READY', 'RESERVATION_READY', 'LIBRARY_FINE_UPDATED',
  'RESEARCH_PROPOSAL_UPDATED', 'PROPOSAL_UPDATED', 'RESEARCH_MILESTONE_DUE', 'MILESTONE_DUE', 'THESIS_REVIEW_UPDATED', 'VIVA_SCHEDULED',
  'HELPDESK_CASE_CREATED', 'HELPDESK_CASE_UPDATED', 'HELPDESK_CASE_RESOLVED',
  'EMPLOYEE_ONBOARDING', 'LEAVE_REQUEST_UPDATED', 'PAYROLL_PROCESSED', 'PAYSLIP_AVAILABLE', 'EMPLOYEE_TRANSFER_UPDATED', 'EXIT_CLEARANCE_UPDATED',
  'EVENT_CREATED', 'EVENT_INVITATION', 'EVENT_REGISTRATION_CONFIRMED', 'EVENT_REMINDER', 'EVENT_VENUE_CHANGED', 'EVENT_CANCELLED', 'EVENT_CERTIFICATE_AVAILABLE',
  'EMERGENCY_ALERT', 'CAMPUS_CLOSURE', 'WEATHER_ALERT', 'SECURITY_ALERT', 'TRANSPORT_EMERGENCY', 'HEALTH_NOTICE', 'EXAM_EMERGENCY',
  'SYSTEM_MAINTENANCE', 'SERVICE_INCIDENT', 'INSTITUTION_SUBSCRIPTION_UPDATED', 'COMMUNICATION_CREDITS_LOW', 'COMMUNICATION_PROVIDER_CONFIGURATION_FAILED',
] as const;
export type CommunicationEventType = (typeof COMMUNICATION_EVENT_TYPES)[number];

export type CommunicationEventInput = {
  eventType: CommunicationEventType;
  tenantId: string;
  subjectType: string;
  subjectId: string;
  occurredAt: string | Date;
  correlationId: string;
  idempotencyKey: string;
  sourceModule: string;
  data?: Record<string, unknown>;
};

export type RecipientTarget = {
  userId: string;
  recipientType: CommunicationRecipientType;
};

export type EventPolicy = {
  category: CommunicationCategory;
  classification: SecurityClassification;
  mandatory: boolean;
  defaultChannels: CommunicationChannel[];
  student?: boolean;
  guardian?: boolean;
  faculty?: boolean;
  institutionAdmin?: boolean;
  superAdmin?: boolean;
  templateKey: string;
  allowSmsBodyDetails?: boolean;
};

const ACADEMIC_EMAIL_IN_APP: CommunicationChannel[] = ['IN_APP', 'EMAIL'];
const SENSITIVE_EMAIL_IN_APP: CommunicationChannel[] = ['IN_APP', 'EMAIL'];

export const EVENT_POLICIES: Record<CommunicationEventType, EventPolicy> = Object.fromEntries(
  COMMUNICATION_EVENT_TYPES.map((eventType) => [eventType, {
    category: 'PLATFORM' as CommunicationCategory,
    classification: 'INTERNAL' as SecurityClassification,
    mandatory: false,
    defaultChannels: ACADEMIC_EMAIL_IN_APP,
    templateKey: eventType.toLowerCase(),
  }]),
) as Record<CommunicationEventType, EventPolicy>;

function assign(events: CommunicationEventType[], patch: Partial<EventPolicy>) {
  for (const event of events) EVENT_POLICIES[event] = { ...EVENT_POLICIES[event], ...patch };
}

assign(['USER_ACCOUNT_CREATED','EMAIL_VERIFICATION_REQUESTED','PASSWORD_RESET_REQUESTED','PASSWORD_CHANGED','LOGIN_SECURITY_ALERT'], {
  category: 'SECURITY', classification: 'CONFIDENTIAL', mandatory: true, defaultChannels: ['EMAIL','IN_APP'], student: true, faculty: true, institutionAdmin: true,
});
assign(['ADMISSION_APPLICATION_SUBMITTED','ADMISSION_APPLICATION_UPDATED','ADMISSION_DOCUMENT_REQUIRED','ADMISSION_OFFERED','ADMISSION_CONFIRMED'], {
  category: 'ADMISSIONS', classification: 'PERSONAL', defaultChannels: ['EMAIL'], templateKey: 'admissions_update',
});
assign(['STUDENT_ENROLLED','SEMESTER_REGISTRATION_OPEN','SEMESTER_REGISTRATION_CONFIRMED','TIMETABLE_PUBLISHED','CLASS_CANCELLED','CLASS_RESCHEDULED'], {
  category: 'ACADEMIC', classification: 'PERSONAL', defaultChannels: ACADEMIC_EMAIL_IN_APP, student: true, templateKey: 'academic_update',
});
assign(['ATTENDANCE_MARKED','ATTENDANCE_SHORTAGE_WARNING','ATTENDANCE_CRITICAL_WARNING','ATTENDANCE_DAILY_SUMMARY','ATTENDANCE_WEEKLY_SUMMARY','ATTENDANCE_MONTHLY_SUMMARY','ATTENDANCE_DIGEST_READY'], {
  category: 'ATTENDANCE', classification: 'PERSONAL', defaultChannels: ['IN_APP','EMAIL'], student: true, guardian: true, templateKey: 'attendance_update',
});
assign(['ATTENDANCE_SHORTAGE_WARNING','ATTENDANCE_CRITICAL_WARNING'], {
  mandatory: true, defaultChannels: ['IN_APP','EMAIL','SMS','WHATSAPP'], templateKey: 'attendance_warning',
});
assign(['EXAM_SCHEDULE_PUBLISHED','EXAM_APPLICATION_OPEN','EXAM_APPLICATION_APPROVED','EXAM_ADMIT_CARD_RELEASED','ADMIT_CARD_AVAILABLE','EXAM_REMINDER','EXAM_RESCHEDULED','EXAM_CANCELLED','SECURE_EXAM_READINESS_REMINDER'], {
  category: 'EXAMINATION', classification: 'PERSONAL', defaultChannels: ['IN_APP','EMAIL'], student: true, templateKey: 'exam_update',
});
assign(['RESULT_PUBLISHED','GRADE_UPDATED','CGPA_UPDATED','BACKLOG_IDENTIFIED','REVALUATION_UPDATED'], {
  category: 'EXAMINATION', classification: 'CONFIDENTIAL', defaultChannels: SENSITIVE_EMAIL_IN_APP, student: true, guardian: true, templateKey: 'result_available', allowSmsBodyDetails: false,
});
assign(['INVOICE_GENERATED','INVOICE_ISSUED','INSTALLMENT_DUE','PAYMENT_DUE','PAYMENT_DUE_SOON','FEE_DUE_REMINDER','FEE_OVERDUE','PAYMENT_RECEIVED','PAYMENT_CONFIRMED','PAYMENT_SUCCESS','PAYMENT_FAILED','PAYMENT_REVERSED','RECEIPT_GENERATED','RECEIPT_AVAILABLE','REFUND_REQUESTED','REFUND_APPROVED','REFUND_COMPLETED','REFUND_UPDATED','SCHOLARSHIP_APPLICATION_UPDATED','SCHOLARSHIP_APPROVED','SCHOLARSHIP_UPDATED'], {
  category: 'FINANCE', classification: 'CONFIDENTIAL', defaultChannels: SENSITIVE_EMAIL_IN_APP, student: true, guardian: true, templateKey: 'finance_update', allowSmsBodyDetails: false,
});
assign(['HOSTEL_ROOM_ALLOCATED','ROOM_ALLOCATED','HOSTEL_OUTPASS_REQUESTED','HOSTEL_OUTPASS_APPROVED','HOSTEL_OUTPASS_REJECTED','OUTPASS_STATUS_CHANGED','HOSTEL_INCIDENT_UPDATE','HOSTEL_NOTICE','MESS_NOTICE'], {
  category: 'HOSTEL', classification: 'PERSONAL', defaultChannels: ['IN_APP','EMAIL'], student: true, guardian: true, templateKey: 'hostel_update',
});
assign(['TRANSPORT_ROUTE_ASSIGNED','TRANSPORT_PICKUP_REMINDER','TRANSPORT_BUS_STARTED','TRANSPORT_BUS_DELAYED','BUS_DELAYED','TRANSPORT_BUS_ARRIVING','BUS_APPROACHING_STOP','TRANSPORT_ROUTE_CHANGED','ROUTE_CHANGED','TRIP_CANCELLED'], {
  category: 'TRANSPORT', classification: 'PERSONAL', defaultChannels: ['IN_APP','WHATSAPP','SMS'], student: true, guardian: true, templateKey: 'transport_update',
});
assign(['LIBRARY_BOOK_ISSUED','LOAN_ISSUED','LIBRARY_DUE_REMINDER','LOAN_DUE_SOON','LIBRARY_OVERDUE','LOAN_OVERDUE','LIBRARY_RESERVATION_READY','RESERVATION_READY','LIBRARY_FINE_UPDATED'], {
  category: 'LIBRARY', classification: 'PERSONAL', defaultChannels: ['IN_APP','EMAIL'], student: true, templateKey: 'library_update',
});
assign(['RESEARCH_PROPOSAL_UPDATED','PROPOSAL_UPDATED','RESEARCH_MILESTONE_DUE','MILESTONE_DUE','THESIS_REVIEW_UPDATED','VIVA_SCHEDULED'], {
  category: 'RESEARCH', classification: 'CONFIDENTIAL', defaultChannels: ['IN_APP','EMAIL'], student: true, faculty: true, templateKey: 'research_update',
});
assign(['HELPDESK_CASE_CREATED','HELPDESK_CASE_UPDATED','HELPDESK_CASE_RESOLVED'], {
  category: 'HELPDESK', classification: 'PERSONAL', defaultChannels: ['IN_APP','EMAIL'], templateKey: 'helpdesk_update',
});
assign(['EMPLOYEE_ONBOARDING','LEAVE_REQUEST_UPDATED','PAYROLL_PROCESSED','PAYSLIP_AVAILABLE','EMPLOYEE_TRANSFER_UPDATED','EXIT_CLEARANCE_UPDATED'], {
  category: 'HR', classification: 'CONFIDENTIAL', defaultChannels: ['IN_APP','EMAIL'], faculty: true, templateKey: 'hr_update',
});
assign(['EVENT_CREATED','EVENT_INVITATION','EVENT_REGISTRATION_CONFIRMED','EVENT_REMINDER','EVENT_VENUE_CHANGED','EVENT_CANCELLED','EVENT_CERTIFICATE_AVAILABLE'], {
  category: 'EVENTS', classification: 'PERSONAL', defaultChannels: ['IN_APP','EMAIL'], student: true, faculty: true, templateKey: 'event_update',
});
assign(['EMERGENCY_ALERT','CAMPUS_CLOSURE','WEATHER_ALERT','SECURITY_ALERT','TRANSPORT_EMERGENCY','HEALTH_NOTICE','EXAM_EMERGENCY'], {
  category: 'EMERGENCY', classification: 'INTERNAL', mandatory: true, defaultChannels: ['IN_APP','EMAIL','SMS','WHATSAPP'], student: true, guardian: true, faculty: true, institutionAdmin: true, templateKey: 'emergency_alert',
});
assign(['SYSTEM_MAINTENANCE','SERVICE_INCIDENT','INSTITUTION_SUBSCRIPTION_UPDATED','COMMUNICATION_CREDITS_LOW','COMMUNICATION_PROVIDER_CONFIGURATION_FAILED'], {
  category: 'PLATFORM', classification: 'INTERNAL', mandatory: true, defaultChannels: ['IN_APP','EMAIL'], institutionAdmin: true, superAdmin: true, templateKey: 'platform_notice',
});

export function isCommunicationEventType(value: string): value is CommunicationEventType {
  return (COMMUNICATION_EVENT_TYPES as readonly string[]).includes(value);
}

export function isCommunicationChannel(value: string): value is CommunicationChannel {
  return (COMMUNICATION_CHANNELS as readonly string[]).includes(value);
}
