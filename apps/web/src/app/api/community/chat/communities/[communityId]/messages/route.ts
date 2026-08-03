import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const service = new CommunityChatService(prisma);
    const result = await service.getMessages(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
      { cursor, limit }
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Not a member') || message.includes('Community not found')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error('[CHAT_MESSAGES_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const sendMessageSchema = z.object({
  body: z.string().min(1).max(5000),
  messageType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'GIF', 'DOCUMENT', 'LINK', 'POLL', 'CODE']).default('TEXT'),
  replyToId: z.string().uuid().optional(),
  attachments: z.array(z.object({
    attachmentType: z.enum(['IMAGE', 'VIDEO', 'GIF', 'DOCUMENT']),
    fileName: z.string(),
    fileUrl: z.string(),
    thumbnailUrl: z.string().optional(),
    mimeType: z.string(),
    fileSizeBytes: z.number(),
    altText: z.string().optional(),
    durationSecs: z.number().optional(),
    widthPx: z.number().optional(),
    heightPx: z.number().optional(),
  })).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    const service = new CommunityChatService(prisma);
    const result = await service.sendMessage(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
      {
        body: validated.body ?? '', messageType: validated.messageType, replyToId: validated.replyToId,
        attachments: validated.attachments?.map((attachment) => ({
          attachmentType: attachment.attachmentType ?? 'DOCUMENT', fileName: attachment.fileName ?? '',
          fileUrl: attachment.fileUrl ?? '', thumbnailUrl: attachment.thumbnailUrl,
          mimeType: attachment.mimeType ?? '', fileSizeBytes: attachment.fileSizeBytes ?? 0,
          altText: attachment.altText, durationSecs: attachment.durationSecs,
          widthPx: attachment.widthPx, heightPx: attachment.heightPx,
        })),
      }
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.message, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[CHAT_MESSAGES_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
