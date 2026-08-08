import { randomUUID } from 'node:crypto';
import process from 'node:process';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SYNTHETIC_TENANT = {
  name: 'Nexus Institute of Technology',
  code: 'NITX',
  subdomain: 'nexus-institute',
};

const SHARED_PASSWORD = 'Campus@2026!';
const STUDENT_COUNT = 100;
const FACULTY_COUNT = 20;
const GUARDIAN_COUNT = 80;

const ROLE_ACCOUNTS = [
  ['SUPER_ADMIN', 'Platform Owner', 'superadmin@nexus-campus.local'],
  ['INSTITUTION_ADMIN', 'Kavya Menon', 'admin@nexus-campus.local'],
  ['REGISTRAR', 'Arjun Deshmukh', 'registrar@nexus-campus.local'],
  ['DEAN', 'Dr. Meera Iyer', 'dean@nexus-campus.local'],
  ['HOD', 'Dr. Raghav Sinha', 'hod@nexus-campus.local'],
  ['FACULTY', 'Dr. Priya Sharma', 'faculty@nexus-campus.local'],
  ['STUDENT', 'Rohan Verma', 'student@nexus-campus.local'],
  ['PARENT', 'Anita Verma', 'parent@nexus-campus.local'],
  ['FINANCE_OFFICER', 'Nikhil Bansal', 'finance@nexus-campus.local'],
  ['ACCOUNTANT', 'Sonal Gupta', 'accountant@nexus-campus.local'],
  ['HR_ADMIN', 'Aditi Kulkarni', 'hr@nexus-campus.local'],
  ['WARDEN', 'Mohit Tiwari', 'warden@nexus-campus.local'],
  ['LIBRARIAN', 'Neha Joshi', 'librarian@nexus-campus.local'],
  ['TRANSPORT_MANAGER', 'Vikram Singh', 'transport@nexus-campus.local'],
  ['PLACEMENT_OFFICER', 'Ishita Kapoor', 'placement@nexus-campus.local'],
  ['ADMISSIONS_COUNSELLOR', 'Rahul Nair', 'admissions@nexus-campus.local'],
  ['EXAMINATION_CONTROLLER', 'Dr. Sameer Rao', 'exams@nexus-campus.local'],
];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Akash', 'Ananya', 'Arjun', 'Avni', 'Dev', 'Diya', 'Harsh',
  'Ishaan', 'Ishita', 'Kabir', 'Kavya', 'Krisha', 'Manav', 'Meera', 'Mohit', 'Myra', 'Neha',
  'Nikhil', 'Nisha', 'Pranav', 'Priya', 'Raghav', 'Rhea', 'Rohan', 'Saanvi', 'Sameer', 'Sara',
  'Siddharth', 'Sonal', 'Tanvi', 'Ved', 'Vihaan', 'Vikram', 'Yash', 'Zara',
];

const LAST_NAMES = [
  'Agarwal', 'Bansal', 'Deshmukh', 'Gupta', 'Iyer', 'Jain', 'Joshi', 'Kapoor', 'Kulkarni',
  'Menon', 'Mehta', 'Mishra', 'Nair', 'Patel', 'Rao', 'Shah', 'Sharma', 'Singh', 'Sinha',
  'Tiwari', 'Verma', 'Yadav',
];

const DEPARTMENTS = [
  ['School of Computing', 'SOC'],
  ['School of Business', 'SOB'],
  ['School of Engineering', 'SOE'],
  ['School of Design', 'SOD'],
  ['School of Humanities', 'SOH'],
  ['School of Sciences', 'SOS'],
];

const PROGRAMMES = [
  ['B.Tech Computer Science', 'BTCS', 4, 0],
  ['B.Tech Artificial Intelligence', 'BTAI', 4, 0],
  ['MBA Operations', 'MBAO', 2, 1],
  ['MBA Finance', 'MBAF', 2, 1],
  ['B.Tech Mechanical Engineering', 'BTME', 4, 2],
  ['Bachelor of Design', 'BDES', 4, 3],
  ['BA English', 'BAEN', 3, 4],
  ['B.Sc Data Science', 'BSDS', 3, 5],
];

const COURSE_TITLES = [
  'Programming Fundamentals', 'Data Structures', 'Database Systems', 'Operating Systems',
  'Computer Networks', 'Artificial Intelligence', 'Machine Learning', 'Cloud Computing',
  'Software Engineering', 'Cyber Security', 'Operations Management', 'Supply Chain Analytics',
  'Financial Accounting', 'Corporate Finance', 'Business Statistics', 'Marketing Management',
  'Thermodynamics', 'Manufacturing Systems', 'Engineering Mechanics', 'Industrial Automation',
  'Design Thinking', 'Interaction Design', 'Visual Communication', 'Product Design Studio',
  'Academic Writing', 'Indian Literature', 'Professional Communication', 'Applied Mathematics',
  'Probability and Statistics', 'Data Visualisation',
];

const COMPANY_NAMES = [
  'Astra Systems', 'BluePeak Consulting', 'CloudNova Labs', 'Delta Mobility', 'Elevate Analytics',
  'FinEdge Services', 'GreenGrid Energy', 'HexaWorks', 'Inspire Retail', 'Jupiter Networks',
  'Kinetic Manufacturing', 'Lumen Health', 'MetaCraft Design', 'NorthStar Logistics',
  'Orbit Software', 'PrimeCore Finance', 'Quantum Learning', 'Riverstone Technologies',
  'Summit Infrastructure', 'Vertex Digital',
];

function hasFlag(flag) {
  return process.argv.includes(`--${flag}`);
}

function assertSeedAllowed() {
  const explicitlyAllowed = hasFlag('allow-synthetic-seed') || process.env.CAMPUSOS_ALLOW_SYNTHETIC_SEED === 'true';
  if (!explicitlyAllowed) {
    throw new Error(
      'Synthetic seeding is disabled by default. Use --allow-synthetic-seed or set CAMPUSOS_ALLOW_SYNTHETIC_SEED=true.',
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed the synthetic campus dataset.');
  }
}

function personName(index, prefix = '') {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length];
  return `${prefix}${first} ${last}`.trim();
}

function dateFromNow(days, hour = 10) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value;
}

function dateBeforeNow(days, hour = 10) {
  return dateFromNow(-Math.abs(days), hour);
}

