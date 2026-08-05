import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { resolveAuthorisedCourses } from '../../../../lib/lms/course-listing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/courses
 *
 * Role-aware course listing, fully tenant-scoped, resolved by the shared
 * resolveAuthorisedCourses helper:
 *   - STUDENT → offerings the student is enrolled in
 *   - FACULTY → offerings the faculty member teaches
 *   - SUPER_ADMIN / INSTITUTION_ADMIN / REGISTRAR → all tenant offerings
 *
 * Status: 401 unauthenticated · 403 no profile/role resolution · 200 list.
 */
export async function GET() {
  try {
    const context = await requireTenantContext();
    const courses = await resolveAuthorisedCourses(context);
    return NextResponse.json({ courses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Unable to load courses' }, { status: 500 });
  }
}
