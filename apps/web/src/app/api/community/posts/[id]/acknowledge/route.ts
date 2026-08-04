import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const { db, session } = await requireTenantContext();
    const postId = params.id;

    const post = await db.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, type: true },
    });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Only notices/announcements can be acknowledged
    const acknowledgeable = ['ANNOUNCEMENT', 'URGENT_NOTICE', 'IMPORTANT_NOTICE'];
    if (!acknowledgeable.includes(post.type)) {
      return NextResponse.json({ error: 'This post type does not support acknowledgement' }, { status: 400 });
    }

    const existing = await db.communityAcknowledgement.findFirst({
      where: { postId, userId: session.userId },
    });

    if (existing) {
      return NextResponse.json({ acknowledged: true, alreadyDone: true });
    }

    await db.communityAcknowledgement.create({
      data: {
        postId,
        userId: session.userId,
        tenantId: session.tenantId,
      },
    });

    return NextResponse.json({ acknowledged: true }, { status: 201 });
  } catch (error: unknown) {
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Failed to acknowledge' }, { status });
  }
}
