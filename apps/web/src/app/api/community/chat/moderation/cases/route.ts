import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const service = new CommunityChatService(prisma);
    const cases = await service.getModerationCases(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      status
    );
    return NextResponse.json(cases);
  } catch (error) {
    console.error('[CHAT_MOD_CASES]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
