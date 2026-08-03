import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../lib/tenant-context';
import { requirePermission } from '../../../../../lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await requireTenantContext();
    const id = params.id;

    const post = await db.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true, role: true } },
        replies: {
          include: {
            author: { select: { id: true, email: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: true,
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[COMMUNITY_POST_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db, session } = await requireTenantContext();
    const id = params.id;

    const post = await db.communityPost.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only author or admin can delete
    if (post.authorId !== session.userId) {
      requirePermission(session.role as any, 'edit_academic_records'); // Fallback for admin check
    }

    await db.communityPost.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.error('[COMMUNITY_POST_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