async function deleteTenantByCode(code) {
  const institution = await prisma.institution.findUnique({ where: { code }, select: { id: true } });
  if (!institution) return;

  const tenantId = institution.id;

  await prisma.$transaction([
    prisma.loan.deleteMany({ where: { libraryItem: { tenantId } } }),
    prisma.libraryItem.deleteMany({ where: { tenantId } }),
    prisma.application.deleteMany({ where: { placement: { tenantId } } }),
    prisma.placement.deleteMany({ where: { tenantId } }),
    prisma.allocation.deleteMany({ where: { roomHostel: { hostel: { tenantId } } } }),
    prisma.roomHostel.deleteMany({ where: { hostel: { tenantId } } }),
    prisma.hostel.deleteMany({ where: { tenantId } }),
    prisma.refund.deleteMany({ where: { payment: { tenantId } } }),
    prisma.messBill.deleteMany({ where: { tenantId } }),
    prisma.transportRoute.deleteMany({ where: { tenantId } }),
    prisma.scholarship.deleteMany({ where: { tenantId } }),
    prisma.announcement.deleteMany({ where: { tenantId } }),
    prisma.ticket.deleteMany({ where: { tenantId } }),
    prisma.document.deleteMany({ where: { tenantId } }),
    prisma.certificate.deleteMany({ where: { tenantId } }),
    prisma.alumni.deleteMany({ where: { tenantId } }),
    prisma.governanceCommittee.deleteMany({ where: { tenantId } }),
    prisma.governanceMeeting.deleteMany({ where: { tenantId } }),
    prisma.governanceResolution.deleteMany({ where: { tenantId } }),
    prisma.governancePolicy.deleteMany({ where: { tenantId } }),
    prisma.governanceDelegation.deleteMany({ where: { tenantId } }),
    prisma.internationalStudent.deleteMany({ where: { tenantId } }),
    prisma.exchangeProgram.deleteMany({ where: { tenantId } }),
    prisma.creditMapping.deleteMany({ where: { tenantId } }),
    prisma.migrationConnector.deleteMany({ where: { tenantId } }),
    prisma.migrationJob.deleteMany({ where: { tenantId } }),
    prisma.migrationFieldMapping.deleteMany({ where: { tenantId } }),
    prisma.migrationValidation.deleteMany({ where: { tenantId } }),
    prisma.migrationLog.deleteMany({ where: { tenantId } }),
    prisma.aiBiasAudit.deleteMany({ where: { tenantId } }),
    prisma.aiIncident.deleteMany({ where: { tenantId } }),
  ]);

  await prisma.institution.delete({ where: { id: tenantId } });
}

async function createRoleAccounts(tenantId, passwordHash) {
  const users = [];
  for (const [role, name, email] of ROLE_ACCOUNTS) {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        tenantId,
        name,
        email,
        passwordHash,
        role,
        isActive: true,
        emailVerified: new Date(),
      },
    });
    users.push(user);
  }
  return users;
}

