import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '../../../../lib/db';
import { hashPassword, generateRandomToken } from '../../../../lib/auth';
import { queueEmail } from '../../../../lib/email-service';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../../lib/public-rate-limit';

const SIGNUP_BODY_LIMIT_BYTES = 32 * 1024;
const SIGNUP_RATE_LIMIT_PER_IP = 5;
const SIGNUP_RATE_WINDOW_MS = 60 * 60_000; // 5 signups per hour per IP

export async function POST(request: Request) {
  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({
      key: `signup:${ipAddress}`,
      limit: SIGNUP_RATE_LIMIT_PER_IP,
      windowMs: SIGNUP_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await readJsonWithLimit(request, SIGNUP_BODY_LIMIT_BYTES);
    const payload =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : {};

    const {
      legalName,
      institutionType,
      country,
      city,
      officialEmail,
      campuses,
      students,
      currentErp,
      contactFirstName,
      contactLastName,
      contactRole,
      contactPhone,
      modules,
      deploymentType,
      consent,
    } = payload;

    if (
      typeof legalName !== 'string' ||
      typeof officialEmail !== 'string' ||
      typeof contactFirstName !== 'string' ||
      typeof contactLastName !== 'string' ||
      consent !== true
    ) {
      return NextResponse.json({ error: 'Missing required fields or consent' }, { status: 400 });
    }

    // Check if email is already in use globally (case-insensitive, matching
    // the login lookup so Admin@x.edu cannot double-register behind admin@x.edu)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: officialEmail.toLowerCase(), mode: 'insensitive' } },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Generate a slugified subdomain. Non-Latin institution names produce an
    // empty slug, so fall back to a deterministic pseudo-slug rather than
    // creating an institution with a blank subdomain.
    // Keep room for the dedup counter suffix within the 63-char workspace limit.
    let baseSubdomain = (legalName as string)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 56);
    if (!baseSubdomain) {
      baseSubdomain = `institution-${crypto.randomBytes(4).toString('hex')}`;
    }
    let subdomain = baseSubdomain;
    let counter = 1;

    while (true) {
      const existing = await prisma.institution.findUnique({ where: { subdomain } });
      if (!existing) break;
      subdomain = `${baseSubdomain}${counter}`;
      counter++;
    }

    // Create the institution code
    const institutionCode = subdomain.toUpperCase().substring(0, 10);
    // Temporary password until they set one via email activation
    const hashedPassword = await hashPassword(generateRandomToken(16));
    const verificationToken = generateRandomToken(32);

    const institution = await prisma.$transaction(async (tx) => {
      const inst = await tx.institution.create({
        data: {
          name: legalName as string,
          code: institutionCode,
          subdomain,
          status: 'EMAIL_VERIFICATION_PENDING',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: inst.id,
          email: officialEmail as string,
          phone: typeof contactPhone === 'string' ? contactPhone : null,
          passwordHash: hashedPassword,
          name: `${contactFirstName} ${contactLastName}`,
          role: 'INSTITUTION_ADMIN',
          isActive: false,
          verificationToken: verificationToken,
        },
      });

      // Audit Log for Institution Creation
      await tx.auditLog.create({
        data: {
          tenantId: inst.id,
          userId: user.id,
          action: 'INSTITUTION_SIGNUP',
          entity: 'Institution',
          diffJson: JSON.stringify({
            country,
            city,
            students,
            campuses,
            institutionType,
            contactRole,
            currentErp,
            modules,
            deploymentType,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        },
      });

      return inst;
    });

    // Send the activation email so the freshly created institution admin can
    // actually complete onboarding. Without this the account could never be
    // activated and the whole signup funnel silently dead-ended.
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const activationUrl = `${origin}/activate-account?token=${encodeURIComponent(verificationToken)}`;

    try {
      await queueEmail({
        tenantId: institution.id,
        to: officialEmail as string,
        subject: 'Activate your CampusOS institution account',
        body: [
          `Hello ${contactFirstName},`,
          '',
          'Your CampusOS institution account has been created. Set your password to activate it:',
          `Activation link: ${activationUrl}`,
          '',
          'This link is valid for 7 days. If you did not request this, you can ignore this message.',
        ].join('\n'),
        type: 'ACCOUNT_ACTIVATION',
      });
    } catch (emailError) {
      // The institution was already created; a mail outage must not fail the
      // signup response. The email remains queued for the delivery worker.
      console.error('Activation email could not be queued:', emailError);
    }

    return NextResponse.json({ success: true, institutionId: institution.id });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
