import { PrismaClient, Institution } from '@prisma/client';
import { resultDocumentNumber, resultSnapshotHash, type ResultSnapshotCourse } from '../../../src/lib/result-integrity';
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
 *   - Faculty → HOD → Dean → examination-office result authorization audit trail
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

  // 3. Extended examination and a realistic multi-course consolidated result.
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

  const registeredOfferingIds = Array.from(new Set(
    academics.registrations
      .filter((registration) => registration.studentId === demoStudent.id)
      .map((registration) => registration.courseOfferingId),
  )).slice(0, 6);
  if (registeredOfferingIds.length === 0 && academics.courseOfferings[0]) {
    registeredOfferingIds.push(academics.courseOfferings[0].id);
  }

  const offeringRecords = await prisma.courseOffering.findMany({
    where: { tenantId: institution.id, id: { in: registeredOfferingIds } },
    include: {
      course: { include: { department: true } },
      faculty: { include: { user: true } },
    },
  });
  offeringRecords.sort((left, right) => registeredOfferingIds.indexOf(left.id) - registeredOfferingIds.indexOf(right.id));

  if (offeringRecords.length > 0) {
    const semesterResultId = random.generateStableId(30, 9);
    const semesterResult = await prisma.studentSemesterResult.upsert({
      where: { id: semesterResultId },
      update: { examinationId: extendedExam.id, status: 'PASS', published: true },
      create: {
        id: semesterResultId,
        tenantId: institution.id,
        studentId: demoStudent.id,
        examinationId: extendedExam.id,
        sgpa: 0,
        cgpa: 0,
        totalCredits: 0,
        earnedCredits: 0,
        status: 'PASS',
        published: true,
      },
    });

    const demoMarks = [92, 87, 84, 79, 90, 82];
    const snapshotCourses: ResultSnapshotCourse[] = [];
    let weightedGradePoints = 0;
    let totalCredits = 0;

    for (let index = 0; index < offeringRecords.length; index += 1) {
      const offering = offeringRecords[index];
      const marksObtained = demoMarks[index % demoMarks.length];
      const grade = gradeForMarks(marksObtained);
      const credits = Math.max(1, offering.course.lectureCredits + offering.course.tutorialCredits + offering.course.practicalCredits);
      totalCredits += credits;
      weightedGradePoints += grade.points * credits;

      const batchId = index === 0 ? random.generateStableId(30, 7) : random.generateStableId(30, 100 + index);
      const batch = await prisma.marksEntryBatch.upsert({
        where: { id: batchId },
        update: {
          examinationId: extendedExam.id,
          courseOfferingId: offering.id,
          facultyId: offering.facultyId,
          status: 'APPROVED',
        },
        create: {
          id: batchId,
          tenantId: institution.id,
          examinationId: extendedExam.id,
          courseOfferingId: offering.id,
          facultyId: offering.facultyId,
          status: 'APPROVED',
        },
      });

      const marksId = index === 0 ? random.generateStableId(30, 8) : random.generateStableId(30, 200 + index);
      await prisma.studentMarks.upsert({
        where: { id: marksId },
        update: { marksEntryBatchId: batch.id, marksObtained, maxMarks: 100, isAbsent: false },
        create: {
          id: marksId,
          tenantId: institution.id,
          marksEntryBatchId: batch.id,
          studentId: demoStudent.id,
          marksObtained,
          maxMarks: 100,
          isAbsent: false,
        },
      });

      const courseResultId = index === 0 ? random.generateStableId(30, 10) : random.generateStableId(30, 300 + index);
      await prisma.studentCourseResult.upsert({
        where: { id: courseResultId },
        update: {
          courseOfferingId: offering.id,
          semesterResultId: semesterResult.id,
          totalMarks: marksObtained,
          grade: grade.letter,
          gradePoints: grade.points,
          credits,
          isPass: true,
        },
        create: {
          id: courseResultId,
          tenantId: institution.id,
          studentId: demoStudent.id,
          courseOfferingId: offering.id,
          semesterResultId: semesterResult.id,
          totalMarks: marksObtained,
          grade: grade.letter,
          gradePoints: grade.points,
          credits,
          isPass: true,
        },
      });

      snapshotCourses.push({
        courseOfferingId: offering.id,
        totalMarks: marksObtained,
        grade: grade.letter,
        gradePoints: grade.points,
        credits,
        isPass: true,
      });
    }

    const sgpa = Number((weightedGradePoints / totalCredits).toFixed(2));
    const cgpa = 8.72;
    await prisma.studentSemesterResult.update({
      where: { id: semesterResult.id },
      data: { sgpa, cgpa, totalCredits, earnedCredits: totalCredits, status: 'PASS', published: true },
    });
    await prisma.student.update({
      where: { id: demoStudent.id },
      data: { cgpa, creditsEarned: Math.max(demoStudent.creditsEarned, totalCredits) },
    });

    // 4. Seed a real synthetic academic authorization chain for the demo result.
    // Each course is certified by its actually assigned faculty member. Each
    // distinct course department receives an HOD approval, followed by Dean
    // authorization and publication by the Controller of Examinations.
    const approvalEntity = `StudentSemesterResult:${semesterResult.id}`;
    for (let index = 0; index < offeringRecords.length; index += 1) {
      const offering = offeringRecords[index];
      await prisma.auditLog.upsert({
        where: { id: random.generateStableId(31, 100 + index) },
        update: {
          userId: offering.faculty.userId,
          action: 'RESULT_FACULTY_APPROVED',
          entity: approvalEntity,
          diffJson: JSON.stringify({
            stage: 'FACULTY',
            scopeKey: offering.id,
            actorRole: 'FACULTY',
            actorName: offering.faculty.user.name,
            comment: `Faculty certification recorded for ${offering.course.code} - ${offering.course.title}.`,
          }),
          createdAt: new Date(`2026-06-15T09:${String(index * 5).padStart(2, '0')}:00Z`),
        },
        create: {
          id: random.generateStableId(31, 100 + index),
          tenantId: institution.id,
          userId: offering.faculty.userId,
          action: 'RESULT_FACULTY_APPROVED',
          entity: approvalEntity,
          diffJson: JSON.stringify({
            stage: 'FACULTY',
            scopeKey: offering.id,
            actorRole: 'FACULTY',
            actorName: offering.faculty.user.name,
            comment: `Faculty certification recorded for ${offering.course.code} - ${offering.course.title}.`,
          }),
          createdAt: new Date(`2026-06-15T09:${String(index * 5).padStart(2, '0')}:00Z`),
        },
      });
    }

    const departments = Array.from(new Map(offeringRecords.map((offering) => [offering.course.department.id, offering.course.department])).values());
    for (let index = 0; index < departments.length; index += 1) {
      const department = departments[index];
      const hodUser = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: institution.id, email: `hod.results.${index + 1}@campusos.demo` } },
        update: { name: `Dr. Ananya Sharma ${index + 1}`, passwordHash: demoStudentUser.passwordHash, role: 'HOD', isActive: true },
        create: {
          id: random.generateStableId(31, 10 + index * 2),
          tenantId: institution.id,
          email: `hod.results.${index + 1}@campusos.demo`,
          name: `Dr. Ananya Sharma ${index + 1}`,
          passwordHash: demoStudentUser.passwordHash,
          role: 'HOD',
          isActive: true,
        },
      });
      await prisma.staff.upsert({
        where: { userId: hodUser.id },
        update: { departmentId: department.id, designation: 'Head of Department' },
        create: {
          id: random.generateStableId(31, 11 + index * 2),
          tenantId: institution.id,
          userId: hodUser.id,
          employeeId: `DEMO-HOD-${String(index + 1).padStart(2, '0')}`,
          designation: 'Head of Department',
          departmentId: department.id,
        },
      });
      await prisma.auditLog.upsert({
        where: { id: random.generateStableId(31, 200 + index) },
        update: {
          userId: hodUser.id,
          action: 'RESULT_HOD_APPROVED',
          entity: approvalEntity,
          diffJson: JSON.stringify({ stage: 'HOD', scopeKey: department.id, actorRole: 'HOD', actorName: hodUser.name, comment: `${department.name} result scope approved by the Head of Department.` }),
          createdAt: new Date(`2026-06-16T10:${String(index * 7).padStart(2, '0')}:00Z`),
        },
        create: {
          id: random.generateStableId(31, 200 + index),
          tenantId: institution.id,
          userId: hodUser.id,
          action: 'RESULT_HOD_APPROVED',
          entity: approvalEntity,
          diffJson: JSON.stringify({ stage: 'HOD', scopeKey: department.id, actorRole: 'HOD', actorName: hodUser.name, comment: `${department.name} result scope approved by the Head of Department.` }),
          createdAt: new Date(`2026-06-16T10:${String(index * 7).padStart(2, '0')}:00Z`),
        },
      });
    }

    const deanUser = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: institution.id, email: 'dean.results@campusos.demo' } },
      update: { name: 'Prof. Arvind Rao', passwordHash: demoStudentUser.passwordHash, role: 'DEAN', isActive: true },
      create: {
        id: random.generateStableId(31, 50),
        tenantId: institution.id,
        email: 'dean.results@campusos.demo',
        name: 'Prof. Arvind Rao',
        passwordHash: demoStudentUser.passwordHash,
        role: 'DEAN',
        isActive: true,
      },
    });
    await prisma.auditLog.upsert({
      where: { id: random.generateStableId(31, 250) },
      update: {
        userId: deanUser.id,
        action: 'RESULT_DEAN_APPROVED',
        entity: approvalEntity,
        diffJson: JSON.stringify({ stage: 'DEAN', scopeKey: 'FINAL', actorRole: 'DEAN', actorName: deanUser.name, comment: 'Final academic authorization recorded by the Academic Dean.' }),
        createdAt: new Date('2026-06-17T11:15:00Z'),
      },
      create: {
        id: random.generateStableId(31, 250),
        tenantId: institution.id,
        userId: deanUser.id,
        action: 'RESULT_DEAN_APPROVED',
        entity: approvalEntity,
        diffJson: JSON.stringify({ stage: 'DEAN', scopeKey: 'FINAL', actorRole: 'DEAN', actorName: deanUser.name, comment: 'Final academic authorization recorded by the Academic Dean.' }),
        createdAt: new Date('2026-06-17T11:15:00Z'),
      },
    });

    const controllerUser = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: institution.id, email: 'controller.results@campusos.demo' } },
      update: { name: 'Dr. Kavita Menon', passwordHash: demoStudentUser.passwordHash, role: 'EXAMINATION_CONTROLLER', isActive: true },
      create: {
        id: random.generateStableId(31, 60),
        tenantId: institution.id,
        email: 'controller.results@campusos.demo',
        name: 'Dr. Kavita Menon',
        passwordHash: demoStudentUser.passwordHash,
        role: 'EXAMINATION_CONTROLLER',
        isActive: true,
      },
    });

    const snapshotHash = resultSnapshotHash({
      resultId: semesterResult.id,
      tenantId: institution.id,
      studentId: demoStudent.id,
      examinationId: extendedExam.id,
      sgpa,
      cgpa,
      totalCredits,
      earnedCredits: totalCredits,
      status: 'PASS',
      courses: snapshotCourses,
    });
    await prisma.auditLog.upsert({
      where: { id: random.generateStableId(31, 300) },
      update: {
        userId: controllerUser.id,
        action: 'RESULT_PUBLISHED',
        entity: approvalEntity,
        diffJson: JSON.stringify({
          scopeKey: 'FINAL',
          actorRole: 'EXAMINATION_CONTROLLER',
          actorName: controllerUser.name,
          documentNumber: resultDocumentNumber(institution.code, 2026, semesterResult.id),
          snapshotHash,
          verificationVersion: 1,
          comment: 'Official result published after faculty, HOD and Dean authorization.',
        }),
        createdAt: new Date('2026-06-18T14:30:00Z'),
      },
      create: {
        id: random.generateStableId(31, 300),
        tenantId: institution.id,
        userId: controllerUser.id,
        action: 'RESULT_PUBLISHED',
        entity: approvalEntity,
        diffJson: JSON.stringify({
          scopeKey: 'FINAL',
          actorRole: 'EXAMINATION_CONTROLLER',
          actorName: controllerUser.name,
          documentNumber: resultDocumentNumber(institution.code, 2026, semesterResult.id),
          snapshotHash,
          verificationVersion: 1,
          comment: 'Official result published after faculty, HOD and Dean authorization.',
        }),
        createdAt: new Date('2026-06-18T14:30:00Z'),
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
      title: 'Official result published',
      body: 'Your authorized end-semester result and verifiable grade card are now available.',
      type: 'RESULT',
      actionUrl: '/results',
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: { title: notification.title, body: notification.body, isRead: false },
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

function gradeForMarks(marks: number) {
  if (marks >= 90) return { letter: 'O', points: 10 };
  if (marks >= 85) return { letter: 'A+', points: 9 };
  if (marks >= 75) return { letter: 'A', points: 8 };
  if (marks >= 65) return { letter: 'B+', points: 7 };
  if (marks >= 55) return { letter: 'B', points: 6 };
  if (marks >= 50) return { letter: 'C', points: 5 };
  return { letter: 'F', points: 0 };
}
