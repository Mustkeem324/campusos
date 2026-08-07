import crypto from 'crypto';

import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import {
  createResultVerificationToken,
  resultDocumentNumber,
  resultPublicOrigin,
  resultSnapshotHash,
  verifyResultVerificationToken,
  type ResultSnapshot,
} from './result-integrity';

export const RESULT_APPROVAL_ROLES: RoleType[] = [RoleType.FACULTY, RoleType.HOD, RoleType.DEAN];
export const RESULT_PUBLICATION_ROLES: RoleType[] = [
  RoleType.EXAMINATION_CONTROLLER,
  RoleType.REGISTRAR,
  RoleType.INSTITUTION_ADMIN,
  RoleType.SUPER_ADMIN,
];

const APPROVAL_ACTION = {
  FACULTY: 'RESULT_FACULTY_APPROVED',
  HOD: 'RESULT_HOD_APPROVED',
  DEAN: 'RESULT_DEAN_APPROVED',
} as const;
const PUBLICATION_ACTION = 'RESULT_PUBLISHED';

type ApprovalStage = keyof typeof APPROVAL_ACTION;

type ResultAuditDetails = {
  stage?: ApprovalStage;
  scopeKey?: string;
  comment?: string;
  actorRole?: string;
  actorName?: string;
  documentNumber?: string;
  snapshotHash?: string;
  verificationVersion?: number;
};

type LoadedResult = Awaited<ReturnType<typeof loadResultRecord>>;
type NonNullLoadedResult = NonNullable<LoadedResult>;

type ApprovalEvent = {
  id: string;
  action: string;
  scopeKey: string;
  approverName: string;
  approverRole: string;
  approvedAt: string;
  comment: string | null;
};

export type OfficialResultCourse = {
  courseOfferingId: string;
  code: string;
  title: string;
  department: string;
  credits: number;
  marksObtained: number;
  maxMarks: number | null;
  percentage: number | null;
  grade: string;
  gradePoints: number;
  isPass: boolean;
  facultyName: string;
};

export type OfficialResultApproval = {
  stage: ApprovalStage;
  scopeKey: string;
  label: string;
  approved: boolean;
  approverName: string | null;
  approverRole: string | null;
  approvedAt: string | null;
  comment: string | null;
};

export type OfficialResult = {
  id: string;
  institution: {
    name: string;
    code: string;
    logoUrl: string | null;
  };
  student: {
    name: string;
    rollNumber: string;
    programme: string;
    programmeCode: string;
    batch: string;
    section: string | null;
    department: string;
  };
  examination: {
    name: string;
    type: string;
    term: string;
    termNumber: number;
    academicYear: string;
    year: number;
  };
  courses: OfficialResultCourse[];
  academicIndex: {
    sgpa: number;
    cgpa: number;
    totalCredits: number;
    earnedCredits: number;
    resultStatus: string;
    marksObtained: number;
    maxMarks: number | null;
    percentage: number | null;
  };
  approvals: OfficialResultApproval[];
  approvalSummary: {
    facultyApproved: number;
    facultyRequired: number;
    hodApproved: number;
    hodRequired: number;
    deanApproved: boolean;
    readyToPublish: boolean;
  };
  publication: {
    published: boolean;
    publishedAt: string | null;
    publisherName: string | null;
    publisherRole: string | null;
    documentNumber: string;
    verificationToken: string | null;
    verificationUrl: string | null;
    integrity: 'VERIFIED' | 'LEGACY' | 'CHANGED' | 'DRAFT';
  };
};

export type ResultPublicationWorkspace = {
  role: RoleType;
  actorName: string;
  results: Array<OfficialResult & {
    workflowAction: {
      kind: 'APPROVE' | 'PUBLISH' | 'NONE';
      label: string;
      enabled: boolean;
      reason: string | null;
    };
  }>;
};

