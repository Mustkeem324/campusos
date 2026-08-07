import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { chatHttpError } from '@/lib/community-chat-academic';
import { getCommunityRealtimeState, recordCommunityPresence } from '@/lib/community-chat-pro';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['heartbeat', 'typing_start', 'typing_stop']),
});

export async function GET(_request: Request, { params }: { params: { communityId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const state = await getCommunityRealtimeState(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
    );
    return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

export async function POST(request: Request, { params }: { params: { communityId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = actionSchema.parse(await request.json());
    const state = await recordCommunityPresence(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
      payload.action,
    );
    return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
