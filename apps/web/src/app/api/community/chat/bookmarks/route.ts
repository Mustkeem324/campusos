import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError, listStrictAcademicCommunities, secureMessageAttachmentUrls } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    const communityId = new URL(request.url).searchParams.get('communityId') || undefined;
    const service = new CommunityChatService(prisma);

    if (communityId) {
      await assertStrictAcademicAccess(chatSession, communityId);
      const bookmarks = await service.getBookmarks(chatSession, communityId);
      return NextResponse.json(bookmarks.map((message) => secureMessageAttachmentUrls(message)), { headers: { 'Cache-Control': 'no-store' } });
    }

    const authorised = await listStrictAcademicCommunities(chatSession);
    const authorisedIds = new Set(authorised.map((community) => community.id));
    const bookmarks = await service.getBookmarks(chatSession);
    return NextResponse.json(
      bookmarks.filter((message) => authorisedIds.has(message.communityId)).map((message) => secureMessageAttachmentUrls(message)),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
