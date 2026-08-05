import process from 'node:process';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REQUIRED_ROLE_EMAILS = [
  'superadmin@nexus-campus.local',
  'admin@nexus-campus.local',
  'registrar@nexus-campus.local',
  'dean@nexus-campus.local',
  'hod@nexus-campus.local',
  'faculty@nexus-campus.local',
  'student@nexus-campus.local',
  'parent@nexus-campus.local',
  'finance@nexus-campus.local',
  'accountant@nexus-campus.local',
  'hr@nexus-campus.local',
  'warden@nexus-campus.local',
  'librarian@nexus-campus.local',
  'transport@nexus-campus.local',
  'placement@nexus-campus.local',
  'admissions@nexus-campus.local',
  'exams@nexus-campus.local',
];

async function verifySyntheticCampus() {
  const institution = await prisma.institution.findUnique({
    where: { code: 'NITX' },
    select: { id: true, name: true, code: true },
  });

  if (!institution) {
    throw new Error('NITX synthetic institution was not found.');
  }

  const tenantId = institution.id;
  const [
    legacyDemoTenant,
    legacyDemoUsers,
    students,
    roleAccounts,
    courses,
    enrolments,
    invoices,
    libraryItems,
    loans,
    hostels,
    hostelAllocations,
    routes,
    placements,
    applications,
  ] = await Promise.all([
    prisma.institution.count({ where: { code: 'CDU' } }),
    prisma.user.count({ where: { email: { contains: '.demo@campusos.local' } } }),
    prisma.student.count({ where: { tenantId } }),
    prisma.user.findMany({
      where: { tenantId, email: { in: REQUIRED_ROLE_EMAILS } },
      select: { email: true, role: true, isActive: true },
    }),
    prisma.course.count({ where: { tenantId } }),
    prisma.enrollment.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.libraryItem.count({ where: { tenantId } }),
    prisma.loan.count({ where: { libraryItem: { tenantId } } }),
    prisma.hostel.count({ where: { tenantId } }),
    prisma.allocation.count({ where: { roomHostel: { hostel: { tenantId } } } }),
    prisma.transportRoute.count({ where: { tenantId } }),
    prisma.placement.count({ where: { tenantId } }),
    prisma.application.count({ where: { placement: { tenantId } } }),
  ]);

  const failures = [];
  const assertEqual = (label, actual, expected) => {
    if (actual !== expected) failures.push(`${label}: expected ${expected}, received ${actual}`);
  };
  const assertAtLeast = (label, actual, expected) => {
    if (actual < expected) failures.push(`${label}: expected at least ${expected}, received ${actual}`);
  };

  assertEqual('legacy CDU institutions', legacyDemoTenant, 0);
  assertEqual('legacy demo users', legacyDemoUsers, 0);
  assertEqual('students', students, 100);
  assertEqual('primary role accounts', roleAccounts.length, REQUIRED_ROLE_EMAILS.length);
  assertEqual('courses', courses, 30);
  assertEqual('enrolments', enrolments, 500);
  assertEqual('invoices', invoices, 100);
  assertEqual('library items', libraryItems, 80);
  assertEqual('library loans', loans, 180);
  assertEqual('hostels', hostels, 3);
  assertEqual('hostel allocations', hostelAllocations, 72);
  assertEqual('transport routes', routes, 12);
  assertEqual('placements', placements, 20);
  assertEqual('placement applications', applications, 160);
  assertAtLeast('active role accounts', roleAccounts.filter((account) => account.isActive).length, 17);

  const foundEmails = new Set(roleAccounts.map((account) => account.email));
  for (const email of REQUIRED_ROLE_EMAILS) {
    if (!foundEmails.has(email)) failures.push(`missing primary role account: ${email}`);
  }

  if (failures.length > 0) {
    console.error('Synthetic campus verification failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('Synthetic campus verification passed.');
  console.table({
    institution: institution.name,
    students,
    roleAccounts: roleAccounts.length,
    courses,
    enrolments,
    invoices,
    libraryItems,
    loans,
    hostels,
    hostelAllocations,
    routes,
    placements,
    applications,
  });
}

verifySyntheticCampus()
  .catch((error) => {
    console.error('Synthetic campus verification error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
