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
    const community = await service.getCommunity(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId
    );

    if (!community) return NextResponse.json({ error: 'Community not found or access denied' }, { status: 404 });
    return NextResponse.json(community);
  } catch (error) {
    console.error('[CHAT_COMMUNITY_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
