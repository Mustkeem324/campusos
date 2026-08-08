import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { hashOneTimeToken, randomOneTimeToken } from '@/lib/phase7';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '@/lib/public-rate-limit';

const BODY_LIMIT_BYTES = 4 * 1024;
const requestSchema = z.object({ email: z.string().trim().email().max(254) });
const genericResponse = {
  success: true,
  message: 'If a pending institution account exists for this email, a new activation link has been queued.',
};

export async function POST(request: Request) {
  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({
      key: `resend-activation:${ipAddress}`,
      limit: 5,
      windowMs: 60 * 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many activation-email requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const { email } = requestSchema.parse(await readJsonWithLimit(request, BODY_LIMIT_BYTES));
    const candidates = await prisma.user.findMany({
      where: {
        email: { equals: email.toLowerCase(), mode: 'insensitive' },
        role: 'INSTITUTION_ADMIN',
        isActive: false,
        emailVerified: null,
        institution: { status: 'EMAIL_VERIFICATION_PENDING' },
      },
      select: { id: true, tenantId: true, email: true },
      take: 2,
    });
    if (candidates.length !== 1) return NextResponse.json(genericResponse);

    const user = candidates[0];
    const token = randomOneTimeToken();
    const storedToken = hashOneTimeToken(token);
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const activationUrl = `${origin}/activate-account?token=${encodeURIComponent(token)}`;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: storedToken },
      }),
      prisma.emailQueue.create({
        data: {
          tenantId: user.tenantId,
          to: user.email,
          subject: 'Activate your Navemora institution account',
          type: 'ACCOUNT_ACTIVATION',
          body: [
            '<h2>Activate your institution account</h2>',
            '<p>A new activation link was requested for your pending institution account.</p>',
            `<p><a href="${activationUrl}">Set your password and activate your account</a></p>`,
            '<p>If you did not request this link, you can ignore this email.</p>',
          ].join(''),
        },
      }),
    ]);

    return NextResponse.json(genericResponse);
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    }
    if (error instanceof InvalidJsonError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    console.error('Activation email resend failed:', error);
    return NextResponse.json(genericResponse);
  }
}
