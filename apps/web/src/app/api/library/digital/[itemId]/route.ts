import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { getDigitalAccess, libraryError } from '@/lib/library-workspace';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { itemId: string } }) {
  try {
    const context = await requireActiveUserContext();
    const digital = await getDigitalAccess(context, params.itemId);
    if (digital.fileId) {
      const file = await prisma.file.findFirst({ where: { id: digital.fileId, tenantId: context.tenantId }, select: { fileName: true, fileUrl: true, mimeType: true } });
      if (!file) return NextResponse.json({ error: 'The licensed e-book file is unavailable.' }, { status: 404 });
      const match = /^data:([^;]+);base64,(.+)$/.exec(file.fileUrl);
      if (!match) return NextResponse.json({ error: 'The e-book storage format is unavailable.' }, { status: 409 });
      const body = Buffer.from(match[2], 'base64');
      const safeName = file.fileName.replace(/[^a-zA-Z0-9._ -]/g, '_');
      return new Response(body, {
        headers: {
          'Content-Type': file.mimeType || match[1],
          'Content-Disposition': `${digital.allowDownload ? 'attachment' : 'inline'}; filename="${safeName}"`,
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'self'; sandbox",
        },
      });
    }
    if (digital.externalUrl) {
      return NextResponse.redirect(digital.externalUrl, { status: 307 });
    }
    return NextResponse.json({ error: 'No online copy is configured.' }, { status: 404 });
  } catch (error: unknown) {
    const failure = libraryError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
