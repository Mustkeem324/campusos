import { ChatAttachmentType, ChatMemberRole, ChatMessageType, ChatModerationActionType, ChatModerationStatus, ChatReactionType, ChatReportReason, PrismaClient, RoleType, Prisma } from '@prisma/client';
import { checkSlidingWindowRateLimit } from './security-service';
import { recordAuditLog } from './audit-service';

// ==================================================
// TYPES & INTERFACES
// ==================================================

export interface ChatSession {
  userId: string;
  tenantId: string;
  role: RoleType;
}

export interface SafeUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: RoleType;
}

export interface CommunitySummary {
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
}

export interface MessageDTO {
  id: string;
  communityId: string;
  author: SafeUser;
  messageType: string;
  body: string;
  sanitizedBody: string | null;
  replyToId: string | null;
  replyTo: { id: string; authorName: string; bodyPreview: string } | null;
  threadId: string | null;
  moderationStatus: string;
  isEdited: boolean;
  isDeleted: boolean;
  mentions: string[];
  hashtags: string[];
  linkUrls: string[];
  attachments: AttachmentDTO[];
  reactions: ReactionDTO[];
  replyCount: number;
  isPinned: boolean;
  isBookmarked: boolean;
  createdAt: string;
  editedAt: string | null;
}

export interface AttachmentDTO {
  id: string;
  attachmentType: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  altText: string | null;
  durationSecs: number | null;
  widthPx: number | null;
  heightPx: number | null;
  processingState: string;
  isSafe: boolean;
}

export interface ReactionDTO {
  reactionType: string;
  count: number;
  userIds: string[];
}

export interface ModerationResult {
  status: 'ALLOWED' | 'ALLOWED_WITH_WARNING' | 'PENDING_REVIEW' | 'HIDDEN_PENDING_REVIEW' | 'BLOCKED';
  reason: string | null;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categories: string[];
}

// ==================================================
// CONTENT MODERATION ENGINE
// ==================================================

const PROHIBITED_PATTERNS: { pattern: RegExp; category: string; severity: 'HIGH' | 'CRITICAL' | 'MEDIUM' }[] = [
  { pattern: /\b(porn|pornograph|nude|nudity|xxx|adult\s*content|explicit\s*sex|sexual\s*content|hentai|cp\b|child\s*porn|csam|sexual\s*harassment|non[\s-]*consensual|revenge\s*porn|nudes?\s*pic|dick\s*pic|send\s*nudes)\b/i, category: 'SEXUAL_CONTENT', severity: 'CRITICAL' },
  { pattern: /\b(hate\s*speech|kill\s*all\s*|racial\s*slur|ethnic\s*cleansing|genocide|white\s*power|nazi|neo[\s-]*nazi|supremacist|deport\s*all|inferior\s*race)\b/i, category: 'HATE_SPEECH', severity: 'CRITICAL' },
  { pattern: /\b(i\s*will\s*kill|threat\s*to\s*kill|bomb\s*threat|school\s*shooting|mass\s*shooting|shoot\s*up\s*the|slaughter|behead|assassinate|murder\s*you|rape\s*you|will\s*rape)\b/i, category: 'THREAT_VIOLENCE', severity: 'CRITICAL' },
  { pattern: /\b(kill\s*yourself|kys|end\s*your\s*life|everyone\s*hates\s*you|you\s*are\s*worthless|nobody\s*likes\s*you|go\s*die|jump\s*off\s*a\s*bridge|you\s*should\s*die)\b/i, category: 'HARASSMENT', severity: 'HIGH' },
  { pattern: /\b(home\s*address\s*is|real\s*address\s*is|phone\s*number\s*is|ssn\s*is|social\s*security\s*is|doxx|dox\s*them|expose\s*their\s*address|leaked\s*address)\b/i, category: 'DOXXING', severity: 'HIGH' },
  { pattern: /\b(buy\s*essay|essay\s*writing\s*service|pay\s*for\s*grades|cheat\s*sheet\s*for\s*sale|exam\s*paper\s*leak|leaked\s*question\s*paper|plagiarism\s*service|assignment\s*for\s*sale|pay\s*someone\s*to\s*do\s*my\s*assignment|test\s*answers\s*for\s*sale)\b/i, category: 'ACADEMIC_CHEATING', severity: 'HIGH' },
  { pattern: /\b(click\s*here\s*to\s*win|free\s*money|nigerian\s*prince|crypto\s*giveaway|double\s*your\s*bitcoin|investment\s*scheme|get\s*rich\s*quick|free\s*iphone|you\s*won\s*a\s*prize|claim\s*your\s*reward)\b/i, category: 'SCAM_SPAM', severity: 'MEDIUM' },
  { pattern: /\b(buy\s*drugs\s*online|drug\s*marketplace|illegal\s*weapons\s*for\s*sale|stolen\s*credit\s*cards|cvv\s*for\s*sale|counterfeit\s*money|fake\s*id\s*for\s*sale)\b/i, category: 'ILLEGAL_GOODS', severity: 'CRITICAL' },
];

const SPAM_PATTERNS: { pattern: RegExp; category: string }[] = [
  { pattern: /(.)\1{20,}/i, category: 'EXCESSIVE_REPETITION' },
  { pattern: /(https?:\/\/\S+\s*){5,}/i, category: 'MASS_LINKS' },
  { pattern: /(@\S+\s*){10,}/i, category: 'MASS_MENTIONS' },
  { pattern: /\b(free\s*money|click\s*here\s*now|limited\s*offer|act\s*now|buy\s*now|subscribe\s*now)\b/i, category: 'SPAM_KEYWORDS' },
];

const BLOCKED_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'malware-site.example', 'phishing-site.example', 'scam-site.example',
  'adult-content.example', 'pirated-content.example',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv', 'application/zip',
];
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar',
  '.msi', '.dll', '.scr', '.com', '.app', '.deb', '.rpm', '.apk', '.ipa', '.widget',
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION = 120;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_IMAGES_PER_MESSAGE = 5;

// ==================================================
// TEXT MODERATION
// ==================================================

