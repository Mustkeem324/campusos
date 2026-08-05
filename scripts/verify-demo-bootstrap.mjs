import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUICK_ACCESS_EMAILS = [
  'admin@nexus-campus.local',
  'faculty@nexus-campus.local',
  'student@nexus-campus.local',
  'parent@nexus-campus.local',
];

async function verifyDemoBootstrap() {
  const institution = await prisma.institution.findUnique({
    where: { code: 'NITX' },
    select: {
      id: true,
      status: true,
      users: {
        where: { email: { in: QUICK_ACCESS_EMAILS } },
        select: { email: true, role: true, isActive: true },
      },
    },
  });

  if (!institution) throw new Error('Synthetic institution NITX was not created.');
  if (institution.status !== 'ACTIVE') throw new Error('Synthetic institution is not active.');
  if (institution.users.length !== QUICK_ACCESS_EMAILS.length) {
    throw new Error(`Expected ${QUICK_ACCESS_EMAILS.length} quick-access users, found ${institution.users.length}.`);
  }
  if (institution.users.some((user) => !user.isActive)) {
    throw new Error('At least one synthetic quick-access user is inactive.');
  }

  const tenantId = institution.id;
  const [
    studentCount,
    staffCount,
    guardianCount,
    courseCount,
    enrollmentCount,
    invoiceCount,
    paymentCount,
    noticeCount,
    legacyDemoCount,
  ] = await Promise.all([
    prisma.student.count({ where: { tenantId } }),
    prisma.staff.count({ where: { tenantId } }),
    prisma.guardian.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } }),
    prisma.enrollment.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.payment.count({ where: { tenantId } }),
    prisma.notice.count({ where: { tenantId } }),
    prisma.institution.count({ where: { code: 'CDU' } }),
  ]);

  const exactChecks = {
    studentCount: [studentCount, 100],
    guardianCount: [guardianCount, 80],
    courseCount: [courseCount, 30],
    enrollmentCount: [enrollmentCount, 500],
    invoiceCount: [invoiceCount, 100],
    legacyDemoCount: [legacyDemoCount, 0],
  };

  for (const [label, [actual, expected]] of Object.entries(exactChecks)) {
    if (actual !== expected) {
      throw new Error(`Synthetic bootstrap verification failed: ${label} expected ${expected}, found ${actual}.`);
    }
  }

  const minimumChecks = { staffCount, paymentCount, noticeCount };
  for (const [label, count] of Object.entries(minimumChecks)) {
    if (count < 1) throw new Error(`Synthetic bootstrap verification failed: ${label} is ${count}.`);
  }

  console.log('Synthetic bootstrap verified:', JSON.stringify({
    tenantId,
    users: institution.users,
    studentCount,
    staffCount,
    guardianCount,
    courseCount,
    enrollmentCount,
    invoiceCount,
    paymentCount,
    noticeCount,
  }, null, 2));
}

verifyDemoBootstrap()
  .catch((error) => {
    console.error('Synthetic bootstrap verification failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
