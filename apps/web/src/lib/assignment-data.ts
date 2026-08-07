import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import {
  assignmentStatus,
  assertAssignmentAccess,
  isAssignmentManager,
  loadAssignmentWorkspace,
  loadAssignmentWorkspaceMap,
  loadSubmissionMeta,
  loadSubmissionMetaMap,
} from './assignment-workspace';
import { prisma } from './db';
import { PRIVILEGED_ROLES } from './lms/course-listing';

export type AssignmentDashboardItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  course: { id: string; code: string; title: string };
  sectionName: string;
  termName: string;
  resourceCount: number;
  status: 'GRADED' | 'LATE' | 'SUBMITTED' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';
  submission: null | { id: string; submittedAt: string; marksObtained: number | null; isLate: boolean };
  submissionCount: number;
};

export type AssignmentDashboardData = {
  role: RoleType;
  canCreate: boolean;
  items: AssignmentDashboardItem[];
};

export async function loadAssignmentDashboard(context: ActiveUserContext): Promise<AssignmentDashboardData> {
  const baseSelect = {
    id: true,
    title: true,
    description: true,
    dueDate: true,
    maxMarks: true,
    courseOffering: {
      select: {
        courseId: true,
        course: { select: { id: true, code: true, title: true } },
        section: { select: { name: true } },
        term: { select: { name: true } },
      },
    },
    _count: { select: { submissions: true } },
  } as const;

  let rows: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    maxMarks: number;
    courseOffering: { courseId: string; course: { id: string; code: string; title: string }; section: { name: string }; term: { name: string } };
    _count: { submissions: number };
    submissions?: Array<{ id: string; submittedAt: Date; marksObtained: number | null }>;
  }> = [];

  if (PRIVILEGED_ROLES.includes(context.activeRole)) {
    rows = await prisma.assignment.findMany({ where: { tenantId: context.tenantId }, orderBy: { dueDate: 'asc' }, select: baseSelect });
  } else if (context.activeRole === RoleType.FACULTY && context.staffProfileId) {
    rows = await prisma.assignment.findMany({ where: { tenantId: context.tenantId, courseOffering: { facultyId: context.staffProfileId } }, orderBy: { dueDate: 'asc' }, select: baseSelect });
  } else if (context.activeRole === RoleType.STUDENT && context.studentProfileId) {
    rows = await prisma.assignment.findMany({
      where: { tenantId: context.tenantId, courseOffering: { enrollments: { some: { studentId: context.studentProfileId } } } },
      orderBy: { dueDate: 'asc' },
      select: { ...baseSelect, submissions: { where: { studentId: context.studentProfileId }, select: { id: true, submittedAt: true, marksObtained: true }, take: 1 } },
    });
  }

  const workspaceMap = await loadAssignmentWorkspaceMap(context.tenantId, rows.map((item) => item.id));
  return {
    role: context.activeRole,
    canCreate: isAssignmentManager(context.activeRole),
    items: rows.map((row) => {
      const submission = row.submissions?.[0] ?? null;
      const status = assignmentStatus({ dueDate: row.dueDate, submittedAt: submission?.submittedAt, marksObtained: submission?.marksObtained });
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        dueDate: row.dueDate.toISOString(),
        maxMarks: row.maxMarks,
        course: row.courseOffering.course,
        sectionName: row.courseOffering.section.name,
        termName: row.courseOffering.term.name,
        resourceCount: workspaceMap.get(row.id)?.resources.length ?? 0,
        status,
        submission: submission ? { id: submission.id, submittedAt: submission.submittedAt.toISOString(), marksObtained: submission.marksObtained, isLate: submission.submittedAt.getTime() > row.dueDate.getTime() } : null,
        submissionCount: row._count.submissions,
      };
    }),
  };
}

