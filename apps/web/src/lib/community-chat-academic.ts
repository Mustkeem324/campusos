import {
  ChatAttachmentType,
  ChatCommunityType,
  ChatMemberRole,
  ChatMessageType,
  ChatModerationStatus,
  ChatPostingPolicy,
  RoleType,
} from '@prisma/client';

import { prisma } from './db';
import {
  checkLinkSafety,
  extractHashtags,
  extractLinks,
  extractMentions,
  moderateText,
  sanitizeFileName,
  sanitizeMessageText,
  type ChatSession,
} from './community-chat-service';

const ACADEMIC_TYPES: ChatCommunityType[] = ['BRANCH', 'PROGRAMME', 'BATCH', 'SEMESTER', 'SECTION', 'COURSE'];
const PLATFORM_MANAGERS: RoleType[] = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'DEAN', 'REGISTRAR'];
const MAX_TEXT = 5000;
const MAX_ATTACHMENTS = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 5 * 1024 * 1024;
const MAX_VOICE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MESSAGE_RATE_WINDOW_MS = 10_000;
const MESSAGE_RATE_LIMIT = 6;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const AUDIO_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav']);
const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);
const BLOCKED_FILE_EXTENSION = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|jar|apk|dmg|iso|docm|xlsm|pptm)$/i;
const ABUSIVE_LANGUAGE = /\b(fuck|fucking|bitch|bastard|asshole|motherfucker|chutiya|chutiye|madarchod|bhenchod|behenchod|gandu|gaand[u]?|harami|randi)\b/i;

export type AcademicCommunityListItem = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  memberCount: number;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastActivityAt: string | null;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
};

type AcademicCommunityScope = {
  id: string;
  type: ChatCommunityType;
  departmentId: string | null;
  programId: string | null;
  batchId: string | null;
  sectionId: string | null;
  semesterNumber: number | null;
  courseOfferingId: string | null;
};

function defaultRules() {
  return [
    'Be respectful and stay relevant to this academic community.',
    'Abuse, bullying, sexual content, hate, threats and harassment are not allowed.',
    'Do not expose private information or share malware, scams, unsafe links or leaked examination material.',
    'Do not sell assignments, answers or academic cheating services.',
  ].join('\n');
}

async function findOrCreateAcademicCommunity(input: {
  session: ChatSession;
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
  const scope = {
    tenantId: input.session.tenantId,
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
  const existing = await prisma.chatCommunity.findFirst({ where: scope, select: { id: true } });
  if (existing) return existing.id;

  const created = await prisma.chatCommunity.create({
    data: {
      ...scope,
      name: input.name,
      description: input.description,
      createdById: input.session.userId,
      visibility: 'RESTRICTED',
      joinPolicy: 'AUTO',
      postingPolicy: 'ALL_MEMBERS',
      mediaPolicy: 'ALLOW_ALL',
      rules: defaultRules(),
      isActive: true,
    },
    select: { id: true },
  });
  return created.id;
}

async function upsertMember(session: ChatSession, communityId: string, role: ChatMemberRole) {
  await prisma.chatCommunityMember.upsert({
    where: { communityId_userId: { communityId, userId: session.userId } },
    create: { tenantId: session.tenantId, communityId, userId: session.userId, role },
    update: { tenantId: session.tenantId, role },
  });
}

async function syncStudent(session: ChatSession) {
  const student = await prisma.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    include: {
      batch: { include: { program: { include: { department: true } } } },
      section: true,
      enrollments: { include: { courseOffering: { include: { course: true, section: true, term: true } } } },
    },
  });
  if (!student) return [] as string[];

  const programme = student.batch.program;
  const department = programme.department;
  const desired: string[] = [];
  desired.push(await findOrCreateAcademicCommunity({ session, type: 'BRANCH', name: `${programme.name} Branch`, description: `Restricted branch community for ${programme.name}.`, departmentId: department.id, programId: programme.id }));
  desired.push(await findOrCreateAcademicCommunity({ session, type: 'PROGRAMME', name: programme.name, description: `Programme community for ${programme.name}.`, departmentId: department.id, programId: programme.id }));
  desired.push(await findOrCreateAcademicCommunity({ session, type: 'BATCH', name: `${programme.code} · ${student.batch.name}`, description: `Academic community for the ${student.batch.name} batch.`, departmentId: department.id, programId: programme.id, batchId: student.batch.id }));
  if (student.section) {
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'SECTION', name: `${programme.code} · ${student.batch.name} · Section ${student.section.name}`, description: `Restricted section community for Section ${student.section.name}.`, departmentId: department.id, programId: programme.id, batchId: student.batch.id, sectionId: student.section.id }));
  }
  for (const enrollment of student.enrollments) {
    const offering = enrollment.courseOffering;
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'SEMESTER', name: `${programme.code} · ${student.batch.name} · Semester ${offering.term.number}`, description: `Semester ${offering.term.number} academic community.`, departmentId: department.id, programId: programme.id, batchId: student.batch.id, semesterNumber: offering.term.number }));
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'COURSE', name: `${offering.course.code} · ${offering.course.title}`, description: 'Course community for enrolled students and assigned faculty.', departmentId: department.id, programId: programme.id, batchId: student.batch.id, sectionId: offering.sectionId, semesterNumber: offering.term.number, courseId: offering.courseId, courseOfferingId: offering.id }));
  }
  const unique = [...new Set(desired)];
  for (const communityId of unique) await upsertMember(session, communityId, 'STUDENT');
  await removeStaleAcademicMemberships(session, unique);
  return unique;
}

