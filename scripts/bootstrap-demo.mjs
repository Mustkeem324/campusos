import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IDS = {
  institution: '10000000-0000-4000-8000-000000000001',
  campus: '10000000-0000-4000-8000-000000000002',
  department: '10000000-0000-4000-8000-000000000003',
  program: '10000000-0000-4000-8000-000000000004',
  batch: '10000000-0000-4000-8000-000000000005',
  section: '10000000-0000-4000-8000-000000000006',
  academicYear: '10000000-0000-4000-8000-000000000007',
  term: '10000000-0000-4000-8000-000000000008',
  admin: '10000000-0000-4000-8000-000000000011',
  faculty: '10000000-0000-4000-8000-000000000012',
  student: '10000000-0000-4000-8000-000000000013',
  parent: '10000000-0000-4000-8000-000000000014',
  staff: '10000000-0000-4000-8000-000000000021',
  guardian: '10000000-0000-4000-8000-000000000022',
  studentProfile: '10000000-0000-4000-8000-000000000023',
  course: '10000000-0000-4000-8000-000000000031',
  offering: '10000000-0000-4000-8000-000000000032',
  room: '10000000-0000-4000-8000-000000000033',
  timetable: '10000000-0000-4000-8000-000000000034',
  enrollment: '10000000-0000-4000-8000-000000000035',
  assignment: '10000000-0000-4000-8000-000000000036',
  attendanceSession: '10000000-0000-4000-8000-000000000037',
  attendanceRecord: '10000000-0000-4000-8000-000000000038',
  feeStructure: '10000000-0000-4000-8000-000000000041',
  invoice: '10000000-0000-4000-8000-000000000042',
  payment: '10000000-0000-4000-8000-000000000043',
  exam: '10000000-0000-4000-8000-000000000051',
  examSchedule: '10000000-0000-4000-8000-000000000052',
  result: '10000000-0000-4000-8000-000000000053',
  notice: '10000000-0000-4000-8000-000000000061',
  adminNotification: '10000000-0000-4000-8000-000000000071',
  facultyNotification: '10000000-0000-4000-8000-000000000072',
  studentNotification: '10000000-0000-4000-8000-000000000073',
  parentNotification: '10000000-0000-4000-8000-000000000074',
};

