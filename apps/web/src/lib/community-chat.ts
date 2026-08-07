import {
  ChatAttachmentType,
  ChatCommunityType,
  ChatMemberRole,
  ChatMessageType,
  ChatModerationStatus,
  ChatPostingPolicy,
  ChatReactionType,
  ChatReportReason,
  RoleType,
} from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';

const ACADEMIC_TYPES: ChatCommunityType[] = [
  ChatCommunityType.BRANCH,
  ChatCommunityType.PROGRAMME,
  ChatCommunityType.BATCH,
  ChatCommunityType.SEMESTER,
  ChatCommunityType.SECTION,
  ChatCommunityType.COURSE,
];

const MANAGEMENT_ROLES: RoleType[] = [
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.DEAN,
  RoleType.REGISTRAR,
  RoleType.HOD,
];

export const CHAT_LIMITS = {
  textCharacters: 5000,
  maxAttachments: 5,
  imageBytes: 5 * 1024 * 1024,
  videoBytes: 5 * 1024 * 1024,
  voiceBytes: 5 * 1024 * 1024,
  documentBytes: 10 * 1024 * 1024,
  burstMessages: 6,
  burstWindowSeconds: 10,
} as const;

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm']);
const ALLOWED_AUDIO_MIME = new Set(['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav']);
const ALLOWED_DOCUMENT_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const BLOCKED_EXTENSIONS = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|jar|apk|dmg|iso|docm|xlsm|pptm)$/i;
const URL_PATTERN = /https?:\/\/[^\s<>()]+/gi;
const PRIVATE_HOST_PATTERN = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i;
const SHORTENER_HOSTS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'rb.gy']);

const BLOCKED_TEXT_RULES: Array<{ category: string; pattern: RegExp }> = [
  { category: 'ABUSE', pattern: /\b(fuck|fucking|bitch|bastard|asshole|motherfucker|chutiya|chutiye|madarchod|bhenchod|behenchod|gandu|gaand[u]?|harami|randi)\b/i },
  { category: 'SEXUAL_CONTENT', pattern: /\b(porn|pornography|nudes?|sex video|sexting|onlyfans)\b/i },
  { category: 'HATE', pattern: /\b(kill all|exterminate|racial superiority|ethnic cleansing)\b/i },
  { category: 'THREAT', pattern: /\b(i will kill you|i'll kill you|i will hurt you|i'll hurt you|bomb threat|shoot you)\b/i },
  { category: 'CHEATING', pattern: /\b(buy assignment|sell assignment|exam leak|leaked question paper|pay for homework)\b/i },
  { category: 'SCAM', pattern: /\b(guaranteed profit|send otp|share your otp|crypto giveaway|double your money)\b/i },
];

export type CommunitySummary = {
  id: string;
  name: string;
  description: string | null;
  type: ChatCommunityType;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  memberCount: number;
  lastMessage: string | null;
  lastActivityAt: string | null;
  role: ChatMemberRole;
  rules: string | null;
};

export type MessageAttachmentView = {
  id: string;
  type: ChatAttachmentType;
  fileName: string;
  mimeType: string;
  size: number;
  altText: string | null;
  durationSecs: number | null;
};

export type MessageView = {
  id: string;
  body: string;
  messageType: ChatMessageType;
  moderationStatus: ChatModerationStatus;
  createdAt: string;
  editedAt: string | null;
  replyToId: string | null;
  author: {
    name: string;
    avatarUrl: string | null;
    role: RoleType;
  };
  attachments: MessageAttachmentView[];
  reactions: Array<{ type: ChatReactionType; count: number; reactedByMe: boolean }>;
};

type MembershipAccess = {
  community: {
    id: string;
    tenantId: string;
    name: string;
    type: ChatCommunityType;
    postingPolicy: ChatPostingPolicy;
    mediaPolicy: string;
    isActive: boolean;
    isArchived: boolean;
  };
  role: ChatMemberRole;
};

