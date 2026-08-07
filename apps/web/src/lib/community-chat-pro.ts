import type { ChatMemberRole, RoleType } from '@prisma/client';

import { assertStrictAcademicAccess, secureMessageAttachmentUrls } from './community-chat-academic';
import { readPresenceState, writePresenceEvent } from './community-chat-presence-internal';
import {
  canCreatePoll,
  canModerateCommunity,
  canPinMessages,
  CommunityChatService,
  type ChatSession,
} from './community-chat-service';
import { prisma } from './db';

const MAX_WORKSPACE_MEDIA = 60;
const MAX_MODERATION_CASES = 25;
const VISIBLE_MESSAGE_STATUSES = ['ALLOWED', 'ALLOWED_WITH_WARNING', 'RESTORED'] as const;

export type PresenceAction = 'heartbeat' | 'typing_start' | 'typing_stop';

export async function recordCommunityPresence(session: ChatSession, communityId: string, action: PresenceAction) {
  await assertStrictAcademicAccess(session, communityId);
  await writePresenceEvent(session, communityId, action);
  return readPresenceState(session, communityId);
}

export async function getCommunityRealtimeState(session: ChatSession, communityId: string) {
  await assertStrictAcademicAccess(session, communityId);
  return readPresenceState(session, communityId);
}

export async function markCommunityMessagesRead(session: ChatSession, communityId: string, messageIds: string[]) {
  await assertStrictAcademicAccess(session, communityId);
  const uniqueIds = [...new Set(messageIds)].slice(0, 100);
  if (!uniqueIds.length) return { readCounts: {} as Record<string, number> };

  const valid = await prisma.chatMessage.findMany({
    where: { tenantId: session.tenantId, communityId, id: { in: uniqueIds }, isDeleted: false },
    select: { id: true },
  });
  const ids = valid.map((item) => item.id);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    if (ids.length) {
      await tx.chatReadReceipt.createMany({
        data: ids.map((messageId) => ({ tenantId: session.tenantId, messageId, userId: session.userId, readAt: now })),
        skipDuplicates: true,
      });
    }
    await tx.chatCommunityMember.updateMany({
      where: { tenantId: session.tenantId, communityId, userId: session.userId },
      data: { lastReadAt: now, unreadCount: 0 },
    });
  });

  return { readCounts: await getMessageReadCountsInternal(session, communityId, ids) };
}

export async function getMessageReadCounts(session: ChatSession, communityId: string, messageIds: string[]) {
  await assertStrictAcademicAccess(session, communityId);
  return getMessageReadCountsInternal(session, communityId, messageIds);
}

async function getMessageReadCountsInternal(session: ChatSession, communityId: string, messageIds: string[]) {
  const ids = [...new Set(messageIds)].slice(0, 100);
  if (!ids.length) return {} as Record<string, number>;
  const rows = await prisma.chatReadReceipt.groupBy({
    by: ['messageId'],
    where: { tenantId: session.tenantId, messageId: { in: ids }, message: { communityId } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.messageId, row._count._all]));
}