async function syncFaculty(session: ChatSession) {
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    include: { courseOfferings: { include: { course: { include: { department: true } }, section: { include: { batch: { include: { program: true } } } }, term: true } } },
  });
  if (!staff) return [] as string[];

  const desired: string[] = [];
  for (const offering of staff.courseOfferings) {
    const programme = offering.section.batch.program;
    const department = offering.course.department;
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'BRANCH', name: `${programme.name} Branch`, description: `Restricted branch community for ${programme.name}.`, departmentId: department.id, programId: programme.id }));
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'PROGRAMME', name: programme.name, description: `Programme community for ${programme.name}.`, departmentId: department.id, programId: programme.id }));
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'BATCH', name: `${programme.code} · ${offering.section.batch.name}`, description: `Academic community for the ${offering.section.batch.name} batch.`, departmentId: department.id, programId: programme.id, batchId: offering.section.batch.id }));
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'SECTION', name: `${programme.code} · ${offering.section.batch.name} · Section ${offering.section.name}`, description: `Restricted section community for Section ${offering.section.name}.`, departmentId: department.id, programId: programme.id, batchId: offering.section.batch.id, sectionId: offering.section.id }));
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'SEMESTER', name: `${programme.code} · ${offering.section.batch.name} · Semester ${offering.term.number}`, description: `Semester ${offering.term.number} academic community.`, departmentId: department.id, programId: programme.id, batchId: offering.section.batch.id, semesterNumber: offering.term.number }));
    desired.push(await findOrCreateAcademicCommunity({ session, type: 'COURSE', name: `${offering.course.code} · ${offering.course.title}`, description: 'Course community for enrolled students and assigned faculty.', departmentId: department.id, programId: programme.id, batchId: offering.section.batch.id, sectionId: offering.section.id, semesterNumber: offering.term.number, courseId: offering.course.id, courseOfferingId: offering.id }));
  }
  const unique = [...new Set(desired)];
  for (const communityId of unique) await upsertMember(session, communityId, 'FACULTY');
  await removeStaleAcademicMemberships(session, unique);
  return unique;
}

async function syncManagement(session: ChatSession) {
  if (!PLATFORM_MANAGERS.includes(session.role) && session.role !== 'HOD') return [] as string[];
  let departmentId: string | undefined;
  if (session.role === 'HOD') {
    const staff = await prisma.staff.findFirst({ where: { userId: session.userId, tenantId: session.tenantId }, select: { departmentId: true } });
    departmentId = staff?.departmentId ?? undefined;
    if (!departmentId) return [] as string[];
  }
  const communities = await prisma.chatCommunity.findMany({
    where: { tenantId: session.tenantId, type: { in: ACADEMIC_TYPES }, isActive: true, isArchived: false, ...(departmentId ? { departmentId } : {}) },
    select: { id: true },
    take: 500,
  });
  const memberRole: ChatMemberRole = session.role === 'HOD' ? 'MODERATOR' : 'ADMIN';
  for (const community of communities) await upsertMember(session, community.id, memberRole);
  return communities.map((community) => community.id);
}

