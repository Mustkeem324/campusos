#!/usr/bin/env node

import os from 'node:os';
import process from 'node:process';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const workerId = process.env.NAVEMORA_COMMUNICATION_WORKER_ID || `${os.hostname()}:${process.pid}`;
const pollMs = Math.min(60_000, Math.max(500, Number(process.env.NAVEMORA_COMMUNICATION_WORKER_POLL_MS || 1500)));
const concurrency = Math.min(50, Math.max(1, Number(process.env.NAVEMORA_COMMUNICATION_WORKER_CONCURRENCY || 5)));
const mode = (process.env.CAMPUSOS_COMMUNICATION_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'development')).toLowerCase();
let stopping = false;

const transientCodes = new Set(['PROVIDER_UNAVAILABLE','RATE_LIMITED','NETWORK_ERROR','TIMEOUT','PROVIDER_5XX']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function valueAtPath(input, path) {
  let current = input;
  for (const part of String(path).split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return '';
    current = current[part];
  }
  return current ?? '';
}

function renderText(template, variables) {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, path) => String(valueAtPath(variables, path) ?? ''));
}

function renderHtmlText(template, variables) {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, path) => escapeHtml(valueAtPath(variables, path)));
}

function safeOriginUrl(pathOrUrl) {
  const origin = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
  try {
    const base = new URL(origin);
    const candidate = new URL(pathOrUrl || '/', base);
    return candidate.origin === base.origin && ['http:','https:'].includes(candidate.protocol) ? candidate.toString() : base.toString();
  } catch {
    return origin;
  }
}

function emailHtml({ institutionName, logoUrl, primaryColor, title, body, ctaLabel, ctaPath }) {
  const primary = /^#[0-9a-f]{6}$/i.test(primaryColor || '') ? primaryColor : '#164A9C';
  const logo = logoUrl ? `<img src="${escapeHtml(logoUrl)}" width="120" alt="${escapeHtml(institutionName)}" style="display:block;max-width:120px;height:auto;border:0">` : `<div style="font-size:19px;font-weight:800;color:#081B3A">${escapeHtml(institutionName)}</div>`;
  const cta = ctaLabel ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:8px;background:${primary}"><a href="${escapeHtml(safeOriginUrl(ctaPath))}" style="display:inline-block;padding:13px 20px;color:#fff;text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(ctaLabel)}</a></td></tr></table>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#24324a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border:1px solid #e5eaf1"><tr><td style="padding:28px 32px;border-bottom:1px solid #edf1f5">${logo}</td></tr><tr><td style="padding:32px"><h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;color:#081B3A">${escapeHtml(title)}</h1><p style="font-size:15px;line-height:1.7;color:#526078">${renderHtmlText(body, {})}</p>${cta}<div style="margin-top:28px;padding-top:20px;border-top:1px solid #edf1f5;font-size:12px;line-height:1.6;color:#738095">For sensitive academic, finance, payroll or examination details, use only the authenticated NAVEMORA portal.</div></td></tr><tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #edf1f5;font-size:11px;color:#7a8699">Operational communication sent through NAVEMORA on behalf of ${escapeHtml(institutionName)}.</td></tr></table></td></tr></table></body></html>`;
}

function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!domain) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

function maskPhone(phone) {
  const value = String(phone || '').replace(/\s+/g, '');
  return value.length < 4 ? '***' : `${value.slice(0, Math.min(3, value.length - 4))}******${value.slice(-4)}`;
}

async function ensureReady() {
  const rows = await prisma.$queryRawUnsafe("SELECT to_regclass('campusos_communications.messages')::text AS messages, to_regclass('campusos_communications.usage_ledger')::text AS usage");
  if (!rows[0]?.messages || !rows[0]?.usage) throw new Error('NAVEMORA communications storage is not provisioned.');
}

async function releaseExpiredLeases() {
  await prisma.$executeRawUnsafe(`
    UPDATE campusos_communications.messages
    SET status='RETRYING', lease_owner=NULL, leased_until=NULL, next_attempt_at=now(), updated_at=now()
    WHERE status='PROCESSING' AND leased_until < now()
  `);
}

