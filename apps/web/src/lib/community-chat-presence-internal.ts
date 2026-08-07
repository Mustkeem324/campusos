import type { ChatSession } from './community-chat-service';
import { prisma } from './db';

const PRESENCE_TTL_MS = 75_000;
const TYPING_TTL_MS = 7_000;

export async function writePresenceEvent(session: ChatSession, communityId: string, action: 'heartbeat' | 'typing_start' | 'typing_stop') {
  const eventTypes = action === 'heartbeat'
    ? ['community.presence.heartbeat']
    : ['community.typing.start', 'community.typing.stop'];
  const eventType = action === 'heartbeat'
    ? 'community.presence.heartbeat'
    : action === 'typing_start' ? 'community.typing.start' : 'community.typing.stop';

  await prisma.$transaction(async (tx) => {
    await tx.chatAuditEvent.deleteMany({
      where: { tenantId: session.tenantId, communityId, actorId: session.userId, eventType: { in: eventTypes } },
    });
    await tx.chatAuditEvent.create({
      data: {
        tenantId: session.tenantId,
        communityId,
        actorId: session.userId,
        eventType,
        entityType: 'User',
        entityId: session.userId,
      },
    });
  });
}

/** Caller must perform strict community authorisation before using this helper. */
export async function readPresenceState(session: ChatSession, communityId: string) {
  const sincePresence = new Date(Date.now() - PRESENCE_TTL_MS);
  const sinceTyping = new Date(Date.now() - TYPING_TTL_MS);
  const events = await prisma.chatAuditEvent.findMany({
    where: {
      tenantId: session.tenantId,
      communityId,
      actorId: { not: null },
      OR: [
        { eventType: 'community.presence.heartbeat', createdAt: { gte: sincePresence } },
        { eventType: { in: ['community.typing.start', 'community.typing.stop'] }, createdAt: { gte: sinceTyping } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { actorId: true, eventType: true, createdAt: true },
    take: 500,
  });

  const online = new Map<string, string>();
  const latestTyping = new Map<string, string>();
  for (const event of events) {
    if (!event.actorId) continue;
    if (event.eventType === 'community.presence.heartbeat' && !online.has(event.actorId)) online.set(event.actorId, event.createdAt.toISOString());
    if ((event.eventType === 'community.typing.start' || event.eventType === 'community.typing.stop') && !latestTyping.has(event.actorId)) latestTyping.set(event.actorId, event.eventType);
  }

  const typingIds = [...latestTyping.entries()]
    .filter(([, eventType]) => eventType === 'community.typing.start')
    .map(([userId]) => userId)
    .filter((userId) => userId !== session.userId);
  const userIds = [...new Set([...online.keys(), ...typingIds])];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { tenantId: session.tenantId, id: { in: userIds }, isActive: true }, select: { id: true, name: true, avatarUrl: true, role: true } })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  return {
    online: [...online.entries()].map(([userId, lastSeenAt]) => ({ userId, lastSeenAt, user: userMap.get(userId) ?? null })),
    typing: typingIds.map((userId) => ({ userId, user: userMap.get(userId) ?? null })).filter((item) => item.user),
  };
}
