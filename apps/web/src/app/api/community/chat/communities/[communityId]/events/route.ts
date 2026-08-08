import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { readPresenceState } from '@/lib/community-chat-presence-internal';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const encoder = new TextEncoder();

export async function GET(request: Request, { params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return new Response('Unauthorized', { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, params.communityId);

    const url = new URL(request.url);
    const afterParam = url.searchParams.get('after');
    const initialAfter = afterParam ? new Date(afterParam) : new Date(Date.now() - 30_000);
    const safeInitialAfter = Number.isNaN(initialAfter.getTime()) ? new Date(Date.now() - 30_000) : initialAfter;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let cursor = safeInitialAfter;
        let lastPresencePayload = '';
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          try { controller.close(); } catch { /* stream already closed */ }
        };
        const send = (chunk: string) => {
          if (closed || request.signal.aborted) return false;
          try {
            controller.enqueue(encoder.encode(chunk));
            return true;
          } catch {
            closed = true;
            return false;
          }
        };
        request.signal.addEventListener('abort', close, { once: true });
        if (!send('event: ready\ndata: {}\n\n')) return;

        const deadline = Date.now() + 25_000;
        while (!closed && !request.signal.aborted && Date.now() < deadline) {
          try {
            const [latest, realtime] = await Promise.all([
              prisma.chatMessage.findMany({
                where: {
                  tenantId: chatSession.tenantId,
                  communityId: params.communityId,
                  createdAt: { gt: cursor },
                  isDeleted: false,
                  moderationStatus: { in: ['ALLOWED', 'ALLOWED_WITH_WARNING', 'RESTORED'] },
                },
                orderBy: { createdAt: 'asc' },
                select: { id: true, createdAt: true },
                take: 25,
              }),
              readPresenceState(chatSession, params.communityId),
            ]);

            if (latest.length) {
              cursor = latest[latest.length - 1].createdAt;
              if (!send(`event: messages\ndata: ${JSON.stringify({ ids: latest.map((item) => item.id), at: cursor.toISOString() })}\n\n`)) break;
            }

            const presencePayload = JSON.stringify(realtime);
            if (presencePayload !== lastPresencePayload) {
              lastPresencePayload = presencePayload;
              if (!send(`event: presence\ndata: ${presencePayload}\n\n`)) break;
            }
            if (!send(': keepalive\n\n')) break;
            await new Promise((resolve) => setTimeout(resolve, 1800));
          } catch (streamError) {
            console.error('[CHAT_REALTIME_STREAM]', streamError);
            close();
            break;
          }
        }
        close();
      },
      cancel() {
        // AbortSignal stops the polling loop.
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return new Response(failure.error, { status: failure.status });
  }
}
