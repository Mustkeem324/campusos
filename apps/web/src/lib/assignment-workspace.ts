import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { PRIVILEGED_ROLES } from './lms/course-listing';

export const ASSIGNMENT_WORKSPACE_ACTION = 'ASSIGNMENT_WORKSPACE_V2';
export const ASSIGNMENT_RESOURCE_ACTION = 'ASSIGNMENT_RESOURCE_FILE_V2';
export const ASSIGNMENT_SUBMISSION_ACTION = 'ASSIGNMENT_SUBMISSION_V2';
export const ASSIGNMENT_SUBMISSION_FILE_ACTION = 'ASSIGNMENT_SUBMISSION_FILE_V2';

export const MAX_ASSIGNMENT_FILES = 8;
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
export const MAX_STANDARD_FILE_BYTES = 12 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const PDF_TYPES = new Set(['application/pdf']);
const MODERN_OFFICE_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const LEGACY_OFFICE_TYPES = new Set([
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel',
]);
const TEXT_TYPES = new Set(['text/plain', 'text/csv']);
const ALLOWED_TYPES = new Set([
  ...IMAGE_TYPES,
  ...VIDEO_TYPES,
  ...PDF_TYPES,
  ...MODERN_OFFICE_TYPES,
  ...LEGACY_OFFICE_TYPES,
  ...TEXT_TYPES,
]);
const BLOCKED_EXTENSION = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|jar|apk|dmg|iso|docm|xlsm|pptm|html?|svg)$/i;

export type AssignmentResourceKind = 'PDF' | 'DOCUMENT' | 'PRESENTATION' | 'SPREADSHEET' | 'IMAGE' | 'VIDEO';

export type AssignmentFileMeta = {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  kind: AssignmentResourceKind;
};

export type AssignmentWorkspaceMeta = {
  version: 2;
  instructions: string;
  submissionInstructions: string;
  lateSubmissionAllowed: boolean;
  latePenaltyPercent: number;
  allowTextResponse: boolean;
  allowResubmission: boolean;
  maxSubmissionFiles: number;
  resources: AssignmentFileMeta[];
};

export type AssignmentSubmissionMeta = {
  version: 2;
  textResponse: string;
  isLate: boolean;
  attemptNumber: number;
  files: AssignmentFileMeta[];
};

export type PreparedAssignmentFile = Omit<AssignmentFileMeta, 'fileId'> & {
  fileUrl: string;
};

export const DEFAULT_ASSIGNMENT_WORKSPACE: AssignmentWorkspaceMeta = {
  version: 2,
  instructions: '',
  submissionInstructions: 'Upload the requested work before the deadline. Verify every file before submitting.',
  lateSubmissionAllowed: true,
  latePenaltyPercent: 10,
  allowTextResponse: true,
  allowResubmission: true,
  maxSubmissionFiles: 6,
  resources: [],
};

export function assignmentEntity(assignmentId: string) {
  return `Assignment:${assignmentId}`;
}

export function submissionEntity(submissionId: string) {
  return `Submission:${submissionId}`;
}

export function fileEntity(fileId: string) {
  return `File:${fileId}`;
}

export function isAssignmentManager(role: RoleType) {
  return role === RoleType.FACULTY || PRIVILEGED_ROLES.includes(role);
}

export async function assertAssignmentAccess(context: ActiveUserContext, assignmentId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, tenantId: context.tenantId },
    include: {
      courseOffering: {
        include: {
          course: { select: { id: true, code: true, title: true } },
          faculty: { select: { id: true, userId: true, user: { select: { name: true } } } },
          section: { select: { id: true, name: true } },
          term: { select: { id: true, name: true, number: true } },
        },
      },
      rubrics: true,
    },
  });
  if (!assignment) throw new Error('ASSIGNMENT_NOT_FOUND');

  if (PRIVILEGED_ROLES.includes(context.activeRole)) return assignment;
  if (context.activeRole === RoleType.FACULTY && context.staffProfileId === assignment.courseOffering.facultyId) return assignment;
  if (context.activeRole === RoleType.STUDENT && context.studentProfileId) {
    const enrolled = await prisma.enrollment.findFirst({
      where: { tenantId: context.tenantId, studentId: context.studentProfileId, courseOfferingId: assignment.courseOfferingId },
      select: { id: true },
    });
    if (enrolled) return assignment;
  }
  throw new Error('ASSIGNMENT_FORBIDDEN');
}

