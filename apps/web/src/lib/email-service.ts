import { prisma } from './db';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const MAX_RETRIES = 3;

interface QueueEmailArgs {
  tenantId: string;
  to: string;
  subject: string;
  body: string;
  type: string;
  idempotencyKey?: string;
  scheduledFor?: Date;
}

/**
 * Validates subjects to prevent leaking sensitive information in plain text.
 */
function sanitizeSubject(subject: string) {
  const sensitivePatterns = [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, /\b\d{10,16}\b/, /(password|token|secret)/i];
  for (const pattern of sensitivePatterns) {
    if (pattern.test(subject)) {
      throw new Error('Security Violation: Subject line contains potentially sensitive information.');
    }
  }
  return subject;
}

/**
 * Wraps content in tenant-specific branding.
 */
async function applyTenantBranding(tenantId: string, content: string) {
  const tenant = await prisma.institution.findUnique({ where: { id: tenantId } });
  if (!tenant) return content;

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${tenant.primaryColor}; padding: 20px; text-align: center;">
        ${tenant.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.name}" style="height: 40px;" />` : `<h1 style="color: white; margin: 0;">${tenant.name}</h1>`}
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        ${content}
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        &copy; ${new Date().getFullYear()} ${tenant.name}. All rights reserved.<br/>
        <a href="https://${tenant.subdomain}.campusos.com/settings/notifications" style="color: ${tenant.primaryColor}; text-decoration: none;">Manage Notification Preferences</a>
      </div>
    </div>
  `;
}

/**
 * 1. Queue-based delivery
 * Safely inserts the email into the transactional queue.
 */
export async function queueEmail({ tenantId, to, subject, body, type, scheduledFor }: QueueEmailArgs) {
  const safeSubject = sanitizeSubject(subject);
  const brandedBody = await applyTenantBranding(tenantId, body);

  await prisma.emailQueue.create({
    data: {
      tenantId,
      to,
      subject: safeSubject,
      body: brandedBody,
      type,
      status: 'PENDING',
      scheduledFor: scheduledFor || new Date(),
    }
  });
}

/**
 * 2. Background Worker / Retry Logic
 * Processes the queue securely with row-level locks and retry constraints.
 */
export async function processEmailQueue() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'dev',
      pass: process.env.SMTP_PASS || 'dev',
    },
  });

  const now = new Date();

  // Find eligible emails: PENDING or (FAILED with retries < 3), scheduled for now or past
  const batch = await prisma.emailQueue.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      attempts: { lt: MAX_RETRIES },
      scheduledFor: { lte: now }
    },
    take: 50,
    orderBy: { createdAt: 'asc' }
  });

  for (const email of batch) {
    try {
      // 3. Duplicate Send Prevention & Concurrency Lock
      const lockResult = await prisma.$executeRaw`
        UPDATE email_queue 
        SET status = 'PROCESSING', attempts = attempts + 1, updated_at = NOW() 
        WHERE id = ${email.id} AND status IN ('PENDING', 'FAILED')
      `;

      if (lockResult === 0) continue; // Another worker picked it up

      await transporter.sendMail({
        from: `"CampusOS" <no-reply@campusos.com>`,
        to: email.to,
        subject: email.subject,
        html: email.body,
      });

      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() }
      });

    } catch (error: any) {
      console.error(`[EMAIL_QUEUE] Failed to send email ${email.id}:`, error);
      
      const newStatus = (email.attempts + 1) >= MAX_RETRIES ? 'BOUNCED' : 'FAILED';
      
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { 
          status: newStatus,
          lastError: error.message || 'Unknown SMTP error',
          // Exponential backoff for retries (e.g. attempt 1 -> wait 5 mins, attempt 2 -> wait 25 mins)
          scheduledFor: newStatus === 'FAILED' ? new Date(now.getTime() + Math.pow(5, email.attempts + 1) * 60000) : email.scheduledFor
        }
      });
    }
  }
}
