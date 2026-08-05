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

// Define models that are scoped by tenantId according to schema.prisma
const TENANT_MODELS = [
  'Campus', 'Department', 'Program', 'Batch', 'Section', 'AcademicYear', 'Term',
  'User', 'Role', 'Student', 'Staff', 'Guardian', 'Course', 'CourseOffering',
  'Enrollment', 'Attendance', 'Assignment', 'Submission', 'Exam', 'Result',
  'FeeStructure', 'Invoice', 'Payment', 'Hostel', 'Room', 'Bed', 'HostelAllocation',
  'TransportRoute', 'Vehicle', 'Stop', 'TransportAllocation', 'Book', 'BookCopy',
  'Borrowing', 'Notice', 'Event', 'AuditLog', 'Notification', 'Webhook', 'ApiKey',
  'Gradebook', 'Certificate', 'Placement', 'Application', 'Alumni',
  'CourseAnnouncement',
  // Community Chat System models
  'ChatCommunity', 'ChatCommunityMember', 'ChatMessage', 'ChatAttachment',
  'ChatReaction', 'ChatBookmark', 'ChatPinnedMessage', 'ChatReport',
  'ChatModerationCase', 'ChatModerationAction', 'ChatUserRestriction',
  'ChatAuditEvent', 'ChatNotificationPref', 'ChatLinkPreview', 'ChatPoll',
  'ChatReadReceipt', 'ChatPollOption', 'ChatPollVote',
  // Community Hub models
  'CommunityPost', 'CommunityReply', 'CommunityReaction', 'CommunityVote',
  'CommunityPoll', 'CommunityPollOption', 'CommunityBookmark',
  'CommunityReport', 'CommunityModerationAction', 'CommunityAcknowledgement',
  'CommunityFollow',
  // Demo Scenario models
  'DemoScenarioInstance', 'DemoScenarioEvent'
];

/**
 * Service Layer Authorization
 * Returns a tenant-scoped Prisma client using Client Extensions.
 * This guarantees that every query (find, create, update, delete) automatically
 * includes the tenantId, enforcing isolation at the ORM layer.
 */
export function getTenantDb(tenantId: string) {
  if (!tenantId) throw new Error('Tenant ID is required for tenantDb');

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }) {
          // Only enforce on tenant-scoped models
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
