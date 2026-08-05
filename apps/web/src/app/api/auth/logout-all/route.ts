import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  const payload = await getSessionFromCookies();

  if (!payload) {
    const response = NextResponse.json({ success: true, revokedSessions: 0 });
    clearSessionCookie(response);
    return response;
  }

  const result = await prisma.session.deleteMany({
    where: { userId: payload.userId },
  });

  const response = NextResponse.json({
    success: true,
    revokedSessions: result.count,
  });
  clearSessionCookie(response);
  return response;
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set('campusos_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });
}
