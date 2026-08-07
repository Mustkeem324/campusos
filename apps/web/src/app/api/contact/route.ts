import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { contactInboxAddress, sendContactNotificationMail } from '../../../lib/contact-mail';
import { prisma } from '../../../lib/db';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../lib/public-rate-limit';

const CONTACT_BODY_LIMIT_BYTES = 16 * 1024;
const CONTACT_RATE_LIMIT = 8;
const CONTACT_RATE_WINDOW_MS = 15 * 60_000;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(''),
  institution: z.string().trim().min(2).max(180),
  role: z.string().trim().max(120).optional().default(''),
  country: z.string().trim().max(100).optional().default(''),
  inquiryType: z.enum(['SALES', 'IMPLEMENTATION', 'SECURITY', 'PARTNERSHIP', 'SUPPORT', 'OTHER']),
  message: z.string().trim().min(20).max(5000),
  consent: z.literal(true),
  website: z.string().trim().max(200).optional().default(''),
});

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function makeReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const token = randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  return `COS-${day}-${token}`;
}

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    const rateLimit = checkPublicRateLimit({
      key: `contact:${ip}`,
      limit: CONTACT_RATE_LIMIT,
      windowMs: CONTACT_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many contact requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const rawBody = await readJsonWithLimit(request, CONTACT_BODY_LIMIT_BYTES);
    const parsed = contactSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please review the form fields and try again.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    // Honeypot submissions are silently discarded so bots do not learn which
    // field caused rejection and never enter the company CRM queue.
    if (data.website) return NextResponse.json({ success: true }, { status: 202 });

    const inquiryId = randomUUID();
    const messageId = randomUUID();
    const reference = makeReference();
    const subject = `[CampusOS ${data.inquiryType}] ${singleLine(data.institution)} — ${singleLine(data.name)}`;
    const recipient = contactInboxAddress() || process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER || '';

    try {
      await prisma.$transaction([
        prisma.$executeRaw`
          INSERT INTO campusos_control.platform_contact_inquiries
            (id, reference, name, email, phone, institution, role, country, inquiry_type,
             subject, status, priority, consent, source, last_message_at, created_at, updated_at)
          VALUES
            (${inquiryId}::uuid, ${reference}, ${data.name}, ${data.email}, ${data.phone || null},
             ${data.institution}, ${data.role || null}, ${data.country || null}, ${data.inquiryType},
             ${subject}, 'NEW', 'NORMAL', ${data.consent}, 'PUBLIC_CONTACT', now(), now(), now())
        `,
        prisma.$executeRaw`
          INSERT INTO campusos_control.platform_contact_messages
            (id, inquiry_id, direction, author_user_id, sender_email, recipient_email,
             subject, body_text, delivery_status, created_at)
          VALUES
            (${messageId}::uuid, ${inquiryId}::uuid, 'INBOUND', NULL, ${data.email}, ${recipient},
             ${subject}, ${data.message}, 'RECEIVED', now())
        `,
      ]);
    } catch (storageError) {
      console.error('Contact enquiry could not be saved to the company inbox:', storageError);
      return NextResponse.json(
        { error: 'Contact intake is temporarily unavailable. Please try again later.' },
        { status: 503 },
      );
    }

    // The database inbox is the durable source of truth. SMTP notification is
    // best-effort: a temporary mail outage must not lose a valid customer lead.
    try {
      await sendContactNotificationMail(data, reference);
    } catch (mailError) {
      console.error(`Contact enquiry ${reference} was saved but notification email failed:`, mailError);
    }

    return NextResponse.json(
      {
        success: true,
        reference,
        message: `Your enquiry has been received. Reference: ${reference}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    console.error('Contact request failed:', error);
    return NextResponse.json({ error: 'Unable to submit your enquiry right now. Please try again later.' }, { status: 500 });
  }
}
