import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new CommunityChatService(prisma);
    const pinned = await service.getPinnedMessages(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId
    );
    return NextResponse.json(pinned);
  } catch (error) {
    console.error('[CHAT_PINNED_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
