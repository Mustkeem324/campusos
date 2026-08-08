import { PrismaClient } from '@prisma/client';

import { resolveServiceEnvironment } from './service-env';

resolveServiceEnvironment();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Define every Prisma model that owns a direct tenantId column. This list is
// guarded by tenant-model-coverage.test.ts, which parses schema.prisma so new
// tenant-owned models cannot silently bypass the generic isolation extension.
// Models without tenantId must be scoped through their tenant-owned parent
// relation instead; injecting tenantId into them would produce invalid Prisma
// queries rather than real isolation.
const TENANT_MODELS = [
  // Core institution / identity / academics
  'Campus', 'Department', 'Program', 'Batch', 'Section', 'AcademicYear', 'Term',
  'User', 'Role', 'Student', 'Staff', 'Guardian', 'Course', 'CourseOffering',
  'Enrollment', 'Curriculum', 'TimetableSlot',

  // Smart attendance models with a direct tenantId
  'AttendanceSession', 'AttendanceRecord', 'AttendanceCheckIn',
  'AttendanceOverride', 'SmartDevice', 'BiometricConsent', 'BiometricEnrollment',

  // LMS / learning / examinations / results
  'Assignment', 'Submission', 'Exam', 'Examinations', 'Result', 'Gradebook',
  'GradeScale', 'Quiz', 'LearningSession', 'MarksEntryBatch', 'StudentMarks',
  'StudentCourseResult', 'StudentSemesterResult', 'CourseAnnouncement',
  'Announcement', 'ForumThread',

  // Finance
  'FeeStructure', 'Invoice', 'Payment', 'RefundPolicy', 'RefundRequest',
  'Scholarship', 'MessBill',

  // Campus operations with a direct tenantId
  'Hostel', 'Room', 'TransportRoute', 'LibraryItem',

  // Files, communication and workflows
  'Document', 'File', 'Notice', 'Notification', 'NotificationPreference',
  'EmailQueue', 'Webhook', 'ApiKey', 'Ticket', 'SupportCase', 'GrievanceCase',
  'FeedbackForm',

  // Compliance / security / legal / integrations
  'AuditLog', 'SecurityControl', 'ConsentDefinition', 'ConsentRecord',
  'CookiePreference', 'DataProcessingActivity', 'DataSubjectRequest',
  'LegalAcceptance', 'LegalDocument', 'Subprocessor', 'IntegrationConnection',
  'ImplementationProject',

  // Analytics / planning / student success
  'AnalyticsMetric', 'PlanningScenario', 'StudentSuccessCase',

  // AI platform
  'AiTenantPolicy', 'AiConversation', 'AiMessage', 'AiKnowledgeDocument',
  'AiKnowledgeChunk', 'AiActionProposal', 'AiAuditLog',

  // Careers / placement / alumni with a direct tenantId
  'Certificate', 'Placement', 'Alumni',

  // Community Chat System models with a direct tenantId column
  'ChatCommunity', 'ChatCommunityMember', 'ChatMessage', 'ChatAttachment',
  'ChatReaction', 'ChatBookmark', 'ChatPinnedMessage', 'ChatReport',
  'ChatModerationCase', 'ChatModerationAction', 'ChatUserRestriction',
  'ChatAuditEvent', 'ChatNotificationPref', 'ChatLinkPreview', 'ChatPoll',
  'ChatReadReceipt',

  // Community Hub models
  'CommunityPost', 'CommunityReply', 'CommunityReaction', 'CommunityVote',
  'CommunityPoll', 'CommunityBookmark', 'CommunityReport',
  'CommunityModerationAction', 'CommunityAcknowledgement', 'CommunityFollow',

  // Demo Scenario models
  'DemoScenarioInstance', 'DemoScenarioEvent',
];

const TENANT_READ_OR_MUTATE_OPERATIONS = new Set([
  'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany',
  'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy',
]);

/**
 * Service Layer Authorization
 * Returns a tenant-scoped Prisma client using Client Extensions.
 * This guarantees that every supported query includes the active tenant for
 * models that own a direct tenantId column and prevents mutations from moving a
 * row into another tenant after the scoped where-clause has matched it.
 */
export function getTenantDb(tenantId: string) {
  if (!tenantId) throw new Error('Tenant ID is required for tenantDb');

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }) {
          if (TENANT_MODELS.includes(model)) {
            if (TENANT_READ_OR_MUTATE_OPERATIONS.has(operation)) {
              (args as any).where = { ...(args as any).where, tenantId };
            }

            if (['create', 'createMany', 'createManyAndReturn'].includes(operation)) {
              if (Array.isArray((args as any).data)) {
                (args as any).data = (args as any).data.map((d: any) => ({ ...d, tenantId }));
              } else {
                (args as any).data = { ...(args as any).data, tenantId };
              }
            }

            // A caller must not be able to tenant-hop an existing row by placing
            // a different tenantId in update data after a tenant-scoped match.
            if (['update', 'updateMany'].includes(operation)) {
              (args as any).data = { ...(args as any).data, tenantId };
            }

            if (operation === 'upsert') {
              (args as any).where = { ...(args as any).where, tenantId };
              (args as any).create = { ...(args as any).create, tenantId };
              (args as any).update = { ...(args as any).update, tenantId };
            }
          }

          return query(args);
        },
      },
    },
  });
}
