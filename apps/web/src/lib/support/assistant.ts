import 'server-only';

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

import { redactSensitiveContent } from './security';
import type { SupportAssistantResult, SupportChatIntent, SupportLocale } from './types';

const STATIC_KNOWLEDGE = [
  {
    id: 'account-access',
    title: 'Account access and password safety',
    content:
      'Use the official CampusOS sign-in or password-reset workflow. Never share passwords, OTPs, recovery codes or session tokens with support staff.',
    href: '/login',
    intents: ['ACCOUNT_ACCESS'] as SupportChatIntent[],
  },
  {
    id: 'institution-onboarding',
    title: 'Institution onboarding',
    content:
      'Institution onboarding begins with discovery, implementation scope, data ownership, migration planning, configuration review and an approved go-live checklist.',
    href: '/contact?category=institution-onboarding',
    intents: ['ONBOARDING'] as SupportChatIntent[],
  },
  {
    id: 'billing-support',
    title: 'Billing support',
    content:
      'Billing questions require a verified institutional contact and may need invoice or transaction references. Do not send full payment-card details or banking PINs.',
    href: '/contact?category=billing',
    intents: ['BILLING'] as SupportChatIntent[],
  },
  {
    id: 'security-reporting',
    title: 'Security reporting',
    content:
      'Potential security issues should be escalated to the restricted security-response queue. Do not include active credentials or exploit private user data.',
    href: '/security/vulnerability-disclosure',
    intents: ['SECURITY'] as SupportChatIntent[],
  },
  {
    id: 'privacy',
    title: 'Privacy and data requests',
    content:
      'Privacy requests should identify the institution and request type without including unnecessary sensitive records. Identity verification may be required before action.',
    href: '/trust/privacy',
    intents: ['PRIVACY'] as SupportChatIntent[],
  },
  {
    id: 'careers',
    title: 'CampusOS careers',
    content:
      'Approved roles are published on the CampusOS careers page. CampusOS should not request recruitment fees, passwords, OTPs or banking credentials during an initial application.',
    href: '/careers',
    intents: ['CAREERS'] as SupportChatIntent[],
  },
];

export async function generateSupportAssistantResponse(input: {
  message: string;
  locale: SupportLocale;
  tenantId?: string | null;
}): Promise<SupportAssistantResult> {
  const safety = redactSensitiveContent(input.message);
  if (safety.blocked) {
    return {
      answer: safety.content,
      intent: 'GENERAL',
      confidence: 1,
      sourceReferences: [],
      recommendedActions: [{ label: 'Contact support', href: '/contact' }],
      handoffRecommended: true,
      safetyStatus: 'BLOCKED',
    };
  }

  if (safety.redacted) {
    return {
      answer:
        'For your security, sensitive information was removed from the message. CampusOS staff will never ask for passwords, OTPs, access tokens or banking PINs. Please describe the issue without those values.',
      intent: detectIntent(safety.content),
      confidence: 1,
      sourceReferences: [{ title: 'Account access and password safety', href: '/login' }],
      recommendedActions: [{ label: 'Open secure sign-in help', href: '/login' }],
      handoffRecommended: false,
      safetyStatus: 'REDACTED',
    };
  }

  const intent = detectIntent(safety.content);
  const deterministic = deterministicResponse(intent, input.locale);
  if (deterministic) return deterministic;

  const retrieved = await retrieveApprovedKnowledge({
    query: safety.content,
    locale: input.locale,
    tenantId: input.tenantId,
  });

  if (retrieved.length > 0) {
    const top = retrieved[0];
    return {
      answer: `${top.summary}\n\nThis answer is based on an approved CampusOS knowledge article. Review the source or request human support when the issue affects an account, billing decision, privacy request or security incident.`,
      intent,
      confidence: 0.78,
      sourceReferences: retrieved.slice(0, 3).map((article) => ({
        title: article.title,
        href: article.href,
      })),
      recommendedActions: [{ label: 'Contact human support', href: '/contact' }],
      handoffRecommended: false,
      safetyStatus: 'SAFE',
    };
  }

  return {
    answer:
      'I could not find a reliable approved answer for that question. I can help create a support request so the CampusOS team can review the issue.',
    intent,
    confidence: 0.25,
    sourceReferences: [],
    recommendedActions: [{ label: 'Create a support request', href: '/contact' }],
    handoffRecommended: true,
    safetyStatus: 'SAFE',
  };
}