export function moderateText(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { status: 'ALLOWED', reason: null, severity: 'NONE', categories: [] };
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { status: 'BLOCKED', reason: 'Message exceeds maximum length', severity: 'MEDIUM', categories: ['EXCESSIVE_LENGTH'] };
  }

  const categories: string[] = [];
  let maxSeverity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';

  for (const { pattern, category, severity } of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      categories.push(category);
      if (severity === 'CRITICAL') maxSeverity = 'CRITICAL';
      else if (severity === 'HIGH' && maxSeverity !== 'CRITICAL') maxSeverity = 'HIGH';
      else if (severity === 'MEDIUM' && maxSeverity === 'NONE') maxSeverity = 'MEDIUM';
    }
  }

  for (const { pattern, category } of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      categories.push(category);
      if (maxSeverity === 'NONE') maxSeverity = 'MEDIUM';
    }
  }

  if (maxSeverity === 'CRITICAL') {
    return { status: 'HIDDEN_PENDING_REVIEW', reason: 'Content may violate Community Guidelines (severe risk detected)', severity: 'CRITICAL', categories };
  }
  if (maxSeverity === 'HIGH') {
    return { status: 'PENDING_REVIEW', reason: 'Content flagged for moderator review', severity: 'HIGH', categories };
  }
  if (maxSeverity === 'MEDIUM') {
    return { status: 'ALLOWED_WITH_WARNING', reason: 'Content may be spam or inappropriate', severity: 'MEDIUM', categories };
  }
  return { status: 'ALLOWED', reason: null, severity: 'NONE', categories: [] };
}

// ==================================================
// HTML SANITIZATION
// ==================================================

export function sanitizeMessageText(text: string): string {
  let sanitized = text.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/[ \t]+/g, ' ').trim();
  if (sanitized.length > MAX_MESSAGE_LENGTH) sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
  return sanitized;
}

// ==================================================
// LINK SAFETY
// ==================================================

export function checkLinkSafety(url: string): { status: 'SAFE' | 'WARNING' | 'BLOCKED'; reason: string | null } {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { status: 'BLOCKED', reason: 'Only HTTP/HTTPS links are allowed' };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' ||
        hostname.startsWith('10.') || hostname.startsWith('172.16.') || hostname.startsWith('192.168.') ||
        hostname.endsWith('.local') || hostname.endsWith('.internal') || /^169\.254\./.test(hostname)) {
      return { status: 'BLOCKED', reason: 'Internal network links are not allowed' };
    }
    if (BLOCKED_DOMAINS.includes(hostname)) {
      return { status: 'BLOCKED', reason: 'This domain is known to be unsafe' };
    }
    const shortenedDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly'];
    if (shortenedDomains.includes(hostname)) {
      return { status: 'WARNING', reason: 'Shortened links may be unsafe. Please verify the destination.' };
    }
    if (parsed.protocol === 'http:') {
      return { status: 'WARNING', reason: 'This link is not secure (HTTP). HTTPS is recommended.' };
    }
    return { status: 'SAFE', reason: null };
  } catch {
    return { status: 'BLOCKED', reason: 'Invalid URL format' };
  }
}

export function extractLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"']+/gi);
  return matches ? matches : [];
}

export function extractMentions(text: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  const regex = /@([a-zA-Z0-9_]+)/g;
  while ((match = regex.exec(text)) !== null) matches.push(match[1]);
  return matches;
}

export function extractHashtags(text: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  const regex = /#([a-zA-Z0-9_]+)/g;
  while ((match = regex.exec(text)) !== null) matches.push(match[1]);
  return matches;
}

// ==================================================
// FILE VALIDATION
// ==================================================

export interface FileValidationResult {
  allowed: boolean;
  attachmentType: 'IMAGE' | 'VIDEO' | 'GIF' | 'DOCUMENT' | null;
  reason: string | null;
}

export function validateFile(fileName: string, mimeType: string, fileSizeBytes: number, durationSecs?: number): FileValidationResult {
  const lowerName = fileName.toLowerCase();
  for (const ext of BLOCKED_EXTENSIONS) {
    if (lowerName.endsWith(ext)) return { allowed: false, attachmentType: null, reason: `File type "${ext}" is not allowed for security reasons` };
  }
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    if (fileSizeBytes > MAX_IMAGE_SIZE) return { allowed: false, attachmentType: 'IMAGE', reason: `Image exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
    return { allowed: true, attachmentType: 'IMAGE', reason: null };
  }
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    if (fileSizeBytes > MAX_VIDEO_SIZE) return { allowed: false, attachmentType: 'VIDEO', reason: `Video exceeds maximum size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB` };
    if (durationSecs !== undefined && durationSecs > MAX_VIDEO_DURATION) return { allowed: false, attachmentType: 'VIDEO', reason: `Video exceeds maximum duration of ${MAX_VIDEO_DURATION} seconds` };
    return { allowed: true, attachmentType: 'VIDEO', reason: null };
  }
  if (mimeType === 'image/gif') {
    if (fileSizeBytes > MAX_IMAGE_SIZE) return { allowed: false, attachmentType: 'GIF', reason: `GIF exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
    return { allowed: true, attachmentType: 'GIF', reason: null };
  }
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    if (fileSizeBytes > MAX_DOCUMENT_SIZE) return { allowed: false, attachmentType: 'DOCUMENT', reason: `Document exceeds maximum size of ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB` };
    return { allowed: true, attachmentType: 'DOCUMENT', reason: null };
  }
  return { allowed: false, attachmentType: null, reason: `File type "${mimeType}" is not supported` };
}

export function sanitizeFileName(fileName: string): string {
  let sanitized = fileName.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    sanitized = sanitized.substring(0, 255 - ext.length - 1) + '.' + ext;
  }
  return sanitized;
}

// ==================================================
// RATE LIMITING
// ==================================================

export function checkMessageRateLimit(userId: string) { return checkSlidingWindowRateLimit(`chat:msg:${userId}`, 30, 60000); }
export function checkUploadRateLimit(userId: string) { return checkSlidingWindowRateLimit(`chat:upload:${userId}`, 10, 60000); }
export function checkMentionRateLimit(userId: string) { return checkSlidingWindowRateLimit(`chat:mention:${userId}`, 20, 60000); }

// ==================================================
// PERMISSIONS
// ==================================================

