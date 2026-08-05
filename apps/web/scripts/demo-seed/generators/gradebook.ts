import { PrismaClient, Institution } from '@prisma/client';
import { SeededRandom } from '../random';
import { AcademicsDataset } from './academics';

/**
 * Phase 98 — Rubrics & Gradebook content for the demo tenant.
 *
 * Creates deterministic, tenant-scoped rubrics (per assignment) and a
 * gradebook (items + per-student scores) for every seeded course offering
 * that has assignments. Rubric / GradebookItem / GradebookScore rows carry no
 * tenantId column, so they are always resolved through their tenant-scoped
 * parent (assignment → courseOffering, gradebook → courseOffering).
 *
 * Stable IDs from the seeded RNG; no Math.random(); idempotent upserts.
 */
const RUBRIC_CRITERIA = [
  { criterion: 'Understanding of concepts', weight: 0.4 },
  { criterion: 'Application & analysis', weight: 0.35 },
  { criterion: 'Presentation & clarity', weight: 0.25 },
];

export async function seedGradebook(
  prisma: PrismaClient,
  institution: Institution,
  academics: AcademicsDataset,
  random: SeededRandom,
): Promise<void> {
  // Assignments are created only for the first 8 offerings in academics.ts.
  const offeringsWithAssignments = academics.courseOfferings.slice(0, 8);

  let rubricIndex = 0;
  let itemIndex = 0;
  let scoreIndex = 0;

  for (const offering of offeringsWithAssignments) {
    const assignments = await prisma.assignment.findMany({
      where: { tenantId: institution.id, courseOfferingId: offering.id },
      orderBy: { id: 'asc' },
      select: { id: true, title: true, maxMarks: true },
    });
    if (assignments.length === 0) continue;

    // 1. Rubrics — three criteria per assignment, points scaled to maxMarks.
    for (const assignment of assignments) {
      for (let r = 0; r < RUBRIC_CRITERIA.length; r++) {
        const rubricId = random.generateStableId(53, rubricIndex);
        rubricIndex += 1;
        const maxPoints = Math.round(assignment.maxMarks * RUBRIC_CRITERIA[r].weight * 100) / 100;
        await prisma.rubric.upsert({
          where: { id: rubricId },
          update: { criterion: RUBRIC_CRITERIA[r].criterion, maxPoints },
          create: { id: rubricId, assignmentId: assignment.id, criterion: RUBRIC_CRITERIA[r].criterion, maxPoints },
        });
      }
    }

    // 2. Gradebook — one per offering, items mirror assignments.
    const gradebookId = random.generateStableId(50, offeringsWithAssignments.indexOf(offering));
    const gradebook = await prisma.gradebook.upsert({
      where: { id: gradebookId },
      update: {},
      create: { id: gradebookId, tenantId: institution.id, courseOfferingId: offering.id },
    });

    const enrolled = academics.registrations.filter((reg) => reg.courseOfferingId === offering.id);

    for (const assignment of assignments) {
      const itemId = random.generateStableId(51, itemIndex);
      itemIndex += 1;
      const item = await prisma.gradebookItem.upsert({
        where: { id: itemId },
        update: { title: assignment.title, maxScore: assignment.maxMarks },
        create: { id: itemId, gradebookId: gradebook.id, title: assignment.title, maxScore: assignment.maxMarks },
      });

      for (const reg of enrolled) {
        // Only students with a real submission receive a score; students who
        // never submitted get no score (null is not representable here, so
        // we simply skip them) — the gradebook must never fabricate marks.
        const submission = await prisma.submission.findFirst({
          where: { tenantId: institution.id, assignmentId: assignment.id, studentId: reg.studentId },
          select: { marksObtained: true },
        });
        if (!submission || submission.marksObtained === null) {
          continue;
        }

        const scoreId = random.generateStableId(52, scoreIndex);
        scoreIndex += 1;
        await prisma.gradebookScore.upsert({
          where: { id: scoreId },
          update: { score: submission.marksObtained },
          create: { id: scoreId, gradebookItemId: item.id, studentId: reg.studentId, score: submission.marksObtained },
        });
      }
    }
  }
}