async function removeStaleAcademicMemberships(session: ChatSession, desired: string[]) {
  if (!['STUDENT', 'FACULTY'].includes(session.role)) return;
  const stale = await prisma.chatCommunityMember.findMany({
    where: {
      tenantId: session.tenantId,
      userId: session.userId,
      community: { type: { in: ACADEMIC_TYPES } },
      ...(desired.length ? { communityId: { notIn: desired } } : {}),
    },
    select: { id: true },
  });
  if (stale.length) await prisma.chatCommunityMember.deleteMany({ where: { id: { in: stale.map((item) => item.id) } } });
}

export async function syncAcademicCommunities(session: ChatSession) {
  if (session.role === 'STUDENT') return syncStudent(session);
  if (session.role === 'FACULTY') return syncFaculty(session);
  return syncManagement(session);
}

async function isStrictlyEligible(session: ChatSession, community: AcademicCommunityScope) {
  if (PLATFORM_MANAGERS.includes(session.role)) return true;
  if (session.role === 'HOD') {
    const staff = await prisma.staff.findFirst({ where: { userId: session.userId, tenantId: session.tenantId }, select: { departmentId: true } });
    return Boolean(staff?.departmentId && community.departmentId === staff.departmentId);
  }
  if (session.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { userId: session.userId, tenantId: session.tenantId },
      select: {
        batchId: true,
        sectionId: true,
        batch: { select: { programId: true } },
        enrollments: { select: { courseOfferingId: true, courseOffering: { select: { term: { select: { number: true } } } } } },
      },
    });
    if (!student) return false;
    if (community.type === 'BRANCH' || community.type === 'PROGRAMME') return Boolean(community.programId && community.programId === student.batch.programId);
    if (community.type === 'BATCH') return Boolean(community.batchId && community.batchId === student.batchId);
    if (community.type === 'SECTION') return Boolean(community.sectionId && community.sectionId === student.sectionId);
    if (community.type === 'SEMESTER') return Boolean(community.batchId === student.batchId && community.semesterNumber !== null && student.enrollments.some((item) => item.courseOffering.term.number === community.semesterNumber));
    if (community.type === 'COURSE') return Boolean(community.courseOfferingId && student.enrollments.some((item) => item.courseOfferingId === community.courseOfferingId));
    return false;
  }
  if (session.role === 'FACULTY') {
    const staff = await prisma.staff.findFirst({
      where: { userId: session.userId, tenantId: session.tenantId },
      select: {
        courseOfferings: {
          select: {
            id: true,
            sectionId: true,
            section: { select: { batchId: true, batch: { select: { programId: true } } } },
            term: { select: { number: true } },
          },
        },
      },
    });
    if (!staff) return false;
    if (community.type === 'BRANCH' || community.type === 'PROGRAMME') return Boolean(community.programId && staff.courseOfferings.some((item) => item.section.batch.programId === community.programId));
    if (community.type === 'BATCH') return Boolean(community.batchId && staff.courseOfferings.some((item) => item.section.batchId === community.batchId));
    if (community.type === 'SECTION') return Boolean(community.sectionId && staff.courseOfferings.some((item) => item.sectionId === community.sectionId));
    if (community.type === 'SEMESTER') return Boolean(community.semesterNumber !== null && staff.courseOfferings.some((item) => item.term.number === community.semesterNumber && (!community.batchId || item.section.batchId === community.batchId)));
    if (community.type === 'COURSE') return Boolean(community.courseOfferingId && staff.courseOfferings.some((item) => item.id === community.courseOfferingId));
    return false;
  }
  return false;
}

export async function assertStrictAcademicAccess(session: ChatSession, communityId: string) {
  await syncAcademicCommunities(session);
  const [community, membership] = await Promise.all([
    prisma.chatCommunity.findFirst({ where: { id: communityId, tenantId: session.tenantId, type: { in: ACADEMIC_TYPES }, isActive: true, isArchived: false } }),
    prisma.chatCommunityMember.findFirst({ where: { communityId, userId: session.userId, tenantId: session.tenantId }, select: { role: true, isMuted: true } }),
  ]);
  if (!community || !membership || membership.role === 'SUSPENDED') throw new Error('CHAT_NOT_AUTHORISED');
  if (!(await isStrictlyEligible(session, community))) throw new Error('CHAT_NOT_AUTHORISED');
  return { community, membership };
}

