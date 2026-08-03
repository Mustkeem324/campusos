import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { requirePermission } from '../../../../lib/rbac';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  type: z.enum(['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'POLL', 'URGENT_NOTICE', 'IMPORTANT_NOTICE', 'EVENT', 'RESOURCE']),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  visibility: z.string().default('INSTITUTION'),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  commentsEnabled: z.boolean().default(true),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const visibility = searchParams.get('visibility');

    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (visibility) whereClause.visibility = visibility;

    const posts = await db.communityPost.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, email: true, role: true } },
        _count: { select: { replies: true, reactions: true } }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[COMMUNITY_POSTS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    
    // Any authenticated user can create a post, but announcements might need permissions.
    // For now we'll allow all, or if they try to create ANNOUNCEMENT, require role.
    const body = await request.json();
    const validatedData = postSchema.parse(body);

    if (validatedData.type === 'ANNOUNCEMENT' || validatedData.type === 'URGENT_NOTICE' || validatedData.type === 'IMPORTANT_NOTICE') {
      requirePermission(session.role as any, 'edit_academic_records'); // Using existing perm for now, or just admin check
      // Ideal: 'manage_announcements' but let's just make sure they are not standard users if required.
    }

    const post = await db.communityPost.create({
      data: {
        ...validatedData,
        tenantId: session.tenantId,
        authorId: session.userId,
      } as any,
      include: {
        author: { select: { id: true, email: true, role: true } }
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[COMMUNITY_POSTS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
