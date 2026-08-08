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

  // Chat, community and learning-session tables reference users restrictively,
  // so they must be removed before profiles and users.
  await prisma.chatPollVote.deleteMany({ where: { option: { poll: { community: { tenantId } } } } });
  await prisma.chatPollOption.deleteMany({ where: { poll: { community: { tenantId } } } });
  await prisma.chatPoll.deleteMany({ where: { community: { tenantId } } });
  await prisma.chatReadReceipt.deleteMany({ where: { message: { community: { tenantId } } } });
  await prisma.chatReaction.deleteMany({ where: { message: { community: { tenantId } } } });
  await prisma.chatAttachment.deleteMany({ where: { message: { community: { tenantId } } } });
  await prisma.chatBookmark.deleteMany({ where: { message: { community: { tenantId } } } });
  await prisma.chatPinnedMessage.deleteMany({ where: { community: { tenantId } } });
  await prisma.chatModerationAction.deleteMany({ where: { case: { community: { tenantId } } } });
  await prisma.chatModerationCase.deleteMany({ where: { community: { tenantId } } });
  await prisma.chatUserRestriction.deleteMany({ where: { tenantId } });
  await prisma.chatNotificationPref.deleteMany({ where: { community: { tenantId } } });
  await prisma.chatLinkPreview.deleteMany({ where: { community: { tenantId } } });
  await prisma.chatReport.deleteMany({ where: { community: { tenantId } } });
  await prisma.chatMessage.deleteMany({ where: { tenantId } });
  await prisma.chatCommunityMember.deleteMany({ where: { tenantId } });
  await prisma.chatCommunity.deleteMany({ where: { tenantId } });
  await prisma.chatAuditEvent.deleteMany({ where: { tenantId } });

  await prisma.communityPollVote.deleteMany({ where: { option: { poll: { post: { tenantId } } } } });
  await prisma.communityPollOption.deleteMany({ where: { poll: { post: { tenantId } } } });
  await prisma.communityPoll.deleteMany({ where: { post: { tenantId } } });
  await prisma.communityBookmark.deleteMany({ where: { tenantId } });
  await prisma.communityFollow.deleteMany({ where: { tenantId } });
  await prisma.communityAcknowledgement.deleteMany({ where: { tenantId } });
  await prisma.communityModerationAction.deleteMany({ where: { report: { tenantId } } });
  await prisma.communityReport.deleteMany({ where: { tenantId } });
  await prisma.communityVote.deleteMany({ where: { tenantId } });
  await prisma.communityReaction.deleteMany({ where: { tenantId } });
  await prisma.communityReply.deleteMany({ where: { tenantId } });
  await prisma.communityPost.deleteMany({ where: { tenantId } });

  await prisma.learningSessionPollVote.deleteMany({ where: { poll: { session: { tenantId } } } });
  await prisma.learningSessionPoll.deleteMany({ where: { session: { tenantId } } });
  await prisma.learningSessionChatMessage.deleteMany({ where: { session: { tenantId } } });
  await prisma.learningSessionPresence.deleteMany({ where: { session: { tenantId } } });
  await prisma.learningSessionParticipant.deleteMany({ where: { session: { tenantId } } });
  await prisma.learningSession.deleteMany({ where: { tenantId } });

  // Marks and gradebook children reference users/students restrictively.
  await prisma.studentMarks.deleteMany({ where: { tenantId } });
  await prisma.marksEntryBatch.deleteMany({ where: { tenantId } });
  await prisma.studentSemesterResult.deleteMany({ where: { tenantId } });
  await prisma.studentCourseResult.deleteMany({ where: { tenantId } });
  await prisma.gradebookScore.deleteMany({ where: { item: { gradebook: { tenantId } } } });
  await prisma.gradebookItem.deleteMany({ where: { gradebook: { tenantId } } });
  await prisma.gradebook.deleteMany({ where: { tenantId } });
  await prisma.examinations.deleteMany({ where: { tenantId } });

  // Demo scenarios and AI governance records reference users restrictively.
  await prisma.demoScenarioEvent.deleteMany({ where: { tenantId } });
  await prisma.demoScenarioInstance.deleteMany({ where: { tenantId } });
  await prisma.aiAuditLog.deleteMany({ where: { tenantId } });
  await prisma.aiActionProposal.deleteMany({ where: { tenantId } });
  await prisma.aiMessage.deleteMany({ where: { tenantId } });
  await prisma.aiConversation.deleteMany({ where: { tenantId } });
  await prisma.aiKnowledgeChunk.deleteMany({ where: { tenantId } });
  await prisma.aiKnowledgeDocument.deleteMany({ where: { tenantId } });
  await prisma.aiIncident.deleteMany({ where: { tenantId } });
  await prisma.aiBiasAudit.deleteMany({ where: { tenantId } });
  await prisma.aiTenantPolicy.deleteMany({ where: { tenantId } });
  await prisma.supportCase.deleteMany({ where: { tenantId } });
  await prisma.studentSuccessCase.deleteMany({ where: { tenantId } });

  // Course offerings must be removed before staff because facultyId is restrictive.
  await prisma.courseAnnouncement.deleteMany({ where: { tenantId } });
  await prisma.quizAttempt.deleteMany({ where: { quiz: { courseOffering: { tenantId } } } });
  await prisma.quiz.deleteMany({ where: { courseOffering: { tenantId } } });
  await prisma.courseModule.deleteMany({ where: { courseOffering: { tenantId } } });
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

  // Governance, international and data-migration records are tenant-owned.
  await prisma.governanceResolution.deleteMany({ where: { tenantId } });
  await prisma.governanceMeeting.deleteMany({ where: { tenantId } });
  await prisma.governanceCommittee.deleteMany({ where: { tenantId } });
  await prisma.governancePolicy.deleteMany({ where: { tenantId } });
  await prisma.governanceDelegation.deleteMany({ where: { tenantId } });
  await prisma.internationalStudent.deleteMany({ where: { tenantId } });
  await prisma.exchangeProgram.deleteMany({ where: { tenantId } });
  await prisma.creditMapping.deleteMany({ where: { tenantId } });
  await prisma.migrationJob.deleteMany({ where: { tenantId } });
  await prisma.migrationConnector.deleteMany({ where: { tenantId } });
  await prisma.migrationFieldMapping.deleteMany({ where: { tenantId } });
  await prisma.migrationValidation.deleteMany({ where: { tenantId } });
  await prisma.migrationLog.deleteMany({ where: { tenantId } });
  await prisma.analyticsMetric.deleteMany({ where: { tenantId } });
  await prisma.planningScenario.deleteMany({ where: { tenantId } });
  await prisma.integrationConnection.deleteMany({ where: { tenantId } });
  await prisma.smartDevice.deleteMany({ where: { tenantId } });
  await prisma.implementationProject.deleteMany({ where: { tenantId } });

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
