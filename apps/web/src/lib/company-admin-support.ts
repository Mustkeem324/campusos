import 'server-only';

import { randomUUID } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { requireCompanySuperAdmin } from './company-admin';
import { prisma } from './db';
import type { CompanySupportInboxData, CompanySupportTicket, HelpdeskPriority } from './helpdesk-types';

export class CompanySupportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'CompanySupportError';
    this.status = status;
  }
}

type TicketRow = {
  id: string;
  reference: string;
  institution_id: string;
  institution_name: string;
  requester_user_id: string;
  requester_name: string;
  requester_email: string;
  category: string;
  subject: string;
  description: string;
  priority: HelpdeskPriority;
  status: CompanySupportTicket['status'];
  assigned_super_admin_user_id: string | null;
  assigned_super_admin_name: string | null;
  first_response_at: Date | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  author_side: 'INSTITUTION' | 'CAMPUSOS';
  author_name: string;
  body: string;
  created_at: Date;
};

async function rows(): Promise<TicketRow[]> {
  try {
    return await prisma.$queryRaw<TicketRow[]>`
      SELECT s.id, s.reference, s.institution_id, i.name AS institution_name, s.requester_user_id,
             s.requester_name, s.requester_email, s.category, s.subject, s.description, s.priority, s.status,
             s.assigned_super_admin_user_id, admin.name AS assigned_super_admin_name,
             s.first_response_at, s.resolved_at, s.created_at, s.updated_at
      FROM campusos_control.institution_support_tickets s
      JOIN public.institutions i ON i.id = s.institution_id
      LEFT JOIN public.users admin ON admin.id = s.assigned_super_admin_user_id
      ORDER BY CASE WHEN s.status IN ('NEW','OPEN') THEN 0 WHEN s.status = 'WAITING_INSTITUTION' THEN 1 ELSE 2 END,
               CASE s.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3 END,
               s.created_at DESC
      LIMIT 300
    `;
  } catch {
    return [];
  }
}

export async function getCompanySupportInboxData(): Promise<CompanySupportInboxData> {
  await requireCompanySuperAdmin();
  const ticketRows = await rows();
  const ids = ticketRows.map((row) => row.id);
  const messages = ids.length === 0 ? [] : await prisma.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT m.id, m.ticket_id, m.author_side, u.name AS author_name, m.body, m.created_at
    FROM campusos_control.institution_support_messages m
    JOIN public.users u ON u.id = m.author_user_id
    WHERE m.ticket_id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
    ORDER BY m.created_at ASC
  `);
  const grouped = new Map<string, MessageRow[]>();
  for (const message of messages) grouped.set(message.ticket_id, [...(grouped.get(message.ticket_id) ?? []), message]);
  const tickets: CompanySupportTicket[] = ticketRows.map((row) => ({
    id: row.id,
    reference: row.reference,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    requesterUserId: row.requester_user_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    category: row.category,
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    assignedSuperAdminUserId: row.assigned_super_admin_user_id,
    assignedSuperAdminName: row.assigned_super_admin_name,
    firstResponseAt: row.first_response_at ? new Date(row.first_response_at).toISOString() : null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    messages: (grouped.get(row.id) ?? []).map((message) => ({
      id: message.id,
      authorSide: message.author_side,
      authorName: message.author_name,
      body: message.body,
      createdAt: new Date(message.created_at).toISOString(),
    })),
  }));
  return {
    generatedAt: new Date().toISOString(),
    tickets,
    metrics: {
      total: tickets.length,
      newCount: tickets.filter((ticket) => ticket.status === 'NEW').length,
      openCount: tickets.filter((ticket) => ticket.status === 'OPEN').length,
      waitingCount: tickets.filter((ticket) => ticket.status === 'WAITING_INSTITUTION').length,
      resolvedCount: tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length,
      urgentCount: tickets.filter((ticket) => ticket.priority === 'URGENT' && !['RESOLVED','CLOSED'].includes(ticket.status)).length,
    },
  };
}

async function requireTicket(ticketId: string) {
  const ticketRows = await prisma.$queryRaw<Array<{ id: string; institution_id: string; status: string; subject: string; reference: string }>>`
    SELECT id, institution_id, status, subject, reference
    FROM campusos_control.institution_support_tickets
    WHERE id = ${ticketId}::uuid LIMIT 1
  `;
  const ticket = ticketRows[0];
  if (!ticket) throw new CompanySupportError('Institution support case not found.', 404);
  return ticket;
}

export async function replyCompanySupportTicket(ticketId: string, bodyInput: string) {
  const actor = await requireCompanySuperAdmin();
  const body = bodyInput.trim();
  if (body.length < 1 || body.length > 8000) throw new CompanySupportError('Reply must contain 1 to 8,000 characters.');
  const ticket = await requireTicket(ticketId);
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') throw new CompanySupportError('Resolved support cases cannot receive new replies.', 409);
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO campusos_control.institution_support_messages
        (id, ticket_id, author_user_id, author_side, body, created_at)
      VALUES (${randomUUID()}::uuid, ${ticketId}::uuid, ${actor.id}::uuid, 'CAMPUSOS', ${body}, now())
    `,
    prisma.$executeRaw`
      UPDATE campusos_control.institution_support_tickets
      SET status = 'WAITING_INSTITUTION',
          assigned_super_admin_user_id = COALESCE(assigned_super_admin_user_id, ${actor.id}::uuid),
          first_response_at = COALESCE(first_response_at, now()), updated_at = now()
      WHERE id = ${ticketId}::uuid
    `,
  ]);
  const admins = await prisma.user.findMany({ where: { tenantId: ticket.institution_id, role: 'INSTITUTION_ADMIN', isActive: true }, select: { id: true }, take: 20 });
  if (admins.length) {
    await prisma.notification.createMany({ data: admins.map((admin) => ({ tenantId: ticket.institution_id, userId: admin.id, type: 'COMPANY_SUPPORT', title: `CampusOS replied to ${ticket.reference}`, body: ticket.subject, actionUrl: '/helpdesk' })) });
  }
}

export async function updateCompanySupportTicket(ticketId: string, input: { status?: CompanySupportTicket['status']; priority?: HelpdeskPriority; assignToMe?: boolean }) {
  const actor = await requireCompanySuperAdmin();
  await requireTicket(ticketId);
  const status = input.status ?? null;
  const priority = input.priority ?? null;
  const assign = input.assignToMe === true;
  await prisma.$executeRaw`
    UPDATE campusos_control.institution_support_tickets
    SET status = COALESCE(${status}, status),
        priority = COALESCE(${priority}, priority),
        assigned_super_admin_user_id = CASE WHEN ${assign} THEN ${actor.id}::uuid ELSE assigned_super_admin_user_id END,
        resolved_at = CASE WHEN ${status} IN ('RESOLVED','CLOSED') THEN COALESCE(resolved_at, now()) WHEN ${status} IS NOT NULL THEN NULL ELSE resolved_at END,
        updated_at = now()
    WHERE id = ${ticketId}::uuid
  `;
}
