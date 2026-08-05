import { PrismaClient } from '@prisma/client';

export async function resetDemoTenantData(prisma: PrismaClient, demoTenantId: string): Promise<void> {
  // 1. Double-check tenant exists and is CDU demo tenant
  const tenant = await prisma.institution.findUnique({
    where: { id: demoTenantId },
  });

  if (!tenant || tenant.code !== 'CDU') {
    throw new Error(`Reset rejected: Target tenant ${demoTenantId} is not a valid demo tenant (code=CDU).`);
  }

  console.log(`[Reset] Cleaning up synthetic demo records for tenant ${tenant.name} (${tenant.code})...`);

  // Delete child records in strict dependency order (leaf records first)
  await prisma.aiAuditLog.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.aiActionProposal.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.aiMessage.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.aiConversation.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.aiKnowledgeChunk.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.aiKnowledgeDocument.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.aiTenantPolicy.deleteMany({ where: { tenantId: demoTenantId } });

  await prisma.supportCase.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.implementationProject.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.smartDevice.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.integrationConnection.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.studentSuccessCase.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.planningScenario.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.analyticsMetric.deleteMany({ where: { tenantId: demoTenantId } });

  await prisma.enrollment.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.attendanceRecord.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.attendanceSession.deleteMany({ where: { tenantId: demoTenantId } });

  // Phase 98 gradebook rows have no tenantId column — reach them via parents.
  await prisma.gradebookScore.deleteMany({ where: { item: { gradebook: { tenantId: demoTenantId } } } });
  await prisma.gradebookItem.deleteMany({ where: { gradebook: { tenantId: demoTenantId } } });
  await prisma.gradebook.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.rubric.deleteMany({ where: { assignment: { tenantId: demoTenantId } } });
  await prisma.grade.deleteMany({ where: { submission: { tenantId: demoTenantId } } });
  await prisma.submission.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.assignment.deleteMany({ where: { tenantId: demoTenantId } });

  // Phase 95 student-life records (children first, then parents)
  await prisma.studentCourseResult.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.studentSemesterResult.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.studentMarks.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.marksEntryBatch.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.examinations.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.examSchedule.deleteMany({ where: { exam: { tenantId: demoTenantId } } });
  await prisma.exam.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.allocation.deleteMany({ where: { student: { tenantId: demoTenantId } } });
  await prisma.roomHostel.deleteMany({ where: { hostel: { tenantId: demoTenantId } } });
  await prisma.hostel.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.notice.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.notification.deleteMany({ where: { tenantId: demoTenantId } });

  await prisma.result.deleteMany({ where: { student: { tenantId: demoTenantId } } });

  await prisma.payment.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.scholarship.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.feeStructure.deleteMany({ where: { tenantId: demoTenantId } });

  // Course offerings reference staff, course, section, and term
  // Phase 97/99 LMS content is cascade-deleted with its course offerings
  // (CourseLesson → CourseModule → CourseOffering onDelete: Cascade;
  // CourseAnnouncement → CourseOffering onDelete: Cascade).
  await prisma.courseAnnouncement.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.courseOffering.deleteMany({ where: { tenantId: demoTenantId } });

  await prisma.student.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.guardian.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.staff.deleteMany({ where: { tenantId: demoTenantId } });

  await prisma.user.deleteMany({ where: { tenantId: demoTenantId } });

  await prisma.term.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.academicYear.deleteMany({ where: { tenantId: demoTenantId } });

  await prisma.course.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.section.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.batch.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.program.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.department.deleteMany({ where: { tenantId: demoTenantId } });
  await prisma.campus.deleteMany({ where: { tenantId: demoTenantId } });

  console.log(`[Reset] Cleaned up demo tenant data safely.`);
}
