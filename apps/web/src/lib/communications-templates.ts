import type { CommunicationCategory, SecurityClassification } from './communications-types';

export type BaseCommunicationTemplate = {
  key: string;
  category: CommunicationCategory;
  classification: SecurityClassification;
  subject: string;
  preheader: string;
  title: string;
  body: string;
  sms?: string;
  whatsapp?: string;
  ctaLabel?: string;
  ctaPath?: string;
};

const BASE: Record<string, BaseCommunicationTemplate> = {};

function define(template: BaseCommunicationTemplate) {
  BASE[template.key] = template;
}

function generic(key: string, category: CommunicationCategory, classification: SecurityClassification, subject: string, title: string, body: string, ctaLabel = 'Open NAVEMORA', ctaPath = '/') {
  define({ key, category, classification, subject, preheader: body, title, body, ctaLabel, ctaPath });
}

generic('welcome_account_created', 'SECURITY', 'CONFIDENTIAL', 'Welcome to {{institution.name}} on NAVEMORA', 'Your NAVEMORA account is ready', 'Your account has been created. Sign in using the secure NAVEMORA portal.', 'Open NAVEMORA', '/login');
generic('email_verification', 'SECURITY', 'CONFIDENTIAL', 'Verify your email address', 'Verify your email', 'Confirm this email address to complete account verification.', 'Verify email', '/verify-email');
generic('password_reset', 'SECURITY', 'HIGHLY_CONFIDENTIAL', 'Reset your NAVEMORA password', 'Password reset requested', 'A password reset was requested for your account. Use the secure link only if you initiated this request.', 'Reset password', '/forgot-password');
generic('security_alert', 'SECURITY', 'HIGHLY_CONFIDENTIAL', 'Security alert for your NAVEMORA account', 'Security alert', 'A security-sensitive change or sign-in event requires your attention.', 'Review account', '/settings');

generic('admission_application_received', 'ADMISSIONS', 'PERSONAL', 'Admission application received', 'We received your application', 'Your institution has received the admission application and will process it according to its admissions workflow.', 'View application', '/platform/admissions');
generic('admission_documents_required', 'ADMISSIONS', 'PERSONAL', 'Additional admission documents required', 'Documents required', 'Your admission application requires additional documents or corrections before it can proceed.', 'Review requirements', '/platform/admissions');
generic('admission_offer', 'ADMISSIONS', 'CONFIDENTIAL', 'Admission offer available', 'Your admission status has been updated', 'An official admission decision is available in NAVEMORA. Review it through the authenticated portal.', 'View admission status', '/platform/admissions');
generic('admission_confirmed', 'ADMISSIONS', 'CONFIDENTIAL', 'Admission confirmed', 'Admission confirmed', 'Your institution has confirmed your admission. Review the next enrollment steps in NAVEMORA.', 'Continue enrollment', '/platform/admissions');
generic('enrollment_confirmation', 'ACADEMIC', 'PERSONAL', 'Enrollment confirmed', 'Enrollment confirmed', 'Your enrollment has been recorded by the institution.', 'View academic profile', '/dashboard/student');

generic('attendance_warning', 'ATTENDANCE', 'PERSONAL', 'Attendance alert for {{student.name}}', 'Attendance requires attention', '{{student.name}} attendance in {{course.title}} is {{attendance.percentage}}%. The institution requirement is {{attendance.requiredPercentage}}%.', 'View attendance', '/attendance');
generic('attendance_critical_warning', 'ATTENDANCE', 'PERSONAL', 'Critical attendance alert for {{student.name}}', 'Attendance is below the institution threshold', '{{student.name}} attendance has reached a critical institution-defined threshold. Review the authoritative attendance dashboard.', 'View attendance', '/attendance');
generic('attendance_digest', 'ATTENDANCE', 'PERSONAL', 'Attendance summary for {{student.name}}', 'Attendance summary', 'A new attendance summary is available for {{student.name}}.', 'View attendance', '/attendance');