export async function loadLatestOfficialResultForViewer(context: ActiveUserContext): Promise<OfficialResult | null> {
  if (context.activeRole === RoleType.STUDENT && context.studentProfileId) {
    const result = await prisma.studentSemesterResult.findFirst({
      where: { tenantId: context.tenantId, studentId: context.studentProfileId, published: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    return result ? loadOfficialResult(context.tenantId, result.id) : null;
  }

  if (context.activeRole === RoleType.PARENT && context.guardianProfileId) {
    const linkedStudents = await prisma.student.findMany({
      where: { tenantId: context.tenantId, guardianId: context.guardianProfileId },
      select: { id: true },
    });
    if (linkedStudents.length === 0) return null;
    const result = await prisma.studentSemesterResult.findFirst({
      where: {
        tenantId: context.tenantId,
        studentId: { in: linkedStudents.map((student) => student.id) },
        published: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    return result ? loadOfficialResult(context.tenantId, result.id) : null;
  }

  throw new ResultPublicationError('This role does not have a student result view.', 403);
}

export async function loadOfficialResultForViewer(context: ActiveUserContext, resultId: string): Promise<OfficialResult> {
  const result = await prisma.studentSemesterResult.findFirst({
    where: { id: resultId, tenantId: context.tenantId, published: true },
    select: { studentId: true },
  });
  if (!result) throw new ResultPublicationError('Published result not found.', 404);

  if (context.activeRole === RoleType.STUDENT) {
    if (!context.studentProfileId || result.studentId !== context.studentProfileId) {
      throw new ResultPublicationError('Published result not found.', 404);
    }
  } else if (context.activeRole === RoleType.PARENT) {
    if (!context.guardianProfileId) throw new ResultPublicationError('Published result not found.', 404);
    const linked = await prisma.student.count({
      where: { id: result.studentId, tenantId: context.tenantId, guardianId: context.guardianProfileId },
    });
    if (!linked) throw new ResultPublicationError('Published result not found.', 404);
  } else {
    throw new ResultPublicationError('This role cannot download a student grade card from this route.', 403);
  }

  return loadOfficialResult(context.tenantId, resultId);
}

export async function loadVerifiedPublicResult(token: string): Promise<OfficialResult | null> {
  let resultId: string | null = null;
  try {
    resultId = verifyResultVerificationToken(token);
  } catch {
    return null;
  }
  if (!resultId) return null;
  const result = await prisma.studentSemesterResult.findUnique({ where: { id: resultId }, select: { tenantId: true, published: true } });
  if (!result?.published) return null;
  const official = await loadOfficialResult(result.tenantId, resultId);
  return official.publication.integrity === 'VERIFIED' ? official : null;
}

export async function loadResultPublicationWorkspace(context: ActiveUserContext): Promise<ResultPublicationWorkspace> {
  if (![...RESULT_APPROVAL_ROLES, ...RESULT_PUBLICATION_ROLES].includes(context.activeRole)) {
    throw new ResultPublicationError('Your role is not authorised for result publication.', 403);
  }

  const actor = await prisma.user.findFirst({
    where: { id: context.userId, tenantId: context.tenantId, isActive: true },
    select: { name: true },
  });
  if (!actor) throw new ResultPublicationError('Active result-publication user could not be resolved.', 403);

  let departmentId: string | null = null;
  if (context.activeRole === RoleType.HOD) {
    const staff = await prisma.staff.findFirst({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { departmentId: true },
    });
    departmentId = staff?.departmentId ?? null;
    if (!departmentId) throw new ResultPublicationError('The HOD department assignment could not be resolved.', 403);
  }

  const where = context.activeRole === RoleType.FACULTY
    ? {
        tenantId: context.tenantId,
        courseResults: { some: { courseOffering: { facultyId: context.staffProfileId ?? '__unresolved__' } } },
      }
    : context.activeRole === RoleType.HOD
      ? {
          tenantId: context.tenantId,
          courseResults: { some: { courseOffering: { course: { departmentId: departmentId! } } } },
        }
      : { tenantId: context.tenantId };

  const rows = await prisma.studentSemesterResult.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 60,
    select: { id: true },
  });

  const results = await Promise.all(rows.map(async ({ id }) => {
    const official = await loadOfficialResult(context.tenantId, id);
    return { ...official, workflowAction: await workflowActionFor(context, official) };
  }));

  return { role: context.activeRole, actorName: actor.name, results };
}

export async function approveResultPublication(context: ActiveUserContext, resultId: string) {
  if (!RESULT_APPROVAL_ROLES.includes(context.activeRole)) {
    throw new ResultPublicationError('Your role is not authorised to approve this result.', 403);
  }

  const official = await loadOfficialResult(context.tenantId, resultId);
  if (official.publication.integrity === 'VERIFIED') {
    throw new ResultPublicationError('Published verified results are locked from further approval changes.', 409);
  }

  const actor = await prisma.user.findFirst({
    where: { id: context.userId, tenantId: context.tenantId, isActive: true },
    select: { name: true, role: true },
  });
  if (!actor) throw new ResultPublicationError('Approver account could not be resolved.', 403);

  const entity = resultEntity(resultId);
  const current = await loadApprovalEvents(context.tenantId, resultId);
  const creates: Array<{ stage: ApprovalStage; scopeKey: string; label: string }> = [];

  if (context.activeRole === RoleType.FACULTY) {
    if (!context.staffProfileId) throw new ResultPublicationError('Faculty profile could not be resolved.', 403);
    const record = await loadResultRecord(context.tenantId, resultId);
    if (!record) throw new ResultPublicationError('Result not found.', 404);
    const assigned = record.courseResults.filter((course) => course.courseOffering.facultyId === context.staffProfileId);
    if (assigned.length === 0) throw new ResultPublicationError('This result has no course assigned to the active faculty member.', 403);
    for (const course of assigned) {
      if (!approvalExists(current, 'FACULTY', course.courseOfferingId)) {
        creates.push({
          stage: 'FACULTY',
          scopeKey: course.courseOfferingId,
          label: `${course.courseOffering.course.code} - ${course.courseOffering.course.title}`,
        });
      }
    }
  }

  if (context.activeRole === RoleType.HOD) {
    const staff = await prisma.staff.findFirst({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { departmentId: true },
    });
    const departmentId = staff?.departmentId;
    if (!departmentId) throw new ResultPublicationError('The HOD department assignment could not be resolved.', 403);
    const requirement = official.approvals.find((approval) => approval.stage === 'HOD' && approval.scopeKey === departmentId);
    if (!requirement) throw new ResultPublicationError('This result is outside the active HOD department.', 403);
    const record = await loadResultRecord(context.tenantId, resultId);
    if (!record) throw new ResultPublicationError('Result not found.', 404);
    const departmentCourses = record.courseResults.filter((course) => course.courseOffering.course.departmentId === departmentId);
    const missingFaculty = departmentCourses.filter((course) => !approvalExists(current, 'FACULTY', course.courseOfferingId));
    if (missingFaculty.length > 0) {
      throw new ResultPublicationError(`Faculty certification is still pending for ${missingFaculty.length} course(s) in this department.`, 409);
    }
    if (!requirement.approved) creates.push({ stage: 'HOD', scopeKey: departmentId, label: requirement.label });
  }

  if (context.activeRole === RoleType.DEAN) {
    if (!official.approvalSummary.facultyRequired || !official.approvalSummary.hodRequired) {
      throw new ResultPublicationError('Result approval requirements are incomplete.', 409);
    }
    if (official.approvalSummary.facultyApproved !== official.approvalSummary.facultyRequired) {
      throw new ResultPublicationError('All course faculty must certify marks before Dean approval.', 409);
    }
    if (official.approvalSummary.hodApproved !== official.approvalSummary.hodRequired) {
      throw new ResultPublicationError('All required Heads of Department must approve before Dean approval.', 409);
    }
    if (!official.approvalSummary.deanApproved) creates.push({ stage: 'DEAN', scopeKey: 'FINAL', label: 'Academic Dean approval' });
  }

  if (creates.length === 0) return { changed: false, message: 'The active approval scope is already authorised.' };

  await prisma.$transaction(creates.map((item) => prisma.auditLog.upsert({
    where: { id: stableAuditId(resultId, APPROVAL_ACTION[item.stage], item.scopeKey) },
    update: {},
    create: {
      id: stableAuditId(resultId, APPROVAL_ACTION[item.stage], item.scopeKey),
      tenantId: context.tenantId,
      userId: context.userId,
      action: APPROVAL_ACTION[item.stage],
      entity,
      diffJson: JSON.stringify({
        stage: item.stage,
        scopeKey: item.scopeKey,
        actorRole: actor.role,
        actorName: actor.name,
        comment: `Authorised in the CampusOS official result publication workflow: ${item.label}.`,
      } satisfies ResultAuditDetails),
    },
  })));

  return { changed: true, message: `Recorded ${creates.length} official approval${creates.length === 1 ? '' : 's'}.` };
}

export async function publishOfficialResult(context: ActiveUserContext, resultId: string) {
  if (!RESULT_PUBLICATION_ROLES.includes(context.activeRole)) {
    throw new ResultPublicationError('Your role cannot publish official results.', 403);
  }

  const official = await loadOfficialResult(context.tenantId, resultId);
  if (!official.approvalSummary.readyToPublish) {
    throw new ResultPublicationError('Faculty, HOD and Dean authorisations must all be complete before publication.', 409);
  }

  const record = await loadResultRecord(context.tenantId, resultId);
  if (!record) throw new ResultPublicationError('Result not found.', 404);
  const actor = await prisma.user.findFirst({
    where: { id: context.userId, tenantId: context.tenantId, isActive: true },
    select: { name: true, role: true },
  });
  if (!actor) throw new ResultPublicationError('Publisher account could not be resolved.', 403);

  const snapshotHash = resultSnapshotHash(snapshotFor(record));
  const documentNumber = resultDocumentNumber(record.institution.code, examinationYear(record), record.id);
  const publicationAuditId = stableAuditId(resultId, PUBLICATION_ACTION, 'FINAL');
  const notificationId = stableAuditId(resultId, 'RESULT_PUBLICATION_NOTIFICATION', record.student.userId);

  await prisma.$transaction([
    prisma.studentSemesterResult.update({
      where: { id: resultId },
      data: { published: true },
    }),
    prisma.auditLog.upsert({
      where: { id: publicationAuditId },
      update: {},
      create: {
        id: publicationAuditId,
        tenantId: context.tenantId,
        userId: context.userId,
        action: PUBLICATION_ACTION,
        entity: resultEntity(resultId),
        diffJson: JSON.stringify({
          scopeKey: 'FINAL',
          actorRole: actor.role,
          actorName: actor.name,
          documentNumber,
          snapshotHash,
          verificationVersion: 1,
          comment: 'Official result published after completion of the required academic approval chain.',
        } satisfies ResultAuditDetails),
      },
    }),
    prisma.notification.upsert({
      where: { id: notificationId },
      update: {
        title: 'Official result published',
        body: `${record.examination.name} is authorised and available with a verifiable grade card.`,
        actionUrl: '/results',
        isRead: false,
      },
      create: {
        id: notificationId,
        tenantId: context.tenantId,
        userId: record.student.userId,
        title: 'Official result published',
        body: `${record.examination.name} is authorised and available with a verifiable grade card.`,
        type: 'RESULT',
        actionUrl: '/results',
        isRead: false,
      },
    }),
  ]);

  return loadOfficialResult(context.tenantId, resultId);
}

async function loadOfficialResult(tenantId: string, resultId: string): Promise<OfficialResult> {
  const record = await loadResultRecord(tenantId, resultId);
  if (!record) throw new ResultPublicationError('Result not found.', 404);

  const [marks, audits] = await Promise.all([
    prisma.studentMarks.findMany({
      where: {
        tenantId,
        studentId: record.studentId,
        marksEntryBatch: {
          examinationId: record.examinationId,
          courseOfferingId: { in: record.courseResults.map((course) => course.courseOfferingId) },
        },
      },
      select: {
        marksObtained: true,
        maxMarks: true,
        isAbsent: true,
        marksEntryBatch: { select: { courseOfferingId: true } },
      },
    }),
    loadResultAudits(tenantId, resultId),
  ]);

  const marksByOffering = new Map(marks.map((mark) => [mark.marksEntryBatch.courseOfferingId, mark]));
  const approvalEvents = parseApprovalEvents(audits);
  const approvals = buildApprovalRequirements(record, approvalEvents);
  const facultyApprovals = approvals.filter((approval) => approval.stage === 'FACULTY');
  const hodApprovals = approvals.filter((approval) => approval.stage === 'HOD');
  const deanApproval = approvals.find((approval) => approval.stage === 'DEAN');
  const publicationAudit = audits.find((audit) => audit.action === PUBLICATION_ACTION) ?? null;
  const publicationDetails = publicationAudit ? parseDetails(publicationAudit.diffJson) : null;
  const snapshotHash = resultSnapshotHash(snapshotFor(record));
  const storedSnapshotHash = publicationDetails?.snapshotHash ?? null;

  let integrity: OfficialResult['publication']['integrity'];
  if (!record.published) integrity = 'DRAFT';
  else if (!publicationAudit || !storedSnapshotHash) integrity = 'LEGACY';
  else if (storedSnapshotHash !== snapshotHash) integrity = 'CHANGED';
  else integrity = 'VERIFIED';

  const documentNumber = publicationDetails?.documentNumber
    ?? resultDocumentNumber(record.institution.code, examinationYear(record), record.id);
  let verificationToken: string | null = null;
  let verificationUrl: string | null = null;
  if (integrity === 'VERIFIED') {
    try {
      verificationToken = createResultVerificationToken(record.id);
      verificationUrl = `${resultPublicOrigin()}/verify/result/${verificationToken}`;
    } catch {
      verificationToken = null;
      verificationUrl = null;
    }
  }

  const courses: OfficialResultCourse[] = record.courseResults.map((courseResult) => {
    const mark = marksByOffering.get(courseResult.courseOfferingId);
    const maxMarks = mark?.maxMarks ?? null;
    const obtained = mark?.isAbsent ? 0 : mark?.marksObtained ?? courseResult.totalMarks;
    return {
      courseOfferingId: courseResult.courseOfferingId,
      code: courseResult.courseOffering.course.code,
      title: courseResult.courseOffering.course.title,
      department: courseResult.courseOffering.course.department.name,
      credits: courseResult.credits,
      marksObtained: obtained,
      maxMarks,
      percentage: maxMarks && maxMarks > 0 ? Number(((obtained / maxMarks) * 100).toFixed(2)) : null,
      grade: courseResult.grade,
      gradePoints: courseResult.gradePoints,
      isPass: courseResult.isPass,
      facultyName: courseResult.courseOffering.faculty.user.name,
    };
  });

  const knownMaxMarks = courses.every((course) => typeof course.maxMarks === 'number');
  const totalObtained = courses.reduce((sum, course) => sum + course.marksObtained, 0);
  const totalMaxMarks = knownMaxMarks ? courses.reduce((sum, course) => sum + (course.maxMarks ?? 0), 0) : null;

  return {
    id: record.id,
    institution: {
      name: record.institution.name,
      code: record.institution.code,
      logoUrl: record.institution.logoUrl,
    },
    student: {
      name: record.student.user.name,
      rollNumber: record.student.rollNumber,
      programme: record.student.batch.program.name,
      programmeCode: record.student.batch.program.code,
      batch: record.student.batch.name,
      section: record.student.section?.name ?? null,
      department: record.student.batch.program.department.name,
    },
    examination: {
      name: record.examination.name,
      type: record.examination.type,
      term: record.examination.term.name,
      termNumber: record.examination.term.number,
      academicYear: record.examination.term.academicYear.name,
      year: examinationYear(record),
    },
    courses,
    academicIndex: {
      sgpa: record.sgpa,
      cgpa: record.cgpa,
      totalCredits: record.totalCredits,
      earnedCredits: record.earnedCredits,
      resultStatus: record.status,
      marksObtained: Number(totalObtained.toFixed(2)),
      maxMarks: totalMaxMarks,
      percentage: totalMaxMarks && totalMaxMarks > 0 ? Number(((totalObtained / totalMaxMarks) * 100).toFixed(2)) : null,
    },
    approvals,
    approvalSummary: {
      facultyApproved: facultyApprovals.filter((approval) => approval.approved).length,
      facultyRequired: facultyApprovals.length,
      hodApproved: hodApprovals.filter((approval) => approval.approved).length,
      hodRequired: hodApprovals.length,
      deanApproved: Boolean(deanApproval?.approved),
      readyToPublish:
        facultyApprovals.length > 0
        && facultyApprovals.every((approval) => approval.approved)
        && hodApprovals.length > 0
        && hodApprovals.every((approval) => approval.approved)
        && Boolean(deanApproval?.approved),
    },
    publication: {
      published: record.published,
      publishedAt: publicationAudit?.createdAt.toISOString() ?? null,
      publisherName: publicationAudit?.user?.name ?? publicationDetails?.actorName ?? null,
      publisherRole: publicationDetails?.actorRole ?? publicationAudit?.user?.role ?? null,
      documentNumber,
      verificationToken,
      verificationUrl,
      integrity,
    },
  };
}

async function workflowActionFor(context: ActiveUserContext, result: OfficialResult): Promise<ResultPublicationWorkspace['results'][number]['workflowAction']> {
  if (result.publication.integrity === 'VERIFIED') {
    return { kind: 'NONE', label: 'Published', enabled: false, reason: 'This result is published and integrity-verified.' };
  }
  if (result.publication.integrity === 'CHANGED') {
    return { kind: 'NONE', label: 'Integrity exception', enabled: false, reason: 'The academic snapshot differs from the published record. Administrative review is required.' };
  }

  if (context.activeRole === RoleType.FACULTY) {
    const record = await loadResultRecord(context.tenantId, result.id);
    const assignedScopes = record?.courseResults.filter((course) => course.courseOffering.facultyId === context.staffProfileId).map((course) => course.courseOfferingId) ?? [];
    const pending = result.approvals.filter((approval) => approval.stage === 'FACULTY' && assignedScopes.includes(approval.scopeKey) && !approval.approved);
    return pending.length > 0
      ? { kind: 'APPROVE', label: `Certify ${pending.length} assigned course${pending.length === 1 ? '' : 's'}`, enabled: true, reason: null }
      : { kind: 'NONE', label: 'Faculty certified', enabled: false, reason: 'Your assigned course marks are already certified.' };
  }

  if (context.activeRole === RoleType.HOD) {
    const staff = await prisma.staff.findFirst({ where: { tenantId: context.tenantId, userId: context.userId }, select: { departmentId: true } });
    const requirement = result.approvals.find((approval) => approval.stage === 'HOD' && approval.scopeKey === staff?.departmentId);
    if (!requirement) return { kind: 'NONE', label: 'Outside department', enabled: false, reason: 'No result scope belongs to the active HOD department.' };
    if (requirement.approved) return { kind: 'NONE', label: 'HOD approved', enabled: false, reason: 'Department approval is complete.' };
    const record = await loadResultRecord(context.tenantId, result.id);
    const departmentCourses = record?.courseResults.filter((course) => course.courseOffering.course.departmentId === staff?.departmentId) ?? [];
    const facultyComplete = departmentCourses.every((course) => result.approvals.some((approval) => approval.stage === 'FACULTY' && approval.scopeKey === course.courseOfferingId && approval.approved));
    return {
      kind: 'APPROVE',
      label: 'Approve department result',
      enabled: facultyComplete,
      reason: facultyComplete ? null : 'Faculty certification is still pending for one or more department courses.',
    };
  }

  if (context.activeRole === RoleType.DEAN) {
    if (result.approvalSummary.deanApproved) return { kind: 'NONE', label: 'Dean approved', enabled: false, reason: 'Academic Dean approval is complete.' };
    const priorComplete = result.approvalSummary.facultyApproved === result.approvalSummary.facultyRequired
      && result.approvalSummary.hodApproved === result.approvalSummary.hodRequired
      && result.approvalSummary.facultyRequired > 0
      && result.approvalSummary.hodRequired > 0;
    return {
      kind: 'APPROVE',
      label: 'Authorise for publication',
      enabled: priorComplete,
      reason: priorComplete ? null : 'Faculty and HOD authorisations must be complete first.',
    };
  }

  if (RESULT_PUBLICATION_ROLES.includes(context.activeRole)) {
    return {
      kind: 'PUBLISH',
      label: result.publication.published ? 'Seal published legacy result' : 'Publish official result',
      enabled: result.approvalSummary.readyToPublish,
      reason: result.approvalSummary.readyToPublish ? null : 'Faculty, HOD and Dean authorisations are incomplete.',
    };
  }

  return { kind: 'NONE', label: 'No action', enabled: false, reason: null };
}

async function loadResultRecord(tenantId: string, resultId: string) {
  const [result, institution] = await Promise.all([
    prisma.studentSemesterResult.findFirst({
      where: { id: resultId, tenantId },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            batch: {
              include: {
                program: { include: { department: true } },
              },
            },
            section: true,
          },
        },
        examination: {
          include: {
            term: { include: { academicYear: true } },
          },
        },
        courseResults: {
          include: {
            courseOffering: {
              include: {
                course: { include: { department: true } },
                faculty: { include: { user: { select: { id: true, name: true } } } },
              },
            },
          },
          orderBy: { courseOfferingId: 'asc' },
        },
      },
    }),
    prisma.institution.findFirst({
      where: { id: tenantId },
      select: { id: true, name: true, code: true, logoUrl: true },
    }),
  ]);
  if (!result || !institution) return null;
  return { ...result, institution };
}

function buildApprovalRequirements(record: NonNullLoadedResult, events: ApprovalEvent[]): OfficialResultApproval[] {
  const faculty = record.courseResults.map((course) => approvalRequirement(
    'FACULTY',
    course.courseOfferingId,
    `${course.courseOffering.course.code} - ${course.courseOffering.course.title}`,
    events,
  ));

  const departments = new Map<string, string>();
  for (const course of record.courseResults) departments.set(course.courseOffering.course.departmentId, course.courseOffering.course.department.name);
  const hod = [...departments.entries()].map(([departmentId, name]) => approvalRequirement('HOD', departmentId, `${name} - Head of Department`, events));
  const dean = approvalRequirement('DEAN', 'FINAL', 'Academic Dean - final academic authorisation', events);
  return [...faculty, ...hod, dean];
}

function approvalRequirement(stage: ApprovalStage, scopeKey: string, label: string, events: ApprovalEvent[]): OfficialResultApproval {
  const event = events.find((candidate) => candidate.action === APPROVAL_ACTION[stage] && candidate.scopeKey === scopeKey);
  return {
    stage,
    scopeKey,
    label,
    approved: Boolean(event),
    approverName: event?.approverName ?? null,
    approverRole: event?.approverRole ?? null,
    approvedAt: event?.approvedAt ?? null,
    comment: event?.comment ?? null,
  };
}

async function loadResultAudits(tenantId: string, resultId: string) {
  return prisma.auditLog.findMany({
    where: {
      tenantId,
      entity: resultEntity(resultId),
      action: { in: [...Object.values(APPROVAL_ACTION), PUBLICATION_ACTION] },
    },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { name: true, role: true } } },
  });
}

