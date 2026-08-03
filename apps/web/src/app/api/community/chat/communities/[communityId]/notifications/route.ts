import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const notifSchema = z.object({
  level: z.enum(['ALL', 'MENTIONS_ONLY', 'IMPORTANT_ONLY', 'MUTED']),
});

export async function PUT(
  request: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = notifSchema.parse(body);

    const service = new CommunityChatService(prisma);
    await service.updateNotificationPref(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
      validated.level
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[CHAT_NOTIF_PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