export function canModerateCommunity(role: RoleType, memberRole: string | null): boolean {
  if (role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN') return true;
  if (!memberRole) return false;
  return ['OWNER', 'ADMIN', 'MODERATOR', 'FACULTY'].includes(memberRole);
}

export function canPinMessages(role: RoleType, memberRole: string | null): boolean {
  if (role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN') return true;
  if (!memberRole) return false;
  return ['OWNER', 'ADMIN', 'MODERATOR', 'FACULTY'].includes(memberRole);
}

export function canCreatePoll(role: RoleType, memberRole: string | null): boolean {
  if (role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN') return true;
  if (!memberRole) return false;
  return ['OWNER', 'ADMIN', 'MODERATOR', 'FACULTY', 'TEACHING_ASSISTANT'].includes(memberRole);
}

export function canManageCommunity(role: RoleType, memberRole: string | null): boolean {
  if (role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN') return true;
  if (!memberRole) return false;
  return ['OWNER', 'ADMIN'].includes(memberRole);
}

export function canPostToCommunity(role: RoleType, memberRole: string | null, postingPolicy: string): boolean {
  if (!memberRole || memberRole === 'SUSPENDED' || memberRole === 'MUTED') return false;
  if (postingPolicy === 'ALL_MEMBERS') return true;
  if (postingPolicy === 'FACULTY_ONLY') return ['FACULTY', 'TEACHING_ASSISTANT', 'MODERATOR', 'ADMIN', 'OWNER'].includes(memberRole) || role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN';
  if (postingPolicy === 'MODERATORS_ONLY') return ['MODERATOR', 'ADMIN', 'OWNER'].includes(memberRole) || role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN';
  if (postingPolicy === 'ANNOUNCEMENT_ONLY') return ['ADMIN', 'OWNER'].includes(memberRole) || role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN';
  return false;
}

export function canUploadMedia(role: RoleType, memberRole: string | null, mediaPolicy: string): boolean {
  if (!memberRole || memberRole === 'SUSPENDED' || memberRole === 'MUTED') return false;
  if (mediaPolicy === 'TEXT_ONLY') return false;
  return true;
}

// ==================================================
// MEMBERSHIP ELIGIBILITY
// ==================================================

export interface EligibilityContext {
  isStudent: boolean;
  isStaff: boolean;
  batchId?: string;
  sectionId?: string;
  programId?: string;
  departmentId?: string;
  enrolledCourseOfferingIds: string[];
  staffCourseOfferingIds: string[];
}

export function isEligibleForCommunity(community: {
  type: string; campusId: string | null; departmentId: string | null; programId: string | null;
  batchId: string | null; sectionId: string | null; semesterNumber: number | null;
  courseId: string | null; courseOfferingId: string | null;
}, ctx: EligibilityContext): boolean {
  if (community.type === 'UNIVERSITY' || community.type === 'CAMPUS') return true;
  if (community.type === 'DEPARTMENT') { if (!community.departmentId) return true; return ctx.departmentId === community.departmentId; }
  if (community.type === 'BRANCH' || community.type === 'PROGRAMME') { if (!community.programId) return true; return ctx.programId === community.programId; }
  if (community.type === 'BATCH') { if (!community.batchId) return true; return ctx.batchId === community.batchId; }
  if (community.type === 'SECTION') { if (!community.sectionId) return true; return ctx.sectionId === community.sectionId; }
  if (community.type === 'SEMESTER') { if (!community.batchId) return true; return ctx.batchId === community.batchId; }
  if (community.type === 'COURSE') {
    if (!community.courseOfferingId) return true;
    if (ctx.isStudent) return ctx.enrolledCourseOfferingIds.includes(community.courseOfferingId);
    if (ctx.isStaff) return ctx.staffCourseOfferingIds.includes(community.courseOfferingId);
    return false;
  }
  if (community.type === 'FACULTY_ANNOUNCEMENT_CHANNEL') return ctx.isStaff || !ctx.isStudent;
  if (['PROJECT_GROUP', 'STUDY_GROUP', 'CLUB', 'PLACEMENT_GROUP'].includes(community.type)) return true;
  return false;
}

// ==================================================
// DTO MAPPERS
// ==================================================

export function toSafeUser(user: { id: string; name: string; avatarUrl: string | null; role: RoleType }): SafeUser {
  return { id: user.id, name: user.name, avatarUrl: user.avatarUrl, role: user.role };
}

type MessageWithIncludes = Prisma.ChatMessageGetPayload<{
  include: {
    author: { select: { id: true; name: true; avatarUrl: true; role: true } };
    attachments: true;
    reactions: { select: { reactionType: true; userId: true } };
    replyTo: { include: { author: { select: { id: true; name: true } } } };
    _count: { select: { replies: true } };
    pinnedEntries: { where: { communityId: string } };
    bookmarks: { where: { userId: string } };
  };
}>;

function mapMessageToDTO(msg: MessageWithIncludes): MessageDTO {
  const reactionMap = new Map<string, string[]>();
  for (const r of msg.reactions) {
    const existing = reactionMap.get(r.reactionType) || [];
    existing.push(r.userId);
    reactionMap.set(r.reactionType, existing);
  }
  const reactions: ReactionDTO[] = Array.from(reactionMap.entries()).map(([type, userIds]) => ({
    reactionType: type, count: userIds.length, userIds,
  }));

  return {
    id: msg.id, communityId: msg.communityId, author: toSafeUser(msg.author),
    messageType: msg.messageType, body: msg.body, sanitizedBody: msg.sanitizedBody,
    replyToId: msg.replyToId,
    replyTo: msg.replyTo ? { id: msg.replyTo.id, authorName: msg.replyTo.author.name, bodyPreview: msg.replyTo.body.substring(0, 80) } : null,
    threadId: msg.threadId, moderationStatus: msg.moderationStatus,
    isEdited: msg.isEdited, isDeleted: msg.isDeleted,
    mentions: msg.mentions, hashtags: msg.hashtags, linkUrls: msg.linkUrls,
    attachments: msg.attachments.map((a) => ({
      id: a.id, attachmentType: a.attachmentType, fileName: a.fileName, fileUrl: a.fileUrl,
      thumbnailUrl: a.thumbnailUrl, mimeType: a.mimeType, fileSizeBytes: a.fileSizeBytes,
      altText: a.altText, durationSecs: a.durationSecs, widthPx: a.widthPx, heightPx: a.heightPx,
      processingState: a.processingState, isSafe: a.isSafe,
    })),
    reactions, replyCount: msg._count.replies,
    isPinned: msg.pinnedEntries.length > 0, isBookmarked: msg.bookmarks.length > 0,
    createdAt: msg.createdAt.toISOString(), editedAt: msg.editedAt?.toISOString() || null,
  };
}

// ==================================================
// COMMUNITY CHAT SERVICE
// ==================================================

export class CommunityChatService {
  constructor(private db: PrismaClient) {}

  async listCommunitiesForUser(session: ChatSession): Promise<CommunitySummary[]> {
    const ctx = await this.getUserEligibilityContext(session);
    const communities = await this.db.chatCommunity.findMany({
      where: { tenantId: session.tenantId, isActive: true, isArchived: false },
      include: {
        _count: { select: { members: true } },
        members: { where: { userId: session.userId } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, messageType: true } },
      },
    });

    const result: CommunitySummary[] = [];
    for (const community of communities) {
      if (!isEligibleForCommunity(community, ctx)) continue;
      const membership = community.members[0];
      const lastMsg = community.messages[0];
      result.push({
        id: community.id, name: community.name, description: community.description, type: community.type,
        memberCount: community._count.members, unreadCount: membership?.unreadCount || 0,
        lastMessagePreview: lastMsg ? (lastMsg.messageType === 'TEXT' ? lastMsg.body.substring(0, 100) : `[${lastMsg.messageType}]`) : null,
        lastActivityAt: lastMsg?.createdAt.toISOString() || null,
        isPinned: membership?.isPinned || false, isMuted: membership?.isMuted || false, isArchived: community.isArchived,
      });
    }

    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bTime - aTime;
    });
    return result;
  }

  async getCommunity(session: ChatSession, communityId: string) {
    const community = await this.db.chatCommunity.findFirst({
      where: { id: communityId, tenantId: session.tenantId },
      include: {
        _count: { select: { members: true, messages: true } },
        members: { where: { userId: session.userId } },
        pinnedMessages: {
          include: { message: { include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } } } },
          orderBy: { createdAt: 'desc' }, take: 5,
        },
      },
    });
    if (!community) return null;
    const membership = await this.verifyMembership(session, communityId);
    if (!membership) return null;
    return community;
  }

  async getCommunityMembers(session: ChatSession, communityId: string) {
    const membership = await this.verifyMembership(session, communityId);
    if (!membership) return null;
    const members = await this.db.chatCommunityMember.findMany({
      where: { communityId, tenantId: session.tenantId },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
    const userIds = members.map((m) => m.userId);
    const users = await this.db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return members.map((m) => ({
      id: m.id, role: m.role, isMuted: m.isMuted, joinedAt: m.joinedAt.toISOString(),
      user: userMap.get(m.userId) ? toSafeUser(userMap.get(m.userId)!) : null,
    }));
  }

  async verifyMembership(session: ChatSession, communityId: string): Promise<{ role: string; isMuted: boolean } | null> {
    const member = await this.db.chatCommunityMember.findFirst({
      where: { communityId, userId: session.userId, tenantId: session.tenantId },
      select: { role: true, isMuted: true },
    });
    if (!member) return null;
    if (member.role === 'SUSPENDED') return null;
    return { role: member.role, isMuted: member.isMuted };
  }

  async ensureMembership(session: ChatSession, communityId: string): Promise<void> {
    const membership = await this.verifyMembership(session, communityId);
    if (!membership) {
      const ctx = await this.getUserEligibilityContext(session);
      const community = await this.db.chatCommunity.findFirst({ where: { id: communityId, tenantId: session.tenantId } });
      if (!community) throw new Error('Community not found');
      if (community.joinPolicy === 'AUTO' && isEligibleForCommunity(community, ctx)) {
        const role = this.getDefaultRole(session);
        await this.db.chatCommunityMember.create({
          data: { communityId, userId: session.userId, role, tenantId: session.tenantId },
        });
        return;
      }
      throw new Error('Not a member of this community');
    }
  }

  async leaveCommunity(session: ChatSession, communityId: string): Promise<{ success: boolean; error?: string }> {
    const community = await this.db.chatCommunity.findFirst({
      where: { id: communityId, tenantId: session.tenantId }, select: { type: true },
    });
    if (!community) return { success: false, error: 'Community not found' };
    const mandatoryTypes = ['UNIVERSITY', 'CAMPUS', 'DEPARTMENT', 'BRANCH', 'PROGRAMME', 'BATCH', 'SECTION', 'SEMESTER', 'COURSE'];
    if (mandatoryTypes.includes(community.type)) {
      return { success: false, error: 'You cannot leave a mandatory academic community.' };
    }
    await this.db.chatCommunityMember.deleteMany({ where: { communityId, userId: session.userId, tenantId: session.tenantId } });
    return { success: true };
  }

  async updateNotificationPref(session: ChatSession, communityId: string, level: 'ALL' | 'MENTIONS_ONLY' | 'IMPORTANT_ONLY' | 'MUTED'): Promise<void> {
    await this.ensureMembership(session, communityId);
    await this.db.chatNotificationPref.upsert({
      where: { communityId_userId: { communityId, userId: session.userId } },
      create: { communityId, userId: session.userId, level, tenantId: session.tenantId },
      update: { level },
    });
  }

  async getMessages(session: ChatSession, communityId: string, options: { cursor?: string; limit?: number } = {}): Promise<{ messages: MessageDTO[]; hasMore: boolean }> {
    await this.ensureMembership(session, communityId);
    const limit = Math.min(options.limit || 50, 100);
    const messages = await this.db.chatMessage.findMany({
      where: { communityId, tenantId: session.tenantId, isDeleted: false, moderationStatus: { notIn: ['HIDDEN_PENDING_REVIEW', 'BLOCKED', 'REMOVED'] } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        attachments: true, reactions: { select: { reactionType: true, userId: true } },
        replyTo: { include: { author: { select: { id: true, name: true } } } },
        _count: { select: { replies: true } },
        pinnedEntries: { where: { communityId } }, bookmarks: { where: { userId: session.userId } },
      },
      orderBy: { createdAt: 'desc' }, take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });
    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const messageDTOs = items.map((msg) => mapMessageToDTO(msg));
    await this.db.chatCommunityMember.updateMany({
      where: { communityId, userId: session.userId, tenantId: session.tenantId },
      data: { lastReadAt: new Date(), unreadCount: 0 },
    });
    return { messages: messageDTOs.reverse(), hasMore };
  }

  async sendMessage(session: ChatSession, communityId: string, data: {
    body: string; messageType?: string; replyToId?: string;
    attachments?: Array<{
      attachmentType: string; fileName: string; fileUrl: string; thumbnailUrl?: string;
      mimeType: string; fileSizeBytes: number; altText?: string; durationSecs?: number; widthPx?: number; heightPx?: number;
    }>;
  }): Promise<{ message: MessageDTO | null; error: string | null; moderationStatus: string }> {
    const rateLimit = checkMessageRateLimit(session.userId);
    if (!rateLimit.allowed) return { message: null, error: `Rate limit exceeded. Please wait ${Math.ceil(rateLimit.resetMs / 1000)} seconds.`, moderationStatus: 'BLOCKED' };

    const membership = await this.verifyMembership(session, communityId);
    if (!membership) return { message: null, error: 'You are not a member of this community', moderationStatus: 'BLOCKED' };
    if (membership.isMuted) return { message: null, error: 'You are muted in this community', moderationStatus: 'BLOCKED' };

    const community = await this.db.chatCommunity.findFirst({
      where: { id: communityId, tenantId: session.tenantId }, select: { postingPolicy: true, mediaPolicy: true, name: true },
    });
    if (!community) return { message: null, error: 'Community not found', moderationStatus: 'BLOCKED' };
    if (!canPostToCommunity(session.role, membership.role, community.postingPolicy)) {
      return { message: null, error: 'You do not have permission to post in this community', moderationStatus: 'BLOCKED' };
    }

    const messageType = data.messageType || 'TEXT';
    const body = data.body || '';

    if (data.attachments && data.attachments.length > 0) {
      if (!canUploadMedia(session.role, membership.role, community.mediaPolicy)) {
        return { message: null, error: 'Media uploads are not allowed in this community', moderationStatus: 'BLOCKED' };
      }
      const imageCount = data.attachments.filter((a) => a.attachmentType === 'IMAGE').length;
      if (imageCount > MAX_IMAGES_PER_MESSAGE) {
        return { message: null, error: `Maximum ${MAX_IMAGES_PER_MESSAGE} images per message`, moderationStatus: 'BLOCKED' };
      }
      for (const att of data.attachments) {
        const validation = validateFile(att.fileName, att.mimeType, att.fileSizeBytes, att.durationSecs);
        if (!validation.allowed) return { message: null, error: validation.reason || 'File validation failed', moderationStatus: 'BLOCKED' };
      }
    }

    const sanitizedBody = sanitizeMessageText(body);
    const moderation = moderateText(sanitizedBody);
    const mentions = extractMentions(sanitizedBody);
    const hashtags = extractHashtags(sanitizedBody);
    const links = extractLinks(sanitizedBody);

    for (const link of links) {
      const linkCheck = checkLinkSafety(link);
      if (linkCheck.status === 'BLOCKED') return { message: null, error: `Link blocked: ${linkCheck.reason}`, moderationStatus: 'BLOCKED' };
    }

    if (mentions.length > 0) {
      const mentionLimit = checkMentionRateLimit(session.userId);
      if (!mentionLimit.allowed) return { message: null, error: 'Mention rate limit exceeded', moderationStatus: 'BLOCKED' };
    }

    const message = await this.db.chatMessage.create({
      data: {
        tenantId: session.tenantId, communityId, authorId: session.userId,
        messageType: messageType as ChatMessageType, body: sanitizedBody, sanitizedBody,
        replyToId: data.replyToId || null, threadId: data.replyToId || null,
        moderationStatus: moderation.status as ChatModerationStatus, moderationReason: moderation.reason,
        mentions, hashtags, linkUrls: links,
        attachments: data.attachments ? {
          create: data.attachments.map((att) => ({
            tenantId: session.tenantId, attachmentType: att.attachmentType as ChatAttachmentType,
            fileName: sanitizeFileName(att.fileName), fileUrl: att.fileUrl, thumbnailUrl: att.thumbnailUrl || null,
            mimeType: att.mimeType, fileSizeBytes: att.fileSizeBytes, altText: att.altText || null,
            durationSecs: att.durationSecs || null, widthPx: att.widthPx || null, heightPx: att.heightPx || null,
          })),
        } : undefined,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        attachments: true, reactions: { select: { reactionType: true, userId: true } },
        replyTo: { include: { author: { select: { id: true, name: true } } } },
        _count: { select: { replies: true } },
        pinnedEntries: { where: { communityId } }, bookmarks: { where: { userId: session.userId } },
      },
    });

    if (moderation.status === 'HIDDEN_PENDING_REVIEW' || moderation.status === 'PENDING_REVIEW') {
      await this.db.chatModerationCase.create({
        data: {
          tenantId: session.tenantId, communityId, messageId: message.id,
          severity: moderation.severity, status: 'OPEN',
          userNotice: 'This content was flagged for review and may violate Community Guidelines.',
          appealDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    for (const link of links) {
      const linkCheck = checkLinkSafety(link);
      if (linkCheck.status !== 'BLOCKED') {
        try {
          const parsed = new URL(link);
          await this.db.chatLinkPreview.create({
            data: { tenantId: session.tenantId, communityId, url: link, domain: parsed.hostname, safetyStatus: linkCheck.status },
          });
        } catch { /* skip */ }
      }
    }

    if (mentions.length > 0) await this.sendMentionNotifications(session, communityId, message.id, mentions, community.name);

    await this.db.chatCommunityMember.updateMany({
      where: { communityId, userId: { not: session.userId }, tenantId: session.tenantId },
      data: { unreadCount: { increment: 1 } },
    });

    const messageDTO = mapMessageToDTO(message);
    recordAuditLog({
      tenantId: session.tenantId, userId: session.userId, action: 'COMMUNITY_MESSAGE_SENT',
      entity: 'ChatMessage', afterState: { messageId: message.id, communityId, moderationStatus: moderation.status },
    });
    return { message: messageDTO, error: null, moderationStatus: moderation.status };
  }

  async editMessage(session: ChatSession, messageId: string, newBody: string): Promise<{ success: boolean; error?: string }> {
    const message = await this.db.chatMessage.findFirst({ where: { id: messageId, tenantId: session.tenantId }, select: { authorId: true } });
    if (!message) return { success: false, error: 'Message not found' };
    if (message.authorId !== session.userId) return { success: false, error: 'You can only edit your own messages' };
    const sanitized = sanitizeMessageText(newBody);
    const moderation = moderateText(sanitized);
    if (moderation.status === 'BLOCKED') return { success: false, error: moderation.reason || 'Content blocked' };
    await this.db.chatMessage.update({
      where: { id: messageId },
      data: { body: sanitized, sanitizedBody: sanitized, isEdited: true, editedAt: new Date(), moderationStatus: moderation.status as ChatModerationStatus, moderationReason: moderation.reason },
    });
    return { success: true };
  }

  async deleteMessage(session: ChatSession, messageId: string): Promise<{ success: boolean; error?: string }> {
    const message = await this.db.chatMessage.findFirst({ where: { id: messageId, tenantId: session.tenantId }, select: { authorId: true, communityId: true } });
    if (!message) return { success: false, error: 'Message not found' };
    if (message.authorId !== session.userId) {
      const membership = await this.verifyMembership(session, message.communityId);
      if (!membership || !canModerateCommunity(session.role, membership.role)) {
        return { success: false, error: 'You do not have permission to delete this message' };
      }
    }
    await this.db.chatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), body: '[This message was deleted]', sanitizedBody: '[This message was deleted]' },
    });
    return { success: true };
  }

  async getThreadReplies(session: ChatSession, parentMessageId: string): Promise<MessageDTO[]> {
    const parent = await this.db.chatMessage.findFirst({ where: { id: parentMessageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!parent) return [];
    await this.ensureMembership(session, parent.communityId);
    const replies = await this.db.chatMessage.findMany({
      where: { tenantId: session.tenantId, OR: [{ replyToId: parentMessageId }, { threadId: parentMessageId }], isDeleted: false, moderationStatus: { notIn: ['HIDDEN_PENDING_REVIEW', 'BLOCKED', 'REMOVED'] } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        attachments: true, reactions: { select: { reactionType: true, userId: true } },
        replyTo: { include: { author: { select: { id: true, name: true } } } },
        _count: { select: { replies: true } },
        pinnedEntries: { where: { communityId: parent.communityId } }, bookmarks: { where: { userId: session.userId } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return replies.map((msg) => mapMessageToDTO(msg));
  }

  async toggleReaction(session: ChatSession, messageId: string, reactionType: string): Promise<{ success: boolean; error?: string }> {
    const message = await this.db.chatMessage.findFirst({ where: { id: messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return { success: false, error: 'Message not found' };
    await this.ensureMembership(session, message.communityId);
    const existing = await this.db.chatReaction.findFirst({ where: { messageId, userId: session.userId, reactionType: reactionType as ChatReactionType, tenantId: session.tenantId } });
    if (existing) { await this.db.chatReaction.delete({ where: { id: existing.id } }); }
    else { await this.db.chatReaction.create({ data: { tenantId: session.tenantId, messageId, userId: session.userId, reactionType: reactionType as ChatReactionType } }); }
    return { success: true };
  }

  async toggleBookmark(session: ChatSession, messageId: string, note?: string): Promise<{ success: boolean; error?: string }> {
    const message = await this.db.chatMessage.findFirst({ where: { id: messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return { success: false, error: 'Message not found' };
    await this.ensureMembership(session, message.communityId);
    const existing = await this.db.chatBookmark.findFirst({ where: { messageId, userId: session.userId, tenantId: session.tenantId } });
    if (existing) { await this.db.chatBookmark.delete({ where: { id: existing.id } }); }
    else { await this.db.chatBookmark.create({ data: { tenantId: session.tenantId, messageId, userId: session.userId, communityId: message.communityId, note } }); }
    return { success: true };
  }

  async getBookmarks(session: ChatSession, communityId?: string): Promise<MessageDTO[]> {
    const bookmarks = await this.db.chatBookmark.findMany({
      where: { userId: session.userId, tenantId: session.tenantId, ...(communityId ? { communityId } : {}) },
      include: {
        message: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
            attachments: true, reactions: { select: { reactionType: true, userId: true } },
            _count: { select: { replies: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks.map((b) => {
      const msg = b.message;
      const reactionMap = new Map<string, string[]>();
      for (const r of msg.reactions) { const ex = reactionMap.get(r.reactionType) || []; ex.push(r.userId); reactionMap.set(r.reactionType, ex); }
      const reactions: ReactionDTO[] = Array.from(reactionMap.entries()).map(([type, userIds]) => ({ reactionType: type, count: userIds.length, userIds }));
      return {
        id: msg.id, communityId: msg.communityId, author: toSafeUser(msg.author),
        messageType: msg.messageType, body: msg.body, sanitizedBody: msg.sanitizedBody,
        replyToId: msg.replyToId, replyTo: null, threadId: msg.threadId,
        moderationStatus: msg.moderationStatus, isEdited: msg.isEdited, isDeleted: msg.isDeleted,
        mentions: msg.mentions, hashtags: msg.hashtags, linkUrls: msg.linkUrls,
        attachments: msg.attachments.map((a) => ({
          id: a.id, attachmentType: a.attachmentType, fileName: a.fileName, fileUrl: a.fileUrl,
          thumbnailUrl: a.thumbnailUrl, mimeType: a.mimeType, fileSizeBytes: a.fileSizeBytes,
          altText: a.altText, durationSecs: a.durationSecs, widthPx: a.widthPx, heightPx: a.heightPx,
          processingState: a.processingState, isSafe: a.isSafe,
        })),
        reactions, replyCount: msg._count.replies, isPinned: false, isBookmarked: true,
        createdAt: msg.createdAt.toISOString(), editedAt: msg.editedAt?.toISOString() || null,
      };
    });
  }

  async togglePin(session: ChatSession, messageId: string, expiresAt?: Date): Promise<{ success: boolean; error?: string }> {
    const message = await this.db.chatMessage.findFirst({ where: { id: messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return { success: false, error: 'Message not found' };
    const membership = await this.verifyMembership(session, message.communityId);
    if (!membership || !canPinMessages(session.role, membership.role)) return { success: false, error: 'You do not have permission to pin messages' };
    const existing = await this.db.chatPinnedMessage.findFirst({ where: { messageId, communityId: message.communityId, tenantId: session.tenantId } });
    if (existing) { await this.db.chatPinnedMessage.delete({ where: { id: existing.id } }); }
    else { await this.db.chatPinnedMessage.create({ data: { tenantId: session.tenantId, communityId: message.communityId, messageId, pinnedById: session.userId, expiresAt: expiresAt || null } }); }
    return { success: true };
  }

  async getPinnedMessages(session: ChatSession, communityId: string): Promise<MessageDTO[]> {
    await this.ensureMembership(session, communityId);
    const pinned = await this.db.chatPinnedMessage.findMany({
      where: { communityId, tenantId: session.tenantId },
      include: {
        message: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
            attachments: true, reactions: { select: { reactionType: true, userId: true } },
            _count: { select: { replies: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return pinned.map((p) => {
      const msg = p.message;
      const reactionMap = new Map<string, string[]>();
      for (const r of msg.reactions) { const ex = reactionMap.get(r.reactionType) || []; ex.push(r.userId); reactionMap.set(r.reactionType, ex); }
      const reactions: ReactionDTO[] = Array.from(reactionMap.entries()).map(([type, userIds]) => ({ reactionType: type, count: userIds.length, userIds }));
      return {
        id: msg.id, communityId: msg.communityId, author: toSafeUser(msg.author),
        messageType: msg.messageType, body: msg.body, sanitizedBody: msg.sanitizedBody,
        replyToId: msg.replyToId, replyTo: null, threadId: msg.threadId,
        moderationStatus: msg.moderationStatus, isEdited: msg.isEdited, isDeleted: msg.isDeleted,
        mentions: msg.mentions, hashtags: msg.hashtags, linkUrls: msg.linkUrls,
        attachments: msg.attachments.map((a) => ({
          id: a.id, attachmentType: a.attachmentType, fileName: a.fileName, fileUrl: a.fileUrl,
          thumbnailUrl: a.thumbnailUrl, mimeType: a.mimeType, fileSizeBytes: a.fileSizeBytes,
          altText: a.altText, durationSecs: a.durationSecs, widthPx: a.widthPx, heightPx: a.heightPx,
          processingState: a.processingState, isSafe: a.isSafe,
        })),
        reactions, replyCount: msg._count.replies, isPinned: true, isBookmarked: false,
        createdAt: msg.createdAt.toISOString(), editedAt: msg.editedAt?.toISOString() || null,
      };
    });
  }

  async search(session: ChatSession, query: string, filters: { communityId?: string; messageType?: string; hasAttachment?: boolean; hasLink?: boolean; limit?: number } = {}): Promise<MessageDTO[]> {
    const limit = Math.min(filters.limit || 50, 100);
    const memberships = await this.db.chatCommunityMember.findMany({ where: { userId: session.userId, tenantId: session.tenantId }, select: { communityId: true } });
    const communityIds = memberships.map((m) => m.communityId);
    if (filters.communityId && !communityIds.includes(filters.communityId)) return [];
    const messages = await this.db.chatMessage.findMany({
      where: {
        tenantId: session.tenantId, isDeleted: false, moderationStatus: { notIn: ['HIDDEN_PENDING_REVIEW', 'BLOCKED', 'REMOVED'] },
        communityId: filters.communityId ? filters.communityId : { in: communityIds },
        body: { contains: query, mode: 'insensitive' },
        ...(filters.messageType ? { messageType: filters.messageType as ChatMessageType } : {}),
        ...(filters.hasAttachment ? { attachments: { some: {} } } : {}),
        ...(filters.hasLink ? { linkUrls: { isEmpty: false } } : {}),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        attachments: true, reactions: { select: { reactionType: true, userId: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' }, take: limit,
    });
    return messages.map((msg) => {
      const reactionMap = new Map<string, string[]>();
      for (const r of msg.reactions) { const ex = reactionMap.get(r.reactionType) || []; ex.push(r.userId); reactionMap.set(r.reactionType, ex); }
      const reactions: ReactionDTO[] = Array.from(reactionMap.entries()).map(([type, userIds]) => ({ reactionType: type, count: userIds.length, userIds }));
      return {
        id: msg.id, communityId: msg.communityId, author: toSafeUser(msg.author),
        messageType: msg.messageType, body: msg.body, sanitizedBody: msg.sanitizedBody,
        replyToId: msg.replyToId, replyTo: null, threadId: msg.threadId,
        moderationStatus: msg.moderationStatus, isEdited: msg.isEdited, isDeleted: msg.isDeleted,
        mentions: msg.mentions, hashtags: msg.hashtags, linkUrls: msg.linkUrls,
        attachments: msg.attachments.map((a) => ({
          id: a.id, attachmentType: a.attachmentType, fileName: a.fileName, fileUrl: a.fileUrl,
          thumbnailUrl: a.thumbnailUrl, mimeType: a.mimeType, fileSizeBytes: a.fileSizeBytes,
          altText: a.altText, durationSecs: a.durationSecs, widthPx: a.widthPx, heightPx: a.heightPx,
          processingState: a.processingState, isSafe: a.isSafe,
        })),
        reactions, replyCount: msg._count.replies, isPinned: false, isBookmarked: false,
        createdAt: msg.createdAt.toISOString(), editedAt: msg.editedAt?.toISOString() || null,
      };
    });
  }

  async reportMessage(session: ChatSession, messageId: string, reason: string, description?: string): Promise<{ success: boolean; error?: string }> {
    const message = await this.db.chatMessage.findFirst({ where: { id: messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return { success: false, error: 'Message not found' };
    await this.ensureMembership(session, message.communityId);
    const existing = await this.db.chatReport.findFirst({ where: { messageId, reporterId: session.userId, tenantId: session.tenantId } });
    if (existing) return { success: false, error: 'You have already reported this message' };
    const report = await this.db.chatReport.create({
      data: { tenantId: session.tenantId, communityId: message.communityId, messageId, reporterId: session.userId, reason: reason as ChatReportReason, description },
    });
    const severity = this.getSeverityForReason(reason);
    await this.db.chatModerationCase.create({
      data: { tenantId: session.tenantId, communityId: message.communityId, reportId: report.id, messageId, severity, status: 'OPEN', userNotice: 'This content was reported and is under review.', appealDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    if (severity === 'CRITICAL') {
      await this.db.chatMessage.update({ where: { id: messageId }, data: { moderationStatus: 'HIDDEN_PENDING_REVIEW', moderationReason: 'Content hidden pending review due to severe report' } });
    }
    return { success: true };
  }

  async getModerationCases(session: ChatSession, status?: string): Promise<unknown[]> {
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'INSTITUTION_ADMIN' && session.role !== 'HOD' && session.role !== 'DEAN') {
      const moderatorMemberships = await this.db.chatCommunityMember.findMany({ where: { userId: session.userId, role: { in: ['OWNER', 'ADMIN', 'MODERATOR', 'FACULTY'] }, tenantId: session.tenantId }, select: { communityId: true } });
      if (moderatorMemberships.length === 0) return [];
      const communityIds = moderatorMemberships.map((m) => m.communityId);
      return this.db.chatModerationCase.findMany({
        where: { communityId: { in: communityIds }, tenantId: session.tenantId, ...(status ? { status } : {}) },
        include: { message: { include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } } }, report: true, actions: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.db.chatModerationCase.findMany({
      where: { tenantId: session.tenantId, ...(status ? { status } : {}) },
      include: { message: { include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } } }, report: true, actions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async takeModerationAction(session: ChatSession, caseId: string, action: { actionType: string; reason: string; internalNotes?: string; userMessage?: string }): Promise<{ success: boolean; error?: string }> {
    const modCase = await this.db.chatModerationCase.findFirst({ where: { id: caseId, tenantId: session.tenantId }, include: { message: true } });
    if (!modCase) return { success: false, error: 'Case not found' };
    const membership = await this.verifyMembership(session, modCase.communityId);
    if (!membership || !canModerateCommunity(session.role, membership.role)) return { success: false, error: 'You do not have moderation permission' };
    const previousState = modCase.message.moderationStatus;
    let newState = previousState;
    switch (action.actionType) {
      case 'HIDE': newState = 'HIDDEN_PENDING_REVIEW'; break;
      case 'RESTORE': newState = 'ALLOWED'; break;
      case 'REMOVE': newState = 'REMOVED'; break;
      case 'ESCALATE': newState = 'HIDDEN_PENDING_REVIEW'; break;
    }
    if (newState !== previousState) {
      await this.db.chatMessage.update({ where: { id: modCase.messageId }, data: { moderationStatus: newState as ChatModerationStatus, moderationReason: action.reason } });
    }
    await this.db.chatModerationAction.create({
      data: { tenantId: session.tenantId, caseId, moderatorId: session.userId, actionType: action.actionType as ChatModerationActionType, reason: action.reason, previousState: String(previousState), newState: String(newState), internalNotes: action.internalNotes, userMessage: action.userMessage },
    });
    await this.db.chatModerationCase.update({ where: { id: caseId }, data: { status: action.actionType === 'CLOSE_REPORT' ? 'RESOLVED' : 'UNDER_REVIEW', internalNotes: action.internalNotes, userNotice: action.userMessage } });
    recordAuditLog({ tenantId: session.tenantId, userId: session.userId, action: `COMMUNITY_MODERATION_${action.actionType}`, entity: 'ChatModerationCase', beforeState: { caseId, previousState }, afterState: { caseId, newState, reason: action.reason } });
    return { success: true };
  }

  async appealModeration(session: ChatSession, caseId: string, appealText: string): Promise<{ success: boolean; error?: string }> {
    const modCase = await this.db.chatModerationCase.findFirst({ where: { id: caseId, tenantId: session.tenantId }, include: { message: { select: { authorId: true } } } });
    if (!modCase) return { success: false, error: 'Case not found' };
    if (modCase.message.authorId !== session.userId) return { success: false, error: 'You can only appeal your own content' };
    if (modCase.appealStatus !== 'NONE' && modCase.appealStatus !== 'REJECTED') return { success: false, error: 'An appeal has already been submitted' };
    await this.db.chatModerationCase.update({ where: { id: caseId }, data: { appealStatus: 'PENDING', internalNotes: `Appeal: ${appealText}` } });
    await this.db.chatMessage.update({ where: { id: modCase.messageId }, data: { moderationStatus: 'APPEALED' } });
    return { success: true };
  }

  async createPoll(session: ChatSession, communityId: string, data: { question: string; options: string[]; isMultipleChoice?: boolean; isAnonymous?: boolean; showResultsBeforeVoting?: boolean; closesAt?: Date }): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (data.options.length < 2 || data.options.length > 10) return { success: false, error: 'Poll must have 2-10 options' };
    const membership = await this.verifyMembership(session, communityId);
    if (!membership || !canCreatePoll(session.role, membership.role)) return { success: false, error: 'You do not have permission to create polls' };
    const message = await this.sendMessage(session, communityId, { body: data.question, messageType: 'POLL' });
    if (!message.message) return { success: false, error: message.error || 'Failed to create poll message' };
    await this.db.chatPoll.create({
      data: { tenantId: session.tenantId, communityId, messageId: message.message.id, question: data.question, isMultipleChoice: data.isMultipleChoice || false, isAnonymous: data.isAnonymous || false, showResultsBeforeVoting: data.showResultsBeforeVoting || false, closesAt: data.closesAt || null, options: { create: data.options.map((text) => ({ text })) } },
    });
    return { success: true, messageId: message.message.id };
  }

  async votePoll(session: ChatSession, pollId: string, optionIds: string[]): Promise<{ success: boolean; error?: string }> {
    const poll = await this.db.chatPoll.findFirst({ where: { id: pollId, tenantId: session.tenantId }, include: { options: true } });
    if (!poll) return { success: false, error: 'Poll not found' };
    await this.ensureMembership(session, poll.communityId);
    if (poll.closesAt && poll.closesAt < new Date()) return { success: false, error: 'This poll has closed' };
    if (!poll.isMultipleChoice && optionIds.length > 1) return { success: false, error: 'Only one option can be selected for this poll' };
    const existingVotes = await this.db.chatPollVote.findMany({ where: { optionId: { in: poll.options.map((o) => o.id) }, userId: session.userId } });
    if (existingVotes.length > 0) {
      if (!poll.isMultipleChoice) return { success: false, error: 'You have already voted in this poll' };
      const toRemove = existingVotes.filter((v) => !optionIds.includes(v.optionId));
      if (toRemove.length > 0) {
        await this.db.chatPollVote.deleteMany({ where: { id: { in: toRemove.map((v) => v.id) } } });
        for (const v of toRemove) { await this.db.chatPollOption.update({ where: { id: v.optionId }, data: { voteCount: { decrement: 1 } } }); }
      }
    }
    const newOptionIds = optionIds.filter((id) => !existingVotes.some((v) => v.optionId === id));
    for (const optionId of newOptionIds) {
      await this.db.chatPollVote.create({ data: { optionId, userId: session.userId } });
      await this.db.chatPollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } });
    }
    return { success: true };
  }

  private getDefaultRole(session: ChatSession): ChatMemberRole {
    if (session.role === 'SUPER_ADMIN' || session.role === 'INSTITUTION_ADMIN') return 'ADMIN';
    if (session.role === 'HOD' || session.role === 'DEAN') return 'MODERATOR';
    if (session.role === 'FACULTY') return 'FACULTY';
    return 'STUDENT';
  }

  private getSeverityForReason(reason: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalReasons = ['SEXUAL_CONTENT', 'THREAT', 'VIOLENCE'];
    const highReasons = ['HARASSMENT', 'BULLYING', 'HATE_DISCRIMINATION', 'PRIVACY_VIOLATION', 'ACADEMIC_CHEATING'];
    const mediumReasons = ['SPAM', 'SCAM', 'IMPERSONATION', 'INAPPROPRIATE_FILE'];
    if (criticalReasons.includes(reason)) return 'CRITICAL';
    if (highReasons.includes(reason)) return 'HIGH';
    if (mediumReasons.includes(reason)) return 'MEDIUM';
    return 'LOW';
  }

  private async getUserEligibilityContext(session: ChatSession): Promise<EligibilityContext> {
    const studentProfile = await this.db.student.findFirst({
      where: { userId: session.userId, tenantId: session.tenantId },
      select: { batchId: true, sectionId: true, batch: { select: { programId: true } }, enrollments: { select: { courseOfferingId: true } } },
    });
    const staffProfile = await this.db.staff.findFirst({
      where: { userId: session.userId, tenantId: session.tenantId },
      select: { departmentId: true, courseOfferings: { select: { id: true } } },
    });
    return {
      isStudent: !!studentProfile, isStaff: !!staffProfile,
      batchId: studentProfile?.batchId, sectionId: studentProfile?.sectionId || undefined,
      programId: studentProfile?.batch.programId, departmentId: staffProfile?.departmentId || undefined,
      enrolledCourseOfferingIds: studentProfile?.enrollments.map((e) => e.courseOfferingId) || [],
      staffCourseOfferingIds: staffProfile?.courseOfferings.map((c) => c.id) || [],
    };
  }

  private async sendMentionNotifications(session: ChatSession, communityId: string, messageId: string, mentions: string[], communityName: string): Promise<void> {
    for (const mentionName of mentions) {
      const users = await this.db.user.findMany({ where: { name: { contains: mentionName, mode: 'insensitive' }, tenantId: session.tenantId }, select: { id: true } });
      for (const user of users) {
        const isMember = await this.db.chatCommunityMember.findFirst({ where: { communityId, userId: user.id, tenantId: session.tenantId } });
        if (isMember) {
          await this.db.notification.create({
            data: { tenantId: session.tenantId, userId: user.id, title: `You were mentioned in ${communityName}`, body: 'Someone mentioned you in a message', type: 'MESSAGE', actionUrl: `/community/${communityId}?msg=${messageId}` },
          });
        }
      }
    }
  }
}
