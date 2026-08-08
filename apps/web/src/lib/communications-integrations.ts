import 'server-only';

import { Prisma } from '@prisma/client';

import { prisma } from './db';
import { requireActiveUserContext } from './active-user-context';
import { attendancePercentage } from './smart-attendance-policy';
import { communicationEvents } from './communications-events';

/**
 * Best-effort communication integration invoked only after an attendance
 * register has been authoritatively submitted. Communication failures must not
 * roll back the academic attendance transaction.
 */
export async function emitSubmittedAttendanceWarnings(sessionId: string) {
  const context = await requireActiveUserContext();
  const sessions = await prisma.$queryRaw<Array<{
    course_offering_id: string;
    session_date: string;
    required_percentage: number;
  }>>`
    SELECT s.course_offering_id, s.session_date::text,
           COALESCE(cfg.required_percentage, 75)::int AS required_percentage
    FROM campusos_attendance.sessions s
    LEFT JOIN campusos_attendance.settings cfg ON cfg.tenant_id=s.tenant_id
    WHERE s.id=${sessionId}::uuid AND s.tenant_id=${context.tenantId}::uuid AND s.status='SUBMITTED'
    LIMIT 1
  `;
  const session = sessions[0];
  if (!session) return { emitted: 0 };

  const offering = await prisma.courseOffering.findFirst({
    where: { id: session.course_offering_id, tenantId: context.tenantId },
    include: { course: { select: { code: true, name: true } } },
  });
  if (!offering) return { emitted: 0 };

  const enrollments = await prisma.enrollment.findMany({
    where: { tenantId: context.tenantId, courseOfferingId: session.course_offering_id, status: 'ENROLLED' },
    include: { student: { select: { id: true, user: { select: { name: true } } } } },
    take: 5000,
  });
  if (!enrollments.length) return { emitted: 0 };

  const studentIds = enrollments.map((item) => item.studentId);
  const studentUuidList = Prisma.join(studentIds.map((studentId) => Prisma.sql`${studentId}::uuid`));
  const summaries = await prisma.$queryRaw<Array<{
    student_id: string;
    held: bigint;
    present: bigint;
    late: bigint;
  }>>(Prisma.sql`
    SELECT m.student_id,
           count(*)::bigint AS held,
           count(*) FILTER (WHERE m.status='PRESENT')::bigint AS present,
           count(*) FILTER (WHERE m.status='LATE')::bigint AS late
    FROM campusos_attendance.sessions s
    JOIN campusos_attendance.marks m ON m.session_id=s.id AND m.tenant_id=s.tenant_id
    WHERE s.tenant_id=${context.tenantId}::uuid
      AND s.course_offering_id=${session.course_offering_id}::uuid
      AND s.status='SUBMITTED'
      AND m.student_id IN (${studentUuidList})
    GROUP BY m.student_id
  `);
  const summaryMap = new Map(summaries.map((row) => [row.student_id, row]));
  let emitted = 0;

  for (const enrollment of enrollments) {
    const summary = summaryMap.get(enrollment.studentId);
    if (!summary) continue;
    const held = Number(summary.held);
    const present = Number(summary.present);
    const late = Number(summary.late);
    const percentage = attendancePercentage(present, late, held);
    if (percentage >= session.required_percentage) continue;
    await communicationEvents.attendanceWarning({
      tenantId: context.tenantId,
      studentId: enrollment.studentId,
      courseOfferingId: session.course_offering_id,
      thresholdBand: 'below-required',
      academicDate: session.session_date,
      percentage: Math.round(percentage * 100) / 100,
      requiredPercentage: session.required_percentage,
      data: {
        student: { name: enrollment.student.user.name },
        course: { code: offering.course.code, title: offering.course.name },
        attendance: {
          percentage: Math.round(percentage * 100) / 100,
          requiredPercentage: session.required_percentage,
          held,
          attended: present + late,
        },
      },
    });
    emitted += 1;
  }
  return { emitted };
}
