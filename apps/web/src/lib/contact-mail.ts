import 'server-only';

import nodemailer from 'nodemailer';

type ContactMailConfig = NonNullable<ReturnType<typeof contactMailConfig>>;
type ContactTransporter = ReturnType<typeof nodemailer.createTransport>;

let sharedTransporter: ContactTransporter | null = null;
let sharedTransporterKey = '';

export type ContactMailInput = {
  name: string;
  email: string;
  phone?: string;
  institution: string;
  role?: string;
  country?: string;
  inquiryType: string;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function contactMailConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || user;
  const inbox = process.env.CONTACT_TO_EMAIL || user || from;
  const replyTo = process.env.CONTACT_REPLY_TO_EMAIL || inbox;

  if (!host || !from || !inbox || !replyTo || !Number.isFinite(port)) return null;
  if ((user && !pass) || (!user && pass)) return null;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: user && pass ? { user, pass } : undefined,
    from,
    inbox,
    replyTo,
  };
}

function getTransporter(config: ContactMailConfig) {
  const key = JSON.stringify([config.host, config.port, config.secure, config.auth?.user || '', config.from]);
  if (sharedTransporter && sharedTransporterKey === key) return sharedTransporter;

  if (sharedTransporter && typeof sharedTransporter.close === 'function') sharedTransporter.close();

  sharedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.auth ? { auth: config.auth } : {}),
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  sharedTransporterKey = key;
  return sharedTransporter;
}

export function contactInboxAddress() {
  return contactMailConfig()?.inbox ?? null;
}

export async function sendContactNotificationMail(input: ContactMailInput, reference: string) {
  const config = contactMailConfig();
  if (!config) throw new Error('CONTACT_MAIL_NOT_CONFIGURED');

  const transporter = getTransporter(config);
  const subject = `[${reference}] [CampusOS ${singleLine(input.inquiryType)}] ${singleLine(input.institution)} — ${singleLine(input.name)}`;
  const text = [
    `Reference: ${reference}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || 'Not provided'}`,
    `Institution: ${input.institution}`,
    `Role: ${input.role || 'Not provided'}`,
    `Country/Region: ${input.country || 'Not provided'}`,
    `Inquiry type: ${input.inquiryType}`,
    '',
    input.message,
  ].join('\n');

  const result = await transporter.sendMail({
    from: config.from,
    to: config.inbox,
    replyTo: input.email,
    subject,
    text,
    html: `<h2>New CampusOS enquiry</h2><p><strong>Reference:</strong> ${escapeHtml(reference)}</p><table cellpadding="6" cellspacing="0" style="border-collapse:collapse"><tr><td><strong>Name</strong></td><td>${escapeHtml(input.name)}</td></tr><tr><td><strong>Email</strong></td><td>${escapeHtml(input.email)}</td></tr><tr><td><strong>Phone</strong></td><td>${escapeHtml(input.phone || 'Not provided')}</td></tr><tr><td><strong>Institution</strong></td><td>${escapeHtml(input.institution)}</td></tr><tr><td><strong>Role</strong></td><td>${escapeHtml(input.role || 'Not provided')}</td></tr><tr><td><strong>Country/Region</strong></td><td>${escapeHtml(input.country || 'Not provided')}</td></tr><tr><td><strong>Inquiry type</strong></td><td>${escapeHtml(input.inquiryType)}</td></tr></table><h3>Message</h3><p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
  });

  return { messageId: result.messageId || null, subject };
}

export async function sendContactReplyMail(input: {
  to: string;
  customerName: string;
  reference: string;
  subject: string;
  message: string;
}) {
  const config = contactMailConfig();
  if (!config) throw new Error('CONTACT_MAIL_NOT_CONFIGURED');

  const transporter = getTransporter(config);
  const safeSubject = singleLine(input.subject);
  const subject = safeSubject.includes(input.reference) ? safeSubject : `${safeSubject} [${input.reference}]`;
  const greeting = input.customerName.trim() ? `Hi ${input.customerName.trim()},` : 'Hello,';
  const text = `${greeting}\n\n${input.message.trim()}\n\nRegards,\nCampusOS Team`;

  const result = await transporter.sendMail({
    from: config.from,
    to: input.to,
    replyTo: config.replyTo,
    subject,
    text,
    html: `<p>${escapeHtml(greeting)}</p><p style="white-space:pre-wrap">${escapeHtml(input.message.trim())}</p><p>Regards,<br/>CampusOS Team</p><hr/><p style="font-size:12px;color:#667085">Reference: ${escapeHtml(input.reference)}</p>`,
  });

  return { messageId: result.messageId || null, subject, from: config.from, replyTo: config.replyTo };
}