export async function assertOfferingManagement(context: ActiveUserContext, courseOfferingId: string) {
  if (!isAssignmentManager(context.activeRole)) throw new Error('ASSIGNMENT_FORBIDDEN');
  const offering = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, tenantId: context.tenantId },
    include: {
      course: { select: { id: true, code: true, title: true } },
      faculty: { select: { id: true, userId: true, user: { select: { name: true } } } },
      enrollments: { select: { student: { select: { userId: true } } } },
    },
  });
  if (!offering) throw new Error('ASSIGNMENT_COURSE_NOT_FOUND');
  if (context.activeRole === RoleType.FACULTY && offering.facultyId !== context.staffProfileId) throw new Error('ASSIGNMENT_FORBIDDEN');
  return offering;
}

export async function loadAssignmentWorkspace(tenantId: string, assignmentId: string): Promise<AssignmentWorkspaceMeta> {
  const audit = await prisma.auditLog.findFirst({
    where: { tenantId, action: ASSIGNMENT_WORKSPACE_ACTION, entity: assignmentEntity(assignmentId) },
    orderBy: { createdAt: 'desc' },
    select: { diffJson: true },
  });
  return parseWorkspaceMeta(audit?.diffJson);
}

export async function loadAssignmentWorkspaceMap(tenantId: string, assignmentIds: string[]) {
  const result = new Map<string, AssignmentWorkspaceMeta>();
  if (!assignmentIds.length) return result;
  const entities = assignmentIds.map(assignmentEntity);
  const audits = await prisma.auditLog.findMany({
    where: { tenantId, action: ASSIGNMENT_WORKSPACE_ACTION, entity: { in: entities } },
    orderBy: { createdAt: 'desc' },
    select: { entity: true, diffJson: true },
  });
  for (const audit of audits) {
    const assignmentId = audit.entity.startsWith('Assignment:') ? audit.entity.slice('Assignment:'.length) : '';
    if (assignmentId && !result.has(assignmentId)) result.set(assignmentId, parseWorkspaceMeta(audit.diffJson));
  }
  for (const id of assignmentIds) if (!result.has(id)) result.set(id, { ...DEFAULT_ASSIGNMENT_WORKSPACE, resources: [] });
  return result;
}

export async function loadSubmissionMeta(tenantId: string, submissionId: string): Promise<AssignmentSubmissionMeta> {
  const audit = await prisma.auditLog.findFirst({
    where: { tenantId, action: ASSIGNMENT_SUBMISSION_ACTION, entity: submissionEntity(submissionId) },
    orderBy: { createdAt: 'desc' },
    select: { diffJson: true },
  });
  return parseSubmissionMeta(audit?.diffJson);
}

export async function loadSubmissionMetaMap(tenantId: string, submissionIds: string[]) {
  const result = new Map<string, AssignmentSubmissionMeta>();
  if (!submissionIds.length) return result;
  const audits = await prisma.auditLog.findMany({
    where: { tenantId, action: ASSIGNMENT_SUBMISSION_ACTION, entity: { in: submissionIds.map(submissionEntity) } },
    orderBy: { createdAt: 'desc' },
    select: { entity: true, diffJson: true },
  });
  for (const audit of audits) {
    const id = audit.entity.startsWith('Submission:') ? audit.entity.slice('Submission:'.length) : '';
    if (id && !result.has(id)) result.set(id, parseSubmissionMeta(audit.diffJson));
  }
  for (const id of submissionIds) if (!result.has(id)) result.set(id, parseSubmissionMeta(null));
  return result;
}

