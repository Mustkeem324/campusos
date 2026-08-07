import 'server-only';

import { prisma } from './db';
import { requireCompanySuperAdmin } from './company-admin';
import type {
  CompanyContactInboxData,
  CompanyContactInquiry,
  CompanyContactMessage,
  ContactDeliveryStatus,
  ContactInquiryPriority,
  ContactInquiryStatus,
  ContactMessageDirection,
} from './company-admin-contact-types';

type InquiryRow = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  institution: string;
  role: string | null;
  country: string | null;
  inquiry_type: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  consent: boolean;
  source: string;
  first_response_at: Date | null;
  resolved_at: Date | null;
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
};

type MessageRow = {
  id: string;
  inquiry_id: string;
  direction: string;
  author_user_id: string | null;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body_text: string;
  delivery_status: string;
  provider_message_id: string | null;
  created_at: Date;
};

function normalizeStatus(value: string): ContactInquiryStatus {
  if (['NEW', 'OPEN', 'WAITING_CUSTOMER', 'RESOLVED', 'SPAM'].includes(value)) return value as ContactInquiryStatus;
  return 'OPEN';
}

function normalizePriority(value: string): ContactInquiryPriority {
  if (['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(value)) return value as ContactInquiryPriority;
  return 'NORMAL';
}

function normalizeDirection(value: string): ContactMessageDirection {
  return value === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND';
}

function normalizeDelivery(value: string): ContactDeliveryStatus {
  if (['RECEIVED', 'QUEUED', 'SENT', 'FAILED'].includes(value)) return value as ContactDeliveryStatus;
  return 'RECEIVED';
}

function normalizeMessage(row: MessageRow): CompanyContactMessage {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    direction: normalizeDirection(row.direction),
    authorUserId: row.author_user_id,
    senderEmail: row.sender_email,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    bodyText: row.body_text,
    deliveryStatus: normalizeDelivery(row.delivery_status),
    providerMessageId: row.provider_message_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function normalizeInquiry(row: InquiryRow, messages: CompanyContactMessage[]): CompanyContactInquiry {
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    email: row.email,
    phone: row.phone,
    institution: row.institution,
    role: row.role,
    country: row.country,
    inquiryType: row.inquiry_type,
    subject: row.subject,
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    consent: row.consent,
    source: row.source,
    firstResponseAt: row.first_response_at ? new Date(row.first_response_at).toISOString() : null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    lastMessageAt: new Date(row.last_message_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    messages,
  };
}

export async function getCompanyContactInboxData(): Promise<CompanyContactInboxData> {
  const actor = await requireCompanySuperAdmin();
  const generatedAt = new Date().toISOString();

  try {
    const rows = await prisma.$queryRaw<InquiryRow[]>`
      SELECT i.id, i.reference, i.name, i.email, i.phone, i.institution, i.role, i.country,
             i.inquiry_type, i.subject, i.status, i.priority, i.assigned_to, i.consent,
             i.source, i.first_response_at, i.resolved_at, i.last_message_at,
             i.created_at, i.updated_at, u.name AS assigned_to_name
      FROM campusos_control.platform_contact_inquiries i
      LEFT JOIN public.users u ON u.id = i.assigned_to
      ORDER BY i.last_message_at DESC
      LIMIT 250
    `;

    const inquiryIds = new Set(rows.map((row) => row.id));
    const recentMessages = await prisma.$queryRaw<MessageRow[]>`
      SELECT id, inquiry_id, direction, author_user_id, sender_email, recipient_email,
             subject, body_text, delivery_status, provider_message_id, created_at
      FROM campusos_control.platform_contact_messages
      ORDER BY created_at DESC
      LIMIT 2500
    `;

    const messagesByInquiry = new Map<string, CompanyContactMessage[]>();
    for (const row of recentMessages) {
      if (!inquiryIds.has(row.inquiry_id)) continue;
      const list = messagesByInquiry.get(row.inquiry_id) ?? [];
      list.push(normalizeMessage(row));
      messagesByInquiry.set(row.inquiry_id, list);
    }

    const inquiries = rows.map((row) => {
      const messages = (messagesByInquiry.get(row.id) ?? []).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return normalizeInquiry(row, messages);
    });

    return {
      generatedAt,
      ready: true,
      actor: { id: actor.id, name: actor.name, email: actor.email },
      metrics: {
        total: inquiries.length,
        new: inquiries.filter((item) => item.status === 'NEW').length,
        open: inquiries.filter((item) => item.status === 'OPEN').length,
        waitingCustomer: inquiries.filter((item) => item.status === 'WAITING_CUSTOMER').length,
        resolved: inquiries.filter((item) => item.status === 'RESOLVED').length,
        urgent: inquiries.filter((item) => item.priority === 'URGENT' && item.status !== 'RESOLVED').length,
      },
      inquiries,
    };
  } catch (error) {
    console.error('Company contact inbox storage unavailable:', error);
    return {
      generatedAt,
      ready: false,
      actor: { id: actor.id, name: actor.name, email: actor.email },
      metrics: { total: 0, new: 0, open: 0, waitingCustomer: 0, resolved: 0, urgent: 0 },
      inquiries: [],
    };
  }
}

export async function getCompanyContactInquiry(id: string) {
  const rows = await prisma.$queryRaw<InquiryRow[]>`
    SELECT i.id, i.reference, i.name, i.email, i.phone, i.institution, i.role, i.country,
           i.inquiry_type, i.subject, i.status, i.priority, i.assigned_to, i.consent,
           i.source, i.first_response_at, i.resolved_at, i.last_message_at,
           i.created_at, i.updated_at, u.name AS assigned_to_name
    FROM campusos_control.platform_contact_inquiries i
    LEFT JOIN public.users u ON u.id = i.assigned_to
    WHERE i.id = ${id}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}