async function seedSyntheticCampus() {
  assertSeedAllowed();

  console.log('Removing the legacy CDU demo tenant and any previous NITX synthetic tenant...');
  await deleteTenantByCode('CDU');
  await deleteTenantByCode(SYNTHETIC_TENANT.code);

  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 12);

  console.log('Creating the synthetic institution, academic structure and role accounts...');
  const institution = await prisma.institution.create({
    data: {
      id: randomUUID(),
      name: SYNTHETIC_TENANT.name,
      code: SYNTHETIC_TENANT.code,
      subdomain: SYNTHETIC_TENANT.subdomain,
      status: 'ACTIVE',
      primaryColor: '#1754E8',
      secondaryColor: '#101D38',
    },
  });

  const campuses = await Promise.all([
    prisma.campus.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        name: 'Nexus Central Campus',
        code: 'NCC',
        address: 'Knowledge Park, Lucknow, Uttar Pradesh',
      },
    }),
    prisma.campus.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        name: 'Nexus Innovation Campus',
        code: 'NIC',
        address: 'Technology Corridor, Noida, Uttar Pradesh',
      },
    }),
  ]);

  const departments = [];
  for (let index = 0; index < DEPARTMENTS.length; index += 1) {
    const [name, code] = DEPARTMENTS[index];
    departments.push(await prisma.department.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        campusId: campuses[index % campuses.length].id,
        name,
        code,
      },
    }));
  }

  const programs = [];
  for (const [name, code, durationYears, departmentIndex] of PROGRAMMES) {
    programs.push(await prisma.program.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        departmentId: departments[departmentIndex].id,
        name,
        code,
        durationYears,
      },
    }));
  }

  const batches = [];
  const sections = [];
  for (let index = 0; index < programs.length; index += 1) {
    const program = programs[index];
    const startYear = index % 2 === 0 ? 2025 : 2026;
    const endYear = startYear + program.durationYears;
    const batch = await prisma.batch.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        programId: program.id,
        name: `${startYear}-${endYear}`,
        startYear,
        endYear,
      },
    });
    batches.push(batch);

    for (const sectionName of ['A', 'B']) {
      sections.push(await prisma.section.create({
        data: {
          id: randomUUID(),
          tenantId: institution.id,
          batchId: batch.id,
          name: sectionName,
          capacity: 60,
        },
      }));
    }
  }

  const academicYear = await prisma.academicYear.create({
    data: {
      id: randomUUID(),
      tenantId: institution.id,
      name: '2026-27',
      startDate: new Date('2026-07-01T00:00:00.000Z'),
      endDate: new Date('2027-06-30T23:59:59.000Z'),
      isCurrent: true,
    },
  });

  const term = await prisma.term.create({
    data: {
      id: randomUUID(),
      tenantId: institution.id,
      academicYearId: academicYear.id,
      name: 'Semester 1',
      number: 1,
      startDate: new Date('2026-07-01T00:00:00.000Z'),
      endDate: new Date('2026-12-20T23:59:59.000Z'),
    },
  });

  const roleUsers = await createRoleAccounts(institution.id, passwordHash);
  const roleUser = Object.fromEntries(roleUsers.map((user) => [user.role, user]));

  const staffUsers = [];
  const facultyStaff = [];
  for (let index = 0; index < FACULTY_COUNT; index += 1) {
    const isPrimaryFaculty = index === 0;
    const user = isPrimaryFaculty
      ? roleUser.FACULTY
      : await prisma.user.create({
          data: {
            id: randomUUID(),
            tenantId: institution.id,
            email: `faculty${String(index + 1).padStart(2, '0')}@nexus-campus.local`,
            name: personName(index + 40, 'Dr. '),
            passwordHash,
            role: 'FACULTY',
            isActive: true,
            emailVerified: new Date(),
          },
        });

    const staff = await prisma.staff.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        userId: user.id,
        employeeId: `FAC-${String(index + 1).padStart(3, '0')}`,
        designation: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'][index % 4],
        departmentId: departments[index % departments.length].id,
      },
    });
    staffUsers.push(user);
    facultyStaff.push(staff);
  }

  const operationalRoles = ROLE_ACCOUNTS.filter(([role]) => !['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY', 'STUDENT', 'PARENT'].includes(role));
  for (let index = 0; index < operationalRoles.length; index += 1) {
    const [role] = operationalRoles[index];
    const user = roleUser[role];
    await prisma.staff.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        userId: user.id,
        employeeId: `OPS-${String(index + 1).padStart(3, '0')}`,
        designation: role.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (value) => value.toUpperCase()),
        departmentId: departments[index % departments.length].id,
      },
    });
  }

  console.log('Creating 80 guardians and 100 realistic synthetic student records...');
  const guardians = [];
  for (let index = 0; index < GUARDIAN_COUNT; index += 1) {
    const isPrimaryParent = index === 0;
    const user = isPrimaryParent
      ? roleUser.PARENT
      : await prisma.user.create({
          data: {
            id: randomUUID(),
            tenantId: institution.id,
            email: `guardian${String(index + 1).padStart(3, '0')}@nexus-campus.local`,
            name: personName(index + 140),
            passwordHash,
            role: 'PARENT',
            isActive: true,
            emailVerified: new Date(),
          },
        });

    guardians.push(await prisma.guardian.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        userId: user.id,
        relationship: index % 2 === 0 ? 'Mother' : 'Father',
      },
    }));
  }

  const students = [];
  for (let index = 0; index < STUDENT_COUNT; index += 1) {
    const isPrimaryStudent = index === 0;
    const user = isPrimaryStudent
      ? roleUser.STUDENT
      : await prisma.user.create({
          data: {
            id: randomUUID(),
            tenantId: institution.id,
            email: `student${String(index + 1).padStart(3, '0')}@nexus-campus.local`,
            name: personName(index + 240),
            passwordHash,
            role: 'STUDENT',
            isActive: true,
            emailVerified: new Date(),
          },
        });

    const batch = batches[index % batches.length];
    const batchSections = sections.filter((section) => section.batchId === batch.id);
    const section = batchSections[index % batchSections.length];
    students.push(await prisma.student.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        userId: user.id,
        rollNumber: `NITX-${batch.startYear}-${String(index + 1).padStart(4, '0')}`,
        batchId: batch.id,
        sectionId: section.id,
        guardianId: guardians[index % guardians.length].id,
        cgpa: Number((6.2 + ((index * 17) % 35) / 10).toFixed(2)),
        creditsEarned: 24 + ((index * 9) % 92),
      },
    }));
  }

  console.log('Creating courses, offerings, enrolments, attendance, assignments and results...');
  const rooms = [];
  for (let index = 0; index < 12; index += 1) {
    rooms.push(await prisma.room.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        campusId: campuses[index % campuses.length].id,
        roomNumber: `${index < 6 ? 'A' : 'B'}-${String(101 + index).padStart(3, '0')}`,
        building: index < 6 ? 'Academic Block' : 'Innovation Block',
        capacity: index % 3 === 0 ? 80 : 60,
      },
    }));
  }

  const courses = [];
  const offerings = [];
  for (let index = 0; index < COURSE_TITLES.length; index += 1) {
    const department = departments[index % departments.length];
    const course = await prisma.course.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        departmentId: department.id,
        code: `${department.code}${String(101 + index).padStart(3, '0')}`,
        title: COURSE_TITLES[index],
        lectureCredits: 3,
        tutorialCredits: index % 3 === 0 ? 1 : 0,
        practicalCredits: index % 2 === 0 ? 1 : 0,
      },
    });
    courses.push(course);

    const offering = await prisma.courseOffering.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        courseId: course.id,
        termId: term.id,
        sectionId: sections[index % sections.length].id,
        facultyId: facultyStaff[index % facultyStaff.length].id,
        capacity: 60,
      },
    });
    offerings.push(offering);

    await prisma.timetableSlot.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        courseOfferingId: offering.id,
        roomId: rooms[index % rooms.length].id,
        dayOfWeek: index % 6,
        startTime: `${String(9 + (index % 7)).padStart(2, '0')}:00`,
        endTime: `${String(10 + (index % 7)).padStart(2, '0')}:00`,
      },
    });
  }

  const enrolments = [];
  for (let studentIndex = 0; studentIndex < students.length; studentIndex += 1) {
    for (let offset = 0; offset < 5; offset += 1) {
      enrolments.push({
        id: randomUUID(),
        tenantId: institution.id,
        studentId: students[studentIndex].id,
        courseOfferingId: offerings[(studentIndex + offset * 3) % offerings.length].id,
        enrolledAt: dateBeforeNow(30 + offset),
      });
    }
  }
  await prisma.enrollment.createMany({ data: enrolments });

  for (let offeringIndex = 0; offeringIndex < 10; offeringIndex += 1) {
    const session = await prisma.attendanceSession.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        courseOfferingId: offerings[offeringIndex].id,
        sessionDate: dateBeforeNow(10 - offeringIndex),
      },
    });

    await prisma.attendanceRecord.createMany({
      data: students.map((student, studentIndex) => ({
        id: randomUUID(),
        tenantId: institution.id,
        attendanceSessionId: session.id,
        studentId: student.id,
        status: (studentIndex + offeringIndex) % 9 === 0 ? 'ABSENT' : 'PRESENT',
      })),
    });
  }

  const assignments = [];
  for (let index = 0; index < 15; index += 1) {
    assignments.push(await prisma.assignment.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        courseOfferingId: offerings[index].id,
        title: `${courses[index].title} Applied Project`,
        description: 'Synthetic academic task used to validate CampusOS assignment, grading and workflow dashboards.',
        dueDate: dateFromNow(5 + index),
        maxMarks: 100,
      },
    }));
  }

  const submissions = [];
  for (let index = 0; index < 300; index += 1) {
    const assignment = assignments[index % assignments.length];
    const student = students[index % students.length];
    submissions.push({
      id: randomUUID(),
      tenantId: institution.id,
      assignmentId: assignment.id,
      studentId: student.id,
      fileUrl: `https://example.invalid/submissions/${assignment.id}/${student.id}.pdf`,
      submittedAt: dateBeforeNow(index % 12),
      marksObtained: 55 + (index % 43),
    });
  }
  await prisma.submission.createMany({ data: submissions, skipDuplicates: true });

  const exams = [];
  for (let index = 0; index < 3; index += 1) {
    const exam = await prisma.exam.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        termId: term.id,
        name: ['Mid Semester Examination', 'Practical Assessment', 'End Semester Examination'][index],
        type: ['MID_TERM', 'PRACTICAL', 'END_TERM'][index],
      },
    });
    exams.push(exam);
    await prisma.examSchedule.create({
      data: {
        id: randomUUID(),
        examId: exam.id,
        examDate: dateFromNow(20 + index * 15, 9),
      },
    });
  }

  await prisma.result.createMany({
    data: exams.flatMap((exam, examIndex) => students.map((student, studentIndex) => ({
      id: randomUUID(),
      tenantId: institution.id,
      examId: exam.id,
      studentId: student.id,
      sgpa: Number((6.1 + ((studentIndex + examIndex * 5) % 34) / 10).toFixed(2)),
      cgpa: Number((6.2 + ((studentIndex + examIndex * 3) % 33) / 10).toFixed(2)),
    }))),
  });

  console.log('Creating finance, hostel, transport, library and placement operations...');
  const feeStructure = await prisma.feeStructure.create({
    data: {
      id: randomUUID(),
      tenantId: institution.id,
      name: 'Academic Fee 2026-27',
      amount: 125000,
    },
  });

  await prisma.scholarship.createMany({
    data: [
      { id: randomUUID(), tenantId: institution.id, name: 'Merit Excellence Scholarship', discountPct: 25 },
      { id: randomUUID(), tenantId: institution.id, name: 'Sports Achievement Scholarship', discountPct: 15 },
      { id: randomUUID(), tenantId: institution.id, name: 'Need-Based Support Grant', discountPct: 20 },
      { id: randomUUID(), tenantId: institution.id, name: 'Women in Technology Scholarship', discountPct: 18 },
    ],
  });

  const invoices = [];
  for (let index = 0; index < students.length; index += 1) {
    const status = index < 62 ? 'PAID' : index < 78 ? 'PARTIAL' : index < 95 ? 'PENDING' : 'FAILED';
    invoices.push(await prisma.invoice.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        studentId: students[index].id,
        feeStructureId: feeStructure.id,
        amount: index % 5 === 0 ? 100000 : 125000,
        dueDate: index < 18 ? dateBeforeNow(10 + index) : dateFromNow(5 + (index % 25)),
        status,
      },
    }));
  }

  const paymentMethods = ['UPI', 'NETBANKING', 'RAZORPAY', 'STRIPE', 'CASH'];
  const payments = [];
  for (let index = 0; index < 84; index += 1) {
    const invoice = invoices[index];
    const status = index < 76 ? 'PAID' : index < 80 ? 'FAILED' : 'REFUNDED';
    const payment = await prisma.payment.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        invoiceId: invoice.id,
        amount: invoice.status === 'PARTIAL' ? invoice.amount / 2 : invoice.amount,
        method: paymentMethods[index % paymentMethods.length],
        status,
        transactionId: `NITX-${String(index + 1).padStart(6, '0')}`,
        paidAt: dateBeforeNow(index % 35),
      },
    });
    payments.push(payment);
  }

  for (const payment of payments.filter((item) => item.status === 'REFUNDED')) {
    await prisma.refund.create({
      data: {
        id: randomUUID(),
        paymentId: payment.id,
        amount: payment.amount,
        reason: 'Synthetic refund record for dashboard validation',
      },
    });
  }

  const hostels = [];
  for (let index = 0; index < 3; index += 1) {
    hostels.push(await prisma.hostel.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        name: ['Aravali Residence', 'Vindhya Residence', 'Nilgiri Residence'][index],
        building: `Residence Block ${String.fromCharCode(65 + index)}`,
      },
    }));
  }

  const hostelRooms = [];
  for (let index = 0; index < 60; index += 1) {
    hostelRooms.push(await prisma.roomHostel.create({
      data: {
        id: randomUUID(),
        hostelId: hostels[index % hostels.length].id,
        roomNumber: `${index % hostels.length + 1}${String(101 + Math.floor(index / 3)).padStart(3, '0')}`,
        capacity: index % 4 === 0 ? 3 : 2,
      },
    }));
  }

  await prisma.allocation.createMany({
    data: students.slice(0, 72).map((student, index) => ({
      id: randomUUID(),
      roomHostelId: hostelRooms[index % hostelRooms.length].id,
      studentId: student.id,
    })),
  });

  await prisma.messBill.createMany({
    data: Array.from({ length: 24 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      amount: 2800 + (index % 6) * 150,
    })),
  });

  await prisma.transportRoute.createMany({
    data: Array.from({ length: 12 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      routeName: `Route ${String(index + 1).padStart(2, '0')} · ${['Gomti Nagar', 'Aliganj', 'Hazratganj', 'Indira Nagar', 'Noida Sector 62', 'Greater Noida'][index % 6]}`,
    })),
  });

  const libraryItems = [];
  for (let index = 0; index < 80; index += 1) {
    libraryItems.push(await prisma.libraryItem.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        title: `${COURSE_TITLES[index % COURSE_TITLES.length]} Reference Volume ${Math.floor(index / COURSE_TITLES.length) + 1}`,
        isbn: index % 7 === 0 ? null : `978-81-${String(1000000 + index).slice(-7)}`,
      },
    }));
  }

  await prisma.loan.createMany({
    data: Array.from({ length: 180 }, (_, index) => ({
      id: randomUUID(),
      libraryItemId: libraryItems[(index * 7) % libraryItems.length].id,
      borrowedAt: dateBeforeNow(index % 90),
    })),
  });

  const placements = [];
  for (const companyName of COMPANY_NAMES) {
    placements.push(await prisma.placement.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        companyName,
      },
    }));
  }

  await prisma.application.createMany({
    data: Array.from({ length: 160 }, (_, index) => ({
      id: randomUUID(),
      placementId: placements[index % placements.length].id,
      status: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'][index % 5],
    })),
  });

  await prisma.alumni.createMany({
    data: Array.from({ length: 40 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      graduationYear: 2019 + (index % 7),
    })),
  });

  console.log('Creating notices, service tickets, notifications and audit history...');
  const targetRoles = ['ALL', 'STUDENT', 'FACULTY', 'PARENT', 'FINANCE_OFFICER', 'LIBRARIAN', 'WARDEN'];
  await prisma.notice.createMany({
    data: Array.from({ length: 20 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      title: `Institution notice ${String(index + 1).padStart(2, '0')}`,
      content: `Synthetic notice covering academic, finance, campus-service or governance activity for operational dashboard validation. Reference ${index + 1}.`,
      targetRole: targetRoles[index % targetRoles.length],
      createdAt: dateBeforeNow(index),
    })),
  });

  await prisma.announcement.createMany({
    data: Array.from({ length: 12 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      title: `Campus service announcement ${index + 1}`,
    })),
  });

  await prisma.ticket.createMany({
    data: Array.from({ length: 36 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      subject: `${['Transport', 'Hostel', 'Finance', 'Library', 'Academic', 'IT Support'][index % 6]} request ${String(index + 1).padStart(2, '0')}`,
      status: ['OPEN', 'IN_PROGRESS', 'RESOLVED'][index % 3],
    })),
  });

  await prisma.auditLog.createMany({
    data: Array.from({ length: 60 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      userId: roleUsers[index % roleUsers.length].id,
      action: ['VIEW_DASHBOARD', 'REVIEW_RECORDS', 'EXPORT_REPORT', 'UPDATE_WORKFLOW'][index % 4],
      entity: ['Dashboard', 'Invoice', 'Student', 'LibraryItem', 'Placement', 'Hostel'][index % 6],
      diffJson: JSON.stringify({ synthetic: true, sequence: index + 1 }),
      ipAddress: '127.0.0.1',
      createdAt: dateBeforeNow(index % 20),
    })),
  });

  await prisma.notification.createMany({
    data: roleUsers.flatMap((user, userIndex) => Array.from({ length: 3 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      userId: user.id,
      title: `Workspace update ${index + 1}`,
      body: `Synthetic ${user.role.toLowerCase().replaceAll('_', ' ')} notification for Phase 5 validation.`,
      type: 'SYSTEM',
      actionUrl: '/dashboard',
      isRead: index === 0,
      createdAt: dateBeforeNow(userIndex + index),
    }))),
  });

  console.log('Creating governance, international, data migration and AI governance records...');

  // --- Institutional Governance ---
  const committeeDefs = [
    ['Board of Governors', 'Statutory', 'Dr. Kavya Menon', 'Dr. Sameer Rao'],
    ['Academic Council', 'Academic', 'Dr. Meera Iyer', 'Dr. Priya Sharma'],
    ['Finance & Audit Committee', 'Administrative', 'Nikhil Bansal', 'Sonal Gupta'],
    ['Anti-Ragging Committee', 'Statutory', 'Dr. Raghav Sinha', 'Mohit Tiwari'],
    ['Research & Innovation Board', 'Advisory', 'Dr. Meera Iyer', 'Dr. Sameer Rao'],
    ['Library & E-Resources Committee', 'Academic', 'Neha Joshi', 'Aditi Kulkarni'],
  ];
  const committees = [];
  for (let index = 0; index < committeeDefs.length; index += 1) {
    const [name, type, chairperson, secretary] = committeeDefs[index];
    const committee = await prisma.governanceCommittee.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        name,
        type,
        chairperson,
        secretary,
        memberCount: 8 + (index % 5),
        termStart: dateBeforeNow(120),
        termEnd: dateFromNow(245),
        status: index === 0 ? 'Active' : index % 3 === 0 ? 'Reconstitution Due' : 'Active',
        lastMeetingDate: dateBeforeNow(index * 9 + 5),
        nextMeetingDate: dateFromNow(12 - index),
      },
    });
    committees.push(committee);
  }

  const meetingDefs = [
    ['Statutory Board Meeting Q2', 'Physical', 'Board Room, Admin Block'],
    ['Academic Council Curriculum Review', 'Hybrid', 'Senate Hall'],
    ['Finance Committee Mid-Year Review', 'Virtual', 'Video Conference'],
    ['Anti-Ragging Committee Orientation', 'Physical', 'Auditorium'],
    ['Research Board Patent Filing', 'Hybrid', 'Research Park'],
  ];
  const meetings = [];
  for (let index = 0; index < meetingDefs.length; index += 1) {
    const [title, mode, venue] = meetingDefs[index];
    const scheduledAt = dateFromNow(index === 0 ? -15 : 8 + index * 6);
    const meeting = await prisma.governanceMeeting.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        committeeId: committees[index % committees.length].id,
        title,
        scheduledAt,
        venue,
        mode,
        status: index === 0 ? 'Completed' : 'Scheduled',
        agendaItems: 4 + (index % 3),
        quorumRequired: Math.floor(committees[index % committees.length].memberCount * 0.6),
        attendedCount: index === 0 ? 11 : 0,
        minutesStatus: index === 0 ? 'Approved' : 'Draft',
      },
    });
    meetings.push(meeting);
  }

  const resolutionDefs = [
    ['Approve revised academic calendar 2026-27', 'Voted', 14, 2, 1, 3, 1],
    ['Ratify research incentive policy', 'Approved', 16, 0, 1, 5, 5],
    ['Sanction hostel fee revision', 'Discussed', 0, 0, 0, 2, 0],
    ['Approve new B.Tech AI program proposal', 'Proposed', 0, 0, 0, 4, 0],
    ['Adopt institutional sustainability charter', 'Approved', 15, 1, 1, 6, 4],
  ];
  for (let index = 0; index < resolutionDefs.length; index += 1) {
    const [title, status, votesFor, votesAgainst, abstentions, actionItems, completedActions] = resolutionDefs[index];
    await prisma.governanceResolution.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        meetingId: meetings[index % meetings.length].id,
        title,
        proposedBy: committees[index % committees.length].chairperson,
        status,
        votesFor,
        votesAgainst,
        abstentions,
        actionItems,
        completedActions,
        createdAt: dateBeforeNow(index * 4 + 3),
      },
    });
  }

  const policyDefs = [
    ['Academic Integrity Policy', 'Academic', 'Approved', 'Office of the Dean'],
    ['Data Protection & Privacy Policy', 'Administrative', 'Published', 'Office of the Registrar'],
    ['Harassment-Free Campus Policy', 'Statutory', 'Published', 'Office of the Dean'],
    ['Research Ethics Policy', 'Academic', 'Under Review', 'Research & Innovation Board'],
    ['Procurement & Vendor Policy', 'Administrative', 'Approved', 'Finance Office'],
    ['International Student Welfare Policy', 'Academic', 'Under Review', 'International Office'],
  ];
  for (let index = 0; index < policyDefs.length; index += 1) {
    const [title, category, status, approvedBy] = policyDefs[index];
    await prisma.governancePolicy.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        title,
        category,
        version: `1.${index}`,
        status,
        effectiveDate: dateBeforeNow(index * 14 + 5),
        lastReviewedAt: dateBeforeNow(index * 9),
        approvedBy,
        department: category,
      },
    });
  }

  const delegationDefs = [
    ['Capital Expenditure', 'HOD', 'Dean', 'Registrar', 'Up to ₹5L', 'Above ₹5L'],
    ['Recruitment & Hiring', 'HOD', 'HR Admin', 'Registrar', 'Up to 2 posts', 'Above 2 posts'],
    ['Student Discipline', 'HOD', 'Dean', 'Registrar', 'Warning level', 'Suspension'],
    ['Procurement', 'Department Admin', 'Finance Officer', 'Registrar', 'Up to ₹2L', 'Above ₹2L'],
    ['Examination Exemptions', 'Course Faculty', 'HOD', 'Controller of Exams', 'Up to 7 days', 'Above 7 days'],
    ['Scholarship Disbursal', 'Accounts', 'Finance Officer', 'Registrar', 'Up to ₹50K', 'Above ₹50K'],
  ];
  await prisma.governanceDelegation.createMany({
    data: delegationDefs.map(([authority, level1, level2, level3, limit, escalation]) => ({
      id: randomUUID(),
      tenantId: institution.id,
      authority,
      level1,
      level2,
      level3,
      limit,
      escalation,
    })),
  });

  // --- International Students & Global Mobility ---
  const intlStudents = [
    ['Amina Yusuf', 'Nigeria', 'NG', 'B.Tech Computer Science', 'Student Visa', 'FRRO'],
    ['Rafiq Hossain', 'Bangladesh', 'BD', 'MBA', 'Student Visa', 'FRRO'],
    ['Ethan Carter', 'USA', 'US', 'B.Des Industrial Design', 'Student Visa', 'FRRO'],
    ['Priyanka Sharma', 'India', 'IN', 'M.Tech Renewable Energy', 'Student Visa', 'FRRO'],
    ['Kwame Mensah', 'Ghana', 'GH', 'B.Tech Civil Engineering', 'Student Visa', 'FRRO'],
    ['Aisha Khan', 'UAE', 'AE', 'BBA', 'Student Visa', 'FRRO'],
    ['Liam O’Brien', 'Ireland', 'IE', 'M.Sc Data Science', 'Student Visa', 'FRRO'],
    ['Sofia Rossi', 'Italy', 'IT', 'B.Arch', 'Student Visa', 'FRRO'],
    ['Chen Wei', 'China', 'CN', 'M.Tech Mechanical', 'Student Visa', 'FRRO'],
    ['Fatima Zahra', 'Morocco', 'MA', 'B.Tech Electronics', 'Student Visa', 'FRRO'],
    ['Daniel Kim', 'South Korea', 'KR', 'MBA', 'Student Visa', 'FRRO'],
    ['Grace Adeyemi', 'Nigeria', 'NG', 'M.Sc Biotechnology', 'Student Visa', 'FRRO'],
  ];
  const intlStudentIds = [];
  for (let index = 0; index < intlStudents.length; index += 1) {
    const [fullName, nationality, countryCode, program] = intlStudents[index];
    const frroStatus = index % 3 === 0 ? 'Pending' : index % 5 === 0 ? 'Expired' : 'Registered';
    const created = await prisma.internationalStudent.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        fullName,
        nationality,
        countryCode,
        program,
        visaType: 'Student Visa (Form S)',
        visaExpiry: dateFromNow(30 + (index % 3) * 60 + index * 5),
        frroStatus,
        insuranceStatus: index % 4 === 0 ? 'Expired' : index % 6 === 0 ? 'Not Enrolled' : 'Active',
        email: `${fullName.split(' ')[0].toLowerCase()}${index}@nexus-campus.local`,
        admissionYear: 2024 + (index % 3),
      },
    });
    intlStudentIds.push(created.id);
  }

  const exchangeDefs = [
    ['TU München', 'Germany', 'DE', 'Outbound', 'Fall 2026', 18, 4, 'Open'],
    ['National University of Singapore', 'Singapore', 'SG', 'Outbound', 'Fall 2026', 15, 3, 'In Progress'],
    ['University of Toronto', 'Canada', 'CA', 'Outbound', 'Spring 2027', 20, 5, 'Open'],
    ['Tsinghua University', 'China', 'CN', 'Outbound', 'Fall 2026', 12, 2, 'Closed'],
    ['Royal Melbourne Institute of Technology', 'Australia', 'AU', 'Outbound', 'Spring 2027', 16, 4, 'Open'],
    ['HEC Paris', 'France', 'FR', 'Inbound', 'Fall 2026', 10, 3, 'In Progress'],
  ];
  await prisma.exchangeProgram.createMany({
    data: exchangeDefs.map(([university, country, countryCode, type, semester, credits, seats, status], index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      university,
      country,
      countryCode,
      type,
      semester,
      creditsTransferable: credits,
      seatsAvailable: seats,
      applicationDeadline: dateFromNow(14 + index * 12),
      status,
    })),
  });

  const creditDefs = [
    ['Data Structures', 4, 'Algorithms & Data Modeling', 4, 'TU München', 'Approved'],
    ['Engineering Mathematics III', 3, 'Applied Mathematics', 3, 'National University of Singapore', 'Approved'],
    ['Thermodynamics', 4, 'Thermal Systems', 4, 'University of Toronto', 'Under Review'],
    ['Design Thinking', 2, 'Human-Centred Design', 2, 'HEC Paris', 'Approved'],
    ['Embedded Systems', 4, 'Microcontroller Systems', 4, 'RMIT', 'Under Review'],
    ['Business Analytics', 3, 'Analytics for Decision Making', 3, 'HEC Paris', 'Approved'],
  ];
  await prisma.creditMapping.createMany({
    data: creditDefs.map(([homeCourse, homeCredits, hostCourse, hostCredits, hostUniversity, equivalence]) => ({
      id: randomUUID(),
      tenantId: institution.id,
      homeCourse,
      homeCredits,
      hostCourse,
      hostCredits,
      hostUniversity,
      equivalence,
      notes: 'Mapped by the International Office equivalence committee.',
    })),
  });

  // --- Data Migration Factory & Control Tower ---
  const connectorDefs = [
    ['Legacy ERP (SAP)', 'ERP', 'Connected'],
    ['LMS Moodle', 'LMS', 'Connected'],
    ['Admissions Portal', 'API', 'Connected'],
    ['Fee Ledger Export', 'Spreadsheet', 'Disconnected'],
  ];
  const connectorRows = [];
  for (let index = 0; index < connectorDefs.length; index += 1) {
    const [name, type, status] = connectorDefs[index];
    const connector = await prisma.migrationConnector.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        name,
        type,
        status,
        lastSyncAt: dateBeforeNow(index * 2),
        recordCount: 52000 + index * 4100,
        tableCount: 8 + index * 3,
      },
    });
    connectorRows.push(connector);
  }

  const entityDefs = [
    ['Students', 'Completed', 100],
    ['Faculty', 'Completed', 60],
    ['Courses', 'Completed', 240],
    ['Enrollments', 'Running', 3400],
    ['Finance', 'Pending', 12000],
    ['Attendance', 'Running', 8800],
  ];
  const jobRows = [];
  for (let index = 0; index < entityDefs.length; index += 1) {
    const [entity, status, totalRecords] = entityDefs[index];
    const migratedRecords =
      status === 'Completed' ? totalRecords : status === 'Running' ? Math.floor(totalRecords * 0.62) : 0;
    const errorCount = status === 'Completed' ? index * 6 : status === 'Running' ? 12 : 0;
    const job = await prisma.migrationJob.create({
      data: {
        id: randomUUID(),
        tenantId: institution.id,
        connectorId: connectorRows[index % connectorRows.length].id,
        entity,
        status,
        totalRecords,
        migratedRecords,
        errorCount,
        throughput: status === 'Running' ? 'Streaming' : status === 'Completed' ? 'Done' : 'Idle',
        startedAt: dateBeforeNow(40 - index * 5),
        completedAt: status === 'Completed' ? dateBeforeNow(18 - index * 3) : null,
      },
    });
    jobRows.push(job);
  }

  const mappingDefs = [
    ['Student ID', 'student_id', 'uuid', 'Transform', 'STU-2024-0001'],
    ['Roll Number', 'roll_number', 'string', 'None', 'NITX-2024-01'],
    ['First Name', 'first_name', 'string', 'Trim', 'Rohan'],
    ['Last Name', 'last_name', 'string', 'Trim', 'Verma'],
    ['Email', 'email', 'email', 'Lowercase', 'student@nexus-campus.local'],
    ['Program Code', 'program_code', 'string', 'Map', 'B.TECH-CSE'],
    ['Batch Year', 'batch_year', 'int', 'Parse', '2024'],
    ['Mobile', 'phone', 'phone', 'Normalize', '+91 98765 43210'],
    ['Joining Date', 'enrolled_at', 'datetime', 'ISO-8601', '2024-07-15'],
    ['Fee Status', 'fee_status', 'enum', 'Map', 'PAID'],
  ];
  await prisma.migrationFieldMapping.createMany({
    data: mappingDefs.map(([source, target, dataType, transform, sample], index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      entity: 'Students',
      sourceField: source,
      targetField: target,
      dataType,
      transform,
      sampleValue: sample,
      status: index % 4 === 0 ? 'Pending' : 'Mapped',
    })),
  });

  const validationDefs = [
    ['Students', 52400, 52180, 96, 74, 22, 99.2],
    ['Faculty', 4300, 4290, 4, 6, 2, 99.8],
    ['Courses', 1120, 1105, 8, 5, 1, 99.1],
    ['Enrollments', 18200, 18010, 120, 48, 12, 98.6],
    ['Finance', 12000, 11910, 40, 35, 15, 98.9],
    ['Attendance', 8800, 8620, 96, 62, 18, 97.9],
  ];
  await prisma.migrationValidation.createMany({
    data: validationDefs.map(([entity, total, valid, duplicates, missing, anomalies, quality]) => ({
      id: randomUUID(),
      tenantId: institution.id,
      entity,
      total,
      valid,
      duplicates,
      missing,
      anomalies,
      quality,
    })),
  });

  const logMessages = [
    ['INFO', 'Connector', 'Legacy ERP connector authenticated successfully.'],
    ['INFO', 'Extract', 'Students table extracted: 52,400 rows in 4m 12s.'],
    ['WARN', 'Transform', '42 rows skipped due to missing program mapping.'],
    ['ERROR', 'Load', 'Bulk insert failed for 6 rows in enrollments (duplicate key).'],
    ['INFO', 'Validate', 'Students validation complete: 99.2% quality score.'],
    ['INFO', 'Publish', 'Students dataset published to staging.'],
    ['WARN', 'Sync', 'Fee ledger export is stale (last sync 3 days ago).'],
    ['INFO', 'Control', 'Dry run 2 snapshot created.'],
  ];
  await prisma.migrationLog.createMany({
    data: Array.from({ length: 24 }, (_, index) => {
      const [severity, source, message] = logMessages[index % logMessages.length];
      return {
        id: randomUUID(),
        tenantId: institution.id,
        severity,
        source,
        message: `${message} [run #${String(index + 1).padStart(3, '0')}]`,
        createdAt: new Date(dateBeforeNow(2).getTime() - index * 900000),
      };
    }),
  });

  // --- AI Governance ---
  const aiModelDefs = [
    ['campusos-mock-v1', 'CampusOS Native Engine', 'openai', 'chat', 'Production', 98.4, 0.97],
    ['gpt-4o', 'OpenAI GPT-4o', 'openai', 'chat', 'Production', 99.1, 0.98],
    ['claude-3-5-sonnet', 'Anthropic Claude 3.5 Sonnet', 'anthropic', 'chat', 'Staging', 98.8, 0.97],
    ['text-embedding-3-large', 'OpenAI Embedding', 'openai', 'embedding', 'Production', 97.6, 0.95],
    ['gemini-1.5-pro', 'Google Gemini 1.5 Pro', 'google', 'chat', 'Development', 97.2, 0.94],
  ];
  const aiModels = [];
  for (let index = 0; index < aiModelDefs.length; index += 1) {
    const [modelId, name, provider, capability, deploymentStatus, accuracyPct, f1Score] = aiModelDefs[index];
    const model = await prisma.aiModel.upsert({
      where: { modelId },
      update: {},
      create: {
        provider,
        modelId,
        name,
        capability,
        contextLimit: capability === 'chat' ? 128000 : 8191,
        costClass: 'standard',
        dataClassification: 'INTERNAL',
        isEnabled: true,
        deploymentStatus,
        accuracyPct,
        f1Score,
        lastTrainedAt: dateBeforeNow(6 - index),
        predictionCount: 84500 - index * 9200,
        driftDetected: index % 4 === 0,
      },
    });
    aiModels.push(model);
  }

  await prisma.aiTenantPolicy.upsert({
    where: { tenantId: institution.id },
    update: {},
    create: {
      tenantId: institution.id,
      isEnabled: true,
      allowedRoles: ['STUDENT', 'FACULTY', 'INSTITUTION_ADMIN'],
      maxMonthlyBudgetUsd: 500,
      currentMonthlySpendUsd: 132.4,
      rateLimitPerMin: 30,
      requireHumanApproval: true,
      retentionDays: 90,
    },
  });

  const aiPolicyDefs = [
    ['Responsible AI Usage Policy', 'AI Governance', 'PUBLISHED', 'ALL'],
    ['Student Data Handling in AI Tools', 'Data Governance', 'PUBLISHED', 'FACULTY'],
    ['AI-Generated Content Disclosure', 'Academic Policy', 'PUBLISHED', 'ALL'],
    ['Model Evaluation & Approval Policy', 'AI Governance', 'UNDER_REVIEW', 'INSTITUTION_ADMIN'],
  ];
  await prisma.aiKnowledgeDocument.createMany({
    data: aiPolicyDefs.map(([title, category, publicationStatus, audience], index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      title,
      category,
      scope: 'INSTITUTION',
      audience,
      classification: 'INTERNAL',
      publicationStatus,
      content: `Synthetic ${category.toLowerCase()} policy covering institutional expectations for ${audience.toLowerCase()} users. Reference ${index + 1}.`,
      effectiveDate: dateBeforeNow(30 - index * 6),
      authorName: 'Office of the Registrar',
    })),
  });

  const biasDefs = [
    [aiModels[0].id, 'Gender', 61.2, 57.8, 60.4, 0.04, 'Fair'],
    [aiModels[1].id, 'Nationality', 59.1, 62.5, 58.9, 0.11, 'Review'],
    [aiModels[3].id, 'First-Generation', 63.4, 60.2, 58.7, 0.06, 'Fair'],
    [aiModels[2].id, 'Disability Status', 55.3, 59.7, 58.2, 0.08, 'Review'],
  ];
  await prisma.aiBiasAudit.createMany({
    data: biasDefs.map(([modelId, groupName, groupA, groupB, groupC, biasScore, status]) => ({
      id: randomUUID(),
      tenantId: institution.id,
      modelId,
      groupName,
      groupA,
      groupB,
      groupC,
      biasScore,
      status,
    })),
  });

  const incidentDefs = [
    ['High', 'Open', 'Hallucination', 'Model cited a non-existent fee rule during a student query.'],
    ['Medium', 'Resolved', 'Data Leak Risk', 'Embedding refresh exposed a draft document in retrieval; fixed within 2h.'],
    ['Low', 'Resolved', 'Latency Spike', 'Inference latency exceeded 2s for 8 minutes during peak.'],
    ['Medium', 'Open', 'Prompt Injection', 'Attempted prompt injection blocked by the safety engine.'],
  ];
  await prisma.aiIncident.createMany({
    data: incidentDefs.map(([severity, status, type, description], index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      modelId: aiModels[index % aiModels.length].id,
      severity,
      status,
      type,
      description,
      resolution: status === 'Resolved' ? 'Resolved per incident response runbook.' : null,
      occurredAt: dateBeforeNow(index * 3 + 1),
    })),
  });

  await prisma.aiAuditLog.createMany({
    data: Array.from({ length: 18 }, (_, index) => ({
      id: randomUUID(),
      tenantId: institution.id,
      userId: roleUsers[index % roleUsers.length].id,
      userRole: roleUsers[index % roleUsers.length].role,
      feature: index % 3 === 0 ? 'ai_chat' : index % 3 === 1 ? 'ai_action' : 'ai_rag',
      actionType: index % 5 === 0 ? 'PROMPT_INJECTION_BLOCKED' : 'QUERY',
      modelUsed: aiModels[index % aiModels.length].modelId,
      promptTokens: 200 + index * 17,
      completionTokens: 80 + index * 9,
      estimatedCostUsd: 0.002 + index * 0.0004,
      promptInjectionBlocked: index % 5 === 0,
      status: index % 5 === 0 ? 'BLOCKED' : 'SUCCESS',
      createdAt: dateBeforeNow(index),
    })),
  });

  const summary = {
    tenant: `${institution.name} (${institution.code})`,
    roleAccounts: roleUsers.length,
    students: students.length,
    guardians: guardians.length,
    faculty: facultyStaff.length,
    courses: courses.length,
    enrolments: enrolments.length,
    invoices: invoices.length,
    libraryItems: libraryItems.length,
    libraryLoans: 180,
    hostelAllocations: 72,
    placements: placements.length,
    applications: 160,
    governanceCommittees: committees.length,
    governanceMeetings: meetings.length,
    internationalStudents: intlStudentIds.length,
    migrationJobs: jobRows.length,
    aiModels: aiModels.length,
    sharedPassword: SHARED_PASSWORD,
  };

  console.log('\n====================================================');
  console.log('CampusOS Synthetic Campus Seed Completed');
  console.log('====================================================');
  console.table(summary);
  console.log('\nPrimary login accounts:');
  for (const [role, name, email] of ROLE_ACCOUNTS) {
    console.log(`${role.padEnd(25)} ${email.padEnd(40)} ${name}`);
  }
  console.log(`Shared password: ${SHARED_PASSWORD}`);
  console.log('All names, records and transactions in this dataset are synthetic.');
}

seedSyntheticCampus()
  .catch((error) => {
    console.error('Synthetic campus seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
