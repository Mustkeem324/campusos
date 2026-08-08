import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { chatHttpError } from '@/lib/community-chat-academic';
import { getCommunityWorkspace } from '@/lib/community-chat-pro';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const workspace = await getCommunityWorkspace(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
    );
    return NextResponse.json(workspace, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
