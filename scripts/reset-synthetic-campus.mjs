import process from 'node:process';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPROVED_CODES = new Set(['CDU', 'NITX']);

function assertResetAllowed() {
  const allowed = process.argv.includes('--allow-synthetic-seed')
    || process.env.CAMPUSOS_ALLOW_SYNTHETIC_SEED === 'true';

  if (!allowed) {
    throw new Error(
      'Synthetic reset is disabled. Use --allow-synthetic-seed or CAMPUSOS_ALLOW_SYNTHETIC_SEED=true.',
    );
  }
}

async function resetTenant(code) {
  const institution = await prisma.institution.findUnique({
    where: { code },
    select: { id: true, code: true, name: true },
  });

  if (!institution) return;
  if (!APPROVED_CODES.has(institution.code)) {
    throw new Error(`Reset rejected for unapproved institution code ${institution.code}.`);
  }

  const tenantId = institution.id;
  console.log(`Resetting approved synthetic tenant ${institution.name} (${institution.code})...`);

  // Delete records without tenantId through a tenant-owned parent first.
  await prisma.refund.deleteMany({ where: { payment: { tenantId } } });
  await prisma.loan.deleteMany({ where: { libraryItem: { tenantId } } });
  await prisma.application.deleteMany({ where: { placement: { tenantId } } });
  await prisma.allocation.deleteMany({ where: { roomHostel: { hostel: { tenantId } } } });
  await prisma.examSchedule.deleteMany({ where: { exam: { tenantId } } });
  await prisma.grade.deleteMany({ where: { submission: { tenantId } } });
  await prisma.rubric.deleteMany({ where: { assignment: { tenantId } } });

  // Delete tenant-owned workflow children before their academic parents.
  await prisma.notification.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.notice.deleteMany({ where: { tenantId } });
  await prisma.ticket.deleteMany({ where: { tenantId } });
  await prisma.announcement.deleteMany({ where: { tenantId } });
  await prisma.application.deleteMany({ where: { placement: { tenantId } } });
  await prisma.placement.deleteMany({ where: { tenantId } });
  await prisma.alumni.deleteMany({ where: { tenantId } });
  await prisma.libraryItem.deleteMany({ where: { tenantId } });
  await prisma.roomHostel.deleteMany({ where: { hostel: { tenantId } } });
  await prisma.hostel.deleteMany({ where: { tenantId } });
  await prisma.messBill.deleteMany({ where: { tenantId } });
  await prisma.transportRoute.deleteMany({ where: { tenantId } });
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.scholarship.deleteMany({ where: { tenantId } });
  await prisma.feeStructure.deleteMany({ where: { tenantId } });
  await prisma.result.deleteMany({ where: { tenantId } });
  await prisma.exam.deleteMany({ where: { tenantId } });
  await prisma.submission.deleteMany({ where: { tenantId } });
  await prisma.assignment.deleteMany({ where: { tenantId } });
  await prisma.attendanceRecord.deleteMany({ where: { tenantId } });
  await prisma.attendanceSession.deleteMany({ where: { tenantId } });
  await prisma.enrollment.deleteMany({ where: { tenantId } });

  // Course offerings must be removed before staff because facultyId is restrictive.
  await prisma.courseAnnouncement.deleteMany({ where: { tenantId } });
  await prisma.courseOffering.deleteMany({ where: { tenantId } });
  await prisma.course.deleteMany({ where: { tenantId } });

  // Profiles must be removed before their users and institution.
  await prisma.student.deleteMany({ where: { tenantId } });
  await prisma.guardian.deleteMany({ where: { tenantId } });
  await prisma.staff.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });

  // Academic structure is removed from leaf to root.
  await prisma.term.deleteMany({ where: { tenantId } });
  await prisma.academicYear.deleteMany({ where: { tenantId } });
  await prisma.room.deleteMany({ where: { tenantId } });
  await prisma.section.deleteMany({ where: { tenantId } });
  await prisma.batch.deleteMany({ where: { tenantId } });
  await prisma.program.deleteMany({ where: { tenantId } });
  await prisma.department.deleteMany({ where: { tenantId } });
  await prisma.campus.deleteMany({ where: { tenantId } });

  await prisma.institution.delete({ where: { id: tenantId } });
  console.log(`Synthetic tenant ${institution.code} removed safely.`);
}

async function main() {
  assertResetAllowed();
  await resetTenant('CDU');
  await resetTenant('NITX');
}

main()
  .catch((error) => {
    console.error('Synthetic tenant reset failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
