import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { getSessionFromCookies } from '../../../../../lib/auth';
import { CommunityChatService } from '../../../../../lib/community-chat-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const communityId = searchParams.get('communityId') || undefined;
    const messageType = searchParams.get('messageType') || undefined;
    const hasAttachment = searchParams.get('hasAttachment') === 'true';
    const hasLink = searchParams.get('hasLink') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const service = new CommunityChatService(prisma);
    const results = await service.search(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      q, { communityId, messageType, hasAttachment, hasLink, limit }
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('[CHAT_SEARCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