generic('timetable_published', 'ACADEMIC', 'PERSONAL', 'Your timetable has been published', 'Timetable published', 'Your institution has published an updated academic timetable.', 'View timetable', '/timetable');
generic('class_rescheduled', 'ACADEMIC', 'PERSONAL', 'Class schedule changed', 'Class rescheduled', '{{course.title}} has a schedule update. Review the latest date, time and room in NAVEMORA.', 'View timetable', '/timetable');
generic('class_cancelled', 'ACADEMIC', 'PERSONAL', 'Class cancelled', 'Class cancelled', '{{course.title}} has been cancelled by the institution for the referenced session.', 'View timetable', '/timetable');

generic('exam_schedule', 'EXAMINATION', 'PERSONAL', 'Examination schedule published', 'Examination schedule available', 'Your institution has published an examination schedule.', 'View examinations', '/examinations');
generic('exam_reminder', 'EXAMINATION', 'PERSONAL', 'Your NAVEMORA exam is coming up', 'Examination reminder', '{{exam.name}} is scheduled for {{exam.date}} at {{exam.time}}. Review venue and instructions in NAVEMORA.', 'Open examination center', '/examinations');
generic('admit_card_available', 'EXAMINATION', 'CONFIDENTIAL', 'Your admit card is available', 'Admit card available', 'Your institution has released an admit card for an upcoming examination.', 'View admit card', '/examinations');
generic('exam_rescheduled', 'EXAMINATION', 'PERSONAL', 'Examination rescheduled', 'Exam schedule changed', '{{exam.name}} has been rescheduled. Review the latest authoritative schedule in NAVEMORA.', 'Review exam schedule', '/examinations');
generic('secure_exam_readiness', 'EXAMINATION', 'PERSONAL', 'Complete your secure examination readiness check', 'Secure exam readiness', 'Complete your device, identity and required proctoring checks before the examination window.', 'Run system check', '/examinations/system-check');
generic('result_published', 'EXAMINATION', 'CONFIDENTIAL', 'Semester result published', 'Your official result is available', 'An official result has been published by your institution. Sign in to view the authorized result.', 'View result', '/results');
generic('revaluation_update', 'EXAMINATION', 'CONFIDENTIAL', 'Revaluation status updated', 'Revaluation update', 'The status of your result revaluation request has changed.', 'View result status', '/results');

generic('invoice_issued', 'FINANCE', 'CONFIDENTIAL', 'A new fee invoice is available', 'Fee invoice issued', 'Your institution has issued a new fee invoice. Review the authenticated finance portal for the amount and due date.', 'View invoice', '/payments');
generic('fee_due', 'FINANCE', 'CONFIDENTIAL', 'Fee payment reminder', 'Payment due reminder', 'A fee installment is approaching its institution-defined due date.', 'View dues', '/payments');
generic('fee_overdue', 'FINANCE', 'CONFIDENTIAL', 'Fee payment overdue', 'Payment is overdue', 'An institution fee obligation is overdue according to the authoritative finance ledger.', 'Review dues', '/payments');
generic('payment_confirmation', 'FINANCE', 'CONFIDENTIAL', 'Payment received', 'Payment confirmed', 'Your payment has been confirmed by NAVEMORA Finance.', 'View receipt', '/receipts');
generic('payment_receipt', 'FINANCE', 'CONFIDENTIAL', 'Your payment receipt is available', 'Receipt available', 'An official payment receipt is available in the authenticated portal.', 'View receipt', '/receipts');
generic('payment_failure', 'FINANCE', 'CONFIDENTIAL', 'Payment was not completed', 'Payment unsuccessful', 'The attempted payment was not confirmed. No success status has been recorded in the authoritative payment ledger.', 'Review payment', '/payments');
generic('refund_update', 'FINANCE', 'CONFIDENTIAL', 'Refund status updated', 'Refund update', 'The status of your refund workflow has changed.', 'View finance status', '/payments');
generic('scholarship_update', 'FINANCE', 'CONFIDENTIAL', 'Scholarship status updated', 'Scholarship update', 'Your scholarship workflow has an official status update.', 'View scholarship status', '/finance');

