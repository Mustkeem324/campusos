import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const appealSchema = z.object({ appealText: z.string().min(10).max(2000) });

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const validated = appealSchema.parse(body);
    const service = new CommunityChatService(prisma);
    const result = await service.appealModeration(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.caseId, validated.appealText
    );
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    console.error('[CHAT_MOD_APPEAL]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
