import { NextResponse } from 'next/server';

/**
 * Retired legacy endpoint.
 *
 * Email verification used to activate both a user and their entire institution
 * from a token alone. That made invitation tokens capable of changing tenant
 * lifecycle state and bypassed the password-setting activation flow. New and
 * existing clients must use /activate-account links backed by
 * /api/auth/activate-account instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'This email-verification flow has been retired. Use the account activation link from your email.',
    },
    { status: 410 },
  );
}
