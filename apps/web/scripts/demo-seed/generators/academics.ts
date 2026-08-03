import { PrismaClient, Institution, Course, CourseOffering, Enrollment, AttendanceStatus } from '@prisma/client';
import { DemoSeedConfig } from '../config';
import { SeededRandom } from '../random';
import { COURSES } from '../constants';
import { AcademicStructure } from './structure';
import { PeopleDataset } from './people';

export interface AcademicsDataset {
  courses: Course[];
  courseOfferings: CourseOffering[];
  registrations: Enrollment[];
}

export async function seedAcademics(
  prisma: PrismaClient,
  institution: Institution,
  structure: AcademicStructure,
  people: PeopleDataset,
  config: DemoSeedConfig,
  random: SeededRandom
): Promise<AcademicsDataset> {
  // 1. Courses
  const courses: Course[] = [];
  const activeCourses = COURSES.slice(0, config.courses);

  for (let i = 0; i < activeCourses.length; i++) {
    const cInfo = activeCourses[i];
    const dept = structure.departments.find(d => d.code === cInfo.deptCode) || structure.departments[i % structure.departments.length];
    const id = random.generateStableId(11, i);

    const course = await prisma.course.upsert({
      where: { id },
      update: { title: cInfo.title, code: cInfo.code, departmentId: dept.id, lectureCredits: cInfo.credits, practicalCredits: 1 },
      create: {
        id,
        tenantId: institution.id,
        departmentId: dept.id,
        title: cInfo.title,
        code: cInfo.code,
        lectureCredits: cInfo.credits,
        tutorialCredits: 0,
        practicalCredits: 1,
      }
    });
    courses.push(course);
  }

  // 2. Course Offerings
  const courseOfferings: CourseOffering[] = [];
  let offeringIndex = 0;
  const activeTerm = structure.terms[0];

  for (const course of courses) {
    const assignedFaculty = people.facultyStaff[offeringIndex % people.facultyStaff.length];
    const section = structure.sections[offeringIndex % structure.sections.length];
    const id = random.generateStableId(12, offeringIndex);

    const offering = await prisma.courseOffering.upsert({
      where: { id },
      update: { courseId: course.id, facultyId: assignedFaculty.id, sectionId: section.id, termId: activeTerm.id },
      create: {
        id,
        tenantId: institution.id,
        courseId: course.id,
        termId: activeTerm.id,
        facultyId: assignedFaculty.id,
        sectionId: section.id,
        capacity: 60,
      }
    });
    courseOfferings.push(offering);
    offeringIndex++;
  }

  // 3. Student Course Registrations (Enrollments)
  const registrations: Enrollment[] = [];
  let regIndex = 0;

  for (const student of people.students) {
    const matchingOfferings = courseOfferings.filter(o => o.sectionId === student.sectionId);
    const targetOfferings = matchingOfferings.length > 0 ? matchingOfferings : courseOfferings.slice(0, 4);

    for (const offering of targetOfferings) {
      const id = random.generateStableId(13, regIndex);
      const reg = await prisma.enrollment.upsert({
        where: { id },
        update: { studentId: student.id, courseOfferingId: offering.id },
        create: {
          id,
          tenantId: institution.id,
          studentId: student.id,
          courseOfferingId: offering.id,
        }
      });
      registrations.push(reg);
      regIndex++;
    }
  }

  // 4. Attendance Sessions & Records
  let sessionIndex = 0;
  for (const offering of courseOfferings.slice(0, 10)) {
    const sessId = random.generateStableId(14, sessionIndex);
    const sessionDate = new Date('2026-08-01');

    const attSession = await prisma.attendanceSession.upsert({
      where: { id: sessId },
      update: { sessionDate },
      create: {
        id: sessId,
        tenantId: institution.id,
        courseOfferingId: offering.id,
        sessionDate,
      }
    });

    const enrolledRegs = registrations.filter(r => r.courseOfferingId === offering.id);
    let attRecIdx = 0;
    for (const reg of enrolledRegs) {
      const recId = random.generateStableId(15, sessionIndex * 100 + attRecIdx);
      const status: AttendanceStatus = random.weightedItem(['PRESENT', 'ABSENT', 'LATE'], [0.85, 0.10, 0.05]) as AttendanceStatus;

      await prisma.attendanceRecord.upsert({
        where: { id: recId },
        update: { status },
        create: {
          id: recId,
          tenantId: institution.id,
          attendanceSessionId: attSession.id,
          studentId: reg.studentId,
          status,
        }
      });
      attRecIdx++;
    }
    sessionIndex++;
  }

  // 5. Assignments & Submissions
  let assignIdx = 0;
  for (const offering of courseOfferings.slice(0, 8)) {
    const assignId = random.generateStableId(16, assignIdx);
    const dueDate = new Date('2026-08-15');

    const assignment = await prisma.assignment.upsert({
      where: { id: assignId },
      update: { title: `Assignment 1: Fundamentals of Course`, dueDate },
      create: {
        id: assignId,
        tenantId: institution.id,
        courseOfferingId: offering.id,
        title: `Assignment 1: Fundamentals of Course`,
        description: 'Complete the problem set and upload solution PDF.',
        dueDate,
        maxMarks: 100,
      }
    });

    const enrolledRegs = registrations.filter(r => r.courseOfferingId === offering.id);
    let subIdx = 0;
    for (const reg of enrolledRegs) {
      const subId = random.generateStableId(17, assignIdx * 100 + subIdx);
      const isSubmitted = random.randomBoolean(0.9);

      if (isSubmitted) {
        const marksObtained = random.randomDecimal(65, 98, 1);
        await prisma.submission.upsert({
          where: { id: subId },
          update: { marksObtained },
          create: {
            id: subId,
            tenantId: institution.id,
            assignmentId: assignment.id,
            studentId: reg.studentId,
            fileUrl: '/uploads/sample-assignment.pdf',
            marksObtained,
            submittedAt: new Date('2026-08-14'),
          }
        });
      }
      subIdx++;
    }
    assignIdx++;
  }

  return {
    courses,
    courseOfferings,
    registrations,
  };
}
