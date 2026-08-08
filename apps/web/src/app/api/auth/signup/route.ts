import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { generateRandomToken, hashPassword } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { hashOneTimeToken } from '../../../../lib/phase7';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../../lib/public-rate-limit';

const SIGNUP_BODY_LIMIT_BYTES = 32 * 1024;
const signupSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  institutionType: z.string().trim().max(80).default(''),
  country: z.string().trim().max(80).default(''),
  city: z.string().trim().max(120).default(''),
  officialEmail: z.string().trim().email().max(254),
  campuses: z.string().trim().max(20).default('1'),
  students: z.string().trim().max(40).default(''),
  currentErp: z.string().trim().max(160).default(''),
  contactFirstName: z.string().trim().min(1).max(80),
  contactLastName: z.string().trim().min(1).max(80),
  contactRole: z.string().trim().max(120).default(''),
  contactPhone: z.string().trim().max(40).default(''),
  modules: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  deploymentType: z.enum(['saas', 'onprem']).default('saas'),
  consent: z.literal(true),
});

function workspaceSlug(legalName: string) {
  return legalName
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function POST(request: Request) {
  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({ key: `signup:${ipAddress}`, limit: 5, windowMs: 60 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const payload = signupSchema.parse(await readJsonWithLimit(request, SIGNUP_BODY_LIMIT_BYTES));
    const officialEmail = payload.officialEmail.toLowerCase();
    const baseSubdomain = workspaceSlug(payload.legalName);
    if (!baseSubdomain) {
      return NextResponse.json({ error: 'Institution name must contain letters or numbers.' }, { status: 400 });
    }

    // Preserve the existing product rule that one public institution-admin
    // registration email cannot silently bootstrap several unrelated tenants.
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: officialEmail, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    let subdomain = baseSubdomain;
    const existingWorkspace = await prisma.institution.findUnique({
      where: { subdomain },
      select: { id: true },
    });
    if (existingWorkspace) {
      subdomain = `${baseSubdomain.slice(0, 40)}-${generateRandomToken(3)}`;
    }

    const institutionCode = `NAV-${generateRandomToken(4).toUpperCase()}`;
    const temporaryPasswordHash = await hashPassword(generateRandomToken(32));
    const verificationToken = generateRandomToken(32);
    const storedVerificationToken = hashOneTimeToken(verificationToken);
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const activationUrl = `${origin}/activate-account?token=${encodeURIComponent(verificationToken)}`;

    const institution = await prisma.$transaction(async (tx) => {
      const inst = await tx.institution.create({
        data: {
          name: payload.legalName,
          code: institutionCode,
          subdomain,
          status: 'EMAIL_VERIFICATION_PENDING',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: inst.id,
          email: officialEmail,
          phone: payload.contactPhone || null,
          passwordHash: temporaryPasswordHash,
          name: `${payload.contactFirstName} ${payload.contactLastName}`.trim(),
          role: 'INSTITUTION_ADMIN',
          isActive: false,
          verificationToken: storedVerificationToken,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: inst.id,
          userId: user.id,
          action: 'INSTITUTION_SIGNUP',
          entity: 'Institution',
          diffJson: JSON.stringify({
            country: payload.country,
            city: payload.city,
            students: payload.students,
            campuses: payload.campuses,
            institutionType: payload.institutionType,
            contactRole: payload.contactRole,
            currentErp: payload.currentErp,
            modules: payload.modules,
            deploymentType: payload.deploymentType,
          }),
          ipAddress,
        },
      });

      // Queue activation atomically with account creation. A registration is not
      // considered successfully created if the activation instruction cannot be
      // persisted for delivery.
      await tx.emailQueue.create({
        data: {
          tenantId: inst.id,
          to: officialEmail,
          subject: 'Activate your Navemora institution account',
          type: 'ACCOUNT_ACTIVATION',
          body: [
            '<h2>Activate your institution account</h2>',
            '<p>Your institution registration was received.</p>',
            `<p><a href="${activationUrl}">Set your password and activate your account</a></p>`,
            '<p>If you did not submit this registration, you can ignore this email.</p>',
          ].join(''),
        },
      });

      return inst;
    });

    return NextResponse.json({ success: true, institutionId: institution.id });
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    }
    if (error instanceof InvalidJsonError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid registration details.' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'That email or workspace is already registered. Please retry or contact support.' },
        { status: 409 },
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