function academicRules() {
  return [
    'Be respectful and keep discussion relevant to this academic community.',
    'Do not share abusive, sexual, hateful, threatening or discriminatory content.',
    'Do not share private information, unsafe links, malware, leaked examination material or paid cheating services.',
    'Faculty and authorised moderators may remove content under institutional policy.',
  ].join('\n');
}

async function findOrCreateCommunity(input: {
  context: ActiveUserContext;
  type: ChatCommunityType;
  name: string;
  description: string;
  departmentId?: string | null;
  programId?: string | null;
  batchId?: string | null;
  sectionId?: string | null;
  semesterNumber?: number | null;
  courseId?: string | null;
  courseOfferingId?: string | null;
}) {
  const where = {
    tenantId: input.context.tenantId,
    type: input.type,
    departmentId: input.departmentId ?? null,
    programId: input.programId ?? null,
    batchId: input.batchId ?? null,
    sectionId: input.sectionId ?? null,
    semesterNumber: input.semesterNumber ?? null,
    courseId: input.courseId ?? null,
    courseOfferingId: input.courseOfferingId ?? null,
    isArchived: false,
  };

  const existing = await prisma.chatCommunity.findFirst({ where, select: { id: true } });
  if (existing) return existing.id;

  const created = await prisma.chatCommunity.create({
    data: {
      tenantId: input.context.tenantId,
      type: input.type,
      name: input.name,
      description: input.description,
      departmentId: input.departmentId ?? null,
      programId: input.programId ?? null,
      batchId: input.batchId ?? null,
      sectionId: input.sectionId ?? null,
      semesterNumber: input.semesterNumber ?? null,
      courseId: input.courseId ?? null,
      courseOfferingId: input.courseOfferingId ?? null,
      createdById: input.context.userId,
      rules: academicRules(),
      requiresAck: false,
    },
    select: { id: true },
  });
  return created.id;
}

async function ensureMembership(context: ActiveUserContext, communityId: string, role: ChatMemberRole) {
  await prisma.chatCommunityMember.upsert({
    where: { communityId_userId: { communityId, userId: context.userId } },
    update: { role, tenantId: context.tenantId },
    create: { tenantId: context.tenantId, communityId, userId: context.userId, role },
  });
}

async function syncStudentMemberships(context: ActiveUserContext) {
  if (!context.studentProfileId) return [] as string[];
  const student = await prisma.student.findFirst({
    where: { id: context.studentProfileId, tenantId: context.tenantId },
    include: {
      batch: { include: { program: { include: { department: true } } } },
      section: true,
      enrollments: {
        include: {
          courseOffering: { include: { course: true, section: true, term: true } },
        },
      },
    },
  });
  if (!student) return [];

  const department = student.batch.program.department;
  const programme = student.batch.program;
  const desired: string[] = [];

  desired.push(await findOrCreateCommunity({
    context,
    type: ChatCommunityType.BRANCH,
    name: `${department.name} Branch`,
    description: `Restricted community for students and authorised staff in ${department.name}.`,
    departmentId: department.id,
  }));
  desired.push(await findOrCreateCommunity({
    context,
    type: ChatCommunityType.PROGRAMME,
    name: programme.name,
    description: `Programme community for ${programme.name}.`,
    departmentId: department.id,
    programId: programme.id,
  }));
  desired.push(await findOrCreateCommunity({
    context,
    type: ChatCommunityType.BATCH,
    name: `${programme.name} · ${student.batch.name}`,
    description: `Academic community for the ${student.batch.name} batch.`,
    departmentId: department.id,
    programId: programme.id,
    batchId: student.batch.id,
  }));

  if (student.section) {
    desired.push(await findOrCreateCommunity({
      context,
      type: ChatCommunityType.SECTION,
      name: `${programme.code} · ${student.batch.name} · Section ${student.section.name}`,
      description: `Restricted section community for Section ${student.section.name}.`,
      departmentId: department.id,
      programId: programme.id,
      batchId: student.batch.id,
      sectionId: student.section.id,
    }));
  }

  for (const enrollment of student.enrollments) {
    const offering = enrollment.courseOffering;
    desired.push(await findOrCreateCommunity({
      context,
      type: ChatCommunityType.SEMESTER,
      name: `${programme.code} · ${student.batch.name} · Semester ${offering.term.number}`,
      description: `Semester ${offering.term.number} academic community.`,
      departmentId: department.id,
      programId: programme.id,
      batchId: student.batch.id,
      semesterNumber: offering.term.number,
    }));
    desired.push(await findOrCreateCommunity({
      context,
      type: ChatCommunityType.COURSE,
      name: `${offering.course.code} · ${offering.course.title}`,
      description: `Course community for enrolled students and assigned faculty.`,
      departmentId: department.id,
      programId: programme.id,
      batchId: student.batch.id,
      sectionId: offering.sectionId,
      semesterNumber: offering.term.number,
      courseId: offering.courseId,
      courseOfferingId: offering.id,
    }));
  }

  for (const id of new Set(desired)) await ensureMembership(context, id, ChatMemberRole.STUDENT);
  await removeStaleAcademicMemberships(context, [...new Set(desired)]);
  return [...new Set(desired)];
}