export async function loadAssignmentDetail(context: ActiveUserContext, assignmentId: string) {
  const assignment = await assertAssignmentAccess(context, assignmentId);
  const workspace = await loadAssignmentWorkspace(context.tenantId, assignment.id);
  const isStudent = context.activeRole === RoleType.STUDENT && Boolean(context.studentProfileId);
  const canManage = isAssignmentManager(context.activeRole) && (context.activeRole !== RoleType.FACULTY || assignment.courseOffering.facultyId === context.staffProfileId);

  let ownSubmission: null | {
    id: string;
    submittedAt: string;
    marksObtained: number | null;
    gradeLetter: string | null;
    feedback: string | null;
    meta: Awaited<ReturnType<typeof loadSubmissionMeta>>;
  } = null;

  if (isStudent && context.studentProfileId) {
    const submission = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: context.studentProfileId } },
      include: { grades: { select: { gradeLetter: true, feedback: true }, take: 1 } },
    });
    if (submission) {
      ownSubmission = {
        id: submission.id,
        submittedAt: submission.submittedAt.toISOString(),
        marksObtained: submission.marksObtained,
        gradeLetter: submission.grades[0]?.gradeLetter ?? null,
        feedback: submission.grades[0]?.feedback ?? null,
        meta: await loadSubmissionMeta(context.tenantId, submission.id),
      };
    }
  }

  let submissions: Array<{
    id: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    submittedAt: string;
    marksObtained: number | null;
    isLate: boolean;
    attemptNumber: number;
    textResponse: string;
    files: Awaited<ReturnType<typeof loadSubmissionMeta>>['files'];
  }> = [];

  if (canManage) {
    const rows = await prisma.submission.findMany({
      where: { tenantId: context.tenantId, assignmentId: assignment.id },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
    const metaMap = await loadSubmissionMetaMap(context.tenantId, rows.map((item) => item.id));
    submissions = rows.map((row) => {
      const meta = metaMap.get(row.id)!;
      return {
        id: row.id,
        studentId: row.studentId,
        studentName: row.student.user.name,
        rollNumber: row.student.rollNumber,
        submittedAt: row.submittedAt.toISOString(),
        marksObtained: row.marksObtained,
        isLate: row.submittedAt.getTime() > assignment.dueDate.getTime(),
        attemptNumber: meta.attemptNumber,
        textResponse: meta.textResponse,
        files: meta.files,
      };
    });
  }

  return {
    viewer: { role: context.activeRole, isStudent, canManage },
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.toISOString(),
      maxMarks: assignment.maxMarks,
      courseOfferingId: assignment.courseOfferingId,
      course: assignment.courseOffering.course,
      sectionName: assignment.courseOffering.section.name,
      termName: assignment.courseOffering.term.name,
      facultyName: assignment.courseOffering.faculty.user.name,
      rubrics: assignment.rubrics.map((rubric) => ({ id: rubric.id, criterion: rubric.criterion, maxPoints: rubric.maxPoints })),
      workspace,
    },
    ownSubmission,
    submissions,
  };
}

export async function loadAssignmentCreationCourses(context: ActiveUserContext) {
  if (!isAssignmentManager(context.activeRole)) return [];
  if (PRIVILEGED_ROLES.includes(context.activeRole)) {
    return prisma.courseOffering.findMany({
      where: { tenantId: context.tenantId },
      orderBy: [{ course: { code: 'asc' } }, { id: 'asc' }],
      select: { id: true, course: { select: { code: true, title: true } }, section: { select: { name: true } }, term: { select: { name: true } }, _count: { select: { enrollments: true } } },
    });
  }
  if (context.activeRole === RoleType.FACULTY && context.staffProfileId) {
    return prisma.courseOffering.findMany({
      where: { tenantId: context.tenantId, facultyId: context.staffProfileId },
      orderBy: [{ course: { code: 'asc' } }, { id: 'asc' }],
      select: { id: true, course: { select: { code: true, title: true } }, section: { select: { name: true } }, term: { select: { name: true } }, _count: { select: { enrollments: true } } },
    });
  }
  return [];
}
