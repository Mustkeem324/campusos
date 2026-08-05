import { PrismaClient, Institution, User, Student, Staff, Guardian } from '@prisma/client';
import { DemoSeedConfig } from '../config';
import { SeededRandom } from '../random';
import { SYNTHETIC_FIRST_NAMES, SYNTHETIC_LAST_NAMES } from '../constants';
import { AcademicStructure } from './structure';

export interface PeopleDataset {
  facultyUsers: User[];
  facultyStaff: Staff[];
  employeeUsers: User[];
  employeeStaff: Staff[];
  guardians: Guardian[];
  studentUsers: User[];
  students: Student[];
}

export async function seedPeople(
  prisma: PrismaClient,
  institution: Institution,
  structure: AcademicStructure,
  personas: { facultyUser: User; studentUser: User; parentUser: User; financeUser: User; passwordHash: string },
  config: DemoSeedConfig,
  random: SeededRandom
): Promise<PeopleDataset> {
  const { passwordHash } = personas;

  // 1. Faculty Members
  const facultyUsers: User[] = [personas.facultyUser];
  const facultyStaff: Staff[] = [];
  const facultyDesignations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor'];

  for (let i = 0; i < config.faculty; i++) {
    const isFirst = i === 0;
    const user = isFirst ? personas.facultyUser : await prisma.user.upsert({
      where: { tenantId_email: { tenantId: institution.id, email: random.generateSyntheticEmail('faculty', i) } },
      update: { passwordHash, role: 'FACULTY', isActive: true },
      create: {
        id: random.generateStableId(7, i + 10),
        email: random.generateSyntheticEmail('faculty', i),
        name: `Dr. ${random.randomItem(SYNTHETIC_FIRST_NAMES)} ${random.randomItem(SYNTHETIC_LAST_NAMES)}`,
        passwordHash,
        role: 'FACULTY',
        tenantId: institution.id,
        isActive: true,
      }
    });

    if (!isFirst) facultyUsers.push(user);

    const dept = structure.departments[i % structure.departments.length];
    const empCode = `EMP-FAC-${String(i + 1).padStart(3, '0')}`;

    const staff = await prisma.staff.upsert({
      where: { userId: user.id },
      update: { departmentId: dept.id, designation: facultyDesignations[i % facultyDesignations.length] },
      create: {
        id: random.generateStableId(9, i),
        tenantId: institution.id,
        userId: user.id,
        employeeId: empCode,
        designation: facultyDesignations[i % facultyDesignations.length],
        departmentId: dept.id,
      }
    });
    facultyStaff.push(staff);
  }

  // 2. Non-Teaching Employees
  const employeeUsers: User[] = [];
  const employeeStaff: Staff[] = [];

  const employeeRoles = [
    { title: 'Admissions Officer', deptIdx: 1 },
    { title: 'Finance Accountant', deptIdx: 1 },
    { title: 'HR Manager', deptIdx: 1 },
    { title: 'Chief Librarian', deptIdx: 4 },
    { title: 'Hostel Warden', deptIdx: 5 },
    { title: 'Transport Supervisor', deptIdx: 2 },
    { title: 'Student Services Coordinator', deptIdx: 5 },
    { title: 'IT Systems Admin', deptIdx: 0 },
    { title: 'Campus Security Officer', deptIdx: 3 },
    { title: 'Academic Registrar Clerk', deptIdx: 4 },
  ];

  for (let i = 0; i < config.employees; i++) {
    const roleInfo = employeeRoles[i % employeeRoles.length];
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: institution.id, email: random.generateSyntheticEmail('employee', i) } },
      update: { passwordHash, role: 'INSTITUTION_ADMIN', isActive: true },
      create: {
        id: random.generateStableId(7, i + 500),
        email: random.generateSyntheticEmail('employee', i),
        name: `${random.randomItem(SYNTHETIC_FIRST_NAMES)} ${random.randomItem(SYNTHETIC_LAST_NAMES)}`,
        passwordHash,
        role: 'INSTITUTION_ADMIN',
        tenantId: institution.id,
        isActive: true,
      }
    });
    employeeUsers.push(user);

    const dept = structure.departments[roleInfo.deptIdx % structure.departments.length];
    const empCode = `EMP-STAFF-${String(i + 1).padStart(3, '0')}`;

    const staff = await prisma.staff.upsert({
      where: { userId: user.id },
      update: { departmentId: dept.id, designation: roleInfo.title },
      create: {
        id: random.generateStableId(9, i + 500),
        tenantId: institution.id,
        userId: user.id,
        employeeId: empCode,
        designation: roleInfo.title,
        departmentId: dept.id,
      }
    });
    employeeStaff.push(staff);
  }

  // 2b. Quick Demo Finance Officer staff profile
  const financeDept = structure.departments[1 % structure.departments.length];
  const financeStaff = await prisma.staff.upsert({
    where: { userId: personas.financeUser.id },
    update: { departmentId: financeDept.id, designation: 'Finance Officer' },
    create: {
      id: random.generateStableId(9, 6000),
      tenantId: institution.id,
      userId: personas.financeUser.id,
      employeeId: 'EMP-FIN-001',
      designation: 'Finance Officer',
      departmentId: financeDept.id,
    }
  });
  employeeStaff.push(financeStaff);

  // 3. Guardians
  const guardians: Guardian[] = [];
  const parentUsers: User[] = [personas.parentUser];

  const demoGuardian = await prisma.guardian.upsert({
    where: { userId: personas.parentUser.id },
    update: { relationship: 'Mother' },
    create: {
      id: random.generateStableId(10, 0),
      tenantId: institution.id,
      userId: personas.parentUser.id,
      relationship: 'Mother',
    }
  });
  guardians.push(demoGuardian);

  for (let i = 1; i < config.parents; i++) {
    const pUser = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: institution.id, email: random.generateSyntheticEmail('guardian', i) } },
      update: { passwordHash, role: 'PARENT', isActive: true },
      create: {
        id: random.generateStableId(7, i + 1000),
        email: random.generateSyntheticEmail('guardian', i),
        name: `${random.randomItem(SYNTHETIC_FIRST_NAMES)} ${random.randomItem(SYNTHETIC_LAST_NAMES)}`,
        passwordHash,
        role: 'PARENT',
        tenantId: institution.id,
        isActive: true,
      }
    });
    parentUsers.push(pUser);

    const guar = await prisma.guardian.upsert({
      where: { userId: pUser.id },
      update: { relationship: i % 2 === 0 ? 'Father' : 'Mother' },
      create: {
        id: random.generateStableId(10, i),
        tenantId: institution.id,
        userId: pUser.id,
        relationship: i % 2 === 0 ? 'Father' : 'Mother',
      }
    });
    guardians.push(guar);
  }

  // 4. Students
  const studentUsers: User[] = [personas.studentUser];
  const students: Student[] = [];

  for (let i = 0; i < config.students; i++) {
    const isFirst = i === 0;
    const user = isFirst ? personas.studentUser : await prisma.user.upsert({
      where: { tenantId_email: { tenantId: institution.id, email: random.generateSyntheticEmail('student', i) } },
      update: { passwordHash, role: 'STUDENT', isActive: true },
      create: {
        id: random.generateStableId(7, i + 2000),
        email: random.generateSyntheticEmail('student', i),
        name: isFirst ? 'Rohan Verma' : `${random.randomItem(SYNTHETIC_FIRST_NAMES)} ${random.randomItem(SYNTHETIC_LAST_NAMES)}`,
        passwordHash,
        role: 'STUDENT',
        tenantId: institution.id,
        isActive: true,
      }
    });

    if (!isFirst) studentUsers.push(user);

    const batch = structure.batches[i % structure.batches.length];
    const section = structure.sections[i % structure.sections.length];
    const guardian = guardians[i % guardians.length];

    const rollNumber = `CDU-${batch.startYear}-${String(i + 1).padStart(4, '0')}`;
    const cgpa = random.randomDecimal(2.5, 3.9, 2);
    const creditsEarned = random.randomInteger(20, 120);

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        rollNumber,
        batchId: batch.id,
        sectionId: section.id,
        guardianId: guardian.id,
        cgpa,
        creditsEarned,
      },
      create: {
        id: random.generateStableId(8, i),
        tenantId: institution.id,
        userId: user.id,
        rollNumber,
        batchId: batch.id,
        sectionId: section.id,
        guardianId: guardian.id,
        cgpa,
        creditsEarned,
      }
    });
    students.push(student);
  }

  return {
    facultyUsers,
    facultyStaff,
    employeeUsers,
    employeeStaff,
    guardians,
    studentUsers,
    students,
  };
}
