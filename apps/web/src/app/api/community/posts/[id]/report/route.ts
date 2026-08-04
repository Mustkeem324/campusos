import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../../lib/tenant-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reportSchema = z.object({
  reason: z.enum(['SPAM', 'HARASSMENT', 'HATE_ABUSE', 'ACADEMIC_MISCONDUCT', 'MISINFORMATION', 'PRIVACY_VIOLATION', 'INAPPROPRIATE', 'COPYRIGHT', 'OTHER']),
  details: z.string().max(2000).optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, session } = await requireTenantContext();
    const postId = params.id;

    const post = await db.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const body = await request.json();
    const data = reportSchema.parse(body);

    // Prevent duplicate reports from same user on same post
    const existing = await db.communityReport.findFirst({
      where: { postId, reporterId: session.userId, status: 'PENDING' },
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already reported this post' }, { status: 409 });
    }

    const report = await db.communityReport.create({
      data: {
        postId,
        reporterId: session.userId,
        reason: data.reason,
        details: data.details || null,
        tenantId: session.tenantId,
      },
    });

    return NextResponse.json({ id: report.id, status: 'PENDING' }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Failed to submit report' }, { status });
  }
}