export function detectIntent(message: string): SupportChatIntent {
  const value = message.toLowerCase();
  if (/\b(hello|hi|hey|namaste|salaam)\b/.test(value)) return 'GREETING';
  if (/human|agent|person|representative|talk to someone/.test(value)) return 'HUMAN_HANDOFF';
  if (/password|login|sign in|account locked|otp|mfa|verification code/.test(value)) return 'ACCOUNT_ACCESS';
  if (/bill|invoice|payment|refund|fee|charge/.test(value)) return 'BILLING';
  if (/security|vulnerability|breach|hacked|phishing|exploit/.test(value)) return 'SECURITY';
  if (/privacy|delete my data|data request|personal data|consent/.test(value)) return 'PRIVACY';
  if (/career|job|internship|application|recruitment/.test(value)) return 'CAREERS';
  if (/onboard|institution setup|implementation|migration|demo/.test(value)) return 'ONBOARDING';
  if (/bug|error|not working|technical|crash|failed/.test(value)) return 'TECHNICAL';
  if (/ticket|reference|request status|case status/.test(value)) return 'TICKET_STATUS';
  return 'GENERAL';
}

function deterministicResponse(
  intent: SupportChatIntent,
  locale: SupportLocale,
): SupportAssistantResult | null {
  const hindi = locale === 'hi-IN';
  const staticArticle = STATIC_KNOWLEDGE.find((article) => article.intents.includes(intent));
  const sourceReferences = staticArticle ? [{ title: staticArticle.title, href: staticArticle.href }] : [];

  switch (intent) {
    case 'GREETING':
      return {
        answer: hindi
          ? 'नमस्ते! मैं CampusOS Support Assistant हूँ। मैं सामान्य मार्गदर्शन दे सकता हूँ, सही पेज खोजने में मदद कर सकता हूँ या मानव सहायता के लिए अनुरोध बना सकता हूँ।'
          : 'Hello! I’m the CampusOS Support Assistant. I can provide general guidance, help find the right page or create a request for human support.',
        intent,
        confidence: 1,
        sourceReferences: [],
        recommendedActions: [
          { label: 'Account access help', href: '/login' },
          { label: 'Contact support', href: '/contact' },
        ],
        handoffRecommended: false,
        safetyStatus: 'SAFE',
      };
    case 'ACCOUNT_ACCESS':
      return result(
        intent,
        'Use the official CampusOS sign-in or password-reset workflow. Do not share passwords, OTPs, recovery codes or active session tokens in chat. Account ownership disputes require human verification.',
        sourceReferences,
        [{ label: 'Open sign-in', href: '/login' }, { label: 'Contact identity support', href: '/contact?category=account-access' }],
        false,
      );
    case 'BILLING':
      return result(
        intent,
        'Billing questions require review by an authorised institutional finance or support contact. Share only the minimum invoice or transaction reference—never a full card number, PIN or banking password.',
        sourceReferences,
        [{ label: 'Contact billing support', href: '/contact?category=billing' }],
        true,
      );
    case 'SECURITY':
      return result(
        intent,
        'Security concerns are routed to a restricted response queue. Do not include active credentials, private student records or exploit data belonging to another user or institution.',
        sourceReferences,
        [{ label: 'Report a security concern', href: '/contact?category=security' }],
        true,
      );
    case 'PRIVACY':
      return result(
        intent,
        'Privacy requests may require identity and institution verification before action. Submit the request type and minimum necessary context without attaching unrelated sensitive records.',
        sourceReferences,
        [{ label: 'Review privacy information', href: '/trust/privacy' }, { label: 'Submit privacy request', href: '/contact?category=data-privacy' }],
        true,
      );
    case 'CAREERS':
      return result(
        intent,
        'Approved CampusOS opportunities are listed on the careers page. Do not pay recruitment fees or share passwords, OTPs or full banking credentials with anyone claiming to recruit for CampusOS.',
        sourceReferences,
        [{ label: 'Explore careers', href: '/careers' }],
        false,
      );
    case 'ONBOARDING':
      return result(
        intent,
        'Institution onboarding normally includes discovery, approved scope, data ownership, migration planning, configuration review, testing and a controlled go-live checklist.',
        sourceReferences,
        [{ label: 'Discuss institution onboarding', href: '/contact?category=institution-onboarding' }],
        true,
      );
    case 'HUMAN_HANDOFF':
      return result(
        intent,
        'I can create a support request for human review. Please use the handoff form and provide only the minimum contact and issue details needed.',
        [],
        [{ label: 'Create support request', href: '/contact' }],
        true,
      );
    case 'TICKET_STATUS':
      return result(
        intent,
        'A support reference alone is not enough to view private request details. Use the secure status access created when the request was submitted or contact support for verification.',
        [],
        [{ label: 'Open contact support', href: '/contact' }],
        true,
      );
    case 'TECHNICAL':
      return null;
    case 'GENERAL':
      return null;
  }
}

