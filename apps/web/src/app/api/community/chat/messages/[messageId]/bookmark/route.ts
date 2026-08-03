import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bookmarkSchema = z.object({ note: z.string().max(500).optional() });

export async function POST(request: Request, { params }: { params: { messageId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const validated = bookmarkSchema.parse(body);
    const service = new CommunityChatService(prisma);
    const result = await service.toggleBookmark(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.messageId, validated.note
    );
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    console.error('[CHAT_BOOKMARK]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