function futureDate(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function upsertUser(tx, institutionId, passwordHash, input) {
  return tx.user.upsert({
    where: { tenantId_email: { tenantId: institutionId, email: input.email } },
    update: {
      name: input.name,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    create: {
      id: input.id,
      tenantId: institutionId,
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
      isActive: true,
      emailVerified: new Date(),
    },
  });
}

export async function bootstrapDemoDatabase() {
  const passwordHash = await bcrypt.hash('demo123', 10);

  const summary = await prisma.$transaction(async (tx) => {
    const institution = await tx.institution.upsert({
      where: { code: 'CDU' },
      update: {
        name: 'CampusOS Demo University',
        subdomain: 'demo-campusos',
        status: 'ACTIVE',
      },
      create: {
        id: IDS.institution,
        name: 'CampusOS Demo University',
        code: 'CDU',
        subdomain: 'demo-campusos',
        status: 'ACTIVE',
        primaryColor: '#1754E8',
        secondaryColor: '#0B1731',
      },
    });

    const campus = await tx.campus.upsert({
      where: { id: IDS.campus },
      update: { name: 'Main Campus', code: 'MAIN', address: 'CampusOS Demonstration Campus' },
      create: {
        id: IDS.campus,
        tenantId: institution.id,
        name: 'Main Campus',
        code: 'MAIN',
        address: 'CampusOS Demonstration Campus',
      },
    });

    const department = await tx.department.upsert({
      where: { id: IDS.department },
      update: { name: 'School of Computing', code: 'SOC', campusId: campus.id },
      create: {
        id: IDS.department,
        tenantId: institution.id,
        campusId: campus.id,
        name: 'School of Computing',
        code: 'SOC',
      },
    });

    const program = await tx.program.upsert({
      where: { id: IDS.program },
      update: { name: 'Bachelor of Technology', code: 'BTECH', departmentId: department.id, durationYears: 4 },
      create: {
        id: IDS.program,
        tenantId: institution.id,
        departmentId: department.id,
        name: 'Bachelor of Technology',
        code: 'BTECH',
        durationYears: 4,
      },
    });

    const batch = await tx.batch.upsert({
      where: { id: IDS.batch },
      update: { name: '2026–2030', programId: program.id, startYear: 2026, endYear: 2030 },
      create: {
        id: IDS.batch,
        tenantId: institution.id,
        programId: program.id,
        name: '2026–2030',
        startYear: 2026,
        endYear: 2030,
      },
    });

    const section = await tx.section.upsert({
      where: { id: IDS.section },
      update: { name: 'A', batchId: batch.id, capacity: 60 },
      create: {
        id: IDS.section,
        tenantId: institution.id,
        batchId: batch.id,
        name: 'A',
        capacity: 60,
      },
    });

    const academicYear = await tx.academicYear.upsert({
      where: { id: IDS.academicYear },
      update: {
        name: '2026–27',
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2027-06-30T23:59:59.000Z'),
        isCurrent: true,
      },
      create: {
        id: IDS.academicYear,
        tenantId: institution.id,
        name: '2026–27',
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2027-06-30T23:59:59.000Z'),
        isCurrent: true,
      },
    });

    const term = await tx.term.upsert({
      where: { id: IDS.term },
      update: {
        academicYearId: academicYear.id,
        name: 'Semester 1',
        number: 1,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-12-20T23:59:59.000Z'),
      },
      create: {
        id: IDS.term,
        tenantId: institution.id,
        academicYearId: academicYear.id,
        name: 'Semester 1',
        number: 1,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-12-20T23:59:59.000Z'),
      },
    });

    const admin = await upsertUser(tx, institution.id, passwordHash, {
      id: IDS.admin,
      email: 'admin.demo@campusos.local',
      name: 'Aarav Mehta',
      role: 'INSTITUTION_ADMIN',
    });
    const faculty = await upsertUser(tx, institution.id, passwordHash, {
      id: IDS.faculty,
      email: 'faculty.demo@campusos.local',
      name: 'Dr. Priya Sharma',
      role: 'FACULTY',
    });
    const studentUser = await upsertUser(tx, institution.id, passwordHash, {
      id: IDS.student,
      email: 'student.demo@campusos.local',
      name: 'Rohan Verma',
      role: 'STUDENT',
    });
    const parent = await upsertUser(tx, institution.id, passwordHash, {
      id: IDS.parent,
      email: 'parent.demo@campusos.local',
      name: 'Anita Verma',
      role: 'PARENT',
    });

    const staff = await tx.staff.upsert({
      where: { userId: faculty.id },
      update: { employeeId: 'FAC-001', designation: 'Associate Professor', departmentId: department.id },
      create: {
        id: IDS.staff,
        tenantId: institution.id,
        userId: faculty.id,
        employeeId: 'FAC-001',
        designation: 'Associate Professor',
        departmentId: department.id,
      },
    });

    const guardian = await tx.guardian.upsert({
      where: { userId: parent.id },
      update: { relationship: 'Mother' },
      create: {
        id: IDS.guardian,
        tenantId: institution.id,
        userId: parent.id,
        relationship: 'Mother',
      },
    });

    const student = await tx.student.upsert({
      where: { userId: studentUser.id },
      update: {
        rollNumber: 'CDU26BTECH001',
        batchId: batch.id,
        sectionId: section.id,
        guardianId: guardian.id,
        cgpa: 8.4,
        creditsEarned: 18,
      },
      create: {
        id: IDS.studentProfile,
        tenantId: institution.id,
        userId: studentUser.id,
        rollNumber: 'CDU26BTECH001',
        batchId: batch.id,
        sectionId: section.id,
        guardianId: guardian.id,
        cgpa: 8.4,
        creditsEarned: 18,
      },
    });

    const course = await tx.course.upsert({
      where: { id: IDS.course },
      update: { departmentId: department.id, code: 'CS101', title: 'Foundations of Computing' },
      create: {
        id: IDS.course,
        tenantId: institution.id,
        departmentId: department.id,
        code: 'CS101',
        title: 'Foundations of Computing',
        lectureCredits: 3,
        tutorialCredits: 1,
        practicalCredits: 1,
      },
    });

    const room = await tx.room.upsert({
      where: { id: IDS.room },
      update: { campusId: campus.id, roomNumber: 'A-204', building: 'Academic Block', capacity: 60 },
      create: {
        id: IDS.room,
        tenantId: institution.id,
        campusId: campus.id,
        roomNumber: 'A-204',
        building: 'Academic Block',
        capacity: 60,
      },
    });

    const offering = await tx.courseOffering.upsert({
      where: { id: IDS.offering },
      update: {
        courseId: course.id,
        termId: term.id,
        sectionId: section.id,
        facultyId: staff.id,
        capacity: 60,
      },
      create: {
        id: IDS.offering,
        tenantId: institution.id,
        courseId: course.id,
        termId: term.id,
        sectionId: section.id,
        facultyId: staff.id,
        capacity: 60,
      },
    });

    await tx.timetableSlot.upsert({
      where: { id: IDS.timetable },
      update: {
        courseOfferingId: offering.id,
        roomId: room.id,
        dayOfWeek: new Date().getDay(),
        startTime: '10:00',
        endTime: '11:00',
      },
      create: {
        id: IDS.timetable,
        tenantId: institution.id,
        courseOfferingId: offering.id,
        roomId: room.id,
        dayOfWeek: new Date().getDay(),
        startTime: '10:00',
        endTime: '11:00',
      },
    });

    await tx.enrollment.upsert({
      where: { id: IDS.enrollment },
      update: { studentId: student.id, courseOfferingId: offering.id },
      create: {
        id: IDS.enrollment,
        tenantId: institution.id,
        studentId: student.id,
        courseOfferingId: offering.id,
      },
    });

    await tx.assignment.upsert({
      where: { id: IDS.assignment },
      update: {
        courseOfferingId: offering.id,
        title: 'Campus Systems Case Study',
        description: 'Analyse a connected institutional workflow and document the responsible roles.',
        dueDate: futureDate(7, 17),
        maxMarks: 100,
      },
      create: {
        id: IDS.assignment,
        tenantId: institution.id,
        courseOfferingId: offering.id,
        title: 'Campus Systems Case Study',
        description: 'Analyse a connected institutional workflow and document the responsible roles.',
        dueDate: futureDate(7, 17),
        maxMarks: 100,
      },
    });

    const attendanceSession = await tx.attendanceSession.upsert({
      where: { id: IDS.attendanceSession },
      update: { courseOfferingId: offering.id, sessionDate: new Date() },
      create: {
        id: IDS.attendanceSession,
        tenantId: institution.id,
        courseOfferingId: offering.id,
        sessionDate: new Date(),
      },
    });

    await tx.attendanceRecord.upsert({
      where: { id: IDS.attendanceRecord },
      update: { attendanceSessionId: attendanceSession.id, studentId: student.id, status: 'PRESENT' },
      create: {
        id: IDS.attendanceRecord,
        tenantId: institution.id,
        attendanceSessionId: attendanceSession.id,
        studentId: student.id,
        status: 'PRESENT',
      },
    });

    const feeStructure = await tx.feeStructure.upsert({
      where: { id: IDS.feeStructure },
      update: { name: 'Semester Tuition', amount: 75000 },
      create: {
        id: IDS.feeStructure,
        tenantId: institution.id,
        name: 'Semester Tuition',
        amount: 75000,
      },
    });

    const invoice = await tx.invoice.upsert({
      where: { id: IDS.invoice },
      update: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        amount: 75000,
        dueDate: futureDate(15, 23),
        status: 'PARTIAL',
      },
      create: {
        id: IDS.invoice,
        tenantId: institution.id,
        studentId: student.id,
        feeStructureId: feeStructure.id,
        amount: 75000,
        dueDate: futureDate(15, 23),
        status: 'PARTIAL',
      },
    });

    await tx.payment.upsert({
      where: { id: IDS.payment },
      update: {
        invoiceId: invoice.id,
        amount: 50000,
        method: 'UPI',
        status: 'PAID',
        transactionId: 'CDU-DEMO-PAYMENT-001',
      },
      create: {
        id: IDS.payment,
        tenantId: institution.id,
        invoiceId: invoice.id,
        amount: 50000,
        method: 'UPI',
        status: 'PAID',
        transactionId: 'CDU-DEMO-PAYMENT-001',
      },
    });

    const exam = await tx.exam.upsert({
      where: { id: IDS.exam },
      update: { termId: term.id, name: 'Semester 1 Assessment', type: 'END_TERM' },
      create: {
        id: IDS.exam,
        tenantId: institution.id,
        termId: term.id,
        name: 'Semester 1 Assessment',
        type: 'END_TERM',
      },
    });

    await tx.examSchedule.upsert({
      where: { id: IDS.examSchedule },
      update: { examId: exam.id, examDate: futureDate(30, 10) },
      create: { id: IDS.examSchedule, examId: exam.id, examDate: futureDate(30, 10) },
    });

    await tx.result.upsert({
      where: { id: IDS.result },
      update: { examId: exam.id, studentId: student.id, sgpa: 8.3, cgpa: 8.4 },
      create: {
        id: IDS.result,
        tenantId: institution.id,
        examId: exam.id,
        studentId: student.id,
        sgpa: 8.3,
        cgpa: 8.4,
      },
    });

    await tx.notice.upsert({
      where: { id: IDS.notice },
      update: {
        title: 'Welcome to the CampusOS demonstration',
        content: 'Explore role-aware academic, finance and student-service workflows using the demo personas.',
        targetRole: 'ALL',
      },
      create: {
        id: IDS.notice,
        tenantId: institution.id,
        title: 'Welcome to the CampusOS demonstration',
        content: 'Explore role-aware academic, finance and student-service workflows using the demo personas.',
        targetRole: 'ALL',
      },
    });

    const notificationInputs = [
      [IDS.adminNotification, admin.id, 'Demo institution ready', 'The CampusOS demonstration dataset is available.'],
      [IDS.facultyNotification, faculty.id, 'Teaching workspace ready', 'Your assigned course and today’s timetable are available.'],
      [IDS.studentNotification, studentUser.id, 'Student workspace ready', 'Review your course, assignment and fee summary.'],
      [IDS.parentNotification, parent.id, 'Guardian workspace ready', 'Your linked student summary is available.'],
    ];

    for (const [id, userId, title, body] of notificationInputs) {
      await tx.notification.upsert({
        where: { id },
        update: { userId, title, body, type: 'SYSTEM', isRead: false },
        create: { id, tenantId: institution.id, userId, title, body, type: 'SYSTEM', isRead: false },
      });
    }

    return {
      institutionId: institution.id,
      users: [admin.email, faculty.email, studentUser.email, parent.email],
    };
  });

  console.log(`Demo database ready for tenant ${summary.institutionId}.`);
  console.log(`Demo users: ${summary.users.join(', ')}.`);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrapDemoDatabase()
    .catch((error) => {
      console.error('Demo bootstrap failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