export async function listStrictAcademicCommunities(session: ChatSession): Promise<AcademicCommunityListItem[]> {
  await syncAcademicCommunities(session);
  const memberships = await prisma.chatCommunityMember.findMany({
    where: { tenantId: session.tenantId, userId: session.userId, community: { type: { in: ACADEMIC_TYPES }, isActive: true, isArchived: false } },
    include: { community: true },
    orderBy: [{ isPinned: 'desc' }, { unreadCount: 'desc' }, { joinedAt: 'desc' }],
  });
  const authorised = [] as typeof memberships;
  for (const membership of memberships) {
    if (await isStrictlyEligible(session, membership.community)) authorised.push(membership);
  }
  return Promise.all(authorised.map(async (item) => {
    const [memberCount, lastMessage] = await Promise.all([
      prisma.chatCommunityMember.count({ where: { tenantId: session.tenantId, communityId: item.communityId, role: { not: 'SUSPENDED' } } }),
      prisma.chatMessage.findFirst({ where: { tenantId: session.tenantId, communityId: item.communityId, isDeleted: false, moderationStatus: { in: ['ALLOWED', 'ALLOWED_WITH_WARNING', 'RESTORED'] } }, orderBy: { createdAt: 'desc' }, select: { body: true, messageType: true, createdAt: true } }),
    ]);
    return {
      id: item.communityId,
      name: item.community.name,
      description: item.community.description,
      type: item.community.type,
      memberCount,
      unreadCount: item.unreadCount,
      lastMessagePreview: lastMessage ? (lastMessage.messageType === 'TEXT' ? lastMessage.body.slice(0, 100) : `[${lastMessage.messageType}]`) : null,
      lastActivityAt: lastMessage?.createdAt.toISOString() ?? null,
      isPinned: item.isPinned,
      isMuted: item.isMuted,
      isArchived: item.community.isArchived,
    };
  }));
}

function fileSignatureLooksValid(bytes: Uint8Array, mimeType: string) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const ascii = (start: number, value: string) => [...value].every((character, index) => bytes[start + index] === character.charCodeAt(0));
  if (mimeType === 'image/jpeg') return starts(0xff, 0xd8, 0xff);
  if (mimeType === 'image/png') return starts(0x89, 0x50, 0x4e, 0x47);
  if (mimeType === 'image/gif') return ascii(0, 'GIF8');
  if (mimeType === 'image/webp') return ascii(0, 'RIFF') && ascii(8, 'WEBP');
  if (mimeType === 'video/mp4' || mimeType === 'audio/mp4') return ascii(4, 'ftyp');
  if (mimeType === 'video/webm' || mimeType === 'audio/webm') return starts(0x1a, 0x45, 0xdf, 0xa3);
  if (mimeType === 'audio/ogg') return ascii(0, 'OggS');
  if (mimeType === 'audio/wav') return ascii(0, 'RIFF') && ascii(8, 'WAVE');
  if (mimeType === 'audio/mpeg') return ascii(0, 'ID3') || (bytes[0] === 0xff && Boolean(bytes[1] && (bytes[1] & 0xe0) === 0xe0));
  if (mimeType === 'application/pdf') return ascii(0, '%PDF');
  if (mimeType.includes('openxmlformats')) return starts(0x50, 0x4b);
  return mimeType === 'text/plain' || mimeType === 'text/csv';
}

export async function prepareSecureAttachment(file: File) {
  const safeName = sanitizeFileName(file.name || 'attachment');
  if (BLOCKED_FILE_EXTENSION.test(safeName)) throw new Error('CHAT_FILE_BLOCKED');
  let attachmentType: ChatAttachmentType;
  let messageType: ChatMessageType;
  let limit: number;
  if (IMAGE_TYPES.has(file.type)) { attachmentType = file.type === 'image/gif' ? 'GIF' : 'IMAGE'; messageType = file.type === 'image/gif' ? 'GIF' : 'IMAGE'; limit = MAX_IMAGE_BYTES; }
  else if (VIDEO_TYPES.has(file.type)) { attachmentType = 'VIDEO'; messageType = 'VIDEO'; limit = MAX_VIDEO_BYTES; }
  else if (AUDIO_TYPES.has(file.type)) { attachmentType = 'DOCUMENT'; messageType = 'DOCUMENT'; limit = MAX_VOICE_BYTES; }
  else if (DOCUMENT_TYPES.has(file.type)) { attachmentType = 'DOCUMENT'; messageType = 'DOCUMENT'; limit = MAX_DOCUMENT_BYTES; }
  else throw new Error('CHAT_FILE_BLOCKED');
  if (file.size > limit) throw new Error('CHAT_FILE_TOO_LARGE');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileSignatureLooksValid(bytes, file.type)) throw new Error('CHAT_FILE_SIGNATURE');
  return { attachmentType, messageType, fileName: safeName, mimeType: file.type, fileSizeBytes: file.size, fileUrl: `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}` };
}

