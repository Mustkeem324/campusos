import type { CourseAccess } from './course-access';

export const MAX_ANNOUNCEMENT_TITLE = 120;
export const MAX_ANNOUNCEMENT_CONTENT = 2_000;

export type CourseAnnouncementInput = { title: string; content: string };

export class CourseAnnouncementPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseAnnouncementPermissionError';
  }
}

export class CourseAnnouncementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseAnnouncementValidationError';
  }
}

/**
 * Trims, length-checks and rejects control characters.
 *
 * - CRLF / lone CR are normalised to LF before validation.
 * - With allowNewlines=false (titles) every control character is rejected.
 * - With allowNewlines=true (messages) LF and tab are allowed; all other
 *   control characters are rejected (header/terminal injection defence).
 */
export function sanitizeAnnouncementField(value: string, maxLength: number, allowNewlines = false): string {
  if (typeof value !== 'string') {
    throw new CourseAnnouncementValidationError('Invalid announcement field.');
  }
  const normalized = value.replace(/\r\n?/g, '\n');
  const trimmed = normalized.trim();
  if (trimmed.length === 0) {
    throw new CourseAnnouncementValidationError('Announcement fields cannot be empty.');
  }
  if (trimmed.length > maxLength) {
    throw new CourseAnnouncementValidationError(`Announcement fields are limited to ${maxLength} characters.`);
  }
  // eslint-disable-next-line no-control-regex
  const controlPattern = allowNewlines ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
  if (controlPattern.test(trimmed)) {
    throw new CourseAnnouncementValidationError('Announcement fields contain unsupported characters.');
  }
  return trimmed;
}

/**
 * Creates a tenant-scoped course announcement for an authorised caller.
 *
 * Authorization (resolved by requireCourseAccess):
 *   - assigned FACULTY → authors as the offering's faculty
 *   - privileged roles with a tenant staff profile → author resolved, else null
 *   - STUDENT / other roles → CourseAnnouncementPermissionError
 */
export async function createCourseAnnouncement(access: CourseAccess, input: CourseAnnouncementInput) {
  if (access.accessRole === 'STUDENT') {
    throw new CourseAnnouncementPermissionError('Only instructors can post course announcements.');
  }

  const title = sanitizeAnnouncementField(input.title, MAX_ANNOUNCEMENT_TITLE);
  const content = sanitizeAnnouncementField(input.content, MAX_ANNOUNCEMENT_CONTENT, true);

  let authorId: string | null = null;
  if (access.accessRole === 'FACULTY') {
    // The assigned faculty owns the offering.
    authorId = access.offering.facultyId;
  } else {
    // Privileged roles post with author attribution when they hold a tenant
    // staff profile; otherwise the announcement is authored by "Administration".
    const staff = await access.db.staff.findUnique({
      where: { userId: access.session.userId },
      select: { id: true },
    });
    authorId = staff?.id ?? null;
  }

  return access.db.courseAnnouncement.create({
    data: {
      tenantId: access.session.tenantId,
      courseOfferingId: access.offering.id,
      authorId,
      title,
      content,
      isPinned: false,
    },
    select: {
      id: true,
      title: true,
      content: true,
      isPinned: true,
      createdAt: true,
      author: { select: { user: { select: { name: true } } } },
    },
  });
}