export async function prepareAssignmentFile(file: File): Promise<PreparedAssignmentFile> {
  const fileName = sanitizeFileName(file.name || 'attachment');
  if (BLOCKED_EXTENSION.test(fileName) || !ALLOWED_TYPES.has(file.type)) throw new Error('ASSIGNMENT_FILE_TYPE');
  const maxBytes = VIDEO_TYPES.has(file.type) ? MAX_VIDEO_BYTES : MAX_STANDARD_FILE_BYTES;
  if (file.size <= 0 || file.size > maxBytes) throw new Error('ASSIGNMENT_FILE_SIZE');

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureLooksValid(bytes, file.type)) throw new Error('ASSIGNMENT_FILE_SIGNATURE');
  const kind = fileKind(file.type);
  return {
    fileName,
    mimeType: file.type,
    fileSizeBytes: file.size,
    kind,
    fileUrl: `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`,
  };
}

export function assignmentStatus(input: { dueDate: Date; submittedAt?: Date | null; marksObtained?: number | null }) {
  const now = Date.now();
  if (input.marksObtained !== null && input.marksObtained !== undefined) return 'GRADED' as const;
  if (input.submittedAt) return input.submittedAt.getTime() > input.dueDate.getTime() ? 'LATE' as const : 'SUBMITTED' as const;
  if (now > input.dueDate.getTime()) return 'OVERDUE' as const;
  const remaining = input.dueDate.getTime() - now;
  if (remaining <= 48 * 60 * 60 * 1000) return 'DUE_SOON' as const;
  return 'UPCOMING' as const;
}

export function assignmentError(error: unknown) {
  const code = error instanceof Error ? error.message : 'ASSIGNMENT_ERROR';
  if (code === 'ASSIGNMENT_NOT_FOUND' || code === 'ASSIGNMENT_COURSE_NOT_FOUND') return { status: 404, error: 'Assignment or course could not be found.' };
  if (code === 'ASSIGNMENT_FORBIDDEN') return { status: 403, error: 'You are not authorised for this assignment.' };
  if (code === 'ASSIGNMENT_DEADLINE_CLOSED') return { status: 410, error: 'The deadline has passed and this assignment does not accept late submissions.' };
  if (code === 'ASSIGNMENT_RESUBMIT_DISABLED') return { status: 409, error: 'This assignment does not allow another submission attempt.' };
  if (code === 'ASSIGNMENT_GRADED_LOCKED') return { status: 409, error: 'This submission is already graded and can no longer be replaced.' };
  if (code === 'ASSIGNMENT_EMPTY_SUBMISSION') return { status: 422, error: 'Add a written response or at least one file before submitting.' };
  if (code === 'ASSIGNMENT_TOO_MANY_FILES') return { status: 422, error: 'Too many files were attached to this assignment.' };
  if (code === 'ASSIGNMENT_FILE_SIZE') return { status: 413, error: 'Videos are limited to 20 MB; documents, presentations, PDFs and images are limited to 12 MB each.' };
  if (code === 'ASSIGNMENT_FILE_TYPE' || code === 'ASSIGNMENT_FILE_SIGNATURE') return { status: 415, error: 'That file type is not supported or its file signature is invalid.' };
  console.error('[ASSIGNMENT_WORKSPACE_UNEXPECTED]', error);
  return { status: 500, error: 'The assignment request could not be completed.' };
}

