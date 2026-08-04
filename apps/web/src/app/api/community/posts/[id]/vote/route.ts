import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../../lib/tenant-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, session } = await requireTenantContext();
    const postId = params.id;

    const post = await db.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const body = await request.json();
    const data = voteSchema.parse(body);

    const existing = await db.communityVote.findFirst({
      where: { postId, userId: session.userId },
    });

    if (existing) {
      if (existing.value === data.value) {
        // Same vote: remove it
        await db.communityVote.delete({ where: { id: existing.id } });
        return NextResponse.json({ action: 'removed', value: 0 });
      }
      // Different vote: update
      await db.communityVote.update({ where: { id: existing.id }, data: { value: data.value } });
      return NextResponse.json({ action: 'changed', value: data.value });
    }

    await db.communityVote.create({
      data: {
        postId,
        userId: session.userId,
        value: data.value,
        tenantId: session.tenantId,
      },
    });

    return NextResponse.json({ action: 'added', value: data.value }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
    }
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Failed to update vote' }, { status });
  }
}
