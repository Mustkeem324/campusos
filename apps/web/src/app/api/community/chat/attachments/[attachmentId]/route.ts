import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { chatHttpError, loadSecureAttachment } from '@/lib/community-chat-academic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safeDispositionName(value: string) {
  return value.replace(/["\r\n\\/]/g, '_').slice(0, 160) || 'attachment';
}

export async function GET(
  _request: Request,
  { params }: { params: { attachmentId: string } },
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const attachment = await loadSecureAttachment(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.attachmentId,
    );
    const bytes = attachment.bytes.buffer.slice(
      attachment.bytes.byteOffset,
      attachment.bytes.byteOffset + attachment.bytes.byteLength,
    );
    return new Response(bytes, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Length': String(attachment.bytes.byteLength),
        'Content-Disposition': `inline; filename="${safeDispositionName(attachment.fileName)}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
