import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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
  website: z.string().max(0).optional().default(''),
});

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass || !to || !from || !Number.isFinite(port)) return null;

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user, pass },
    to,
    from,
  };
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = contactSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please review the form fields and try again.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Honeypot: bots often fill hidden website fields. Return a neutral success
    // response so the endpoint does not become a bot-feedback oracle.
    if (data.website) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const config = smtpConfig();
    if (!config) {
      console.error('Contact endpoint is missing SMTP_HOST/SMTP_USER/SMTP_PASS/CONTACT_TO_EMAIL configuration.');
      return NextResponse.json(
        { error: 'Contact delivery is temporarily unavailable. Please try again later.' },
        { status: 503 },
      );
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: true,
      maxConnections: 3,
    });

    const subject = `[CampusOS ${data.inquiryType}] ${data.institution} — ${data.name}`;
    const lines = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || 'Not provided'}`,
      `Institution: ${data.institution}`,
      `Role: ${data.role || 'Not provided'}`,
      `Country/Region: ${data.country || 'Not provided'}`,
      `Inquiry type: ${data.inquiryType}`,
      '',
      data.message,
    ];

    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: data.email,
      subject,
      text: lines.join('\n'),
      html: `
        <h2>New CampusOS enquiry</h2>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(data.name)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(data.email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(data.phone || 'Not provided')}</td></tr>
          <tr><td><strong>Institution</strong></td><td>${escapeHtml(data.institution)}</td></tr>
          <tr><td><strong>Role</strong></td><td>${escapeHtml(data.role || 'Not provided')}</td></tr>
          <tr><td><strong>Country/Region</strong></td><td>${escapeHtml(data.country || 'Not provided')}</td></tr>
          <tr><td><strong>Inquiry type</strong></td><td>${escapeHtml(data.inquiryType)}</td></tr>
        </table>
        <h3>Message</h3>
        <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
      `,
    });

    return NextResponse.json({ success: true, message: 'Your message has been sent to the CampusOS team.' }, { status: 201 });
  } catch (error) {
    console.error('Contact request failed:', error);
    return NextResponse.json({ error: 'Unable to send your message right now. Please try again later.' }, { status: 500 });
  }
}