async function syncFacultyMemberships(context: ActiveUserContext) {
  const staff = await prisma.staff.findFirst({
    where: { userId: context.userId, tenantId: context.tenantId },
    include: {
      courseOfferings: {
        include: {
          course: { include: { department: true } },
          section: { include: { batch: { include: { program: true } } } },
          term: true,
        },
      },
    },
  });
  if (!staff) return [] as string[];

  const desired: string[] = [];
  if (staff.departmentId) {
    const department = await prisma.department.findFirst({ where: { id: staff.departmentId, tenantId: context.tenantId } });
    if (department) {
      desired.push(await findOrCreateCommunity({
        context,
        type: ChatCommunityType.BRANCH,
        name: `${department.name} Branch`,
        description: `Restricted community for students and authorised staff in ${department.name}.`,
        departmentId: department.id,
      }));
    }
  }

  for (const offering of staff.courseOfferings) {
    const programme = offering.section.batch.program;
    desired.push(await findOrCreateCommunity({
      context,
      type: ChatCommunityType.COURSE,
      name: `${offering.course.code} · ${offering.course.title}`,
      description: `Course community for enrolled students and assigned faculty.`,
      departmentId: offering.course.departmentId,
      programId: programme.id,
      batchId: offering.section.batchId,
      sectionId: offering.sectionId,
      semesterNumber: offering.term.number,
      courseId: offering.courseId,
      courseOfferingId: offering.id,
    }));
  }

  for (const id of new Set(desired)) await ensureMembership(context, id, ChatMemberRole.FACULTY);
  await removeStaleAcademicMemberships(context, [...new Set(desired)]);
  return [...new Set(desired)];
}

async function syncManagementMemberships(context: ActiveUserContext) {
  let communities = await prisma.chatCommunity.findMany({
    where: { tenantId: context.tenantId, isActive: true, isArchived: false },
    select: { id: true, departmentId: true },
    take: 250,
  });

  if (context.activeRole === RoleType.HOD) {
    const staff = await prisma.staff.findFirst({ where: { userId: context.userId, tenantId: context.tenantId }, select: { departmentId: true } });
    communities = communities.filter((community) => Boolean(staff?.departmentId && community.departmentId === staff.departmentId));
  }

  const role = context.activeRole === RoleType.HOD ? ChatMemberRole.MODERATOR : ChatMemberRole.ADMIN;
  for (const community of communities) await ensureMembership(context, community.id, role);
  return communities.map((community) => community.id);
}

async function removeStaleAcademicMemberships(context: ActiveUserContext, desiredIds: string[]) {
  const memberships = await prisma.chatCommunityMember.findMany({
    where: {
      tenantId: context.tenantId,
      userId: context.userId,
      community: { type: { in: ACADEMIC_TYPES } },
    },
    select: { id: true, communityId: true },
  });
  const desired = new Set(desiredIds);
  const staleIds = memberships.filter((item) => !desired.has(item.communityId)).map((item) => item.id);
  if (staleIds.length) await prisma.chatCommunityMember.deleteMany({ where: { id: { in: staleIds } } });
}

