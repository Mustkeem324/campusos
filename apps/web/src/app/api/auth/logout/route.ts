import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  const payload = await getSessionFromCookies();

  if (payload) {
    await prisma.session.deleteMany({
      where: {
        userId: payload.userId,
        token: payload.sessionId,
      },
    });
  }

  const response = NextResponse.json({ success: true });
  clearCookie(response, 'campusos_session', true);
  clearCookie(response, 'campusos_workspace', true);
  return response;
}

function clearCookie(response: NextResponse, name: string, httpOnly: boolean) {
  response.cookies.set(name, '', {
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });
}
