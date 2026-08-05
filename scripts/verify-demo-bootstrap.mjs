import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDemoBootstrap() {
  const institution = await prisma.institution.findUnique({
    where: { code: 'CDU' },
    select: {
      id: true,
      status: true,
      users: {
        where: {
          email: {
            in: [
              'admin.demo@campusos.local',
              'faculty.demo@campusos.local',
              'student.demo@campusos.local',
              'parent.demo@campusos.local',
            ],
          },
        },
        select: { email: true, role: true, isActive: true },
      },
    },
  });

  if (!institution) throw new Error('Demo institution CDU was not created.');
  if (institution.status !== 'ACTIVE') throw new Error('Demo institution is not active.');
  if (institution.users.length !== 4) {
    throw new Error(`Expected four demo users, found ${institution.users.length}.`);
  }
  if (institution.users.some((user) => !user.isActive)) {
    throw new Error('At least one demo user is inactive.');
  }

  const tenantId = institution.id;
  const [studentCount, staffCount, guardianCount, courseCount, enrollmentCount, invoiceCount, paymentCount, noticeCount] = await Promise.all([
    prisma.student.count({ where: { tenantId } }),
    prisma.staff.count({ where: { tenantId } }),
    prisma.guardian.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } }),
    prisma.enrollment.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
    prisma.payment.count({ where: { tenantId } }),
    prisma.notice.count({ where: { tenantId } }),
  ]);

  const checks = {
    studentCount,
    staffCount,
    guardianCount,
    courseCount,
    enrollmentCount,
    invoiceCount,
    paymentCount,
    noticeCount,
  };

  for (const [label, count] of Object.entries(checks)) {
    if (count < 1) throw new Error(`Demo bootstrap verification failed: ${label} is ${count}.`);
  }

  console.log('Demo bootstrap verified:', JSON.stringify({ tenantId, users: institution.users, ...checks }, null, 2));
}

verifyDemoBootstrap()
  .catch((error) => {
    console.error('Demo bootstrap verification failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
