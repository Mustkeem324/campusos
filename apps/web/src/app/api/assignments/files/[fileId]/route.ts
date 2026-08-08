import { RoleType } from '@prisma/client';
import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  ASSIGNMENT_RESOURCE_ACTION,
  ASSIGNMENT_SUBMISSION_FILE_ACTION,
  assignmentError,
  assertAssignmentAccess,
  fileEntity,
} from '@/lib/assignment-workspace';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params: paramsPromise }: { params: Promise<{ fileId: string }>; }) {
  const params = await paramsPromise;

  try {
    const context = await requireActiveUserContext();
    const file = await prisma.file.findFirst({
      where: { id: params.fileId, tenantId: context.tenantId },
      select: { id: true, fileName: true, fileUrl: true, mimeType: true },
    });
    if (!file) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

    const association = await prisma.auditLog.findFirst({
      where: {
        tenantId: context.tenantId,
        entity: fileEntity(file.id),
        action: { in: [ASSIGNMENT_RESOURCE_ACTION, ASSIGNMENT_SUBMISSION_FILE_ACTION] },
      },
      orderBy: { createdAt: 'desc' },
      select: { action: true, diffJson: true },
    });
    if (!association?.diffJson) return NextResponse.json({ error: 'File is not linked to an assignment.' }, { status: 404 });

    const metadata = JSON.parse(association.diffJson) as { assignmentId?: string; studentId?: string };
    if (!metadata.assignmentId) return NextResponse.json({ error: 'File is not linked to an assignment.' }, { status: 404 });
    await assertAssignmentAccess(context, metadata.assignmentId);
    if (association.action === ASSIGNMENT_SUBMISSION_FILE_ACTION && context.activeRole === RoleType.STUDENT && metadata.studentId !== context.studentProfileId) {
      throw new Error('ASSIGNMENT_FORBIDDEN');
    }

    const encoded = /^data:([^;]+);base64,(.+)$/.exec(file.fileUrl);
    if (!encoded) return NextResponse.json({ error: 'Stored file is unavailable.' }, { status: 404 });
    const bytes = Buffer.from(encoded[2], 'base64');
    const url = new URL(request.url);
    const download = url.searchParams.get('download') === '1';
    const inline = !download && (file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/'));
    const safeName = file.fileName.replace(/["\r\n]/g, '_');

    return new Response(bytes, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': String(bytes.length),
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (error: unknown) {
    const failure = assignmentError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
