import { PrismaClient, Institution } from '@prisma/client';
import { SeededRandom } from '../random';
import { AcademicStructure } from './structure';
import { PeopleDataset } from './people';
import { AcademicsDataset } from './academics';

/**
 * Phase 95 — Student-life records for the demo tenant.
 *
 * Creates deterministic, tenant-scoped, relationally-consistent records that
 * back the Student dashboard sections the generic seed never covered:
 *   - Notices targeted at students
 *   - Examination schedule (legacy Exam + ExamSchedule in the enrolled term)
 *   - Published semester results (StudentSemesterResult + StudentCourseResult)
 *   - A hostel allocation (Allocation → RoomHostel → Hostel)
 *   - Student service support cases (SupportCase by userId)
 *
 * Everything uses stable IDs from the seeded RNG; no Math.random() anywhere.
 */
export async function seedStudentLife(
  prisma: PrismaClient,
  institution: Institution,
  structure: AcademicStructure,
  people: PeopleDataset,
  academics: AcademicsDataset,
  random: SeededRandom
): Promise<void> {
  const demoStudent = people.students[0];
  const demoStudentUser = people.studentUsers[0];

  if (!demoStudent || !demoStudentUser) {
    return;
  }

  const activeTerm = structure.terms[0];

  // 1. Notices (tenant-scoped, student-relevant targets)
  const notices: Array<{ id: string; title: string; content: string; targetRole: string }> = [
    {
      id: random.generateStableId(30, 1),
      title: 'End-Semester Examination Schedule Released',
      content: 'The end-semester examination timetable for the current term is now available. Verify your hall ticket and examination centre details before the exam week begins.',
      targetRole: 'ALL',
    },
    {
      id: random.generateStableId(30, 2),
      title: 'Library Extended Hours During Examination Week',
      content: 'The central library will remain open until 11 PM during examination week. Book your study slots in advance through the OPAC portal.',
      targetRole: 'STUDENT',
    },
    {
      id: random.generateStableId(30, 3),
      title: 'Fee Payment Reminder for Current Term',
      content: 'All pending term fees must be settled before the examination start date. Reach out to the finance office for any discrepancies.',
      targetRole: 'STUDENT',
    },
  ];

  for (const notice of notices) {
    await prisma.notice.upsert({
      where: { id: notice.id },
      update: { title: notice.title, content: notice.content, targetRole: notice.targetRole },
      create: {
        id: notice.id,
        tenantId: institution.id,
        title: notice.title,
        content: notice.content,
        targetRole: notice.targetRole,
      },
    });
  }

  // 2. Legacy Exam + ExamSchedule for the enrolled term (drives "Examinations")
  const examId = random.generateStableId(30, 4);
  const exam = await prisma.exam.upsert({
    where: { id: examId },
    update: { name: 'End-Semester Examinations 2026', type: 'END_SEMESTER' },
    create: {
      id: examId,
      tenantId: institution.id,
      termId: activeTerm.id,
      name: 'End-Semester Examinations 2026',
      type: 'END_SEMESTER',
    },
  });

  const scheduleId = random.generateStableId(30, 5);
  await prisma.examSchedule.upsert({
    where: { id: scheduleId },
    update: { examDate: new Date('2026-09-01') },
    create: {
      id: scheduleId,
      examId: exam.id,
      examDate: new Date('2026-09-01'),
    },
  });

  // 3. Extended Examinations → MarksEntryBatch → StudentMarks (marks for this student)
  const extendedExamId = random.generateStableId(30, 6);
  const extendedExam = await prisma.examinations.upsert({
    where: { id: extendedExamId },
    update: { name: 'End-Semester Examination 2026', type: 'END_SEMESTER', status: 'PUBLISHED' },
    create: {
      id: extendedExamId,
      tenantId: institution.id,
      termId: activeTerm.id,
      name: 'End-Semester Examination 2026',
      type: 'END_SEMESTER',
      status: 'PUBLISHED',
    },
  });

  // Marks entry batch for the first enrolled course offering of the demo student
  const enrolledOffering = academics.registrations.find((r) => r.studentId === demoStudent.id)?.courseOfferingId;
  const offering = academics.courseOfferings.find((o) => o.id === enrolledOffering) || academics.courseOfferings[0];
  const faculty = people.facultyStaff[0];

  if (offering && faculty) {
    const batchId = random.generateStableId(30, 7);
    const batch = await prisma.marksEntryBatch.upsert({
      where: { id: batchId },
      update: { status: 'APPROVED' },
      create: {
        id: batchId,
        tenantId: institution.id,
        examinationId: extendedExam.id,
        courseOfferingId: offering.id,
        facultyId: faculty.id,
        status: 'APPROVED',
      },
    });

    const marksId = random.generateStableId(30, 8);
    await prisma.studentMarks.upsert({
      where: { id: marksId },
      update: { marksObtained: 82.5, maxMarks: 100, isAbsent: false },
      create: {
        id: marksId,
        tenantId: institution.id,
        marksEntryBatchId: batch.id,
        studentId: demoStudent.id,
        marksObtained: 82.5,
        maxMarks: 100,
        isAbsent: false,
      },
    });

    // 4. Published semester result (only published=true is ever exposed)
    const semesterResultId = random.generateStableId(30, 9);
    const semesterResult = await prisma.studentSemesterResult.upsert({
      where: { id: semesterResultId },
      update: { sgpa: 8.4, cgpa: 3.8, totalCredits: 24, earnedCredits: 24, status: 'PASS', published: true },
      create: {
        id: semesterResultId,
        tenantId: institution.id,
        studentId: demoStudent.id,
        examinationId: extendedExam.id,
        sgpa: 8.4,
        cgpa: 3.8,
        totalCredits: 24,
        earnedCredits: 24,
        status: 'PASS',
        published: true,
      },
    });

    const courseResultId = random.generateStableId(30, 10);
    await prisma.studentCourseResult.upsert({
      where: { id: courseResultId },
      update: { totalMarks: 82.5, grade: 'A', gradePoints: 8.5, credits: 4, isPass: true },
      create: {
        id: courseResultId,
        tenantId: institution.id,
        studentId: demoStudent.id,
        courseOfferingId: offering.id,
        semesterResultId: semesterResult.id,
        totalMarks: 82.5,
        grade: 'A',
        gradePoints: 8.5,
        credits: 4,
        isPass: true,
      },
    });
  }

  // 5. Hostel allocation for the demo student
  const hostelId = random.generateStableId(30, 11);
  const hostel = await prisma.hostel.upsert({
    where: { id: hostelId },
    update: { name: 'Kaveri Hostel', building: 'Boys Hostel Block B' },
    create: {
      id: hostelId,
      tenantId: institution.id,
      name: 'Kaveri Hostel',
      building: 'Boys Hostel Block B',
    },
  });

  const roomHostelId = random.generateStableId(30, 12);
  const roomHostel = await prisma.roomHostel.upsert({
    where: { id: roomHostelId },
    update: { roomNumber: 'B-204', capacity: 2 },
    create: {
      id: roomHostelId,
      hostelId: hostel.id,
      roomNumber: 'B-204',
      capacity: 2,
    },
  });

  const allocationId = random.generateStableId(30, 13);
  await prisma.allocation.upsert({
    where: { id: allocationId },
    update: { studentId: demoStudent.id },
    create: {
      id: allocationId,
      roomHostelId: roomHostel.id,
      studentId: demoStudent.id,
    },
  });

  // 6. Student service support cases (scoped to the student user)
  const serviceCases = [
    {
      id: random.generateStableId(30, 14),
      caseNumber: 'CAS-STU-001',
      title: 'Request for examination hall ticket reprint',
      category: 'Student Services',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
    },
    {
      id: random.generateStableId(30, 15),
      caseNumber: 'CAS-STU-002',
      title: 'Scholarship document verification follow-up',
      category: 'Student Services',
      priority: 'LOW',
      status: 'NEW',
    },
  ];

  for (const serviceCase of serviceCases) {
    await prisma.supportCase.upsert({
      where: { id: serviceCase.id },
      update: { status: serviceCase.status, priority: serviceCase.priority },
      create: {
        id: serviceCase.id,
        tenantId: institution.id,
        userId: demoStudentUser.id,
        caseNumber: serviceCase.caseNumber,
        title: serviceCase.title,
        category: serviceCase.category,
        priority: serviceCase.priority,
        status: serviceCase.status,
      },
    });
  }

  // 7. Notifications for the demo student
  const notifications = [
    {
      id: random.generateStableId(30, 16),
      title: 'Examination schedule available',
      body: 'The end-semester examination timetable has been published.',
      type: 'ACADEMIC',
      actionUrl: '/examinations',
    },
    {
      id: random.generateStableId(30, 17),
      title: 'Result published',
      body: 'Your end-semester result is now available.',
      type: 'RESULT',
      actionUrl: '/results',
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: { isRead: false },
      create: {
        id: notification.id,
        tenantId: institution.id,
        userId: demoStudentUser.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        actionUrl: notification.actionUrl,
        isRead: false,
      },
    });
  }
}
