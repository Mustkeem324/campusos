import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { hashOneTimeToken, randomOneTimeToken } from '@/lib/phase7';

const requestSchema = z.object({ email: z.string().trim().email() });

export async function POST(request: Request) {
  const genericResponse = {
    success: true,
    message: 'If an active account exists, password reset instructions have been queued.',
  };

  try {
    const { email } = requestSchema.parse(await request.json());
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email.toLowerCase(), mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true, tenantId: true, email: true, name: true },
    });

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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    console.error('Password reset request failed:', error);
    return NextResponse.json(genericResponse);
  }
}