function canPost(role: RoleType, memberRole: ChatMemberRole, postingPolicy: ChatPostingPolicy) {
  if (memberRole === 'MUTED' || memberRole === 'SUSPENDED' || memberRole === 'OBSERVER') return false;
  if (postingPolicy === 'ALL_MEMBERS') return true;
  if (postingPolicy === 'FACULTY_ONLY') return role === 'FACULTY' || ['FACULTY', 'TEACHING_ASSISTANT', 'MODERATOR', 'ADMIN', 'OWNER'].includes(memberRole);
  if (postingPolicy === 'MODERATORS_ONLY') return ['MODERATOR', 'ADMIN', 'OWNER'].includes(memberRole);
  return ['ADMIN', 'OWNER'].includes(memberRole);
}

export async function sendStrictAcademicMessage(session: ChatSession, communityId: string, input: { body: string; replyToId?: string; files: File[] }) {
  const access = await assertStrictAcademicAccess(session, communityId);
  if (!canPost(session.role, access.membership.role, access.community.postingPolicy)) throw new Error('CHAT_NOT_AUTHORISED');
  if (input.files.length > MAX_ATTACHMENTS) throw new Error('CHAT_TOO_MANY_FILES');
  if (access.community.mediaPolicy === 'TEXT_ONLY' && input.files.length) throw new Error('CHAT_FILE_BLOCKED');

  const recent = await prisma.chatMessage.count({ where: { tenantId: session.tenantId, communityId, authorId: session.userId, createdAt: { gte: new Date(Date.now() - MESSAGE_RATE_WINDOW_MS) } } });
  if (recent >= MESSAGE_RATE_LIMIT) throw new Error('CHAT_RATE_LIMIT');

  const body = sanitizeMessageText(input.body ?? '').slice(0, MAX_TEXT);
  if (ABUSIVE_LANGUAGE.test(body)) throw new Error('CHAT_CONTENT_BLOCKED');
  const moderation = moderateText(body);
  if (moderation.status !== 'ALLOWED' && moderation.status !== 'ALLOWED_WITH_WARNING') throw new Error('CHAT_CONTENT_BLOCKED');
  const links = extractLinks(body);
  for (const link of links) {
    if (checkLinkSafety(link).status === 'BLOCKED') throw new Error('CHAT_LINK_BLOCKED');
  }
  const attachments = await Promise.all(input.files.map(prepareSecureAttachment));
  if (access.community.mediaPolicy === 'IMAGES_ONLY' && attachments.some((item) => item.attachmentType !== 'IMAGE' && item.attachmentType !== 'GIF')) throw new Error('CHAT_FILE_BLOCKED');
  if (access.community.mediaPolicy === 'DOCUMENTS_ONLY' && attachments.some((item) => item.attachmentType !== 'DOCUMENT')) throw new Error('CHAT_FILE_BLOCKED');
  if (!body && attachments.length === 0) throw new Error('CHAT_EMPTY');
  if (input.replyToId) {
    const parent = await prisma.chatMessage.findFirst({ where: { id: input.replyToId, tenantId: session.tenantId, communityId, isDeleted: false }, select: { id: true } });
    if (!parent) throw new Error('CHAT_REPLY_INVALID');
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        tenantId: session.tenantId,
        communityId,
        authorId: session.userId,
        messageType: attachments[0]?.messageType ?? (links.length ? 'LINK' : 'TEXT'),
        body,
        sanitizedBody: body,
        replyToId: input.replyToId ?? null,
        threadId: input.replyToId ?? null,
        moderationStatus: moderation.status as ChatModerationStatus,
        moderationReason: moderation.reason,
        mentions: extractMentions(body),
        hashtags: extractHashtags(body),
        linkUrls: links,
        attachments: attachments.length ? { create: attachments.map((attachment) => ({ tenantId: session.tenantId, attachmentType: attachment.attachmentType, fileName: attachment.fileName, fileUrl: attachment.fileUrl, mimeType: attachment.mimeType, fileSizeBytes: attachment.fileSizeBytes, processingState: 'READY', isSafe: true, scanResult: 'MIME_SIGNATURE_VALIDATED' })) } : undefined,
      },
      include: { author: { select: { name: true, avatarUrl: true, role: true } }, attachments: true },
    });
    await tx.chatCommunityMember.updateMany({ where: { tenantId: session.tenantId, communityId, userId: { not: session.userId }, isMuted: false }, data: { unreadCount: { increment: 1 } } });
    await tx.chatAuditEvent.create({ data: { tenantId: session.tenantId, communityId, actorId: session.userId, eventType: 'community.message.created', entityType: 'ChatMessage', entityId: created.id } });
    return created;
  });

  return {
    id: message.id,
    communityId,
    author: message.author,
    messageType: message.messageType,
    body: message.sanitizedBody ?? message.body,
    sanitizedBody: message.sanitizedBody,
    replyToId: message.replyToId,
    replyTo: null,
    threadId: message.threadId,
    moderationStatus: message.moderationStatus,
    isEdited: false,
    isDeleted: false,
    mentions: message.mentions,
    hashtags: message.hashtags,
    linkUrls: message.linkUrls,
    attachments: message.attachments.map((attachment) => ({ id: attachment.id, attachmentType: attachment.attachmentType, fileName: attachment.fileName, fileUrl: `/api/community/chat/attachments/${attachment.id}`, mimeType: attachment.mimeType, fileSizeBytes: attachment.fileSizeBytes, altText: attachment.altText, durationSecs: attachment.durationSecs, processingState: attachment.processingState, isSafe: attachment.isSafe })),
    reactions: [],
    replyCount: 0,
    isPinned: false,
    isBookmarked: false,
    createdAt: message.createdAt.toISOString(),
    editedAt: null,
  };
}

