import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { listStrictAcademicCommunities } from '@/lib/community-chat-academic';
import { canModerateCommunity } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
  const authorisedCommunities = await listStrictAcademicCommunities(chatSession);
  if (!authorisedCommunities.length) return NextResponse.json({ cases: [], communities: [] });

  const memberships = await prisma.chatCommunityMember.findMany({
    where: { tenantId: session.tenantId, userId: session.userId, communityId: { in: authorisedCommunities.map((item) => item.id) } },
    select: { communityId: true, role: true },
  });
  const moderatableIds = memberships.filter((membership) => canModerateCommunity(session.role, membership.role)).map((membership) => membership.communityId);
  if (!moderatableIds.length) return NextResponse.json({ error: 'You do not have moderation permission for an academic community.' }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const allowedStatus = status && ['OPEN', 'UNDER_REVIEW', 'RESOLVED'].includes(status) ? status : undefined;
  const cases = await prisma.chatModerationCase.findMany({
    where: {
      tenantId: session.tenantId,
      communityId: { in: moderatableIds },
      ...(allowedStatus ? { status: allowedStatus } : { status: { in: ['OPEN', 'UNDER_REVIEW'] } }),
    },
    select: {
      id: true,
      communityId: true,
      severity: true,
      status: true,
      internalNotes: true,
      userNotice: true,
      createdAt: true,
      updatedAt: true,
      community: { select: { name: true, type: true } },
      message: { select: { id: true, body: true, moderationStatus: true, author: { select: { id: true, name: true, role: true } } } },
      report: { select: { reason: true, description: true, status: true } },
      actions: { select: { id: true, actionType: true, reason: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return NextResponse.json({
    cases: cases.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), actions: item.actions.map((action) => ({ ...action, createdAt: action.createdAt.toISOString() })) })),
    communities: authorisedCommunities.filter((community) => moderatableIds.includes(community.id)).map((community) => ({ id: community.id, name: community.name, type: community.type })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