generic('hostel_allocation', 'HOSTEL', 'PERSONAL', 'Hostel room allocation updated', 'Hostel allocation', 'Your hostel allocation has been updated by the institution.', 'View hostel', '/hostel');
generic('hostel_outpass_update', 'HOSTEL', 'PERSONAL', 'Hostel outpass status updated', 'Outpass update', 'The status of the hostel outpass request has changed.', 'View hostel', '/hostel');
generic('hostel_notice', 'HOSTEL', 'PERSONAL', 'Hostel notice from {{institution.name}}', 'Hostel notice', 'A new hostel operational notice is available.', 'View hostel', '/hostel');

generic('transport_assignment', 'TRANSPORT', 'PERSONAL', 'Transport route assigned', 'Transport assignment', 'Your institution transport route or vehicle assignment has been updated.', 'View transport', '/transport');
generic('transport_delay', 'TRANSPORT', 'PERSONAL', 'Transport delay on {{transport.route}}', 'Transport delay', 'The institution has reported a delay for your assigned transport service.', 'View transport', '/transport');
generic('transport_route_update', 'TRANSPORT', 'PERSONAL', 'Transport route updated', 'Route update', 'Your assigned transport route has changed.', 'View transport', '/transport');

generic('library_due', 'LIBRARY', 'PERSONAL', 'Library item due soon', 'Library due reminder', 'A library item assigned to your account is approaching its due date.', 'View library account', '/library');
generic('library_overdue', 'LIBRARY', 'PERSONAL', 'Library item overdue', 'Library item overdue', 'A library item is overdue according to the institution library ledger.', 'View library account', '/library');
generic('library_reservation_ready', 'LIBRARY', 'PERSONAL', 'Your library reservation is ready', 'Reservation ready', 'A reserved library item is ready according to the library workflow.', 'View reservation', '/library');

generic('research_milestone', 'RESEARCH', 'CONFIDENTIAL', 'Research milestone due', 'Research milestone', 'A research project milestone requires attention.', 'Open research workspace', '/research');
generic('thesis_review', 'RESEARCH', 'CONFIDENTIAL', 'Thesis review updated', 'Thesis review update', 'Your thesis or dissertation review workflow has an update.', 'Open research workspace', '/research');
generic('viva_schedule', 'RESEARCH', 'CONFIDENTIAL', 'Viva schedule published', 'Viva scheduled', 'A viva schedule has been published for an authorized research workflow.', 'View schedule', '/research');

generic('helpdesk_update', 'HELPDESK', 'PERSONAL', 'Helpdesk case updated', 'Support case update', 'Your NAVEMORA helpdesk case has a new status or response.', 'Open helpdesk', '/helpdesk');

generic('faculty_timetable', 'ACADEMIC', 'PERSONAL', 'Faculty timetable updated', 'Teaching timetable updated', 'Your assigned teaching timetable has been updated.', 'View timetable', '/timetable');
generic('attendance_submission_reminder', 'ATTENDANCE', 'PERSONAL', 'Attendance register requires submission', 'Attendance submission reminder', 'An assigned attendance register requires action.', 'Open attendance', '/attendance');
generic('exam_duty', 'EXAMINATION', 'PERSONAL', 'Examination duty assigned', 'Exam duty', 'An examination or invigilation duty has been assigned to you.', 'View examinations', '/examinations');
generic('marks_entry_reminder', 'EXAMINATION', 'CONFIDENTIAL', 'Marks entry requires action', 'Marks entry reminder', 'An authorized marks-entry workflow requires your attention.', 'Open results workspace', '/results');
generic('leave_decision', 'HR', 'CONFIDENTIAL', 'Leave request status updated', 'Leave update', 'Your leave request has an official status update.', 'Open workforce', '/workforce');
generic('payslip_available', 'HR', 'HIGHLY_CONFIDENTIAL', 'Your payslip is available', 'Payslip available', 'Your payslip is available through the authenticated workforce portal. Sensitive payroll details are not included in this email.', 'View payslip', '/workforce');

