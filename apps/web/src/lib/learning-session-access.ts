import { requireTenantContext } from './tenant-context';

export class LearningSessionAccessError extends Error {
  constructor(public readonly status: 401 | 403 | 404, message: string) {
    super(message);
  }
}

export async function requireLearningSessionAccess(courseId: string, sessionId: string) {
  const context = await requireTenantContext();
  const { db, session } = context;
  const courseOffering = await db.courseOffering.findFirst({ where: { courseId }, select: { id: true, facultyId: true } });
  if (!courseOffering) throw new LearningSessionAccessError(404, 'Course offering not found');
  const learningSession = await db.learningSession.findFirst({
    where: { id: sessionId, tenantId: session.tenantId, courseOfferingId: courseOffering.id },
  });
  if (!learningSession) throw new LearningSessionAccessError(404, 'Learning session not found');

  const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
  const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
  const isHost = staff?.id === courseOffering.facultyId;
  const enrollment = student ? await db.enrollment.findFirst({ where: { studentId: student.id, courseOfferingId: learningSession.courseOfferingId }, select: { id: true } }) : null;
  const isPrivileged = session.role === 'SUPER_ADMIN' || session.role === 'INSTITUTION_ADMIN';
  if (!isHost && !enrollment && !isPrivileged) throw new LearningSessionAccessError(403, 'You are not authorised to access this session');

  return { ...context, learningSession, isHost };
}

export async function requireLearningSessionParticipant(courseId: string, sessionId: string) {
  const access = await requireLearningSessionAccess(courseId, sessionId);
  const participant = await access.db.learningSessionParticipant.findFirst({ where: { sessionId, userId: access.session.userId } });
  if (!participant) throw new LearningSessionAccessError(403, 'Join the learning session before using this feature');
  return { ...access, participant };
}
