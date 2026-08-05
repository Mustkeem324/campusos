import { NextResponse } from 'next/server';
import { requireCourseAccess, CourseAccessError } from '../../../../../../lib/lms/course-access';
import {
  createCourseAnnouncement,
  CourseAnnouncementPermissionError,
  CourseAnnouncementValidationError,
} from '../../../../../../lib/lms/course-announcements';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16_384;

type AnnouncementInput = { title?: unknown; content?: unknown };

function parseBody(text: string): AnnouncementInput | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as AnnouncementInput;
  } catch {
    return null;
  }
}

/**
 * POST /api/learning/courses/[courseId]/announcements
 *
 * Faculty (assigned to the offering) and privileged roles may post a course
 * announcement. Students and other roles receive 403. Records are created
 * tenant-scoped through the access gate's extended client (tenantId auto-injected).
 */
export async function POST(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const access = await requireCourseAccess(params.courseId);

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Announcement is too large.' }, { status: 413 });
    }
    const input = parseBody(text);
    if (!input) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    if (typeof input.title !== 'string' || typeof input.content !== 'string') {
      return NextResponse.json({ error: 'A title and message are required.' }, { status: 400 });
    }

    const announcement = await createCourseAnnouncement(access, { title: input.title, content: input.content });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof CourseAnnouncementPermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof CourseAnnouncementValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unable to post announcement' }, { status: 500 });
  }
}