async function claimMessage() {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRawUnsafe(`
      SELECT m.id, m.tenant_id, m.communication_event_id, m.template_version_id,
             m.channel, m.category, m.classification, m.recipient_user_id, m.recipient_type,
             m.subject_snapshot, m.variables, m.attempt_count, m.max_attempts,
             i.name AS institution_name, i.logoUrl AS institution_logo_url, i.primaryColor AS institution_primary_color,
             u.email, u.phone,
             ce.event_type,
             tv.subject_template, tv.preheader_template, tv.html_template, tv.text_template, tv.provider_template_name,
             t.template_key
      FROM campusos_communications.messages m
      JOIN public.institutions i ON i.id=m.tenant_id
      LEFT JOIN public.users u ON u.id=m.recipient_user_id AND u.tenant_id=m.tenant_id
      LEFT JOIN campusos_communications.communication_events ce ON ce.id=m.communication_event_id
      LEFT JOIN campusos_communications.template_versions tv ON tv.id=m.template_version_id
      LEFT JOIN campusos_communications.templates t ON t.id=tv.template_id
      WHERE m.status IN ('PENDING','RETRYING','SCHEDULED')
        AND m.next_attempt_at <= now()
        AND (m.scheduled_at IS NULL OR m.scheduled_at <= now())
        AND (m.leased_until IS NULL OR m.leased_until < now())
      ORDER BY CASE WHEN m.category='EMERGENCY' THEN 0 WHEN m.category='SECURITY' THEN 1 ELSE 2 END,
               COALESCE(m.scheduled_at, m.queued_at), m.created_at
      FOR UPDATE OF m SKIP LOCKED
      LIMIT 1
    `);
    const job = rows[0];
    if (!job) return null;
    await tx.$executeRawUnsafe(
      `UPDATE campusos_communications.messages
       SET status='PROCESSING', lease_owner=$1, leased_until=now()+interval '90 seconds', attempt_count=attempt_count+1, updated_at=now()
       WHERE id=$2::uuid`,
      workerId,
      job.id,
    );
    job.attempt_count = Number(job.attempt_count || 0) + 1;
    job.max_attempts = Number(job.max_attempts || 6);
    return job;
  });
}

async function activeProvider(job) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(cs.provider_key, pa.provider_key) AS provider_key,
            COALESCE(pa.config, '{}'::jsonb) AS provider_config,
            COALESCE(pa.status, CASE WHEN cs.provider_key IS NULL THEN 'MISCONFIGURED' ELSE 'AVAILABLE' END) AS provider_status,
            cs.regulatory_config
     FROM campusos_communications.channel_settings cs
     LEFT JOIN LATERAL (
       SELECT provider_key, config, status
       FROM campusos_communications.provider_accounts p
       WHERE p.channel=cs.channel
         AND (p.tenant_id=cs.tenant_id OR (p.tenant_id IS NULL AND p.scope='PLATFORM'))
         AND p.status IN ('AVAILABLE','DEGRADED')
       ORDER BY (p.tenant_id=cs.tenant_id) DESC, p.is_primary DESC, p.updated_at DESC
       LIMIT 1
     ) pa ON true
     WHERE cs.tenant_id=$1::uuid AND cs.channel=$2 AND cs.enabled=true LIMIT 1`,
    job.tenant_id,
    job.channel,
  );
  const row = rows[0];
  if (!row) throw providerError('TENANT_CHANNEL_DISABLED', `${job.channel} is not enabled for the institution.`, false);
  return row;
}

function providerError(code, message, transient = false) {
  const error = new Error(message);
  error.code = code;
  error.transient = transient;
  return error;
}

async function resolveTemplate(job) {
  const vars = job.variables && typeof job.variables === 'object' ? job.variables : {};
  let subject = job.subject_template ? renderText(job.subject_template, vars) : String(job.subject_snapshot || 'NAVEMORA notification');
  subject = subject.replace(/[\r\n]+/g, ' ').slice(0, 200);
  let text = job.text_template ? renderText(job.text_template, vars) : genericText(job, vars);
  let html = job.html_template ? renderHtmlText(job.html_template, vars) : emailHtml({
    institutionName: job.institution_name,
    logoUrl: job.institution_logo_url,
    primaryColor: job.institution_primary_color,
    title: subject,
    body: text,
    ctaLabel: 'Open NAVEMORA',
    ctaPath: defaultCta(job.event_type),
  });
  if (job.html_template) html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#24324a">${html}</div>`;
  return { subject, text: text.slice(0, 20000), html, providerTemplateName: job.provider_template_name || null };
}

