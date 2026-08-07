import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { chatHttpError } from '@/lib/community-chat-academic';
import { updateCommunityNotificationLevel } from '@/lib/community-chat-pro';
import { prisma } from '@/lib/db';
import { assertStrictAcademicAccess } from '@/lib/community-chat-academic';

export const dynamic = 'force-dynamic';

const notifSchema = z.object({
  level: z.enum(['ALL', 'MENTIONS_ONLY', 'IMPORTANT_ONLY', 'MUTED']),
});

export async function GET(_request: Request, { params }: { params: { communityId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, params.communityId);
    const pref = await prisma.chatNotificationPref.findUnique({
      where: { communityId_userId: { communityId: params.communityId, userId: session.userId } },
      select: { level: true },
    });
    return NextResponse.json({ level: pref?.level ?? 'ALL' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

export async function PUT(request: Request, { params }: { params: { communityId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const validated = notifSchema.parse(await request.json());
    const result = await updateCommunityNotificationLevel(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
      validated.level,
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
