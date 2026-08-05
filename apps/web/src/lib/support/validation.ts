import { z } from 'zod';

import {
  SUPPORT_CATEGORIES,
  SUPPORT_CONTACT_METHODS,
  SUPPORT_LOCALES,
  SUPPORT_REQUESTER_TYPES,
} from './types';

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const UNSAFE_HTML = /<\s*script|<\s*iframe|on\w+\s*=|javascript:/i;
const HEADER_INJECTION = /[\r\n]/;
const URL_PATTERN = /https?:\/\//gi;

const safeText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .refine((value) => !CONTROL_CHARACTERS.test(value), 'Control characters are not allowed.')
    .refine((value) => !UNSAFE_HTML.test(value), 'Scripts or unsafe HTML are not allowed.');

const optionalSafeText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .refine((value) => !CONTROL_CHARACTERS.test(value), 'Control characters are not allowed.')
    .optional()
    .or(z.literal(''));

export const supportRequestSchema = z
  .object({
    fullName: safeText(2, 120),
    email: z
      .string()
      .trim()
      .min(3)
      .max(254)
      .email()
      .refine((value) => !HEADER_INJECTION.test(value), 'Invalid email address.'),
    phone: optionalSafeText(32),
    institutionName: safeText(2, 180),
    institutionCode: optionalSafeText(64),
    requesterType: z.enum(SUPPORT_REQUESTER_TYPES),
    category: z.enum(SUPPORT_CATEGORIES),
    subject: safeText(4, 180),
    message: safeText(12, 5000).refine(
      (value) => (value.match(URL_PATTERN) ?? []).length <= 5,
      'Too many links were included.',
    ),
    preferredContactMethod: z.enum(SUPPORT_CONTACT_METHODS),
    preferredLocale: z.enum(SUPPORT_LOCALES),
    consent: z.literal(true),
    consentVersion: z.string().trim().min(1).max(40),
    source: z.string().trim().min(1).max(80),
    website: z.string().max(0).optional().or(z.literal('')),
    startedAt: z.number().int().positive(),
  })
  .strict();

export const chatMessageSchema = z
  .object({
    message: safeText(1, 2000).refine(
      (value) => (value.match(URL_PATTERN) ?? []).length <= 4,
      'Too many links were included.',
    ),
    locale: z.enum(SUPPORT_LOCALES).default('en-IN'),
  })
  .strict();

export const chatConversationSchema = z
  .object({
    locale: z.enum(SUPPORT_LOCALES).default('en-IN'),
  })
  .strict();

export const handoffSchema = z
  .object({
    fullName: safeText(2, 120),
    email: z.string().trim().max(254).email(),
    institutionName: safeText(2, 180),
    category: z.enum(SUPPORT_CATEGORIES),
    subject: safeText(4, 180),
    consent: z.literal(true),
  })
  .strict();

export const adminTicketUpdateSchema = z
  .object({
    status: z
      .enum([
        'NEW',
        'ACKNOWLEDGED',
        'OPEN',
        'IN_PROGRESS',
        'WAITING_FOR_CUSTOMER',
        'WAITING_FOR_INTERNAL_TEAM',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
        'SPAM',
        'ARCHIVED',
      ])
      .optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    assignedAgentId: z.string().uuid().nullable().optional(),
    assignedTeam: z.string().trim().min(2).max(80).optional(),
    publicReply: safeText(2, 5000).optional(),
    internalNote: safeText(2, 5000).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.status !== undefined ||
      value.priority !== undefined ||
      value.assignedAgentId !== undefined ||
      value.assignedTeam !== undefined ||
      value.publicReply !== undefined ||
      value.internalNote !== undefined,
    'At least one supported update is required.',
  );

export function normalizeEmail(value: string): string {
  const trimmed = value.trim();
  const separator = trimmed.lastIndexOf('@');
  if (separator <= 0 || separator === trimmed.length - 1) return trimmed;
  return `${trimmed.slice(0, separator)}@${trimmed.slice(separator + 1).toLowerCase()}`;
}

export function validateCompletionTime(startedAt: number, now = Date.now()): boolean {
  const elapsed = now - startedAt;
  return elapsed >= 1800 && elapsed <= 24 * 60 * 60 * 1000;
}