export async function syncAcademicCommunityMemberships(context: ActiveUserContext) {
  if (context.activeRole === RoleType.STUDENT) return syncStudentMemberships(context);
  if (context.activeRole === RoleType.FACULTY) return syncFacultyMemberships(context);
  if (MANAGEMENT_ROLES.includes(context.activeRole)) return syncManagementMemberships(context);
  return [] as string[];
}

export async function assertCommunityAccess(context: ActiveUserContext, communityId: string): Promise<MembershipAccess> {
  await syncAcademicCommunityMemberships(context);
  const membership = await prisma.chatCommunityMember.findFirst({
    where: { tenantId: context.tenantId, userId: context.userId, communityId },
    include: { community: true },
  });
  if (!membership || membership.community.tenantId !== context.tenantId || !membership.community.isActive || membership.community.isArchived) {
    throw new Error('FORBIDDEN_COMMUNITY');
  }
  if (membership.role === ChatMemberRole.SUSPENDED) throw new Error('COMMUNITY_SUSPENDED');
  return { community: membership.community, role: membership.role };
}

export async function listAuthorizedCommunities(context: ActiveUserContext): Promise<CommunitySummary[]> {
  await syncAcademicCommunityMemberships(context);
  const memberships = await prisma.chatCommunityMember.findMany({
    where: { tenantId: context.tenantId, userId: context.userId, community: { isActive: true, isArchived: false } },
    include: { community: true },
    orderBy: [{ isPinned: 'desc' }, { unreadCount: 'desc' }, { joinedAt: 'desc' }],
    take: 100,
  });

  return Promise.all(memberships.map(async (membership) => {
    const [memberCount, lastMessage] = await Promise.all([
      prisma.chatCommunityMember.count({ where: { tenantId: context.tenantId, communityId: membership.communityId, role: { not: ChatMemberRole.SUSPENDED } } }),
      prisma.chatMessage.findFirst({
        where: {
          tenantId: context.tenantId,
          communityId: membership.communityId,
          isDeleted: false,
          moderationStatus: { in: [ChatModerationStatus.ALLOWED, ChatModerationStatus.ALLOWED_WITH_WARNING, ChatModerationStatus.RESTORED] },
        },
        orderBy: { createdAt: 'desc' },
        select: { body: true, createdAt: true },
      }),
    ]);
    return {
      id: membership.community.id,
      name: membership.community.name,
      description: membership.community.description,
      type: membership.community.type,
      unreadCount: membership.unreadCount,
      isPinned: membership.isPinned,
      isMuted: membership.isMuted,
      memberCount,
      lastMessage: lastMessage?.body ? lastMessage.body.slice(0, 120) : null,
      lastActivityAt: lastMessage?.createdAt.toISOString() ?? null,
      role: membership.role,
      rules: membership.community.rules,
    };
  }));
}

function reactionSummary(reactions: Array<{ reactionType: ChatReactionType; userId: string }>, currentUserId: string) {
  const counts = new Map<ChatReactionType, { count: number; reactedByMe: boolean }>();
  for (const reaction of reactions) {
    const current = counts.get(reaction.reactionType) ?? { count: 0, reactedByMe: false };
    current.count += 1;
    if (reaction.userId === currentUserId) current.reactedByMe = true;
    counts.set(reaction.reactionType, current);
  }
  return [...counts.entries()].map(([type, value]) => ({ type, ...value }));
}