function parseWorkspaceMeta(value: string | null | undefined): AssignmentWorkspaceMeta {
  if (!value) return { ...DEFAULT_ASSIGNMENT_WORKSPACE, resources: [] };
  try {
    const parsed = JSON.parse(value) as Partial<AssignmentWorkspaceMeta>;
    if (parsed.version !== 2) return { ...DEFAULT_ASSIGNMENT_WORKSPACE, resources: [] };
    const resources = Array.isArray(parsed.resources) ? parsed.resources.filter(isAssignmentFileMeta) : [];
    return {
      version: 2,
      instructions: typeof parsed.instructions === 'string' ? parsed.instructions : '',
      submissionInstructions: typeof parsed.submissionInstructions === 'string' ? parsed.submissionInstructions : DEFAULT_ASSIGNMENT_WORKSPACE.submissionInstructions,
      lateSubmissionAllowed: typeof parsed.lateSubmissionAllowed === 'boolean' ? parsed.lateSubmissionAllowed : DEFAULT_ASSIGNMENT_WORKSPACE.lateSubmissionAllowed,
      latePenaltyPercent: clampNumber(parsed.latePenaltyPercent, 0, 100, DEFAULT_ASSIGNMENT_WORKSPACE.latePenaltyPercent),
      allowTextResponse: typeof parsed.allowTextResponse === 'boolean' ? parsed.allowTextResponse : DEFAULT_ASSIGNMENT_WORKSPACE.allowTextResponse,
      allowResubmission: typeof parsed.allowResubmission === 'boolean' ? parsed.allowResubmission : DEFAULT_ASSIGNMENT_WORKSPACE.allowResubmission,
      maxSubmissionFiles: Math.round(clampNumber(parsed.maxSubmissionFiles, 1, MAX_ASSIGNMENT_FILES, DEFAULT_ASSIGNMENT_WORKSPACE.maxSubmissionFiles)),
      resources,
    };
  } catch {
    return { ...DEFAULT_ASSIGNMENT_WORKSPACE, resources: [] };
  }
}

function parseSubmissionMeta(value: string | null | undefined): AssignmentSubmissionMeta {
  if (!value) return { version: 2, textResponse: '', isLate: false, attemptNumber: 1, files: [] };
  try {
    const parsed = JSON.parse(value) as Partial<AssignmentSubmissionMeta>;
    return {
      version: 2,
      textResponse: typeof parsed.textResponse === 'string' ? parsed.textResponse : '',
      isLate: Boolean(parsed.isLate),
      attemptNumber: Math.max(1, Number.isFinite(parsed.attemptNumber) ? Number(parsed.attemptNumber) : 1),
      files: Array.isArray(parsed.files) ? parsed.files.filter(isAssignmentFileMeta) : [],
    };
  } catch {
    return { version: 2, textResponse: '', isLate: false, attemptNumber: 1, files: [] };
  }
}

function isAssignmentFileMeta(value: unknown): value is AssignmentFileMeta {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssignmentFileMeta>;
  return typeof item.fileId === 'string' && typeof item.fileName === 'string' && typeof item.mimeType === 'string' && typeof item.fileSizeBytes === 'number' && typeof item.kind === 'string';
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/\u0000-\u001f\u007f]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 180) || 'attachment';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function fileKind(mimeType: string): AssignmentResourceKind {
  if (PDF_TYPES.has(mimeType)) return 'PDF';
  if (IMAGE_TYPES.has(mimeType)) return 'IMAGE';
  if (VIDEO_TYPES.has(mimeType)) return 'VIDEO';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PRESENTATION';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'SPREADSHEET';
  return 'DOCUMENT';
}

function signatureLooksValid(bytes: Uint8Array, mimeType: string) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const ascii = (offset: number, value: string) => [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
  if (mimeType === 'application/pdf') return ascii(0, '%PDF');
  if (mimeType === 'image/jpeg') return starts(0xff, 0xd8, 0xff);
  if (mimeType === 'image/png') return starts(0x89, 0x50, 0x4e, 0x47);
  if (mimeType === 'image/gif') return ascii(0, 'GIF8');
  if (mimeType === 'image/webp') return ascii(0, 'RIFF') && ascii(8, 'WEBP');
  if (mimeType === 'video/mp4') return ascii(4, 'ftyp');
  if (mimeType === 'video/webm') return starts(0x1a, 0x45, 0xdf, 0xa3);
  if (MODERN_OFFICE_TYPES.has(mimeType)) return starts(0x50, 0x4b);
  if (LEGACY_OFFICE_TYPES.has(mimeType)) return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  return TEXT_TYPES.has(mimeType);
}
