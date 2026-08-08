import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, params.communityId);
    const members = await new CommunityChatService(prisma).getCommunityMembers(chatSession, params.communityId);
    if (!members) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    return NextResponse.json(members, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
