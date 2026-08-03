import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { queueEmail } from '../../../../lib/email-service';
import { generateRandomToken } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      const resetToken = generateRandomToken(32);
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes short expiry

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        }
      });

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

      await queueEmail({
        tenantId: user.tenantId,
        to: user.email,
        subject: 'Password Reset Request',
        type: 'RESET',
        body: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to create a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        `
      });
    }

    // Always return success to prevent account enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
