import { PrismaClient, Institution } from '@prisma/client';
import { SeededRandom } from '../random';
import { AcademicsDataset } from './academics';

/**
 * Phase 97/99 — LMS foundation content and course announcements for the demo tenant.
 *
 * Creates deterministic, tenant-scoped course modules, published lessons (with
 * real content bodies for reading lessons and stable sample video URLs for video
 * lessons), and course announcements authored by each offering's faculty.
 * The real course workspace (learning/courses) renders this content, so the
 * lesson viewer and announcements section show actual data instead of empty states.
 *
 * Stable IDs from the seeded RNG; no Math.random() anywhere; idempotent upserts.
 */

// Real, stable, publicly hosted sample videos (no fabricated URLs).
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

type LessonTemplate = { title: string; contentType: string; body?: string; url?: string };

const MODULE_TEMPLATES: { title: string; description: string; lessons: LessonTemplate[] }[] = [
  {
    title: 'Course Introduction & Foundations',
    description: 'Syllabus overview, learning outcomes, and the core concepts this course builds upon.',
    lessons: [
      { title: 'Welcome to the course', contentType: 'VIDEO', url: SAMPLE_VIDEOS[0] },
      {
        title: 'Syllabus and assessment plan',
        contentType: 'PDF',
        body: 'This document outlines the syllabus for {courseCode} — {courseTitle}. It covers the learning outcomes, the assessment breakdown, the weekly schedule, and the academic integrity policy. Assessment in this course combines continuous evaluation, practical work, and a final examination.',
      },
      {
        title: 'Foundational concepts primer',
        contentType: 'ARTICLE',
        body: 'Every course builds on a small set of foundational ideas. In {courseTitle} ({courseCode}) the core concepts introduced in this module anchor the techniques used later in the term. Read each section carefully, note the terminology, and attempt the self-check questions at the end before moving to the next module.',
      },
    ],
  },
  {
    title: 'Core Concepts & Techniques',
    description: 'The essential techniques and models used throughout the remainder of the term.',
    lessons: [
      { title: 'Core technique walkthrough', contentType: 'VIDEO', url: SAMPLE_VIDEOS[1] },
      {
        title: 'Worked examples',
        contentType: 'ARTICLE',
        body: 'The worked examples in this lesson step through the standard approach for {courseCode} problems. Follow each example from the given state to the final result, then reproduce the same steps on the practice problem set. Working through examples by hand is the most reliable way to internalise the technique.',
      },
      {
        title: 'Practice problem set',
        contentType: 'ASSIGNMENT',
        body: 'This problem set gives you structured practice on the core techniques of {courseTitle}. Complete the problems in order, show your working, and submit through the assessments section of this course before the deadline. The rubric rewards clear reasoning, not just the final answer.',
      },
    ],
  },
  {
    title: 'Applications & Case Studies',
    description: 'Real-world applications, case studies, and how the material connects to practice.',
    lessons: [
      {
        title: 'Case study analysis',
        contentType: 'ARTICLE',
        body: 'This case study applies the concepts of {courseCode} to a realistic scenario. Read the case, identify which techniques apply, and prepare a short written analysis. Use the discussion forum to compare your reasoning with classmates before the module assessment.',
      },
      { title: 'Application lab session', contentType: 'VIDEO', url: SAMPLE_VIDEOS[2] },
      {
        title: 'Module assessment',
        contentType: 'QUIZ',
        body: 'The module assessment checks your understanding of the applications and case studies in this module. It is time-limited and must be completed in one sitting. Review the worked examples and the case study before you begin.',
      },
    ],
  },
];

const ANNOUNCEMENT_TEMPLATES: { title: string; content: string; pinned: boolean }[] = [
  {
    title: 'Welcome to {courseCode} — {courseTitle}',
    content: 'Welcome to {courseTitle} ({courseCode}). Please review the course introduction module and the syllabus before our first session. All published lessons are available from this workspace, and announcements like this one will carry important updates throughout the term.',
    pinned: true,
  },
  {
    title: 'Weekly study guidance',
    content: 'This week we focus on the core concepts module of {courseCode}. Work through the video lesson and the worked examples, then attempt the practice problem set before the next session. Office hours are open for questions on this material.',
    pinned: false,
  },
  {
    title: 'Assessment reminder',
    content: 'Please submit your work for {courseCode} by the published deadlines. Review the rubric and the grading policy in the assessments section of this workspace before submitting. Late submissions follow the policy stated in the syllabus.',
    pinned: false,
  },
];

function replaceCourseTokens(value: string, code: string, title: string): string {
  return value.replaceAll('{courseCode}', code).replaceAll('{courseTitle}', title);
}

export async function seedLmsContent(
  prisma: PrismaClient,
  institution: Institution,
  academics: AcademicsDataset,
  random: SeededRandom,
): Promise<void> {
  let moduleIndex = 0;
  const courseById = new Map(academics.courses.map((course) => [course.id, course]));

  for (const offering of academics.courseOfferings) {
    const courseInfo = courseById.get(offering.courseId);
    const code = courseInfo?.code ?? 'COURSE';
    const title = courseInfo?.title ?? offering.courseId;

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
        const contentBody = lesson.body ? replaceCourseTokens(lesson.body, code, title) : null;

        await prisma.courseLesson.upsert({
          where: { id: lessonId },
          update: {
            title: lesson.title,
            contentType: lesson.contentType,
            contentBody,
            contentUrl: lesson.url ?? null,
            isPublished: true,
            sequence: l,
          },
          create: {
            id: lessonId,
            courseModuleId: courseModule.id,
            title: lesson.title,
            contentType: lesson.contentType,
            contentBody,
            contentUrl: lesson.url ?? null,
            isPublished: true,
            sequence: l,
          },
        });
      }
    }
  }
}

/**
 * Deterministic course announcements for every seeded offering. Each offering
 * gets three announcements (the first pinned), authored by the offering's
 * assigned faculty, with staggered creation dates. Tenant-scoped and idempotent.
 */
export async function seedCourseAnnouncements(
  prisma: PrismaClient,
  institution: Institution,
  academics: AcademicsDataset,
  random: SeededRandom,
): Promise<void> {
  const courseById = new Map(academics.courses.map((course) => [course.id, course]));
  const baseDate = Date.parse('2026-07-28T08:00:00Z');

  let announcementIndex = 0;
  for (let o = 0; o < academics.courseOfferings.length; o++) {
    const offering = academics.courseOfferings[o];
    const courseInfo = courseById.get(offering.courseId);
    const code = courseInfo?.code ?? 'COURSE';
    const title = courseInfo?.title ?? offering.courseId;

    for (let a = 0; a < ANNOUNCEMENT_TEMPLATES.length; a++) {
      const template = ANNOUNCEMENT_TEMPLATES[a];
      const id = random.generateStableId(42, announcementIndex);
      announcementIndex += 1;
      const createdAt = new Date(baseDate + o * 86_400_000 + a * 3_600_000);

      await prisma.courseAnnouncement.upsert({
        where: { id },
        update: {
          title: replaceCourseTokens(template.title, code, title),
          content: replaceCourseTokens(template.content, code, title),
          isPinned: template.pinned,
          authorId: offering.facultyId,
        },
        create: {
          id,
          tenantId: institution.id,
          courseOfferingId: offering.id,
          authorId: offering.facultyId,
          title: replaceCourseTokens(template.title, code, title),
          content: replaceCourseTokens(template.content, code, title),
          isPinned: template.pinned,
          createdAt,
        },
      });
    }
  }
}
