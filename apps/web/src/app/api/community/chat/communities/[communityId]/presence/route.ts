import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { readPresenceState, writePresenceEvent } from '@/lib/community-chat-presence-internal';
import { checkSlidingWindowRateLimit } from '@/lib/security-service';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({ action: z.enum(['heartbeat', 'typing_start', 'typing_stop']) });

export async function GET(_request: Request, { params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, params.communityId);
    const state = await readPresenceState(chatSession, params.communityId);
    return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimit = checkSlidingWindowRateLimit(`chat:presence:${session.userId}`, 60, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Presence updates are temporarily rate limited.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil(rateLimit.resetMs / 1000))) } },
      );
    }
    const payload = actionSchema.parse(await request.json());
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, params.communityId);
    await writePresenceEvent(chatSession, params.communityId, payload.action);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
