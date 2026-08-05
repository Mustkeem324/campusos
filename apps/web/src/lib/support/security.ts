import crypto from 'crypto';

import type { SupportCategory, SupportPriority } from './types';

const PASSWORD_PATTERN = /\b(password|passwd|pwd)\s*[:=]\s*\S+/gi;
const OTP_PATTERN = /\b(otp|one[- ]time password|verification code)\s*[:=]?\s*\d{4,8}\b/gi;
const TOKEN_PATTERN = /\b(access[_ -]?token|refresh[_ -]?token|api[_ -]?key|bearer)\s*[:=]\s*[A-Za-z0-9._~+\/-]{12,}\b/gi;
const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;
const PROMPT_INJECTION_PATTERN = /(ignore (all|any|the) previous|reveal (the )?(system|developer) prompt|print environment variables|show all tickets|execute (a )?database|change user permissions|bypass tenant)/i;

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function generateSupportReference(now = new Date()): string {
  const random = crypto.randomBytes(5).toString('base64url').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const suffix = random.padEnd(7, 'X').slice(0, 7);
  return `SUP-${now.getUTCFullYear()}-${suffix}`;
}

export function safeRequestId(): string {
  return crypto.randomBytes(10).toString('hex');
}

export function redactSensitiveContent(value: string): {
  content: string;
  redacted: boolean;
  blocked: boolean;
} {
  const blocked = PROMPT_INJECTION_PATTERN.test(value);
  let content = value;
  const initial = content;

  content = content
    .replace(PASSWORD_PATTERN, '$1=[REDACTED]')
    .replace(OTP_PATTERN, '$1 [REDACTED]')
    .replace(TOKEN_PATTERN, '$1=[REDACTED]')
    .replace(CARD_PATTERN, (candidate) => {
      const digits = candidate.replace(/\D/g, '');
      return digits.length >= 13 && digits.length <= 19 ? '[PAYMENT_DATA_REDACTED]' : candidate;
    });

  return {
    content: blocked
      ? 'This message contained instructions that cannot be processed by the support assistant. Please describe the CampusOS issue without requesting hidden prompts, credentials, cross-tenant data or administrative actions.'
      : content,
    redacted: content !== initial,
    blocked,
  };
}

export function supportPriorityForCategory(category: SupportCategory): SupportPriority {
  switch (category) {
    case 'SECURITY_REPORT':
      return 'CRITICAL';
    case 'DATA_PRIVACY':
      return 'URGENT';
    case 'ACCOUNT_ACCESS':
    case 'BILLING_ENQUIRY':
    case 'TECHNICAL_SUPPORT':
      return 'HIGH';
    default:
      return 'NORMAL';
  }
}

export function supportTeamForCategory(category: SupportCategory): string {
  switch (category) {
    case 'SECURITY_REPORT':
      return 'SECURITY_RESPONSE';
    case 'DATA_PRIVACY':
      return 'PRIVACY_TEAM';
    case 'BILLING_ENQUIRY':
      return 'BILLING_SUPPORT';
    case 'INSTITUTION_ONBOARDING':
    case 'PRODUCT_ENQUIRY':
    case 'PARTNERSHIP':
      return 'INSTITUTION_SUCCESS';
    case 'CAREERS':
      return 'RECRUITMENT';
    case 'ACCOUNT_ACCESS':
      return 'IDENTITY_SUPPORT';
    case 'TECHNICAL_SUPPORT':
      return 'TECHNICAL_SUPPORT';
    default:
      return 'GENERAL_SUPPORT';
  }
}

export function safeClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim().slice(0, 80) || 'unknown';
  return headers.get('x-real-ip')?.slice(0, 80) || 'unknown';
}

export function constantTimeTokenEquals(rawToken: string, expectedHash: string): boolean {
  const actual = Buffer.from(sha256(rawToken), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
