import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function POST(_: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    const post = await db.communityPost.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const bookmark = await db.communityBookmark.findUnique({ where: { postId_userId: { postId: post.id, userId: session.userId } }, select: { id: true } });
    if (bookmark) {
      await db.communityBookmark.delete({ where: { id: bookmark.id } });
      return NextResponse.json({ bookmarked: false });
    }
    await db.communityBookmark.create({ data: { postId: post.id, userId: session.userId, tenantId: session.tenantId } });
    return NextResponse.json({ bookmarked: true });
  } catch (error: unknown) {
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Unable to update bookmark' }, { status });
  }
}