export async function listCommunityMessages(context: ActiveUserContext, communityId: string, before?: Date) {
  await assertCommunityAccess(context, communityId);
  const messages = await prisma.chatMessage.findMany({
    where: {
      tenantId: context.tenantId,
      communityId,
      isDeleted: false,
      moderationStatus: { in: [ChatModerationStatus.ALLOWED, ChatModerationStatus.ALLOWED_WITH_WARNING, ChatModerationStatus.RESTORED] },
      ...(before ? { createdAt: { lt: before } } : {}),
    },
    include: {
      author: { select: { name: true, avatarUrl: true, role: true } },
      attachments: { select: { id: true, attachmentType: true, fileName: true, mimeType: true, fileSizeBytes: true, altText: true, durationSecs: true, isSafe: true } },
      reactions: { select: { reactionType: true, userId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  await prisma.chatCommunityMember.updateMany({
    where: { tenantId: context.tenantId, communityId, userId: context.userId },
    data: { unreadCount: 0, lastReadAt: new Date() },
  });

  return messages.reverse().map((message): MessageView => ({
    id: message.id,
    body: message.sanitizedBody ?? message.body,
    messageType: message.messageType,
    moderationStatus: message.moderationStatus,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    replyToId: message.replyToId,
    author: message.author,
    attachments: message.attachments.filter((attachment) => attachment.isSafe).map((attachment) => ({
      id: attachment.id,
      type: attachment.attachmentType,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.fileSizeBytes,
      altText: attachment.altText,
      durationSecs: attachment.durationSecs,
    })),
    reactions: reactionSummary(message.reactions, context.userId),
  }));
}

function extractUrls(body: string) {
  return [...new Set(body.match(URL_PATTERN) ?? [])].slice(0, 6);
}

function validateLinks(urls: string[]) {
  for (const value of urls) {
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) return { blocked: true, reason: 'Unsupported link protocol.' };
      if (PRIVATE_HOST_PATTERN.test(parsed.hostname)) return { blocked: true, reason: 'Internal or local network links are not allowed.' };
      if (SHORTENER_HOSTS.has(parsed.hostname.toLowerCase())) return { blocked: false, warning: 'Shortened link: open carefully.' };
    } catch {
      return { blocked: true, reason: 'Invalid link.' };
    }
  }
  return { blocked: false as const };
}

function moderateText(body: string) {
  const normalized = body.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  if (normalized.length > CHAT_LIMITS.textCharacters) return { status: ChatModerationStatus.BLOCKED, reason: `Messages are limited to ${CHAT_LIMITS.textCharacters} characters.`, sanitized: normalized.slice(0, CHAT_LIMITS.textCharacters) };
  if (/(.)\1{14,}/i.test(normalized)) return { status: ChatModerationStatus.BLOCKED, reason: 'Repeated spam-like content is not allowed.', sanitized: normalized };

  for (const rule of BLOCKED_TEXT_RULES) {
    if (rule.pattern.test(normalized)) return { status: ChatModerationStatus.BLOCKED, reason: `${rule.category}: This message may violate CampusOS Community Guidelines.`, sanitized: normalized };
  }

  const urls = extractUrls(normalized);
  const links = validateLinks(urls);
  if (links.blocked) return { status: ChatModerationStatus.BLOCKED, reason: links.reason ?? 'Unsafe link blocked.', sanitized: normalized, urls };
  return {
    status: links.warning ? ChatModerationStatus.ALLOWED_WITH_WARNING : ChatModerationStatus.ALLOWED,
    reason: links.warning ?? null,
    sanitized: normalized,
    urls,
  };
}

function classifyFile(file: File) {
  const name = file.name.replace(/[\\/\u0000-\u001F]/g, '_').slice(0, 180) || 'attachment';
  if (BLOCKED_EXTENSIONS.test(name)) throw new Error('BLOCKED_FILE_TYPE');

  if (ALLOWED_IMAGE_MIME.has(file.type)) {
    if (file.size > CHAT_LIMITS.imageBytes) throw new Error('IMAGE_TOO_LARGE');
    return { name, type: ChatAttachmentType.IMAGE, messageType: ChatMessageType.IMAGE, limit: CHAT_LIMITS.imageBytes };
  }
  if (ALLOWED_VIDEO_MIME.has(file.type)) {
    if (file.size > CHAT_LIMITS.videoBytes) throw new Error('VIDEO_TOO_LARGE');
    return { name, type: ChatAttachmentType.VIDEO, messageType: ChatMessageType.VIDEO, limit: CHAT_LIMITS.videoBytes };
  }
  if (ALLOWED_AUDIO_MIME.has(file.type)) {
    if (file.size > CHAT_LIMITS.voiceBytes) throw new Error('VOICE_TOO_LARGE');
    return { name, type: ChatAttachmentType.DOCUMENT, messageType: ChatMessageType.DOCUMENT, limit: CHAT_LIMITS.voiceBytes };
  }
  if (ALLOWED_DOCUMENT_MIME.has(file.type)) {
    if (file.size > CHAT_LIMITS.documentBytes) throw new Error('DOCUMENT_TOO_LARGE');
    return { name, type: ChatAttachmentType.DOCUMENT, messageType: ChatMessageType.DOCUMENT, limit: CHAT_LIMITS.documentBytes };
  }
  throw new Error('UNSUPPORTED_FILE_TYPE');
}

function looksLikeExpectedType(bytes: Uint8Array, mimeType: string) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const ascii = (start: number, text: string) => text.split('').every((character, index) => bytes[start + index] === character.charCodeAt(0));
  if (mimeType === 'image/jpeg') return starts(0xff, 0xd8, 0xff);
  if (mimeType === 'image/png') return starts(0x89, 0x50, 0x4e, 0x47);
  if (mimeType === 'image/gif') return ascii(0, 'GIF8');
  if (mimeType === 'image/webp') return ascii(0, 'RIFF') && ascii(8, 'WEBP');
  if (mimeType === 'application/pdf') return ascii(0, '%PDF');
  if (mimeType === 'video/mp4' || mimeType === 'audio/mp4') return ascii(4, 'ftyp');
  if (mimeType === 'video/webm' || mimeType === 'audio/webm') return starts(0x1a, 0x45, 0xdf, 0xa3);
  if (mimeType === 'audio/ogg') return ascii(0, 'OggS');
  if (mimeType === 'audio/mpeg') return ascii(0, 'ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (mimeType === 'audio/wav') return ascii(0, 'RIFF') && ascii(8, 'WAVE');
  if (mimeType.includes('openxmlformats')) return starts(0x50, 0x4b);
  if (mimeType === 'text/plain' || mimeType === 'text/csv') return true;
  return false;
}

async function attachmentData(file: File) {
  const classification = classifyFile(file);
  const buffer = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeExpectedType(buffer, file.type)) throw new Error('FILE_SIGNATURE_MISMATCH');
  const encoded = Buffer.from(buffer).toString('base64');
  return {
    classification,
    fileUrl: `data:${file.type};base64,${encoded}`,
  };
}

function canPost(access: MembershipAccess) {
  if ([ChatMemberRole.MUTED, ChatMemberRole.SUSPENDED, ChatMemberRole.OBSERVER].includes(access.role)) return false;
  if (access.community.postingPolicy === ChatPostingPolicy.ALL_MEMBERS) return true;
  if (access.community.postingPolicy === ChatPostingPolicy.FACULTY_ONLY) return [ChatMemberRole.FACULTY, ChatMemberRole.MODERATOR, ChatMemberRole.ADMIN, ChatMemberRole.OWNER].includes(access.role);
  return [ChatMemberRole.MODERATOR, ChatMemberRole.ADMIN, ChatMemberRole.OWNER].includes(access.role);
}

export async function createCommunityMessage(context: ActiveUserContext, communityId: string, body: string, files: File[], replyToId?: string | null) {
  const access = await assertCommunityAccess(context, communityId);
  if (!canPost(access)) throw new Error('POSTING_NOT_ALLOWED');
  if (files.length > CHAT_LIMITS.maxAttachments) throw new Error('TOO_MANY_ATTACHMENTS');

  const activeRestriction = await prisma.chatUserRestriction.findFirst({
    where: { tenantId: context.tenantId, communityId, userId: context.userId, isActive: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
  });
  if (activeRestriction) throw new Error('CHAT_RESTRICTED');

  const since = new Date(Date.now() - CHAT_LIMITS.burstWindowSeconds * 1000);
  const recentCount = await prisma.chatMessage.count({ where: { tenantId: context.tenantId, communityId, authorId: context.userId, createdAt: { gte: since } } });
  if (recentCount >= CHAT_LIMITS.burstMessages) throw new Error('RATE_LIMITED');

  const moderated = moderateText(body);
  if (!moderated.sanitized && files.length === 0) throw new Error('EMPTY_MESSAGE');

  const preparedFiles = await Promise.all(files.map(attachmentData));
  const messageType = preparedFiles[0]?.classification.messageType ?? (moderated.urls?.length ? ChatMessageType.LINK : ChatMessageType.TEXT);

  if (replyToId) {
    const replyTarget = await prisma.chatMessage.findFirst({ where: { id: replyToId, tenantId: context.tenantId, communityId, isDeleted: false }, select: { id: true } });
    if (!replyTarget) throw new Error('INVALID_REPLY_TARGET');
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        tenantId: context.tenantId,
        communityId,
        authorId: context.userId,
        messageType,
        body: moderated.sanitized,
        sanitizedBody: moderated.sanitized,
        replyToId: replyToId ?? null,
        moderationStatus: moderated.status,
        moderationReason: moderated.reason,
        linkUrls: moderated.urls ?? [],
      },
    });

    for (const prepared of preparedFiles) {
      await tx.chatAttachment.create({
        data: {
          tenantId: context.tenantId,
          messageId: created.id,
          attachmentType: prepared.classification.type,
          fileName: prepared.classification.name,
          fileUrl: prepared.fileUrl,
          mimeType: files[preparedFiles.indexOf(prepared)]?.type ?? 'application/octet-stream',
          fileSizeBytes: files[preparedFiles.indexOf(prepared)]?.size ?? 0,
          isSafe: true,
          scanResult: 'MIME_AND_SIGNATURE_VALIDATED',
        },
      });
    }

    await tx.chatAuditEvent.create({
      data: {
        tenantId: context.tenantId,
        communityId,
        actorId: context.userId,
        eventType: moderated.status === ChatModerationStatus.BLOCKED ? 'community.message.blocked' : 'community.message.created',
        entityType: 'ChatMessage',
        entityId: created.id,
        metadata: moderated.reason ?? undefined,
      },
    });

    if (moderated.status === ChatModerationStatus.BLOCKED || moderated.status === ChatModerationStatus.HIDDEN_PENDING_REVIEW) {
      await tx.chatModerationCase.create({
        data: {
          tenantId: context.tenantId,
          communityId,
          messageId: created.id,
          severity: moderated.status === ChatModerationStatus.BLOCKED ? 'MEDIUM' : 'HIGH',
          status: 'OPEN',
          userNotice: 'This content was withheld because it may violate the CampusOS Community Guidelines.',
        },
      });
    }

    if (moderated.status !== ChatModerationStatus.BLOCKED) {
      await tx.chatCommunityMember.updateMany({
        where: { tenantId: context.tenantId, communityId, userId: { not: context.userId }, isMuted: false },
        data: { unreadCount: { increment: 1 } },
      });
    }
    return created;
  });

  if (moderated.status === ChatModerationStatus.BLOCKED) throw new Error(`CONTENT_BLOCKED:${moderated.reason ?? 'Community policy'}`);
  return message.id;
}

