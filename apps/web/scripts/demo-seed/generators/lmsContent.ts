import { PrismaClient, Institution } from '@prisma/client';
import { SeededRandom } from '../random';
import { AcademicsDataset } from './academics';

/**
 * Phase 97 — LMS foundation content for the demo tenant.
 *
 * Creates deterministic, tenant-scoped course modules and published lessons for
 * every seeded course offering, so the real course workspace (learning/courses)
 * renders actual content instead of an empty state or demo-only UI.
 *
 * Stable IDs from the seeded RNG; no Math.random() anywhere; idempotent upserts.
 */
const MODULE_TEMPLATES = [
  {
    title: 'Course Introduction & Foundations',
    description: 'Syllabus overview, learning outcomes, and the core concepts this course builds upon.',
    lessons: [
      { title: 'Welcome to the course', contentType: 'VIDEO' },
      { title: 'Syllabus and assessment plan', contentType: 'PDF' },
      { title: 'Foundational concepts primer', contentType: 'ARTICLE' },
    ],
  },
  {
    title: 'Core Concepts & Techniques',
    description: 'The essential techniques and models used throughout the remainder of the term.',
    lessons: [
      { title: 'Core technique walkthrough', contentType: 'VIDEO' },
      { title: 'Worked examples', contentType: 'ARTICLE' },
      { title: 'Practice problem set', contentType: 'ASSIGNMENT' },
    ],
  },
  {
    title: 'Applications & Case Studies',
    description: 'Real-world applications, case studies, and how the material connects to practice.',
    lessons: [
      { title: 'Case study analysis', contentType: 'ARTICLE' },
      { title: 'Application lab session', contentType: 'VIDEO' },
      { title: 'Module assessment', contentType: 'QUIZ' },
    ],
  },
];

export async function seedLmsContent(
  prisma: PrismaClient,
  institution: Institution,
  academics: AcademicsDataset,
  random: SeededRandom,
): Promise<void> {
  let moduleIndex = 0;

  for (const offering of academics.courseOfferings) {
    for (let m = 0; m < MODULE_TEMPLATES.length; m++) {
      const template = MODULE_TEMPLATES[m];
      const moduleId = random.generateStableId(40, moduleIndex);
      moduleIndex += 1;

      const courseModule = await prisma.courseModule.upsert({
        where: { id: moduleId },
        update: { title: template.title, description: template.description, sequence: m },
        create: {
          id: moduleId,
          courseOfferingId: offering.id,
          title: template.title,
          description: template.description,
          sequence: m,
        },
      });

      for (let l = 0; l < template.lessons.length; l++) {
        const lesson = template.lessons[l];
        const lessonId = random.generateStableId(41, moduleIndex);
        moduleIndex += 1;

        await prisma.courseLesson.upsert({
          where: { id: lessonId },
          update: {
            title: lesson.title,
            contentType: lesson.contentType,
            isPublished: true,
            sequence: l,
          },
          create: {
            id: lessonId,
            courseModuleId: courseModule.id,
            title: lesson.title,
            contentType: lesson.contentType,
            isPublished: true,
            sequence: l,
          },
        });
      }
    }
  }
}