function result(
  intent: SupportChatIntent,
  answer: string,
  sourceReferences: Array<{ title: string; href: string }>,
  recommendedActions: Array<{ label: string; href: string }>,
  handoffRecommended: boolean,
): SupportAssistantResult {
  return {
    answer,
    intent,
    confidence: 0.98,
    sourceReferences,
    recommendedActions,
    handoffRecommended,
    safetyStatus: 'SAFE',
  };
}

async function retrieveApprovedKnowledge(input: {
  query: string;
  locale: SupportLocale;
  tenantId?: string | null;
}): Promise<Array<{ title: string; summary: string; href: string }>> {
  const searchTerms = input.query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9-]/g, ''))
    .filter((term) => term.length >= 4)
    .slice(0, 6);

  if (searchTerms.length === 0) return [];
  const pattern = `%${searchTerms.join('%')}%`;

  const publicRows = await prisma.$queryRaw<Array<{
    title: string;
    summary: string;
    slug: string;
  }>>(Prisma.sql`
    SELECT "title", "summary", "slug"
    FROM "support_knowledge_articles_v2"
    WHERE "status" = 'PUBLISHED'
      AND "locale" IN (${input.locale}, 'en-IN')
      AND ("expires_at" IS NULL OR "expires_at" > NOW())
      AND (${input.tenantId ?? null}::uuid IS NULL OR "tenant_id" IS NULL OR "tenant_id" = ${input.tenantId ?? null}::uuid)
      AND ("title" ILIKE ${pattern} OR "summary" ILIKE ${pattern} OR "content" ILIKE ${pattern})
    ORDER BY "published_at" DESC NULLS LAST
    LIMIT 3
  `);

  if (publicRows.length > 0) {
    return publicRows.map((row) => ({
      title: row.title,
      summary: row.summary,
      href: `/support/faq#${row.slug}`,
    }));
  }

  if (!input.tenantId) return [];

  const tenantDocuments = await prisma.aiKnowledgeDocument.findMany({
    where: {
      tenantId: input.tenantId,
      publicationStatus: 'PUBLISHED',
      classification: { in: ['PUBLIC', 'INTERNAL'] },
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } },
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
      sourceUrl: true,
    },
    take: 20,
  });

  return tenantDocuments
    .map((document) => {
      const haystack = `${document.title} ${document.content}`.toLowerCase();
      const score = searchTerms.filter((term) => haystack.includes(term)).length;
      return { document, score };
    })
    .filter((item) => item.score >= 2)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ document }) => ({
      title: document.title,
      summary: document.content.slice(0, 420),
      href: document.sourceUrl || `/resources/help?article=${document.id}`,
    }));
}