export async function getSecureAttachment(context: ActiveUserContext, attachmentId: string) {
  const attachment = await prisma.chatAttachment.findFirst({
    where: { id: attachmentId, tenantId: context.tenantId, isSafe: true },
    include: { message: { select: { communityId: true, moderationStatus: true, isDeleted: true } } },
  });
  if (!attachment || attachment.message.isDeleted || ![ChatModerationStatus.ALLOWED, ChatModerationStatus.ALLOWED_WITH_WARNING, ChatModerationStatus.RESTORED].includes(attachment.message.moderationStatus)) {
    throw new Error('ATTACHMENT_NOT_AVAILABLE');
  }
  await assertCommunityAccess(context, attachment.message.communityId);
  const match = /^data:([^;]+);base64,(.+)$/s.exec(attachment.fileUrl);
  if (!match) throw new Error('ATTACHMENT_STORAGE_UNAVAILABLE');
  return {
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    bytes: Buffer.from(match[2], 'base64'),
  };
}

export async function toggleReaction(context: ActiveUserContext, messageId: string, reactionType: ChatReactionType) {
  const message = await prisma.chatMessage.findFirst({ where: { id: messageId, tenantId: context.tenantId, isDeleted: false }, select: { communityId: true } });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');
  await assertCommunityAccess(context, message.communityId);
  const where = { messageId_userId_reactionType: { messageId, userId: context.userId, reactionType } };
  const existing = await prisma.chatReaction.findUnique({ where });
  if (existing) await prisma.chatReaction.delete({ where });
  else await prisma.chatReaction.create({ data: { tenantId: context.tenantId, messageId, userId: context.userId, reactionType } });
  return !existing;
}

