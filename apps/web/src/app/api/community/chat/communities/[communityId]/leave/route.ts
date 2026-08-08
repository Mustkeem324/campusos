import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new CommunityChatService(prisma);
    const result = await service.leaveCommunity(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId
    );

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CHAT_LEAVE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
