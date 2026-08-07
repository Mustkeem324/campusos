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
// Nested models without tenantId (for example ChatPollOption/ChatPollVote) must
// be scoped through their tenant-owned parent relation instead.
const TENANT_MODELS = [
  // Core institution / identity / academics
  'Campus', 'Department', 'Program', 'Batch', 'Section', 'AcademicYear', 'Term',
  'User', 'Role', 'Student', 'Staff', 'Guardian', 'Course', 'CourseOffering',
  'Enrollment', 'Curriculum', 'TimetableSlot',

  // Attendance and smart attendance
  'Attendance', 'AttendanceSession', 'AttendanceRecord', 'AttendanceCheckIn',
  'AttendanceOverride', 'SmartDevice', 'BiometricConsent', 'BiometricEnrollment',

  // LMS / learning / examinations / results
  'Assignment', 'Submission', 'Exam', 'Examinations', 'Result', 'Gradebook',
  'GradeScale', 'Quiz', 'LearningSession', 'MarksEntryBatch', 'StudentMarks',
  'StudentCourseResult', 'StudentSemesterResult', 'CourseAnnouncement',
  'Announcement', 'ForumThread',

  // Finance
  'FeeStructure', 'Invoice', 'Payment', 'RefundPolicy', 'RefundRequest',
  'Scholarship', 'MessBill',

  // Campus operations
  'Hostel', 'Room', 'Bed', 'HostelAllocation', 'TransportRoute', 'Vehicle', 'Stop',
  'TransportAllocation', 'Book', 'BookCopy', 'Borrowing', 'LibraryItem',

  // Files, communication and workflows
  'Document', 'File', 'Notice', 'Event', 'Notification', 'NotificationPreference',
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

  // Careers / placement / alumni
  'Certificate', 'Placement', 'Application', 'Alumni',

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

/**
 * Service Layer Authorization
 * Returns a tenant-scoped Prisma client using Client Extensions.
 * This guarantees that every query (find, create, update, delete) automatically
 * includes the tenantId for models that own a direct tenantId column.
 */
export function getTenantDb(tenantId: string) {
  if (!tenantId) throw new Error('Tenant ID is required for tenantDb');

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }) {
          // Only enforce on tenant-scoped models with a direct tenantId column.
          if (TENANT_MODELS.includes(model)) {
            // For reads, updates, deletes -> inject into `where`
            if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
              (args as any).where = { ...(args as any).where, tenantId };
            }

            // For creates -> inject into `data`
            if (['create', 'createMany'].includes(operation)) {
              if (Array.isArray((args as any).data)) {
                (args as any).data = (args as any).data.map((d: any) => ({ ...d, tenantId }));
              } else {
                (args as any).data = { ...(args as any).data, tenantId };
              }
            }

            // For upserts
            if (operation === 'upsert') {
              (args as any).where = { ...(args as any).where, tenantId };
              (args as any).create = { ...(args as any).create, tenantId };
            }
          }

          return query(args);
        },
      },
    },
  });
}
