import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import {
  assertStrictAcademicAccess,
  chatHttpError,
  secureMessageAttachmentUrls,
  sendStrictAcademicMessage,
} from '@/lib/community-chat-academic';
import { markCommunityMessagesRead } from '@/lib/community-chat-pro';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function sessionInput(session: NonNullable<Awaited<ReturnType<typeof getSessionFromCookies>>>) {
  return { userId: session.userId, tenantId: session.tenantId, role: session.role };
}

export async function GET(request: Request, { params }: { params: { communityId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = sessionInput(session);
    await assertStrictAcademicAccess(chatSession, params.communityId);

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '50', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 60) : 50;

    const service = new CommunityChatService(prisma);
    const result = await service.getMessages(chatSession, params.communityId, { cursor, limit });
    const secured = result.messages.map((message) => secureMessageAttachmentUrls(message));
    const read = await markCommunityMessagesRead(chatSession, params.communityId, secured.map((message) => message.id));
    return NextResponse.json(
      {
        ...result,
        currentUserId: session.userId,
        messages: secured.map((message) => ({ ...message, readCount: read.readCounts[message.id] ?? 0 })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

export async function POST(request: Request, { params }: { params: { communityId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = sessionInput(session);
    const contentType = request.headers.get('content-type') ?? '';

    let body = '';
    let replyToId: string | undefined;
    let files: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      body = String(form.get('body') ?? '');
      const reply = form.get('replyToId');
      replyToId = typeof reply === 'string' && reply ? reply : undefined;
      files = form.getAll('files').filter((value): value is File => value instanceof File);
    } else {
      const payload: unknown = await request.json();
      if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
      const record = payload as Record<string, unknown>;
      body = typeof record.body === 'string' ? record.body : '';
      replyToId = typeof record.replyToId === 'string' ? record.replyToId : undefined;
      if (Array.isArray(record.attachments) && record.attachments.length > 0) {
        return NextResponse.json({ error: 'Attachments must be uploaded as files; external file URLs are not accepted.' }, { status: 400 });
      }
    }

    const message = await sendStrictAcademicMessage(chatSession, params.communityId, { body, replyToId, files });
    return NextResponse.json(message, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
