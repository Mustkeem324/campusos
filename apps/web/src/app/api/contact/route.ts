import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

type SmtpConfig = NonNullable<ReturnType<typeof smtpConfig>>;
type SmtpTransporter = ReturnType<typeof nodemailer.createTransport>;

let sharedTransporter: SmtpTransporter | null = null;
let sharedTransporterKey = '';

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || user;
  const to = process.env.CONTACT_TO_EMAIL || user || from;

  if (!host || !from || !to || !Number.isFinite(port)) return null;
  if ((user && !pass) || (!user && pass)) return null;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: user && pass ? { user, pass } : undefined,
    from,
    to,
  };
}

function getTransporter(config: SmtpConfig) {
  const key = JSON.stringify([config.host, config.port, config.secure, config.auth?.user || '', config.from]);
  if (sharedTransporter && sharedTransporterKey === key) return sharedTransporter;

  if (sharedTransporter && typeof sharedTransporter.close === 'function') {
    sharedTransporter.close();
  }

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
    // field caused rejection.
    if (data.website) return NextResponse.json({ success: true }, { status: 202 });

    const config = smtpConfig();
    if (!config) {
      console.error('Contact endpoint SMTP configuration is incomplete.');
      return NextResponse.json({ error: 'Contact delivery is temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    const transporter = getTransporter(config);
    const subject = `[CampusOS ${data.inquiryType}] ${singleLine(data.institution)} — ${singleLine(data.name)}`;
    const text = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || 'Not provided'}`,
      `Institution: ${data.institution}`,
      `Role: ${data.role || 'Not provided'}`,
      `Country/Region: ${data.country || 'Not provided'}`,
      `Inquiry type: ${data.inquiryType}`,
      '',
      data.message,
    ].join('\n');

    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: data.email,
      subject,
      text,
      html: `<h2>New CampusOS enquiry</h2><table cellpadding="6" cellspacing="0" style="border-collapse:collapse"><tr><td><strong>Name</strong></td><td>${escapeHtml(data.name)}</td></tr><tr><td><strong>Email</strong></td><td>${escapeHtml(data.email)}</td></tr><tr><td><strong>Phone</strong></td><td>${escapeHtml(data.phone || 'Not provided')}</td></tr><tr><td><strong>Institution</strong></td><td>${escapeHtml(data.institution)}</td></tr><tr><td><strong>Role</strong></td><td>${escapeHtml(data.role || 'Not provided')}</td></tr><tr><td><strong>Country/Region</strong></td><td>${escapeHtml(data.country || 'Not provided')}</td></tr><tr><td><strong>Inquiry type</strong></td><td>${escapeHtml(data.inquiryType)}</td></tr></table><h3>Message</h3><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>`,
    });

    return NextResponse.json({ success: true, message: 'Your message has been sent to the CampusOS team.' }, { status: 201 });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    console.error('Contact request failed:', error);
    return NextResponse.json({ error: 'Unable to send your message right now. Please try again later.' }, { status: 500 });
  }
}
