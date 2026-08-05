import crypto from 'crypto';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

import {
  constantTimeTokenEquals,
  generateOpaqueToken,
  generateSupportReference,
  sha256,
  supportPriorityForCategory,
  supportTeamForCategory,
} from './security';
import type {
  SupportAdminListItem,
  SupportAssistantResult,
  SupportCategory,
  SupportPublicView,
  SupportRequestInput,
  SupportRequestRecord,
  SupportStatus,
} from './types';
import { normalizeEmail } from './validation';

type RequestContext = {
  tenantId?: string | null;
  requesterUserId?: string | null;
};

type SupportRequestRow = {
  id: string;
  tenantId: string | null;
  requesterUserId: string | null;
  referenceCode: string;
  publicAccessTokenHash: string;
  requesterType: SupportRequestRecord['requesterType'];
  fullName: string;
  emailNormalized: string;
  emailDisplay: string;
  phone: string | null;
  institutionName: string;
  institutionCode: string | null;
  category: SupportRequestRecord['category'];
  subject: string;
  message: string;
  preferredContactMethod: SupportRequestRecord['preferredContactMethod'];
  preferredLocale: SupportRequestRecord['preferredLocale'];
  source: string;
  status: SupportRequestRecord['status'];
  priority: SupportRequestRecord['priority'];
  assignedTeam: string;
  assignedAgentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function resolvePublicTenantId(institutionCode?: string): Promise<string | null> {
  if (!institutionCode) return null;
  const institution = await prisma.institution.findUnique({
    where: { code: institutionCode.trim() },
    select: { id: true },
  });
  return institution?.id ?? null;
}

export async function createSupportRequest(
  input: SupportRequestInput,
  context: RequestContext,
): Promise<{ request: SupportRequestRecord; accessToken: string }> {
  const id = crypto.randomUUID();
  const referenceCode = generateSupportReference();
  const accessToken = generateOpaqueToken();
  const accessTokenHash = sha256(accessToken);
  const emailNormalized = normalizeEmail(input.email);
  const fingerprintHash = sha256(
    [emailNormalized, input.category, input.subject.toLowerCase(), input.message.toLowerCase()].join('|'),
  );
  const priority = supportPriorityForCategory(input.category);
  const assignedTeam = supportTeamForCategory(input.category);
  const tenantId = context.tenantId ?? (await resolvePublicTenantId(input.institutionCode));
  const now = new Date();

  const duplicate = await prisma.$queryRaw<Array<{ id: string; referenceCode: string }>>(Prisma.sql`
    SELECT "id", "reference_code" AS "referenceCode"
    FROM "support_requests_v2"
    WHERE "fingerprint_hash" = ${fingerprintHash}
      AND "created_at" >= ${new Date(Date.now() - 15 * 60 * 1000)}
    ORDER BY "created_at" DESC
    LIMIT 1
  `);

  if (duplicate[0]) {
    throw new SupportRepositoryError('DUPLICATE_REQUEST', 'A matching request was recently received.', 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "support_requests_v2" (
        "id", "tenant_id", "requester_user_id", "reference_code", "public_access_token_hash",
        "requester_type", "full_name", "email_normalized", "email_display", "phone",
        "institution_name", "institution_code", "category", "subject", "message",
        "preferred_contact_method", "preferred_locale", "source", "status", "priority",
        "assigned_team", "consent_version", "consent_at", "fingerprint_hash", "created_at", "updated_at"
      ) VALUES (
        ${id}::uuid, ${tenantId}::uuid, ${context.requesterUserId ?? null}::uuid, ${referenceCode}, ${accessTokenHash},
        ${input.requesterType}, ${input.fullName}, ${emailNormalized}, ${input.email.trim()}, ${input.phone || null},
        ${input.institutionName}, ${input.institutionCode || null}, ${input.category}, ${input.subject}, ${input.message},
        ${input.preferredContactMethod}, ${input.preferredLocale}, ${input.source}, 'NEW', ${priority},
        ${assignedTeam}, ${input.consentVersion}, ${now}, ${fingerprintHash}, ${now}, ${now}
      )
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "support_messages_v2" (
        "id", "support_request_id", "author_type", "author_user_id", "body", "visibility", "source", "created_at"
      ) VALUES (
        ${crypto.randomUUID()}::uuid, ${id}::uuid, 'CUSTOMER', ${context.requesterUserId ?? null}::uuid,
        ${input.message}, 'CUSTOMER_VISIBLE', ${input.source}, ${now}
      )
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "support_events_v2" (
        "id", "support_request_id", "event_type", "actor_user_id", "actor_type", "new_value", "metadata_json", "created_at"
      ) VALUES (
        ${crypto.randomUUID()}::uuid, ${id}::uuid, 'CREATED', ${context.requesterUserId ?? null}::uuid,
        ${context.requesterUserId ? 'CUSTOMER' : 'PUBLIC'}, 'NEW',
        ${JSON.stringify({ category: input.category, source: input.source })}::jsonb, ${now}
      )
    `);
  });

  return {
    accessToken,
    request: {
      id,
      tenantId,
      requesterUserId: context.requesterUserId ?? null,
      referenceCode,
      requesterType: input.requesterType,
      fullName: input.fullName,
      emailDisplay: input.email.trim(),
      phone: input.phone || null,
      institutionName: input.institutionName,
      institutionCode: input.institutionCode || null,
      category: input.category,
      subject: input.subject,
      message: input.message,
      preferredContactMethod: input.preferredContactMethod,
      preferredLocale: input.preferredLocale,
      source: input.source,
      status: 'NEW',
      priority,
      assignedTeam,
      assignedAgentId: null,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export async function checkSupportRateLimit(input: {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / input.windowMs) * input.windowMs);
  const expiresAt = new Date(windowStart.getTime() + input.windowMs);
  const keyHash = sha256(input.key);

  const rows = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    INSERT INTO "support_rate_limit_buckets_v2" (
      "id", "scope", "key_hash", "window_start", "count", "expires_at"
    ) VALUES (
      ${crypto.randomUUID()}::uuid, ${input.scope}, ${keyHash}, ${windowStart}, 1, ${expiresAt}
    )
    ON CONFLICT ("scope", "key_hash", "window_start")
    DO UPDATE SET "count" = "support_rate_limit_buckets_v2"."count" + 1
    RETURNING "count"
  `);

  const count = rows[0]?.count ?? input.limit + 1;
  return {
    allowed: count <= input.limit,
    remaining: Math.max(0, input.limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
  };
}

export async function createConversation(input: {
  locale: string;
  tenantId?: string | null;
  requesterUserId?: string | null;
}): Promise<{ id: string; token: string; expiresAt: Date }> {
  const id = crypto.randomUUID();
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "support_conversations_v2" (
      "id", "tenant_id", "public_token_hash", "requester_user_id", "locale", "state", "expires_at"
    ) VALUES (
      ${id}::uuid, ${input.tenantId ?? null}::uuid, ${sha256(token)}, ${input.requesterUserId ?? null}::uuid,
      ${input.locale}, 'BOT_ACTIVE', ${expiresAt}
    )
  `);

  return { id, token, expiresAt };
}

export async function authorizeConversation(conversationId: string, token: string): Promise<{
  id: string;
  tenantId: string | null;
  requesterUserId: string | null;
  locale: string;
  state: string;
  supportRequestId: string | null;
}> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    tenantId: string | null;
    requesterUserId: string | null;
    publicTokenHash: string;
    locale: string;
    state: string;
    supportRequestId: string | null;
    expiresAt: Date;
  }>>(Prisma.sql`
    SELECT
      "id", "tenant_id" AS "tenantId", "requester_user_id" AS "requesterUserId",
      "public_token_hash" AS "publicTokenHash", "locale", "state",
      "support_request_id" AS "supportRequestId", "expires_at" AS "expiresAt"
    FROM "support_conversations_v2"
    WHERE "id" = ${conversationId}::uuid
    LIMIT 1
  `);

  const conversation = rows[0];
  if (!conversation || conversation.expiresAt.getTime() < Date.now() || !constantTimeTokenEquals(token, conversation.publicTokenHash)) {
    throw new SupportRepositoryError('CONVERSATION_NOT_AVAILABLE', 'The conversation is invalid or expired.', 404);
  }

  return conversation;
}

export async function appendChatExchange(input: {
  conversationId: string;
  requesterUserId?: string | null;
  userMessage: string;
  assistant: SupportAssistantResult;
}): Promise<{ userMessageId: string; assistantMessageId: string }> {
  const userMessageId = crypto.randomUUID();
  const assistantMessageId = crypto.randomUUID();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "support_chat_messages_v2" (
        "id", "conversation_id", "sender_type", "sender_user_id", "content", "intent", "safety_status", "created_at"
      ) VALUES (
        ${userMessageId}::uuid, ${input.conversationId}::uuid, 'USER', ${input.requesterUserId ?? null}::uuid,
        ${input.userMessage}, ${input.assistant.intent}, ${input.assistant.safetyStatus}, ${now}
      )
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "support_chat_messages_v2" (
        "id", "conversation_id", "sender_type", "content", "intent", "confidence",
        "source_references", "provider_name", "safety_status", "created_at"
      ) VALUES (
        ${assistantMessageId}::uuid, ${input.conversationId}::uuid, 'BOT', ${input.assistant.answer},
        ${input.assistant.intent}, ${input.assistant.confidence},
        ${JSON.stringify(input.assistant.sourceReferences)}::jsonb, 'deterministic-campusos',
        ${input.assistant.safetyStatus}, ${now}
      )
    `);

    await tx.$executeRaw(Prisma.sql`
      UPDATE "support_conversations_v2"
      SET "last_message_at" = ${now}, "updated_at" = ${now},
          "state" = ${input.assistant.handoffRecommended ? 'COLLECTING_DETAILS' : 'BOT_ACTIVE'}
      WHERE "id" = ${input.conversationId}::uuid
    `);
  });

  return { userMessageId, assistantMessageId };
}

