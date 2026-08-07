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

const requestSchema = z.object({ email: z.string().trim().email().max(254) });
const RESET_REQUEST_BODY_LIMIT_BYTES = 4 * 1024;

export async function POST(request: Request) {
  const genericResponse = {
    success: true,
    message: 'If one active account exists for this email, password reset instructions have been queued.',
  };

  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({ key: `password-forgot:${ipAddress}`, limit: 10, windowMs: 60 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const { email } = requestSchema.parse(
      await readJsonWithLimit(request, RESET_REQUEST_BODY_LIMIT_BYTES),
    );
    const candidates = await prisma.user.findMany({
      where: {
        email: { equals: email.toLowerCase(), mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true, tenantId: true, email: true, name: true },
      take: 2,
    });

    // Email addresses are unique per tenant, not globally. Never reset an
    // arbitrary institution account when the same address belongs to two tenants.
    const user = candidates.length === 1 ? candidates[0] : null;
    if (!user) return NextResponse.json(genericResponse);

    const token = randomOneTimeToken();
    const resetToken = hashOneTimeToken(token);
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      }),
      prisma.emailQueue.create({
        data: {
          tenantId: user.tenantId,
          to: user.email,
          subject: 'Reset your CampusOS password',
          body: [
            `Hello ${user.name},`,
            '',
            'A password reset was requested for your CampusOS account.',
            `Reset link: ${resetUrl}`,
            '',
            'This link expires in 30 minutes. If you did not request it, you can ignore this message.',
          ].join('\n'),
          type: 'PASSWORD_RESET',
        },
      }),
    ]);

    const exposeToken =
      process.env.NODE_ENV !== 'production' &&
      process.env.CAMPUSOS_EXPOSE_RESET_TOKEN === 'true';

    return NextResponse.json({
      ...genericResponse,
      ...(exposeToken ? { developmentResetUrl: resetUrl } : {}),
    });
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
    console.error('Password reset request failed:', error);
    return NextResponse.json(genericResponse);
  }
}
