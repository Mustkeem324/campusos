import type { PrismaClient } from '@prisma/client';

export const LMS_LESSON_COMPLETE_ACTION = 'LMS_LESSON_COMPLETED';
const LMS_LESSON_ENTITY_PREFIX = 'LMS_LESSON:';

export function lessonProgressEntity(lessonId: string) {
  return `${LMS_LESSON_ENTITY_PREFIX}${lessonId}`;
}

export function lessonIdFromProgressEntity(entity: string) {
  return entity.startsWith(LMS_LESSON_ENTITY_PREFIX) ? entity.slice(LMS_LESSON_ENTITY_PREFIX.length) : null;
}

export async function getCompletedLessonIds(
  db: PrismaClient,
  input: { tenantId: string; userId: string },
) {
  const rows = await db.auditLog.findMany({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: LMS_LESSON_COMPLETE_ACTION,
      entity: { startsWith: LMS_LESSON_ENTITY_PREFIX },
    },
    select: { entity: true },
  });

  return new Set(
    rows
      .map((row) => lessonIdFromProgressEntity(row.entity))
      .filter((value): value is string => Boolean(value)),
  );
}

export async function markLessonCompleted(
  db: PrismaClient,
  input: {
    tenantId: string;
    userId: string;
    courseId: string;
    courseOfferingId: string;
    lessonId: string;
    moduleId: string;
  },
) {
  const entity = lessonProgressEntity(input.lessonId);
  const existing = await db.auditLog.findFirst({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: LMS_LESSON_COMPLETE_ACTION,
      entity,
    },
    select: { id: true, createdAt: true },
  });

  if (existing) return { alreadyCompleted: true, completedAt: existing.createdAt };

  const created = await db.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: LMS_LESSON_COMPLETE_ACTION,
      entity,
      diffJson: JSON.stringify({
        courseId: input.courseId,
        courseOfferingId: input.courseOfferingId,
        lessonId: input.lessonId,
        moduleId: input.moduleId,
      }),
    },
    select: { createdAt: true },
  });

  return { alreadyCompleted: false, completedAt: created.createdAt };
}