export async function listConversationMessages(conversationId: string): Promise<Array<{
  id: string;
  senderType: 'USER' | 'BOT' | 'AGENT' | 'SYSTEM';
  content: string;
  createdAt: string;
}>> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    senderType: 'USER' | 'BOT' | 'AGENT' | 'SYSTEM';
    content: string;
    createdAt: Date;
  }>>(Prisma.sql`
    SELECT "id", "sender_type" AS "senderType", "content", "created_at" AS "createdAt"
    FROM "support_chat_messages_v2"
    WHERE "conversation_id" = ${conversationId}::uuid
    ORDER BY "created_at" ASC
    LIMIT 100
  `);

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function handoffConversation(input: {
  conversationId: string;
  token: string;
  fullName: string;
  email: string;
  institutionName: string;
  category: SupportCategory;
  subject: string;
}): Promise<{ request: SupportRequestRecord; accessToken: string }> {
  const conversation = await authorizeConversation(input.conversationId, input.token);
  if (conversation.supportRequestId) {
    throw new SupportRepositoryError('HANDOFF_ALREADY_CREATED', 'A support request already exists for this conversation.', 409);
  }

  const messages = await listConversationMessages(input.conversationId);
  const transcript = messages
    .slice(-20)
    .map((message) => `${message.senderType}: ${message.content}`)
    .join('\n');

  const result = await createSupportRequest(
    {
      fullName: input.fullName,
      email: input.email,
      institutionName: input.institutionName,
      requesterType: 'OTHER',
      category: input.category,
      subject: input.subject,
      message: `Chat handoff summary\n\n${transcript}`.slice(0, 5000),
      preferredContactMethod: 'EMAIL',
      preferredLocale: conversation.locale as SupportRequestInput['preferredLocale'],
      consent: true,
      consentVersion: 'support-chat-v1',
      source: 'support-chat-handoff',
      website: '',
      startedAt: Date.now() - 5000,
    },
    {
      tenantId: conversation.tenantId,
      requesterUserId: conversation.requesterUserId,
    },
  );

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE "support_conversations_v2"
      SET "support_request_id" = ${result.request.id}::uuid,
          "requester_email" = ${normalizeEmail(input.email)},
          "state" = 'HANDOFF_REQUESTED',
          "handed_off_at" = ${new Date()},
          "updated_at" = ${new Date()}
      WHERE "id" = ${input.conversationId}::uuid
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "support_events_v2" (
        "id", "support_request_id", "event_type", "actor_type", "new_value", "metadata_json"
      ) VALUES (
        ${crypto.randomUUID()}::uuid, ${result.request.id}::uuid, 'CHATBOT_ESCALATED', 'CHATBOT',
        'HANDOFF_REQUESTED', ${JSON.stringify({ conversationId: input.conversationId })}::jsonb
      )
    `);
  });

  return result;
}

export async function getPublicTicket(referenceCode: string, token: string): Promise<SupportPublicView> {
  const requests = await prisma.$queryRaw<SupportRequestRow[]>(Prisma.sql`
    SELECT
      "id", "tenant_id" AS "tenantId", "requester_user_id" AS "requesterUserId",
      "reference_code" AS "referenceCode", "public_access_token_hash" AS "publicAccessTokenHash",
      "requester_type" AS "requesterType", "full_name" AS "fullName",
      "email_normalized" AS "emailNormalized", "email_display" AS "emailDisplay", "phone",
      "institution_name" AS "institutionName", "institution_code" AS "institutionCode", "category",
      "subject", "message", "preferred_contact_method" AS "preferredContactMethod",
      "preferred_locale" AS "preferredLocale", "source", "status", "priority",
      "assigned_team" AS "assignedTeam", "assigned_agent_id" AS "assignedAgentId",
      "created_at" AS "createdAt", "updated_at" AS "updatedAt"
    FROM "support_requests_v2"
    WHERE "reference_code" = ${referenceCode}
    LIMIT 1
  `);

  const request = requests[0];
  if (!request || !constantTimeTokenEquals(token, request.publicAccessTokenHash)) {
    throw new SupportRepositoryError('TICKET_NOT_AVAILABLE', 'The support request is invalid or unavailable.', 404);
  }

  const messages = await prisma.$queryRaw<Array<{
    id: string;
    authorType: SupportPublicView['messages'][number]['authorType'];
    body: string;
    createdAt: Date;
  }>>(Prisma.sql`
    SELECT "id", "author_type" AS "authorType", "body", "created_at" AS "createdAt"
    FROM "support_messages_v2"
    WHERE "support_request_id" = ${request.id}::uuid
      AND "visibility" = 'CUSTOMER_VISIBLE'
      AND "deleted_at" IS NULL
    ORDER BY "created_at" ASC
    LIMIT 100
  `);

  return {
    reference: request.referenceCode,
    category: request.category,
    subject: request.subject,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    messages: messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() })),
  };
}

export async function listAdminSupportRequests(input: {
  tenantId?: string | null;
  status?: SupportStatus | null;
  query?: string | null;
  limit?: number;
}): Promise<SupportAdminListItem[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const query = input.query?.trim() ? `%${input.query.trim()}%` : null;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    referenceCode: string;
    fullName: string;
    emailDisplay: string;
    institutionName: string;
    category: SupportAdminListItem['category'];
    subject: string;
    status: SupportAdminListItem['status'];
    priority: SupportAdminListItem['priority'];
    assignedTeam: string;
    assignedAgentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>>(Prisma.sql`
    SELECT
      "id", "reference_code" AS "referenceCode", "full_name" AS "fullName",
      "email_display" AS "emailDisplay", "institution_name" AS "institutionName",
      "category", "subject", "status", "priority", "assigned_team" AS "assignedTeam",
      "assigned_agent_id" AS "assignedAgentId", "created_at" AS "createdAt", "updated_at" AS "updatedAt"
    FROM "support_requests_v2"
    WHERE (${input.tenantId ?? null}::uuid IS NULL OR "tenant_id" = ${input.tenantId ?? null}::uuid)
      AND (${input.status ?? null}::text IS NULL OR "status" = ${input.status ?? null})
      AND (
        ${query}::text IS NULL OR
        "reference_code" ILIKE ${query} OR
        "full_name" ILIKE ${query} OR
        "email_display" ILIKE ${query} OR
        "institution_name" ILIKE ${query} OR
        "subject" ILIKE ${query}
      )
    ORDER BY
      CASE "priority"
        WHEN 'CRITICAL' THEN 1
        WHEN 'URGENT' THEN 2
        WHEN 'HIGH' THEN 3
        WHEN 'NORMAL' THEN 4
        ELSE 5
      END,
      "updated_at" DESC
    LIMIT ${limit}
  `);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getAdminSupportRequest(input: { id: string; tenantId?: string | null }) {
  const rows = await prisma.$queryRaw<SupportRequestRow[]>(Prisma.sql`
    SELECT
      "id", "tenant_id" AS "tenantId", "requester_user_id" AS "requesterUserId",
      "reference_code" AS "referenceCode", "public_access_token_hash" AS "publicAccessTokenHash",
      "requester_type" AS "requesterType", "full_name" AS "fullName",
      "email_normalized" AS "emailNormalized", "email_display" AS "emailDisplay", "phone",
      "institution_name" AS "institutionName", "institution_code" AS "institutionCode", "category",
      "subject", "message", "preferred_contact_method" AS "preferredContactMethod",
      "preferred_locale" AS "preferredLocale", "source", "status", "priority",
      "assigned_team" AS "assignedTeam", "assigned_agent_id" AS "assignedAgentId",
      "created_at" AS "createdAt", "updated_at" AS "updatedAt"
    FROM "support_requests_v2"
    WHERE "id" = ${input.id}::uuid
      AND (${input.tenantId ?? null}::uuid IS NULL OR "tenant_id" = ${input.tenantId ?? null}::uuid)
    LIMIT 1
  `);

  const request = rows[0];
  if (!request) throw new SupportRepositoryError('TICKET_NOT_FOUND', 'Support request not found.', 404);

  const [messages, events] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: string;
      authorType: string;
      body: string;
      visibility: string;
      createdAt: Date;
    }>>(Prisma.sql`
      SELECT "id", "author_type" AS "authorType", "body", "visibility", "created_at" AS "createdAt"
      FROM "support_messages_v2"
      WHERE "support_request_id" = ${request.id}::uuid AND "deleted_at" IS NULL
      ORDER BY "created_at" ASC
    `),
    prisma.$queryRaw<Array<{
      id: string;
      eventType: string;
      actorType: string;
      previousValue: string | null;
      newValue: string | null;
      safeReasonCode: string | null;
      createdAt: Date;
    }>>(Prisma.sql`
      SELECT "id", "event_type" AS "eventType", "actor_type" AS "actorType",
        "previous_value" AS "previousValue", "new_value" AS "newValue",
        "safe_reason_code" AS "safeReasonCode", "created_at" AS "createdAt"
      FROM "support_events_v2"
      WHERE "support_request_id" = ${request.id}::uuid
      ORDER BY "created_at" ASC
    `),
  ]);

  const { publicAccessTokenHash: _hidden, emailNormalized: _normalized, ...safeRequest } = request;
  return {
    request: safeRequest,
    messages: messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() })),
    events: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
  };
}

export async function updateAdminSupportRequest(input: {
  id: string;
  tenantId?: string | null;
  actorUserId: string;
  status?: string;
  priority?: string;
  assignedAgentId?: string | null;
  assignedTeam?: string;
  publicReply?: string;
  internalNote?: string;
}) {
  const current = await getAdminSupportRequest({ id: input.id, tenantId: input.tenantId });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (
      input.status !== undefined ||
      input.priority !== undefined ||
      input.assignedAgentId !== undefined ||
      input.assignedTeam !== undefined
    ) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "support_requests_v2"
        SET
          "status" = COALESCE(${input.status ?? null}, "status"),
          "priority" = COALESCE(${input.priority ?? null}, "priority"),
          "assigned_agent_id" = CASE
            WHEN ${input.assignedAgentId === undefined} THEN "assigned_agent_id"
            ELSE ${input.assignedAgentId ?? null}::uuid
          END,
          "assigned_team" = COALESCE(${input.assignedTeam ?? null}, "assigned_team"),
          "first_response_at" = CASE
            WHEN "first_response_at" IS NULL AND ${Boolean(input.publicReply)} THEN ${now}
            ELSE "first_response_at"
          END,
          "resolved_at" = CASE WHEN ${input.status ?? null} = 'RESOLVED' THEN ${now} ELSE "resolved_at" END,
          "closed_at" = CASE WHEN ${input.status ?? null} = 'CLOSED' THEN ${now} ELSE "closed_at" END,
          "updated_at" = ${now}
        WHERE "id" = ${input.id}::uuid
      `);
    }

    const messageEntries = [
      input.publicReply
        ? { body: input.publicReply, visibility: 'CUSTOMER_VISIBLE', event: 'AGENT_REPLIED' }
        : null,
      input.internalNote
        ? { body: input.internalNote, visibility: 'INTERNAL_ONLY', event: 'INTERNAL_NOTE_ADDED' }
        : null,
    ].filter(Boolean) as Array<{ body: string; visibility: string; event: string }>;

    for (const entry of messageEntries) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "support_messages_v2" (
          "id", "support_request_id", "author_type", "author_user_id", "body", "visibility", "source", "created_at"
        ) VALUES (
          ${crypto.randomUUID()}::uuid, ${input.id}::uuid, 'SUPPORT_AGENT', ${input.actorUserId}::uuid,
          ${entry.body}, ${entry.visibility}, 'admin-support-console', ${now}
        )
      `);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "support_events_v2" (
          "id", "support_request_id", "event_type", "actor_user_id", "actor_type", "created_at"
        ) VALUES (
          ${crypto.randomUUID()}::uuid, ${input.id}::uuid, ${entry.event}, ${input.actorUserId}::uuid, 'SUPPORT_AGENT', ${now}
        )
      `);
    }

    const changes = [
      input.status !== undefined && current.request.status !== input.status
        ? { event: 'STATUS_CHANGED', previous: current.request.status, next: input.status }
        : null,
      input.priority !== undefined && current.request.priority !== input.priority
        ? { event: 'PRIORITY_CHANGED', previous: current.request.priority, next: input.priority }
        : null,
      input.assignedAgentId !== undefined && current.request.assignedAgentId !== input.assignedAgentId
        ? { event: 'ASSIGNED', previous: current.request.assignedAgentId, next: input.assignedAgentId }
        : null,
      input.assignedTeam !== undefined && current.request.assignedTeam !== input.assignedTeam
        ? { event: 'TEAM_CHANGED', previous: current.request.assignedTeam, next: input.assignedTeam }
        : null,
    ].filter(Boolean) as Array<{ event: string; previous: string | null; next: string | null }>;

    for (const change of changes) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "support_events_v2" (
          "id", "support_request_id", "event_type", "actor_user_id", "actor_type",
          "previous_value", "new_value", "created_at"
        ) VALUES (
          ${crypto.randomUUID()}::uuid, ${input.id}::uuid, ${change.event}, ${input.actorUserId}::uuid,
          'SUPPORT_AGENT', ${change.previous}, ${change.next}, ${now}
        )
      `);
    }
  });

  return getAdminSupportRequest({ id: input.id, tenantId: input.tenantId });
}

export async function createEmailDelivery(input: {
  supportRequestId?: string | null;
  messageId?: string | null;
  recipient: string;
  emailType: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "support_email_deliveries_v2" (
      "id", "support_request_id", "message_id", "recipient_hash", "email_type", "status", "attempts"
    ) VALUES (
      ${id}::uuid, ${input.supportRequestId ?? null}::uuid, ${input.messageId ?? null}::uuid,
      ${sha256(normalizeEmail(input.recipient))}, ${input.emailType}, 'PENDING', 0
    )
  `);
  return id;
}

export async function completeEmailDelivery(input: {
  id: string;
  accepted: boolean;
  providerMessageId?: string;
  failureType?: string;
  safeErrorCode?: string;
}) {
  const status = input.accepted ? 'SENT' : input.failureType === 'permanent' ? 'PERMANENT_FAILED' : 'RETRY_PENDING';
  const nextAttemptAt = !input.accepted && input.failureType !== 'permanent'
    ? new Date(Date.now() + 5 * 60 * 1000)
    : null;

  await prisma.$executeRaw(Prisma.sql`
    UPDATE "support_email_deliveries_v2"
    SET "status" = ${status}, "provider_message_id" = ${input.providerMessageId ?? null},
        "failure_type" = ${input.failureType ?? null}, "safe_error_code" = ${input.safeErrorCode ?? null},
        "attempts" = "attempts" + 1, "next_attempt_at" = ${nextAttemptAt},
        "sent_at" = ${input.accepted ? new Date() : null}, "updated_at" = ${new Date()}
    WHERE "id" = ${input.id}::uuid
  `);
}

export class SupportRepositoryError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'SupportRepositoryError';
  }
}