function genericText(job, vars) {
  const event = String(job.event_type || 'NOTIFICATION').replaceAll('_', ' ').toLowerCase();
  const studentName = valueAtPath(vars, 'student.name');
  const prefix = studentName ? `${studentName}: ` : '';
  return `${prefix}${event}. Sign in to NAVEMORA to view the authoritative details from your institution.`;
}

function defaultCta(eventType) {
  const event = String(eventType || '');
  if (event.includes('ATTENDANCE')) return '/attendance';
  if (event.includes('EXAM') || event.includes('RESULT') || event.includes('GRADE') || event.includes('CGPA')) return event.includes('RESULT') || event.includes('GRADE') || event.includes('CGPA') ? '/results' : '/examinations';
  if (event.includes('PAYMENT') || event.includes('FEE') || event.includes('INVOICE') || event.includes('REFUND') || event.includes('SCHOLARSHIP')) return '/payments';
  if (event.includes('HOSTEL') || event.includes('OUTPASS')) return '/hostel';
  if (event.includes('TRANSPORT') || event.includes('BUS') || event.includes('ROUTE')) return '/transport';
  if (event.includes('LIBRARY') || event.includes('LOAN') || event.includes('RESERVATION')) return '/library';
  if (event.includes('RESEARCH') || event.includes('THESIS') || event.includes('VIVA') || event.includes('MILESTONE')) return '/research';
  if (event.includes('HELPDESK')) return '/helpdesk';
  return '/notifications';
}

async function sendEmail(job, provider, rendered) {
  if (!job.email) throw providerError('INVALID_RECIPIENT', 'Recipient has no email address.', false);
  const providerKey = String(provider.provider_key || process.env.NAVEMORA_EMAIL_PROVIDER || 'SMTP').toUpperCase();
  const from = process.env.NAVEMORA_EMAIL_FROM || process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || 'NAVEMORA <noreply@navemora.local>';
  const replyTo = process.env.NAVEMORA_EMAIL_REPLY_TO || undefined;

  if (mode === 'development' || providerKey === 'SMTP') {
    const transport = nodemailer.createTransport({
      host: process.env.NAVEMORA_SMTP_HOST || process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.NAVEMORA_SMTP_PORT || process.env.SMTP_PORT || 1025),
      secure: String(process.env.NAVEMORA_SMTP_SECURE || process.env.SMTP_SECURE || 'false') === 'true',
      auth: (process.env.NAVEMORA_SMTP_USER || process.env.SMTP_USER) ? {
        user: process.env.NAVEMORA_SMTP_USER || process.env.SMTP_USER,
        pass: process.env.NAVEMORA_SMTP_PASSWORD || process.env.SMTP_PASS,
      } : undefined,
    });
    const result = await transport.sendMail({ from, replyTo, to: job.email, subject: rendered.subject, text: rendered.text, html: rendered.html });
    return { providerKey: mode === 'development' ? 'MAILHOG' : 'SMTP', providerReference: result.messageId, maskedDestination: maskEmail(job.email), submitted: true };
  }

  if (providerKey === 'RESEND') {
    const key = process.env.RESEND_API_KEY || process.env.NAVEMORA_RESEND_API_KEY;
    if (!key) throw providerError('PROVIDER_UNAVAILABLE', 'Resend API key is not configured.', false);
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${key}` }, body: JSON.stringify({ from, to:[job.email], subject:rendered.subject, html:rendered.html, text:rendered.text, reply_to:replyTo }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw httpProviderError(response.status, body?.message || 'Resend rejected the email.');
    return { providerKey:'RESEND', providerReference:String(body.id || crypto.randomUUID()), maskedDestination:maskEmail(job.email), submitted:true };
  }

  if (providerKey === 'SENDGRID') {
    const key = process.env.SENDGRID_API_KEY || process.env.NAVEMORA_SENDGRID_API_KEY;
    if (!key) throw providerError('PROVIDER_UNAVAILABLE', 'SendGrid API key is not configured.', false);
    const parsedFrom = parseMailbox(from);
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${key}` }, body:JSON.stringify({ personalizations:[{to:[{email:job.email}]}], from:parsedFrom, reply_to:replyTo ? {email:replyTo}:undefined, subject:rendered.subject, content:[{type:'text/plain',value:rendered.text},{type:'text/html',value:rendered.html}] }) });
    if (!response.ok) throw httpProviderError(response.status, await response.text());
    return { providerKey:'SENDGRID', providerReference:response.headers.get('x-message-id') || crypto.randomUUID(), maskedDestination:maskEmail(job.email), submitted:true };
  }

  if (providerKey === 'POSTMARK') {
    const key = process.env.POSTMARK_SERVER_TOKEN || process.env.NAVEMORA_POSTMARK_SERVER_TOKEN;
    if (!key) throw providerError('PROVIDER_UNAVAILABLE', 'Postmark token is not configured.', false);
    const response = await fetch('https://api.postmarkapp.com/email', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Postmark-Server-Token':key }, body:JSON.stringify({ From:from, To:job.email, Subject:rendered.subject, TextBody:rendered.text, HtmlBody:rendered.html, ReplyTo:replyTo }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ErrorCode) throw httpProviderError(response.status || 400, body.Message || 'Postmark rejected the email.');
    return { providerKey:'POSTMARK', providerReference:String(body.MessageID || crypto.randomUUID()), maskedDestination:maskEmail(job.email), submitted:true };
  }

  throw providerError('PROVIDER_UNAVAILABLE', `Unsupported email provider ${providerKey}.`, false);
}

