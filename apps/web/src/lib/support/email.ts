import 'server-only';

import nodemailer from 'nodemailer';

import { completeEmailDelivery, createEmailDelivery } from './repository';
import type { EmailSendResult, SupportRequestRecord } from './types';

export interface SupportEmailProvider {
  sendContactConfirmation(input: { request: SupportRequestRecord; statusUrl?: string }): Promise<EmailSendResult>;
  sendAgentNotification(input: { request: SupportRequestRecord }): Promise<EmailSendResult>;
  sendTicketReply(input: { request: SupportRequestRecord; body: string }): Promise<EmailSendResult>;
}

class SmtpSupportEmailProvider implements SupportEmailProvider {
  private readonly transporter;
  private readonly fromAddress: string;
  private readonly supportAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    if (!host || !user || !password) {
      throw new Error('SMTP_NOT_CONFIGURED');
    }

    this.fromAddress = process.env.SUPPORT_FROM_EMAIL || process.env.SMTP_FROM || user;
    this.supportAddress = process.env.SUPPORT_INBOX_EMAIL || user;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async sendContactConfirmation(input: { request: SupportRequestRecord; statusUrl?: string }): Promise<EmailSendResult> {
    const request = input.request;
    return this.send({
      to: request.emailDisplay,
      subject: `CampusOS support request received — ${request.referenceCode}`,
      text: [
        `Hello ${request.fullName},`,
        '',
        'Your CampusOS support request has been received.',
        `Reference: ${request.referenceCode}`,
        `Category: ${formatLabel(request.category)}`,
        `Subject: ${request.subject}`,
        '',
        input.statusUrl ? `Secure status link: ${input.statusUrl}` : 'Keep your reference number for future communication.',
        '',
        'CampusOS staff will never ask for your password, OTP or banking PIN.',
      ].join('\n'),
      html: `
        <h2>Support request received</h2>
        <p>Hello ${escapeHtml(request.fullName)},</p>
        <p>Your CampusOS support request has been received.</p>
        <table role="presentation" style="border-collapse:collapse">
          <tr><td style="padding:4px 12px 4px 0"><strong>Reference</strong></td><td>${escapeHtml(request.referenceCode)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0"><strong>Category</strong></td><td>${escapeHtml(formatLabel(request.category))}</td></tr>
          <tr><td style="padding:4px 12px 4px 0"><strong>Subject</strong></td><td>${escapeHtml(request.subject)}</td></tr>
        </table>
        ${input.statusUrl ? `<p><a href="${escapeAttribute(input.statusUrl)}">View secure request status</a></p>` : ''}
        <p><strong>Security reminder:</strong> CampusOS staff will never ask for your password, OTP or banking PIN.</p>
      `,
    });
  }

  async sendAgentNotification(input: { request: SupportRequestRecord }): Promise<EmailSendResult> {
    const request = input.request;
    return this.send({
      to: this.supportAddress,
      subject: `[${request.priority}] ${request.referenceCode} — ${request.subject}`,
      text: [
        'A new CampusOS support request has been received.',
        `Reference: ${request.referenceCode}`,
        `Category: ${request.category}`,
        `Priority: ${request.priority}`,
        `Queue: ${request.assignedTeam}`,
        `Institution: ${request.institutionName}`,
        `Requester: ${request.fullName} <${request.emailDisplay}>`,
        '',
        'Open the authorized CampusOS support console to review the request.',
      ].join('\n'),
      html: `
        <h2>New support request</h2>
        <p><strong>${escapeHtml(request.referenceCode)}</strong></p>
        <p>${escapeHtml(request.subject)}</p>
        <ul>
          <li>Category: ${escapeHtml(request.category)}</li>
          <li>Priority: ${escapeHtml(request.priority)}</li>
          <li>Queue: ${escapeHtml(request.assignedTeam)}</li>
          <li>Institution: ${escapeHtml(request.institutionName)}</li>
        </ul>
        <p>Open the authorized CampusOS support console to review the full message.</p>
      `,
    });
  }