export async function reportMessage(context: ActiveUserContext, messageId: string, reason: ChatReportReason, description?: string) {
  const message = await prisma.chatMessage.findFirst({ where: { id: messageId, tenantId: context.tenantId, isDeleted: false }, select: { communityId: true } });
  if (!message) throw new Error('MESSAGE_NOT_FOUND');
  await assertCommunityAccess(context, message.communityId);

  const existing = await prisma.chatReport.findFirst({ where: { tenantId: context.tenantId, messageId, reporterId: context.userId, status: { in: ['OPEN', 'UNDER_REVIEW'] } } });
  if (existing) return existing.id;

  const report = await prisma.chatReport.create({
    data: {
      tenantId: context.tenantId,
      communityId: message.communityId,
      messageId,
      reporterId: context.userId,
      reason,
      description: description?.slice(0, 1000),
    },
  });
  await prisma.chatModerationCase.create({
    data: {
      tenantId: context.tenantId,
      communityId: message.communityId,
      messageId,
      reportId: report.id,
      severity: ['THREAT', 'VIOLENCE', 'SEXUAL_CONTENT'].includes(reason) ? 'HIGH' : 'MEDIUM',
      status: 'OPEN',
    },
  });
  return report.id;
}

export function communityErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : 'UNKNOWN';
  if (message.startsWith('CONTENT_BLOCKED:')) return { status: 422, message: message.replace('CONTENT_BLOCKED:', '') };
  if (['FORBIDDEN_COMMUNITY', 'COMMUNITY_SUSPENDED', 'POSTING_NOT_ALLOWED', 'CHAT_RESTRICTED'].includes(message)) return { status: 403, message: 'You are not authorised to perform this action in this community.' };
  if (message === 'RATE_LIMITED') return { status: 429, message: 'You are sending messages too quickly. Please wait a moment.' };
  if (message === 'IMAGE_TOO_LARGE') return { status: 413, message: 'Images are limited to 5 MB each.' };
  if (message === 'VIDEO_TOO_LARGE') return { status: 413, message: 'Short videos are limited to 5 MB.' };
  if (message === 'VOICE_TOO_LARGE') return { status: 413, message: 'Voice notes are limited to 5 MB.' };
  if (message === 'DOCUMENT_TOO_LARGE') return { status: 413, message: 'Documents are limited to 10 MB.' };
  if (['BLOCKED_FILE_TYPE', 'UNSUPPORTED_FILE_TYPE', 'FILE_SIGNATURE_MISMATCH'].includes(message)) return { status: 415, message: 'That attachment type is not allowed or its file signature is invalid.' };
  if (message === 'TOO_MANY_ATTACHMENTS') return { status: 422, message: `A message can contain at most ${CHAT_LIMITS.maxAttachments} attachments.` };
  if (message === 'EMPTY_MESSAGE') return { status: 422, message: 'Write a message or add an attachment before sending.' };
  return { status: 400, message: 'The community request could not be completed.' };
}