export async function getCommunityWorkspace(session: ChatSession, communityId: string) {
  const access = await assertStrictAcademicAccess(session, communityId);
  const service = new CommunityChatService(prisma);

  const allowedPollMessages = await prisma.chatMessage.findMany({
    where: {
      tenantId: session.tenantId,
      communityId,
      messageType: 'POLL',
      isDeleted: false,
      moderationStatus: { in: [...VISIBLE_MESSAGE_STATUSES] },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const allowedPollMessageIds = allowedPollMessages.map((message) => message.id);

  const [memberRows, pinnedRaw, bookmarkRaw, notificationPref, media, polls, realtime, moderationCases] = await Promise.all([
    prisma.chatCommunityMember.findMany({
      where: { tenantId: session.tenantId, communityId, role: { not: 'SUSPENDED' } },
      select: { id: true, userId: true, role: true, isMuted: true, joinedAt: true, lastReadAt: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      take: 500,
    }),
    service.getPinnedMessages(session, communityId),
    service.getBookmarks(session, communityId),
    prisma.chatNotificationPref.findUnique({
      where: { communityId_userId: { communityId, userId: session.userId } },
      select: { level: true },
    }),
    prisma.chatAttachment.findMany({
      where: {
        tenantId: session.tenantId,
        isSafe: true,
        message: { communityId, isDeleted: false, moderationStatus: { in: [...VISIBLE_MESSAGE_STATUSES] } },
      },
      select: {
        id: true,
        attachmentType: true,
        fileName: true,
        mimeType: true,
        fileSizeBytes: true,
        createdAt: true,
        messageId: true,
        message: { select: { author: { select: { name: true, role: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_WORKSPACE_MEDIA,
    }),
    prisma.chatPoll.findMany({
      where: {
        tenantId: session.tenantId,
        communityId,
        messageId: { in: allowedPollMessageIds },
      },
      select: {
        id: true,
        messageId: true,
        question: true,
        isMultipleChoice: true,
        isAnonymous: true,
        showResultsBeforeVoting: true,
        closesAt: true,
        options: {
          select: {
            id: true,
            text: true,
            voteCount: true,
            votes: { where: { userId: session.userId }, select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    readPresenceState(session, communityId),
    canModerateCommunity(session.role, access.membership.role)
      ? prisma.chatModerationCase.findMany({
          where: { tenantId: session.tenantId, communityId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
          select: {
            id: true,
            severity: true,
            status: true,
            userNotice: true,
            createdAt: true,
            message: { select: { id: true, body: true, author: { select: { id: true, name: true, role: true } } } },
            report: { select: { reason: true, description: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: MAX_MODERATION_CASES,
        })
      : Promise.resolve([]),
  ]);

  const memberUserIds = memberRows.map((member) => member.userId);
  const users = memberUserIds.length
    ? await prisma.user.findMany({
        where: { tenantId: session.tenantId, id: { in: memberUserIds }, isActive: true },
        select: { id: true, name: true, avatarUrl: true, role: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));
  const onlineMap = new Map(realtime.online.map((item) => [item.userId, item.lastSeenAt]));

  return {
    currentUserId: session.userId,
    currentRole: session.role,
    memberRole: access.membership.role,
    community: {
      id: access.community.id,
      name: access.community.name,
      description: access.community.description,
      type: access.community.type,
      rules: access.community.rules,
      postingPolicy: access.community.postingPolicy,
      mediaPolicy: access.community.mediaPolicy,
    },
    permissions: {
      canPin: canPinMessages(session.role, access.membership.role),
      canPoll: canCreatePoll(session.role, access.membership.role),
      canModerate: canModerateCommunity(session.role, access.membership.role),
      canEditCommunity: ['OWNER', 'ADMIN'].includes(access.membership.role)
        || session.role === 'SUPER_ADMIN'
        || session.role === 'INSTITUTION_ADMIN',
    },
    notificationLevel: notificationPref?.level ?? 'ALL',
    members: memberRows.map((member) => ({
      id: member.id,
      role: member.role,
      isMuted: member.isMuted,
      joinedAt: member.joinedAt.toISOString(),
      lastReadAt: member.lastReadAt?.toISOString() ?? null,
      online: onlineMap.has(member.userId),
      lastSeenAt: onlineMap.get(member.userId) ?? member.lastReadAt?.toISOString() ?? null,
      user: userMap.get(member.userId) ?? null,
    })).filter((member) => member.user),
    typing: realtime.typing,
    pinned: pinnedRaw.map((message) => secureMessageAttachmentUrls(message)),
    bookmarks: bookmarkRaw.map((message) => secureMessageAttachmentUrls(message)),
    media: media.map((item) => ({
      id: item.id,
      attachmentType: item.attachmentType,
      fileName: item.fileName,
      mimeType: item.mimeType,
      fileSizeBytes: item.fileSizeBytes,
      createdAt: item.createdAt.toISOString(),
      messageId: item.messageId,
      fileUrl: `/api/community/chat/attachments/${item.id}`,
      author: item.message.author,
    })),
    polls: polls.map((poll) => ({
      id: poll.id,
      messageId: poll.messageId,
      question: poll.question,
      isMultipleChoice: poll.isMultipleChoice,
      isAnonymous: poll.isAnonymous,
      showResultsBeforeVoting: poll.showResultsBeforeVoting,
      closesAt: poll.closesAt?.toISOString() ?? null,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        voteCount: option.voteCount,
        selectedByMe: option.votes.length > 0,
      })),
    })),
    moderationCases,
  };
}

export async function secureSearchCommunity(
  session: ChatSession,
  communityId: string,
  query: string,
  filters: { messageType?: string; hasAttachment?: boolean; hasLink?: boolean },
) {
  await assertStrictAcademicAccess(session, communityId);
  const service = new CommunityChatService(prisma);
  const results = await service.search(session, query, { communityId, ...filters, limit: 75 });
  return results.map((message) => secureMessageAttachmentUrls(message));
}

export async function updateCommunityNotificationLevel(
  session: ChatSession,
  communityId: string,
  level: 'ALL' | 'MENTIONS_ONLY' | 'IMPORTANT_ONLY' | 'MUTED',
) {
  await assertStrictAcademicAccess(session, communityId);
  const service = new CommunityChatService(prisma);
  await service.updateNotificationPref(session, communityId, level);
  await prisma.chatCommunityMember.updateMany({
    where: { tenantId: session.tenantId, communityId, userId: session.userId },
    data: { isMuted: level === 'MUTED' },
  });
  return { level };
}

export function canEditOwnMessage(authorId: string, session: ChatSession) {
  return authorId === session.userId;
}

export function canDeleteMessage(authorId: string, session: ChatSession, memberRole: ChatMemberRole) {
  return authorId === session.userId || canModerateCommunity(session.role, memberRole);
}

export function canManageCommunityRole(role: RoleType, memberRole: ChatMemberRole) {
  return role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN' || ['OWNER', 'ADMIN'].includes(memberRole);
}