  async sendTicketReply(input: { request: SupportRequestRecord; body: string }): Promise<EmailSendResult> {
    return this.send({
      to: input.request.emailDisplay,
      subject: `Update on ${input.request.referenceCode} — ${input.request.subject}`,
      text: `${input.body}\n\nReference: ${input.request.referenceCode}`,
      html: `<p>${escapeHtml(input.body).replace(/\n/g, '<br />')}</p><p>Reference: <strong>${escapeHtml(input.request.referenceCode)}</strong></p>`,
    });
  }

  private async send(input: { to: string; subject: string; text: string; html: string }): Promise<EmailSendResult> {
    try {
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.to,
        subject: stripHeaderCharacters(input.subject),
        text: input.text,
        html: input.html,
      });
      return {
        accepted: Array.isArray(result.accepted) ? result.accepted.length > 0 : true,
        providerMessageId: result.messageId,
      };
    } catch (error: unknown) {
      const code = safeProviderCode(error);
      const permanent = ['EENVELOPE', 'EADDRESS', 'INVALID_RECIPIENT'].includes(code);
      return {
        accepted: false,
        failureType: permanent ? 'permanent' : 'temporary',
        safeErrorCode: code,
      };
    }
  }
}

class DisabledSupportEmailProvider implements SupportEmailProvider {
  async sendContactConfirmation(): Promise<EmailSendResult> {
    return { accepted: false, failureType: 'temporary', safeErrorCode: 'EMAIL_PROVIDER_NOT_CONFIGURED' };
  }

  async sendAgentNotification(): Promise<EmailSendResult> {
    return { accepted: false, failureType: 'temporary', safeErrorCode: 'EMAIL_PROVIDER_NOT_CONFIGURED' };
  }

  async sendTicketReply(): Promise<EmailSendResult> {
    return { accepted: false, failureType: 'temporary', safeErrorCode: 'EMAIL_PROVIDER_NOT_CONFIGURED' };
  }
}

export function getSupportEmailProvider(): SupportEmailProvider {
  try {
    return new SmtpSupportEmailProvider();
  } catch {
    return new DisabledSupportEmailProvider();
  }
}

export async function deliverNewSupportRequestEmails(input: {
  request: SupportRequestRecord;
  statusUrl?: string;
}): Promise<{ confirmation: EmailSendResult; agentNotification: EmailSendResult }> {
  const provider = getSupportEmailProvider();
  const confirmationDeliveryId = await createEmailDelivery({
    supportRequestId: input.request.id,
    recipient: input.request.emailDisplay,
    emailType: 'CONTACT_CONFIRMATION',
  });
  const agentDeliveryId = await createEmailDelivery({
    supportRequestId: input.request.id,
    recipient: process.env.SUPPORT_INBOX_EMAIL || process.env.SMTP_USER || 'unconfigured',
    emailType: 'AGENT_NOTIFICATION',
  });

  const [confirmation, agentNotification] = await Promise.all([
    provider.sendContactConfirmation(input),
    provider.sendAgentNotification({ request: input.request }),
  ]);

  await Promise.all([
    completeEmailDelivery({ id: confirmationDeliveryId, ...confirmation }),
    completeEmailDelivery({ id: agentDeliveryId, ...agentNotification }),
  ]);

  return { confirmation, agentNotification };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function stripHeaderCharacters(value: string): string {
  return value.replace(/[\r\n]/g, ' ').slice(0, 180);
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function safeProviderCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'EMAIL_PROVIDER_ERROR';
  const candidate = error as { code?: unknown; responseCode?: unknown };
  if (typeof candidate.code === 'string') return candidate.code.slice(0, 64);
  if (typeof candidate.responseCode === 'number') return `SMTP_${candidate.responseCode}`;
  return 'EMAIL_PROVIDER_ERROR';
}