export function secureMessageAttachmentUrls<T extends { attachments?: Array<{ id: string; fileUrl: string }> }>(message: T): T {
  if (!message.attachments) return message;
  return { ...message, attachments: message.attachments.map((attachment) => ({ ...attachment, fileUrl: `/api/community/chat/attachments/${attachment.id}` })) };
}

export async function loadSecureAttachment(session: ChatSession, attachmentId: string) {
  const attachment = await prisma.chatAttachment.findFirst({ where: { id: attachmentId, tenantId: session.tenantId, isSafe: true }, include: { message: { select: { communityId: true, moderationStatus: true, isDeleted: true } } } });
  if (!attachment || attachment.message.isDeleted || !['ALLOWED', 'ALLOWED_WITH_WARNING', 'RESTORED'].includes(attachment.message.moderationStatus)) throw new Error('CHAT_ATTACHMENT_NOT_FOUND');
  await assertStrictAcademicAccess(session, attachment.message.communityId);
  const encoded = /^data:([^;]+);base64,(.+)$/.exec(attachment.fileUrl);
  if (!encoded) throw new Error('CHAT_ATTACHMENT_NOT_FOUND');
  return { fileName: attachment.fileName, mimeType: attachment.mimeType, bytes: Buffer.from(encoded[2], 'base64') };
}

export function chatHttpError(error: unknown) {
  const code = error instanceof Error ? error.message : 'CHAT_ERROR';
  if (code === 'CHAT_NOT_AUTHORISED') return { status: 403, error: 'You are not authorised for this academic community.' };
  if (code === 'CHAT_RATE_LIMIT') return { status: 429, error: 'You are sending messages too quickly. Please wait a moment.' };
  if (code === 'CHAT_CONTENT_BLOCKED') return { status: 422, error: 'This message was not sent because it may violate CampusOS Community Guidelines.' };
  if (code === 'CHAT_LINK_BLOCKED') return { status: 422, error: 'This link is not allowed because it may be unsafe.' };
  if (code === 'CHAT_FILE_TOO_LARGE') return { status: 413, error: 'Images, short videos and voice notes are limited to 5 MB. Documents are limited to 10 MB.' };
  if (code === 'CHAT_TOO_MANY_FILES') return { status: 422, error: 'A message can include up to five attachments.' };
  if (code === 'CHAT_FILE_BLOCKED' || code === 'CHAT_FILE_SIGNATURE') return { status: 415, error: 'That attachment type is not allowed or its file signature is invalid.' };
  if (code === 'CHAT_EMPTY') return { status: 422, error: 'Write a message or add an attachment before sending.' };
  if (code === 'CHAT_ATTACHMENT_NOT_FOUND') return { status: 404, error: 'Attachment not found or not available.' };
  return { status: 400, error: 'The community request could not be completed.' };
}
