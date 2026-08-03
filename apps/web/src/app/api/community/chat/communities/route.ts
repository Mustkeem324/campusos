import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { getSessionFromCookies } from '../../../../../lib/auth';
import { CommunityChatService } from '../../../../../lib/community-chat-service';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = new CommunityChatService(prisma);
    const communities = await service.listCommunitiesForUser({
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
    });
    return NextResponse.json(communities);
  } catch (error: unknown) {
    console.error('[CHAT_COMMUNITIES_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
  rules: z.string().optional(),
  requiresAck: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.role === 'STUDENT' || session.role === 'PARENT') {
      return NextResponse.json({ error: 'Only faculty and staff can create communities' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createCommunitySchema.parse(body);

    const communityData: Prisma.ChatCommunityUncheckedCreateInput = {
      tenantId: session.tenantId, createdById: session.userId,
      name: validated.name ?? '', type: validated.type ?? 'STUDY_GROUP',
      description: validated.description, visibility: validated.visibility ?? 'RESTRICTED',
      joinPolicy: validated.joinPolicy ?? 'REQUEST', postingPolicy: validated.postingPolicy ?? 'ALL_MEMBERS',
      mediaPolicy: validated.mediaPolicy ?? 'ALLOW_ALL', rules: validated.rules,
      requiresAck: validated.requiresAck ?? false,
    };
    const community = await prisma.chatCommunity.create({ data: communityData });

    await prisma.chatCommunityMember.create({
      data: { communityId: community.id, userId: session.userId, role: 'OWNER', tenantId: session.tenantId },
    });

    return NextResponse.json(community, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[CHAT_COMMUNITIES_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
