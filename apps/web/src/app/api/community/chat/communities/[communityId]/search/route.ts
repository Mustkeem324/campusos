import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { chatHttpError } from '@/lib/community-chat-academic';
import { secureSearchCommunity } from '@/lib/community-chat-pro';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { communityId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
    if (query.length < 2) return NextResponse.json([]);
    const results = await secureSearchCommunity(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
      query,
      {
        messageType: url.searchParams.get('messageType') || undefined,
        hasAttachment: url.searchParams.get('hasAttachment') === 'true' || undefined,
        hasLink: url.searchParams.get('hasLink') === 'true' || undefined,
      },
    );
    return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
