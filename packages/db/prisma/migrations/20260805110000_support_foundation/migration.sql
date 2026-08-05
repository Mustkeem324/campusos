-- CampusOS Support-1 foundation
-- These tables extend the existing lightweight support_cases model without replacing it.

CREATE TABLE "support_requests_v2" (
  "id" UUID NOT NULL,
  "tenant_id" UUID,
  "requester_user_id" UUID,
  "reference_code" TEXT NOT NULL,
  "public_access_token_hash" TEXT NOT NULL,
  "requester_type" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email_normalized" TEXT NOT NULL,
  "email_display" TEXT NOT NULL,
  "phone" TEXT,
  "institution_name" TEXT NOT NULL,
  "institution_code" TEXT,
  "category" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "preferred_contact_method" TEXT NOT NULL,
  "preferred_locale" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "assigned_team" TEXT NOT NULL DEFAULT 'GENERAL_SUPPORT',
  "assigned_agent_id" UUID,
  "consent_version" TEXT NOT NULL,
  "consent_at" TIMESTAMP(3) NOT NULL,
  "fingerprint_hash" TEXT NOT NULL,
  "first_response_at" TIMESTAMP(3),
  "resolved_at" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_requests_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_messages_v2" (
  "id" UUID NOT NULL,
  "support_request_id" UUID NOT NULL,
  "author_type" TEXT NOT NULL,
  "author_user_id" UUID,
  "body" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'CUSTOMER_VISIBLE',
  "source" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "support_messages_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_events_v2" (
  "id" UUID NOT NULL,
  "support_request_id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "actor_user_id" UUID,
  "actor_type" TEXT NOT NULL,
  "previous_value" TEXT,
  "new_value" TEXT,
  "safe_reason_code" TEXT,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_events_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_conversations_v2" (
  "id" UUID NOT NULL,
  "tenant_id" UUID,
  "public_token_hash" TEXT NOT NULL,
  "requester_user_id" UUID,
  "requester_email" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en-IN',
  "channel" TEXT NOT NULL DEFAULT 'WEB_CHAT',
  "state" TEXT NOT NULL DEFAULT 'BOT_ACTIVE',
  "assigned_agent_id" UUID,
  "support_request_id" UUID,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "handed_off_at" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_conversations_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_chat_messages_v2" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "sender_type" TEXT NOT NULL,
  "sender_user_id" UUID,
  "content" TEXT NOT NULL,
  "intent" TEXT,
  "confidence" DOUBLE PRECISION,
  "source_references" JSONB,
  "provider_name" TEXT,
  "safety_status" TEXT NOT NULL DEFAULT 'SAFE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_chat_messages_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_email_deliveries_v2" (
  "id" UUID NOT NULL,
  "support_request_id" UUID,
  "message_id" UUID,
  "recipient_hash" TEXT NOT NULL,
  "email_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "provider_message_id" TEXT,
  "failure_type" TEXT,
  "safe_error_code" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_email_deliveries_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_rate_limit_buckets_v2" (
  "id" UUID NOT NULL,
  "scope" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL,
  "window_start" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_rate_limit_buckets_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_knowledge_articles_v2" (
  "id" UUID NOT NULL,
  "tenant_id" UUID,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en-IN',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "source_url" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "published_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_knowledge_articles_v2_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_requests_v2_reference_code_key" ON "support_requests_v2"("reference_code");
CREATE INDEX "support_requests_v2_status_created_idx" ON "support_requests_v2"("status", "created_at");
CREATE INDEX "support_requests_v2_tenant_status_idx" ON "support_requests_v2"("tenant_id", "status");
CREATE INDEX "support_requests_v2_email_idx" ON "support_requests_v2"("email_normalized");
CREATE INDEX "support_requests_v2_fingerprint_idx" ON "support_requests_v2"("fingerprint_hash", "created_at");
CREATE INDEX "support_messages_v2_request_created_idx" ON "support_messages_v2"("support_request_id", "created_at");
CREATE INDEX "support_events_v2_request_created_idx" ON "support_events_v2"("support_request_id", "created_at");
CREATE INDEX "support_conversations_v2_state_updated_idx" ON "support_conversations_v2"("state", "updated_at");
CREATE INDEX "support_chat_messages_v2_conversation_created_idx" ON "support_chat_messages_v2"("conversation_id", "created_at");
CREATE INDEX "support_email_deliveries_v2_status_retry_idx" ON "support_email_deliveries_v2"("status", "next_attempt_at");
CREATE UNIQUE INDEX "support_rate_limit_buckets_v2_unique_window" ON "support_rate_limit_buckets_v2"("scope", "key_hash", "window_start");
CREATE INDEX "support_rate_limit_buckets_v2_expires_idx" ON "support_rate_limit_buckets_v2"("expires_at");
CREATE UNIQUE INDEX "support_knowledge_articles_v2_slug_locale_key" ON "support_knowledge_articles_v2"("slug", "locale");
CREATE INDEX "support_knowledge_articles_v2_publication_idx" ON "support_knowledge_articles_v2"("status", "locale", "published_at");

ALTER TABLE "support_requests_v2" ADD CONSTRAINT "support_requests_v2_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_requests_v2" ADD CONSTRAINT "support_requests_v2_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_requests_v2" ADD CONSTRAINT "support_requests_v2_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_messages_v2" ADD CONSTRAINT "support_messages_v2_request_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_events_v2" ADD CONSTRAINT "support_events_v2_request_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_conversations_v2" ADD CONSTRAINT "support_conversations_v2_request_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests_v2"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_chat_messages_v2" ADD CONSTRAINT "support_chat_messages_v2_conversation_fkey" FOREIGN KEY ("conversation_id") REFERENCES "support_conversations_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_email_deliveries_v2" ADD CONSTRAINT "support_email_deliveries_v2_request_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_email_deliveries_v2" ADD CONSTRAINT "support_email_deliveries_v2_message_fkey" FOREIGN KEY ("message_id") REFERENCES "support_messages_v2"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_knowledge_articles_v2" ADD CONSTRAINT "support_knowledge_articles_v2_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
