import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { chatHttpError, listStrictAcademicCommunities } from '@/lib/community-chat-academic';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const communities = await listStrictAcademicCommunities({
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
    });
    return NextResponse.json({ communities }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

const createCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['PROJECT_GROUP', 'STUDY_GROUP', 'CLUB', 'PLACEMENT_GROUP', 'FACULTY_ANNOUNCEMENT_CHANNEL']),
  visibility: z.enum(['PUBLIC', 'INSTITUTION', 'DEPARTMENT', 'RESTRICTED']).default('RESTRICTED'),
  joinPolicy: z.enum(['AUTO', 'REQUEST', 'INVITE', 'CLOSED']).default('REQUEST'),
  postingPolicy: z.enum(['ALL_MEMBERS', 'FACULTY_ONLY', 'MODERATORS_ONLY', 'ANNOUNCEMENT_ONLY']).default('ALL_MEMBERS'),
  mediaPolicy: z.enum(['ALLOW_ALL', 'IMAGES_ONLY', 'DOCUMENTS_ONLY', 'TEXT_ONLY']).default('ALLOW_ALL'),
  rules: z.string().max(4000).optional(),
  requiresAck: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'STUDENT' || session.role === 'PARENT') {
      return NextResponse.json({ error: 'Only faculty and authorised staff can create optional communities.' }, { status: 403 });
    }

    const validated = createCommunitySchema.parse(await request.json());
    const communityData: Prisma.ChatCommunityUncheckedCreateInput = {
      tenantId: session.tenantId,
      createdById: session.userId,
      name: validated.name,
      type: validated.type,
      description: validated.description,
      visibility: validated.visibility,
      joinPolicy: validated.joinPolicy,
      postingPolicy: validated.postingPolicy,
      mediaPolicy: validated.mediaPolicy,
      rules: validated.rules,
      requiresAck: validated.requiresAck,
    };
    const community = await prisma.chatCommunity.create({ data: communityData });
    await prisma.chatCommunityMember.create({
      data: { communityId: community.id, userId: session.userId, role: 'OWNER', tenantId: session.tenantId },
    });
    return NextResponse.json({ id: community.id, name: community.name, type: community.type }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unable to create community.' }, { status: 500 });
  }
}