generic('event_invitation', 'EVENTS', 'PERSONAL', 'You are invited: {{event.name}}', 'Event invitation', 'Your institution has shared an event invitation.', 'View event', '/events');
generic('event_reminder', 'EVENTS', 'PERSONAL', 'Event reminder: {{event.name}}', 'Event reminder', 'An event you are eligible for is approaching.', 'View event', '/events');
generic('event_cancelled', 'EVENTS', 'PERSONAL', 'Event cancelled: {{event.name}}', 'Event cancelled', 'The institution has cancelled the referenced event.', 'View events', '/events');

generic('emergency_alert', 'EMERGENCY', 'INTERNAL', '{{institution.name}} — Important safety notice', 'Important institutional notice', '{{alert.message}}', 'Open NAVEMORA', '/notifications');
generic('platform_maintenance', 'PLATFORM', 'INTERNAL', 'NAVEMORA platform maintenance notice', 'Platform maintenance', 'A scheduled NAVEMORA platform maintenance window has been announced.', 'Review status', '/notifications');
generic('institution_subscription', 'PLATFORM', 'CONFIDENTIAL', 'NAVEMORA subscription updated', 'Subscription update', 'Your institution subscription has an official update.', 'Review subscription', '/settings');
generic('communication_credits_low', 'PLATFORM', 'CONFIDENTIAL', 'Communication credits are running low', 'Communication credit warning', 'Your institution is approaching its configured paid-channel communication balance threshold.', 'Review communication billing', '/communications/admin');
generic('provider_configuration_failure', 'PLATFORM', 'CONFIDENTIAL', 'Communication provider requires attention', 'Provider configuration issue', 'An email, SMS or WhatsApp provider is unavailable or misconfigured. No successful delivery is being fabricated.', 'Open communications', '/communications/admin');

BASE.attendance_warning.sms = 'NAVEMORA: {{student.name}} attendance in {{course.title}} is {{attendance.percentage}}%, below the institution requirement of {{attendance.requiredPercentage}}%. View details in NAVEMORA.';
BASE.fee_due.sms = 'NAVEMORA: A fee installment for {{student.name}} is due on {{invoice.dueDate}}. Sign in to NAVEMORA for invoice details.';
BASE.exam_reminder.sms = 'NAVEMORA: {{exam.name}} is scheduled for {{exam.date}} at {{exam.time}}. Check NAVEMORA for venue/instructions.';
BASE.result_published.sms = 'NAVEMORA: {{student.name}} result for {{result.term}} has been published. Sign in to NAVEMORA to view the official result.';
BASE.transport_delay.sms = 'NAVEMORA Transport: {{transport.vehicle}} is delayed by approximately {{transport.delay}} on {{transport.route}}.';
BASE.emergency_alert.sms = 'NAVEMORA: {{alert.message}} Open the authorized NAVEMORA portal for official details.';

for (const key of ['attendance_warning','fee_due','payment_confirmation','exam_reminder','result_published','event_reminder','transport_delay','hostel_outpass_update','library_due','emergency_alert']) {
  if (BASE[key]) BASE[key].whatsapp = BASE[key].sms ?? BASE[key].body;
}

export const BASE_COMMUNICATION_TEMPLATES = Object.freeze(BASE);

function valueAtPath(input: Record<string, unknown>, path: string): unknown {
  let current: unknown = input;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return '';
    current = (current as Record<string, unknown>)[part];
  }
  return current ?? '';
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderText(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, path: string) => String(valueAtPath(variables, path) ?? ''));
}

export function renderHtmlText(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, path: string) => escapeHtml(valueAtPath(variables, path)));
}

export function safePortalUrl(pathOrUrl: string | undefined, publicOrigin = process.env.APP_PUBLIC_URL || 'http://localhost:3000') {
  const fallback = new URL('/', publicOrigin).toString();
  if (!pathOrUrl) return fallback;
  try {
    const base = new URL(publicOrigin);
    const candidate = new URL(pathOrUrl, base);
    if (candidate.origin !== base.origin) return fallback;
    if (!['http:', 'https:'].includes(candidate.protocol)) return fallback;
    return candidate.toString();
  } catch {
    return fallback;
  }
}