async function loadApprovalEvents(tenantId: string, resultId: string) {
  return parseApprovalEvents(await loadResultAudits(tenantId, resultId));
}

function parseApprovalEvents(audits: Awaited<ReturnType<typeof loadResultAudits>>): ApprovalEvent[] {
  return audits.flatMap((audit) => {
    if (!Object.values(APPROVAL_ACTION).includes(audit.action as (typeof APPROVAL_ACTION)[ApprovalStage])) return [];
    const details = parseDetails(audit.diffJson);
    if (!details?.scopeKey) return [];
    return [{
      id: audit.id,
      action: audit.action,
      scopeKey: details.scopeKey,
      approverName: details.actorName ?? audit.user?.name ?? 'Authorised academic officer',
      approverRole: details.actorRole ?? audit.user?.role ?? 'ACADEMIC_APPROVER',
      approvedAt: audit.createdAt.toISOString(),
      comment: details.comment ?? null,
    }];
  });
}

function approvalExists(events: ApprovalEvent[], stage: ApprovalStage, scopeKey: string) {
  return events.some((event) => event.action === APPROVAL_ACTION[stage] && event.scopeKey === scopeKey);
}

function snapshotFor(record: NonNullLoadedResult): ResultSnapshot {
  return {
    resultId: record.id,
    tenantId: record.tenantId,
    studentId: record.studentId,
    examinationId: record.examinationId,
    sgpa: record.sgpa,
    cgpa: record.cgpa,
    totalCredits: record.totalCredits,
    earnedCredits: record.earnedCredits,
    status: record.status,
    courses: record.courseResults.map((course) => ({
      courseOfferingId: course.courseOfferingId,
      totalMarks: course.totalMarks,
      grade: course.grade,
      gradePoints: course.gradePoints,
      credits: course.credits,
      isPass: course.isPass,
    })),
  };
}

function examinationYear(record: NonNullLoadedResult) {
  const match = /(20\d{2})/.exec(record.examination.term.academicYear.name) ?? /(20\d{2})/.exec(record.examination.name);
  if (match) return Number(match[1]);
  return record.examination.term.endDate.getUTCFullYear();
}

function resultEntity(resultId: string) {
  return `StudentSemesterResult:${resultId}`;
}

function stableAuditId(resultId: string, action: string, scopeKey: string) {
  const hex = crypto.createHash('sha256').update(`campusos:${resultId}:${action}:${scopeKey}`).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  const variant = parseInt(hex[16], 16);
  hex[16] = ((variant & 0x3) | 0x8).toString(16);
  const raw = hex.join('');
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

function parseDetails(raw: string | null): ResultAuditDetails | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ResultAuditDetails;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export class ResultPublicationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ResultPublicationError';
    this.status = status;
  }
}
