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
 * Safely inserts the email into the transactional queue, then performs a
 * best-effort inline drain so critical mail (password resets, account
 * activation) is delivered even when no background worker or cron is wired
 * up. The database queue stays the durable source of truth: if the inline
 * attempt fails the row remains PENDING/FAILED for the cron worker
 * (see /api/cron/process-email-queue) or a later retry.
 */
export async function queueEmail({ tenantId, to, subject, body, type, scheduledFor }: QueueEmailArgs) {
  const safeSubject = sanitizeSubject(subject);
  const brandedBody = await applyTenantBranding(tenantId, body);

  const created = await prisma.emailQueue.create({
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

  // Bounded, non-fatal inline delivery of exactly this message. Any failure
  // keeps the row queued for the cron worker (/api/cron/process-email-queue)
  // or a later retry, and never blocks the calling request beyond the
  // transporter timeouts.
  await deliverEmailNow(created.id).catch(() => false);

  return created;
}

/**
 * 2. Background Worker / Retry Logic
 * Processes the queue securely with row-level locks and retry constraints.
 */
export async function processEmailQueue(): Promise<{ processed: number; failed: number }> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'dev',
      pass: process.env.SMTP_PASS || 'dev',
    },
    // Bound every network phase so a down or slow mail server cannot hang a
    // request or worker indefinitely.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  const now = new Date();
  let processed = 0;
  let failed = 0;

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
      if (await deliverEmailWithLock(transporter, email.id)) processed += 1;
      else failed += 1;
    } catch (error: unknown) {
      failed += 1;
      console.error(`[EMAIL_QUEUE] Failed to send email ${email.id}:`, error);
    }
  }

  return { processed, failed };
}

/**
 * Best-effort inline delivery of a single queued email (used right after
 * queueing so critical mail like password resets or activations is not
 * silently stuck until a worker/cron runs). Bounded to one message so a slow
 * or down mail server can never stall the calling request for long.
 */
export async function deliverEmailNow(emailId: string): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'dev',
      pass: process.env.SMTP_PASS || 'dev',
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  try {
    return await deliverEmailWithLock(transporter, emailId);
  } catch (error) {
    console.error(`[EMAIL_QUEUE] Inline delivery failed for ${emailId}:`, error);
    return false;
  }
}

/**
 * Locks and sends a single queued email. The conditional UPDATE is the
 * concurrency lock: only one worker can transition PENDING/FAILED ->
 * PROCESSING, so the same message is never sent twice even under retries.
 */
async function deliverEmailWithLock(transporter: nodemailer.Transporter, emailId: string) {
  const email = await prisma.emailQueue.findUnique({ where: { id: emailId } });
  if (!email) return false;

  // 3. Duplicate Send Prevention & Concurrency Lock
  const lockResult = await prisma.$executeRaw`
    UPDATE email_queue 
    SET status = 'PROCESSING', attempts = attempts + 1, updated_at = NOW() 
    WHERE id = ${email.id} AND status IN ('PENDING', 'FAILED')
  `;

  if (lockResult === 0) return false; // Another worker picked it up

  try {
    await transporter.sendMail({
      from: `"CampusOS" <no-reply@campusos.com>`,
      to: email.to,
      subject: email.subject,
      html: email.body,
    });

    await prisma.emailQueue.update({
      where: { id: email.id },
      data: { status: 'SENT', sentAt: new Date() },
    });
    return true;
  } catch (error: any) {
    console.error(`[EMAIL_QUEUE] Failed to send email ${email.id}:`, error);

    const newStatus = email.attempts + 1 >= MAX_RETRIES ? 'BOUNCED' : 'FAILED';

    await prisma.emailQueue.update({
      where: { id: email.id },
      data: {
        status: newStatus,
        lastError: error.message || 'Unknown SMTP error',
        // Exponential backoff for retries (e.g. attempt 1 -> wait 5 mins, attempt 2 -> wait 25 mins)
        scheduledFor: newStatus === 'FAILED' ? new Date(Date.now() + Math.pow(5, email.attempts + 1) * 60000) : email.scheduledFor,
      },
    });
    return false;
  }
}