async function sendSms(job, provider, rendered) {
  if (!job.phone) throw providerError('INVALID_RECIPIENT', 'Recipient has no verified phone destination.', false);
  const providerKey = String(provider.provider_key || process.env.NAVEMORA_SMS_PROVIDER || '').toUpperCase();
  const message = rendered.text.slice(0, 1600);
  if (mode === 'development') {
    console.log(JSON.stringify({ event:'communication_test_sms', messageId:job.id, destination:maskPhone(job.phone), body:message }));
    return { providerKey:'DEVELOPMENT_SMS_SINK', providerReference:`dev-sms-${job.id}`, maskedDestination:maskPhone(job.phone), submitted:true, simulated:true };
  }
  if (!providerKey) throw providerError('PROVIDER_UNAVAILABLE', 'SMS provider is not configured.', false);

  if (providerKey === 'TWILIO') {
    const sid = process.env.TWILIO_ACCOUNT_SID || process.env.NAVEMORA_TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN || process.env.NAVEMORA_TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_SMS_FROM || process.env.NAVEMORA_SMS_FROM;
    if (!sid || !token || !from) throw providerError('SMS_CONFIGURATION_INCOMPLETE', 'Twilio SMS credentials/sender are incomplete.', false);
    const body = new URLSearchParams({ To:job.phone, From:from, Body:message });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, { method:'POST', headers:{ Authorization:`Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type':'application/x-www-form-urlencoded' }, body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw httpProviderError(response.status, result.message || 'Twilio rejected the SMS.');
    return { providerKey:'TWILIO', providerReference:String(result.sid || crypto.randomUUID()), maskedDestination:maskPhone(job.phone), submitted:true };
  }

  if (providerKey === 'MSG91') {
    const key = process.env.MSG91_AUTH_KEY || process.env.NAVEMORA_SMS_API_KEY;
    const templateId = provider.regulatory_config?.templateId || process.env.MSG91_TEMPLATE_ID;
    const senderId = provider.regulatory_config?.senderId || process.env.MSG91_SENDER_ID;
    if (!key || !templateId || !senderId) throw providerError('SMS_CONFIGURATION_INCOMPLETE', 'MSG91 regulatory/provider configuration is incomplete.', false);
    const response = await fetch('https://control.msg91.com/api/v5/flow/', { method:'POST', headers:{ 'Content-Type':'application/json', authkey:key }, body:JSON.stringify({ template_id:templateId, sender:senderId, short_url:'0', mobiles:job.phone.replace(/^\+/, ''), message }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || String(result.type || '').toLowerCase() === 'error') throw httpProviderError(response.status || 400, result.message || 'MSG91 rejected the SMS.');
    return { providerKey:'MSG91', providerReference:String(result.request_id || result.requestId || crypto.randomUUID()), maskedDestination:maskPhone(job.phone), submitted:true };
  }

  throw providerError('PROVIDER_UNAVAILABLE', `Unsupported SMS provider ${providerKey}.`, false);
}

async function sendWhatsApp(job, provider, rendered) {
  if (!job.phone) throw providerError('INVALID_RECIPIENT', 'Recipient has no WhatsApp phone destination.', false);
  const providerKey = String(provider.provider_key || process.env.NAVEMORA_WHATSAPP_PROVIDER || '').toUpperCase();
  if (mode === 'development') {
    console.log(JSON.stringify({ event:'communication_test_whatsapp', messageId:job.id, destination:maskPhone(job.phone), body:rendered.text.slice(0, 2000) }));
    return { providerKey:'DEVELOPMENT_WHATSAPP_SINK', providerReference:`dev-wa-${job.id}`, maskedDestination:maskPhone(job.phone), submitted:true, simulated:true };
  }
  if (!providerKey) throw providerError('PROVIDER_UNAVAILABLE', 'WhatsApp provider is not configured.', false);

  if (providerKey === 'META' || providerKey === 'META_WHATSAPP') {
    const token = process.env.NAVEMORA_WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.NAVEMORA_WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const template = rendered.providerTemplateName || provider.regulatory_config?.templateName;
    const language = provider.regulatory_config?.language || 'en';
    if (!token || !phoneId || !template) throw providerError('WHATSAPP_TEMPLATE_NOT_CONFIGURED', 'Meta WhatsApp approved template mapping is incomplete.', false);
    const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(phoneId)}/messages`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ messaging_product:'whatsapp', to:job.phone.replace(/^\+/, ''), type:'template', template:{ name:template, language:{code:language} } }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw httpProviderError(response.status, result.error?.message || 'WhatsApp provider rejected the template message.');
    return { providerKey:'META_WHATSAPP', providerReference:String(result.messages?.[0]?.id || crypto.randomUUID()), maskedDestination:maskPhone(job.phone), submitted:true };
  }

  if (providerKey === 'TWILIO') {
    const sid = process.env.TWILIO_ACCOUNT_SID || process.env.NAVEMORA_TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN || process.env.NAVEMORA_TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM || process.env.NAVEMORA_WHATSAPP_FROM;
    if (!sid || !token || !from) throw providerError('WHATSAPP_CONFIGURATION_INCOMPLETE', 'Twilio WhatsApp credentials/sender are incomplete.', false);
    const body = new URLSearchParams({ To:`whatsapp:${job.phone}`, From:from.startsWith('whatsapp:') ? from : `whatsapp:${from}`, Body:rendered.text.slice(0, 4000) });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, { method:'POST', headers:{ Authorization:`Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type':'application/x-www-form-urlencoded' }, body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw httpProviderError(response.status, result.message || 'Twilio WhatsApp rejected the message.');
    return { providerKey:'TWILIO_WHATSAPP', providerReference:String(result.sid || crypto.randomUUID()), maskedDestination:maskPhone(job.phone), submitted:true };
  }

  throw providerError('PROVIDER_UNAVAILABLE', `Unsupported WhatsApp provider ${providerKey}.`, false);
}

function parseMailbox(value) {
  const match = /^(.*?)<([^>]+)>$/.exec(value);
  return match ? { name:match[1].trim(), email:match[2].trim() } : { email:value.trim() };
}

function httpProviderError(status, detail) {
  if (status === 429) return providerError('RATE_LIMITED', String(detail).slice(0, 500), true);
  if (status >= 500) return providerError('PROVIDER_5XX', String(detail).slice(0, 500), true);
  return providerError('PROVIDER_REJECTED', String(detail).slice(0, 500), false);
}

async function submit(job) {
  const provider = await activeProvider(job);
  const rendered = await resolveTemplate(job);
  if (job.channel === 'EMAIL') return sendEmail(job, provider, rendered);
  if (job.channel === 'SMS') return sendSms(job, provider, rendered);
  if (job.channel === 'WHATSAPP') return sendWhatsApp(job, provider, rendered);
  throw providerError('PROVIDER_UNAVAILABLE', `Worker delivery for ${job.channel} is not configured.`, false);
}

async function settleSuccess(job, result) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO campusos_communications.message_attempts
        (tenant_id,message_id,attempt_no,provider_key,state,provider_reference,sanitized_response,finished_at)
       VALUES ($1::uuid,$2::uuid,$3,$4,'SUBMITTED',$5,$6::jsonb,now())
       ON CONFLICT (message_id,attempt_no) DO NOTHING`,
      job.tenant_id, job.id, job.attempt_count, result.providerKey, result.providerReference,
      JSON.stringify({ simulated:Boolean(result.simulated) }),
    );
    await tx.$executeRawUnsafe(
      `UPDATE campusos_communications.messages
       SET status='SUBMITTED', provider_key=$1, provider_reference=$2, masked_destination=$3,
           submitted_at=COALESCE(submitted_at,now()), lease_owner=NULL, leased_until=NULL, failure_code=NULL, failure_detail=NULL, updated_at=now()
       WHERE id=$4::uuid`,
      result.providerKey, result.providerReference, result.maskedDestination, job.id,
    );
    if (job.channel === 'SMS' || job.channel === 'WHATSAPP') {
      await tx.$executeRawUnsafe(
        `INSERT INTO campusos_communications.usage_ledger
          (tenant_id,message_id,channel,state,provider_key,billing_units,estimated_cost_minor,currency,provider_reference,metadata)
         SELECT tenant_id,id,channel,'SUBMITTED',$1,
                COALESCE((SELECT billing_units FROM campusos_communications.usage_ledger ul WHERE ul.message_id=id AND ul.state='RESERVED' ORDER BY created_at DESC LIMIT 1),1),
                COALESCE((SELECT estimated_cost_minor FROM campusos_communications.usage_ledger ul WHERE ul.message_id=id AND ul.state='RESERVED' ORDER BY created_at DESC LIMIT 1),0),
                COALESCE((SELECT currency FROM campusos_communications.usage_ledger ul WHERE ul.message_id=id AND ul.state='RESERVED' ORDER BY created_at DESC LIMIT 1),'INR'),
                $2,$3::jsonb
         FROM campusos_communications.messages WHERE id=$4::uuid`,
        result.providerKey, result.providerReference, JSON.stringify({ simulated:Boolean(result.simulated) }), job.id,
      );
      if (!result.simulated) {
        await tx.$executeRawUnsafe(
          `UPDATE campusos_communications.credit_wallets cw
           SET reserved_units=GREATEST(0,cw.reserved_units-COALESCE((SELECT billing_units FROM campusos_communications.usage_ledger ul WHERE ul.message_id=$1::uuid AND ul.state='RESERVED' ORDER BY created_at DESC LIMIT 1),0)),
               used_units=cw.used_units+COALESCE((SELECT billing_units FROM campusos_communications.usage_ledger ul WHERE ul.message_id=$1::uuid AND ul.state='RESERVED' ORDER BY created_at DESC LIMIT 1),0),
               updated_at=now()
           WHERE cw.tenant_id=$2::uuid AND cw.channel=$3`,
          job.id, job.tenant_id, job.channel,
        );
      }
    }
  });
}

async function settleFailure(job, error) {
  const code = String(error?.code || 'PROVIDER_ERROR');
  const detail = String(error?.message || 'Communication provider failed.').slice(0, 1000);
  const transient = Boolean(error?.transient) || transientCodes.has(code);
  const exhausted = job.attempt_count >= job.max_attempts;
  const retry = transient && !exhausted;
  const delaySeconds = Math.min(3600, Math.max(5, 2 ** Math.min(job.attempt_count, 10) * 5));

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO campusos_communications.message_attempts
        (tenant_id,message_id,attempt_no,provider_key,state,failure_code,sanitized_response,finished_at)
       VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6,$7::jsonb,now())
       ON CONFLICT (message_id,attempt_no) DO NOTHING`,
      job.tenant_id, job.id, job.attempt_count, 'UNAVAILABLE', retry ? 'RETRYING' : 'FAILED', code, JSON.stringify({ detail }),
    );
    await tx.$executeRawUnsafe(
      `UPDATE campusos_communications.messages
       SET status=$1, failure_code=$2, failure_detail=$3,
           failed_at=CASE WHEN $1 IN ('FAILED','DEAD_LETTER') THEN COALESCE(failed_at,now()) ELSE failed_at END,
           next_attempt_at=CASE WHEN $1='RETRYING' THEN now()+($4 || ' seconds')::interval ELSE next_attempt_at END,
           lease_owner=NULL, leased_until=NULL, updated_at=now()
       WHERE id=$5::uuid`,
      retry ? 'RETRYING' : exhausted ? 'DEAD_LETTER' : 'FAILED', code, detail, String(delaySeconds), job.id,
    );
    if (!retry && (job.channel === 'SMS' || job.channel === 'WHATSAPP')) {
      const reserved = await tx.$queryRawUnsafe(
        `SELECT billing_units,estimated_cost_minor,currency FROM campusos_communications.usage_ledger
         WHERE message_id=$1::uuid AND state='RESERVED' ORDER BY created_at DESC LIMIT 1`, job.id,
      );
      const units = Number(reserved[0]?.billing_units || 0);
      if (units > 0) {
        await tx.$executeRawUnsafe(
          `UPDATE campusos_communications.credit_wallets SET available_units=available_units+$1,reserved_units=GREATEST(0,reserved_units-$1),updated_at=now()
           WHERE tenant_id=$2::uuid AND channel=$3`, units, job.tenant_id, job.channel,
        );
        await tx.$executeRawUnsafe(
          `INSERT INTO campusos_communications.usage_ledger (tenant_id,message_id,channel,state,billing_units,estimated_cost_minor,currency,metadata)
           VALUES ($1::uuid,$2::uuid,$3,'REVERSED',$4,$5,$6,$7::jsonb)`,
          job.tenant_id,job.id,job.channel,units,Number(reserved[0]?.estimated_cost_minor || 0),reserved[0]?.currency || 'INR',JSON.stringify({ failureCode:code }),
        );
        await tx.$executeRawUnsafe(
          `INSERT INTO campusos_communications.credit_transactions (tenant_id,channel,transaction_type,units,reference_type,reference_id)
           VALUES ($1::uuid,$2,'RELEASE',$3,'MESSAGE',$4)`, job.tenant_id,job.channel,units,job.id,
        );
      }
    }
    if (exhausted) {
      await tx.$executeRawUnsafe(
        `INSERT INTO campusos_communications.dead_letter_messages (tenant_id,message_id,reason_code,sanitized_detail,retry_history)
         VALUES ($1::uuid,$2::uuid,$3,$4,'[]'::jsonb) ON CONFLICT(message_id) DO NOTHING`,
        job.tenant_id,job.id,code,detail,
      );
    }
  });
}

async function workOne() {
  const job = await claimMessage();
  if (!job) return false;
  try {
    const result = await submit(job);
    await settleSuccess(job, result);
  } catch (error) {
    await settleFailure(job, error);
  }
  return true;
}

async function loop() {
  await ensureReady();
  console.log(JSON.stringify({ event:'communication_worker_started', workerId, mode, concurrency }));
  while (!stopping) {
    await releaseExpiredLeases();
    const results = await Promise.all(Array.from({ length:concurrency }, () => workOne()));
    if (!results.some(Boolean)) await sleep(pollMs);
  }
}

for (const signal of ['SIGINT','SIGTERM']) {
  process.on(signal, () => { stopping = true; });
}

loop()
  .catch((error) => { console.error('Communication worker failed:', error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