export function renderEmailShell(input: {
  institutionName: string;
  institutionLogoUrl?: string | null;
  primaryColor?: string | null;
  supportEmail?: string | null;
  title: string;
  preheader: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string | null;
}) {
  const primary = /^#[0-9a-fA-F]{6}$/.test(input.primaryColor || '') ? input.primaryColor! : '#164A9C';
  const logo = input.institutionLogoUrl ? `<img src="${escapeHtml(input.institutionLogoUrl)}" width="120" alt="${escapeHtml(input.institutionName)}" style="display:block;max-width:120px;height:auto;border:0" />` : `<div style="font-size:19px;font-weight:800;color:#081B3A">${escapeHtml(input.institutionName)}</div>`;
  const cta = input.ctaLabel && input.ctaUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:8px;background:${primary}"><a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(input.ctaLabel)}</a></td></tr></table>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#24324a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fa"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5eaf1;border-radius:16px"><tr><td style="padding:28px 32px;border-bottom:1px solid #edf1f5">${logo}</td></tr><tr><td style="padding:32px"><h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;color:#081B3A">${escapeHtml(input.title)}</h1><div style="font-size:15px;line-height:1.7;color:#526078">${input.bodyHtml}</div>${cta}<div style="margin-top:28px;padding-top:20px;border-top:1px solid #edf1f5;font-size:12px;line-height:1.6;color:#738095">For privacy and security, open sensitive academic, finance, payroll or examination details only inside the authenticated NAVEMORA portal.</div></td></tr><tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #edf1f5;font-size:11px;line-height:1.6;color:#7a8699">${escapeHtml(input.footer || 'This operational communication was sent through NAVEMORA on behalf of your institution.')}${input.supportEmail ? `<br>Support: ${escapeHtml(input.supportEmail)}` : ''}</td></tr></table></td></tr></table></body></html>`;
}

export function renderBaseTemplate(input: {
  key: string;
  variables: Record<string, unknown>;
  institution: { name: string; logoUrl?: string | null; primaryColor?: string | null };
  supportEmail?: string | null;
}) {
  const template = BASE_COMMUNICATION_TEMPLATES[input.key] ?? BASE_COMMUNICATION_TEMPLATES.platform_maintenance;
  const merged = { ...input.variables, institution: { ...(input.variables.institution as Record<string, unknown> | undefined), name: input.institution.name } };
  const subject = renderText(template.subject, merged).replace(/[\r\n]+/g, ' ').slice(0, 200);
  const preheader = renderText(template.preheader, merged).slice(0, 250);
  const bodyText = renderText(template.body, merged);
  const bodyHtml = `<p style="margin:0 0 14px">${renderHtmlText(template.body, merged)}</p>`;
  const ctaUrl = safePortalUrl(template.ctaPath);
  return {
    template,
    subject,
    preheader,
    text: `${template.title}\n\n${bodyText}${template.ctaLabel ? `\n\n${template.ctaLabel}: ${ctaUrl}` : ''}\n\nThis operational communication was sent through NAVEMORA on behalf of ${input.institution.name}.`,
    html: renderEmailShell({
      institutionName: input.institution.name,
      institutionLogoUrl: input.institution.logoUrl,
      primaryColor: input.institution.primaryColor,
      supportEmail: input.supportEmail,
      title: renderText(template.title, merged),
      preheader,
      bodyHtml,
      ctaLabel: template.ctaLabel,
      ctaUrl,
    }),
    sms: renderText(template.sms ?? template.body, merged),
    whatsapp: renderText(template.whatsapp ?? template.sms ?? template.body, merged),
  };
}

const GSM_BASIC = /^[\x20-\x7E\n\r€£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉÄÖÑÜ§¿äöñüà^{}\\\[~\]|]*$/;

export function calculateSmsSegments(message: string) {
  const gsm = GSM_BASIC.test(message);
  const single = gsm ? 160 : 70;
  const concat = gsm ? 153 : 67;
  const length = [...message].length;
  const segments = length <= single ? 1 : Math.ceil(length / concat);
  return { encoding: gsm ? 'GSM-7' : 'UCS-2', characters: length, segments };
}
