import 'server-only';

import { randomUUID } from 'node:crypto';

import { Prisma, type RoleType } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import {
  HELPDESK_CATEGORIES,
  canEscalateTo,
  escalationTargetsForRole,
  helpdeskRoleLabel,
  initialHelpdeskQueue,
  isDepartmentScopedQueue,
  slaHoursForPriority,
} from './helpdesk-policy';
import type {
  CompanySupportTicket,
  HelpdeskCategory,
  HelpdeskMessage,
  HelpdeskPriority,
  HelpdeskStatus,
  HelpdeskTicket,
  HelpdeskWorkspaceData,
} from './helpdesk-types';

export class HelpdeskError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'HelpdeskError';
    this.status = status;
  }
}

type TicketRow = {
  id: string;
  case_number: string;
  requester_user_id: string;
  requester_name: string;
  requester_role: RoleType;
  related_student_id: string | null;
  related_student_name: string | null;
  department_id: string | null;
  department_name: string | null;
  category: HelpdeskCategory;
  subject: string;
  description: string;
  priority: HelpdeskPriority;
  status: HelpdeskStatus;
  current_queue_role: RoleType;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  sla_due_at: Date;
  first_response_at: Date | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  author_user_id: string;
  author_name: string;
  author_role: RoleType;
  message_type: HelpdeskMessage['type'];
  body: string;
  created_at: Date;
};

type CompanySupportRow = {
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

type CompanyMessageRow = {
  id: string;
  ticket_id: string;
  author_side: 'INSTITUTION' | 'CAMPUSOS';
  author_name: string;
  body: string;
  created_at: Date;
};

function reference(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `${prefix}-${stamp}-${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

async function storageReady() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM campusos_helpdesk.tickets LIMIT 1`;
    return true;
  } catch {
    return false;
  }
}

async function resolveDepartmentId(context: ActiveUserContext, relatedStudentId?: string | null) {
  if (context.activeRole === 'STUDENT') {
    if (!context.studentProfileId) return { relatedStudentId: null, departmentId: null };
    const student = await prisma.student.findFirst({
      where: { id: context.studentProfileId, tenantId: context.tenantId },
      select: { id: true, batch: { select: { program: { select: { departmentId: true } } } } },
    });
    return { relatedStudentId: student?.id ?? null, departmentId: student?.batch.program.departmentId ?? null };
  }

  if (context.activeRole === 'PARENT') {
    if (!relatedStudentId || !context.guardianProfileId) return { relatedStudentId: null, departmentId: null };
    const student = await prisma.student.findFirst({
      where: { id: relatedStudentId, tenantId: context.tenantId, guardianId: context.guardianProfileId },
      select: { id: true, batch: { select: { program: { select: { departmentId: true } } } } },
    });
    if (!student) throw new HelpdeskError('The selected student is not linked to this guardian account.', 403);
    return { relatedStudentId: student.id, departmentId: student.batch.program.departmentId };
  }

  const staff = await prisma.staff.findFirst({
    where: { userId: context.userId, tenantId: context.tenantId },
    select: { departmentId: true },
  });
  return { relatedStudentId: null, departmentId: staff?.departmentId ?? null };
}

async function handlerDepartmentId(context: ActiveUserContext) {
  if (!isDepartmentScopedQueue(context.activeRole)) return null;
  if (context.departmentId) return context.departmentId;
  const staff = await prisma.staff.findFirst({ where: { userId: context.userId, tenantId: context.tenantId }, select: { departmentId: true } });
  return staff?.departmentId ?? null;
}

async function readTicketRows(context: ActiveUserContext): Promise<TicketRow[]> {
  const base = Prisma.sql`
    SELECT
      t.id, t.case_number, t.requester_user_id, requester.name AS requester_name,
      t.requester_role, t.related_student_id, student_user.name AS related_student_name,
      t.department_id, d.name AS department_name, t.category, t.subject, t.description,
      t.priority, t.status, t.current_queue_role, t.assigned_user_id,
      assignee.name AS assigned_user_name, t.sla_due_at, t.first_response_at,
      t.resolved_at, t.created_at, t.updated_at
    FROM campusos_helpdesk.tickets t
    JOIN public.users requester ON requester.id = t.requester_user_id AND requester.tenant_id = t.tenant_id
    LEFT JOIN public.students rs ON rs.id = t.related_student_id AND rs.tenant_id = t.tenant_id
    LEFT JOIN public.users student_user ON student_user.id = rs.user_id AND student_user.tenant_id = t.tenant_id
    LEFT JOIN public.departments d ON d.id = t.department_id AND d.tenant_id = t.tenant_id
    LEFT JOIN public.users assignee ON assignee.id = t.assigned_user_id AND assignee.tenant_id = t.tenant_id
  `;

  if (context.activeRole === 'INSTITUTION_ADMIN') {
    return prisma.$queryRaw<TicketRow[]>(Prisma.sql`${base}
      WHERE t.tenant_id = ${context.tenantId}::uuid
      ORDER BY CASE WHEN t.status IN ('OPEN','IN_PROGRESS','ESCALATED') THEN 0 ELSE 1 END,
               t.sla_due_at ASC, t.created_at DESC LIMIT 300`);
  }

  const departmentId = await handlerDepartmentId(context);
  if (isDepartmentScopedQueue(context.activeRole)) {
    if (!departmentId) {
      return prisma.$queryRaw<TicketRow[]>(Prisma.sql`${base}
        WHERE t.tenant_id = ${context.tenantId}::uuid AND t.requester_user_id = ${context.userId}::uuid
        ORDER BY t.created_at DESC LIMIT 200`);
    }
    return prisma.$queryRaw<TicketRow[]>(Prisma.sql`${base}
      WHERE t.tenant_id = ${context.tenantId}::uuid
        AND (
          t.requester_user_id = ${context.userId}::uuid
          OR (t.current_queue_role = ${context.activeRole}::text AND t.department_id = ${departmentId}::uuid)
        )
      ORDER BY CASE WHEN t.current_queue_role = ${context.activeRole}::text AND t.status NOT IN ('RESOLVED','CLOSED') THEN 0 ELSE 1 END,
               t.sla_due_at ASC, t.created_at DESC LIMIT 250`);
  }

  return prisma.$queryRaw<TicketRow[]>(Prisma.sql`${base}
    WHERE t.tenant_id = ${context.tenantId}::uuid
      AND (t.requester_user_id = ${context.userId}::uuid OR t.current_queue_role = ${context.activeRole}::text)
    ORDER BY CASE WHEN t.current_queue_role = ${context.activeRole}::text AND t.status NOT IN ('RESOLVED','CLOSED') THEN 0 ELSE 1 END,
             t.sla_due_at ASC, t.created_at DESC LIMIT 250`);
}

async function readMessages(tenantId: string, ticketIds: string[]) {
  if (ticketIds.length === 0) return new Map<string, MessageRow[]>();
  const rows = await prisma.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT m.id, m.ticket_id, m.author_user_id, u.name AS author_name,
           m.author_role, m.message_type, m.body, m.created_at
    FROM campusos_helpdesk.messages m
    JOIN public.users u ON u.id = m.author_user_id AND u.tenant_id = m.tenant_id
    WHERE m.tenant_id = ${tenantId}::uuid
      AND m.ticket_id IN (${Prisma.join(ticketIds.map((id) => Prisma.sql`${id}::uuid`))})
    ORDER BY m.created_at ASC
  `);
  const grouped = new Map<string, MessageRow[]>();
  for (const row of rows) grouped.set(row.ticket_id, [...(grouped.get(row.ticket_id) ?? []), row]);
  return grouped;
}

function mapTicket(row: TicketRow, context: ActiveUserContext, messages: MessageRow[]): HelpdeskTicket {
  const requester = row.requester_user_id === context.userId;
  const canHandle = context.activeRole === 'INSTITUTION_ADMIN' || row.current_queue_role === context.activeRole;
  const closed = row.status === 'RESOLVED' || row.status === 'CLOSED';
  const targets = canHandle ? escalationTargetsForRole(row.current_queue_role) : [];
  const visibleMessages = messages
    .filter((message) => message.message_type !== 'INTERNAL_NOTE' || canHandle)
    .map((message) => ({
      id: message.id,
      authorUserId: message.author_user_id,
      authorName: message.author_name,
      authorRole: message.author_role,
      type: message.message_type,
      body: message.body,
      createdAt: new Date(message.created_at).toISOString(),
    }));

  return {
    id: row.id,
    caseNumber: row.case_number,
    requesterUserId: row.requester_user_id,
    requesterName: row.requester_name,
    requesterRole: row.requester_role,
    relatedStudentId: row.related_student_id,
    relatedStudentName: row.related_student_name,
    departmentId: row.department_id,
    departmentName: row.department_name,
    category: row.category,
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    currentQueueRole: row.current_queue_role,
    assignedUserId: row.assigned_user_id,
    assignedUserName: row.assigned_user_name,
    slaDueAt: new Date(row.sla_due_at).toISOString(),
    slaBreached: !closed && new Date(row.sla_due_at).getTime() < Date.now(),
    firstResponseAt: row.first_response_at ? new Date(row.first_response_at).toISOString() : null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    canHandle,
    canEscalate: canHandle && !closed && targets.length > 0,
    canReply: !closed && (requester || canHandle),
    escalationTargets: targets,
    messages: visibleMessages,
  };
}

async function relatedStudents(context: ActiveUserContext) {
  if (context.activeRole === 'STUDENT') {
    if (!context.studentProfileId) return [];
    return prisma.student.findMany({
      where: { id: context.studentProfileId, tenantId: context.tenantId },
      select: { id: true, rollNumber: true, user: { select: { name: true } }, batch: { select: { program: { select: { department: { select: { name: true } } } } } } },
    }).then((rows) => rows.map((row) => ({ id: row.id, name: row.user.name, rollNumber: row.rollNumber, departmentName: row.batch.program.department.name })));
  }
  if (context.activeRole === 'PARENT' && context.guardianProfileId) {
    return prisma.student.findMany({
      where: { tenantId: context.tenantId, guardianId: context.guardianProfileId },
      orderBy: { rollNumber: 'asc' },
      select: { id: true, rollNumber: true, user: { select: { name: true } }, batch: { select: { program: { select: { department: { select: { name: true } } } } } } },
    }).then((rows) => rows.map((row) => ({ id: row.id, name: row.user.name, rollNumber: row.rollNumber, departmentName: row.batch.program.department.name })));
  }
  return [];
}

async function readInstitutionPlatformTickets(context: ActiveUserContext): Promise<CompanySupportTicket[]> {
  if (context.activeRole !== 'INSTITUTION_ADMIN') return [];
  try {
    const rows = await prisma.$queryRaw<CompanySupportRow[]>`
      SELECT s.id, s.reference, s.institution_id, i.name AS institution_name, s.requester_user_id,
             s.requester_name, s.requester_email, s.category, s.subject, s.description, s.priority, s.status,
             s.assigned_super_admin_user_id, admin.name AS assigned_super_admin_name,
             s.first_response_at, s.resolved_at, s.created_at, s.updated_at
      FROM campusos_control.institution_support_tickets s
      JOIN public.institutions i ON i.id = s.institution_id
      LEFT JOIN public.users admin ON admin.id = s.assigned_super_admin_user_id
      WHERE s.institution_id = ${context.tenantId}::uuid
      ORDER BY s.created_at DESC LIMIT 100
    `;
    const ids = rows.map((row) => row.id);
    const messages = ids.length === 0 ? [] : await prisma.$queryRaw<CompanyMessageRow[]>(Prisma.sql`
      SELECT m.id, m.ticket_id, m.author_side, u.name AS author_name, m.body, m.created_at
      FROM campusos_control.institution_support_messages m
      JOIN public.users u ON u.id = m.author_user_id
      WHERE m.ticket_id IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY m.created_at ASC
    `);
    const byTicket = new Map<string, CompanyMessageRow[]>();
    for (const message of messages) byTicket.set(message.ticket_id, [...(byTicket.get(message.ticket_id) ?? []), message]);
    return rows.map((row) => ({
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
      messages: (byTicket.get(row.id) ?? []).map((message) => ({
        id: message.id,
        authorSide: message.author_side,
        authorName: message.author_name,
        body: message.body,
        createdAt: new Date(message.created_at).toISOString(),
      })),
    }));
  } catch {
    return [];
  }
}

export async function getHelpdeskWorkspaceData(): Promise<HelpdeskWorkspaceData> {
  const context = await requireActiveUserContext();
  if (context.activeRole === 'SUPER_ADMIN') throw new HelpdeskError('Use the company support workspace for Super Admin support operations.', 403);
  const [ready, institution, user, students] = await Promise.all([
    storageReady(),
    prisma.institution.findUnique({ where: { id: context.tenantId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: context.userId }, select: { name: true } }),
    relatedStudents(context),
  ]);
  if (!ready) {
    return {
      generatedAt: new Date().toISOString(), storeReady: false, institutionName: institution?.name ?? 'CampusOS Institution',
      userName: user?.name ?? 'CampusOS user', role: context.activeRole, roleLabel: helpdeskRoleLabel(context.activeRole), tickets: [],
      relatedStudents: students, categories: HELPDESK_CATEGORIES, metrics: { visibleTickets: 0, openTickets: 0, waitingTickets: 0, resolvedTickets: 0, slaBreached: 0, myQueue: 0 },
      canCreatePlatformSupport: context.activeRole === 'INSTITUTION_ADMIN', platformTickets: [],
    };
  }
  const rows = await readTicketRows(context);
  const messageMap = await readMessages(context.tenantId, rows.map((row) => row.id));
  const tickets = rows.map((row) => mapTicket(row, context, messageMap.get(row.id) ?? []));
  const platformTickets = await readInstitutionPlatformTickets(context);
  return {
    generatedAt: new Date().toISOString(), storeReady: true, institutionName: institution?.name ?? 'CampusOS Institution',
    userName: user?.name ?? 'CampusOS user', role: context.activeRole, roleLabel: helpdeskRoleLabel(context.activeRole), tickets,
    relatedStudents: students, categories: HELPDESK_CATEGORIES,
    metrics: {
      visibleTickets: tickets.length,
      openTickets: tickets.filter((ticket) => !['RESOLVED','CLOSED'].includes(ticket.status)).length,
      waitingTickets: tickets.filter((ticket) => ticket.status === 'WAITING_REQUESTER').length,
      resolvedTickets: tickets.filter((ticket) => ['RESOLVED','CLOSED'].includes(ticket.status)).length,
      slaBreached: tickets.filter((ticket) => ticket.slaBreached).length,
      myQueue: tickets.filter((ticket) => ticket.canHandle && !['RESOLVED','CLOSED'].includes(ticket.status)).length,
    },
    canCreatePlatformSupport: context.activeRole === 'INSTITUTION_ADMIN', platformTickets,
  };
}

async function notifyQueue(context: ActiveUserContext, role: RoleType, departmentId: string | null, title: string, body: string) {
  const users = await prisma.user.findMany({
    where: {
      tenantId: context.tenantId,
      role,
      isActive: true,
      ...(departmentId && isDepartmentScopedQueue(role) ? { staffProfile: { is: { departmentId } } } : {}),
    },
    select: { id: true },
    take: 50,
  });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((user) => ({ tenantId: context.tenantId, userId: user.id, type: 'HELPDESK', title, body, actionUrl: '/helpdesk' })),
  });
}

async function ticketAccess(context: ActiveUserContext, ticketId: string) {
  const rows = await readTicketRows(context);
  const row = rows.find((item) => item.id === ticketId);
  if (!row) throw new HelpdeskError('Helpdesk case not found or not visible in this workspace.', 404);
  const requester = row.requester_user_id === context.userId;
  const handler = context.activeRole === 'INSTITUTION_ADMIN' || row.current_queue_role === context.activeRole;
  return { row, requester, handler };
}

export async function createHelpdeskTicket(input: {
  category: HelpdeskCategory;
  subject: string;
  description: string;
  priority: HelpdeskPriority;
  relatedStudentId?: string | null;
}) {
  const context = await requireActiveUserContext();
  if (context.activeRole === 'SUPER_ADMIN') throw new HelpdeskError('Super Admin does not create institution helpdesk cases.', 403);
  if (!HELPDESK_CATEGORIES.some((item) => item.value === input.category)) throw new HelpdeskError('Unsupported helpdesk category.');
  const subject = input.subject.trim();
  const description = input.description.trim();
  if (subject.length < 3 || subject.length > 180) throw new HelpdeskError('Subject must contain 3 to 180 characters.');
  if (description.length < 5 || description.length > 8000) throw new HelpdeskError('Description must contain 5 to 8,000 characters.');

  const scope = await resolveDepartmentId(context, input.relatedStudentId);
  const queue = initialHelpdeskQueue(context.activeRole, input.category);
  const id = randomUUID();
  const caseNumber = reference('HD');
  const slaDueAt = new Date(Date.now() + slaHoursForPriority(input.priority) * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_helpdesk.tickets
        (id, tenant_id, case_number, requester_user_id, requester_role, related_student_id, department_id,
         category, subject, description, priority, status, current_queue_role, sla_due_at, created_at, updated_at)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${caseNumber}, ${context.userId}::uuid, ${context.activeRole}::text,
         ${scope.relatedStudentId}::uuid, ${scope.departmentId}::uuid, ${input.category}, ${subject}, ${description},
         ${input.priority}, 'OPEN', ${queue}::text, ${slaDueAt}, now(), now())
    `;
    await tx.supportCase.create({
      data: {
        id,
        tenantId: context.tenantId,
        userId: context.userId,
        caseNumber,
        title: subject,
        category: input.category,
        priority: input.priority === 'NORMAL' ? 'MEDIUM' : input.priority,
        status: 'NEW',
      },
    });
  });

  await notifyQueue(context, queue, scope.departmentId, `New helpdesk case ${caseNumber}`, subject);
  return { id, caseNumber, queueRole: queue, slaDueAt: slaDueAt.toISOString() };
}

export async function replyToHelpdeskTicket(ticketId: string, bodyInput: string, internalNote = false) {
  const context = await requireActiveUserContext();
  const body = bodyInput.trim();
  if (body.length < 1 || body.length > 8000) throw new HelpdeskError('Reply must contain 1 to 8,000 characters.');
  const { row, requester, handler } = await ticketAccess(context, ticketId);
  if (!requester && !handler) throw new HelpdeskError('You cannot reply to this case.', 403);
  if (row.status === 'CLOSED' || row.status === 'RESOLVED') throw new HelpdeskError('Resolved cases cannot receive new replies.', 409);
  if (internalNote && !handler) throw new HelpdeskError('Internal notes are restricted to helpdesk handlers.', 403);
  const type = internalNote ? 'INTERNAL_NOTE' : 'REPLY';
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_helpdesk.messages
        (id, tenant_id, ticket_id, author_user_id, author_role, message_type, body, created_at)
      VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${ticketId}::uuid, ${context.userId}::uuid,
              ${context.activeRole}::text, ${type}, ${body}, now())
    `;
    if (!internalNote) {
      const nextStatus = handler ? 'WAITING_REQUESTER' : 'IN_PROGRESS';
      await tx.$executeRaw`
        UPDATE campusos_helpdesk.tickets
        SET status = ${nextStatus},
            first_response_at = CASE WHEN ${handler} THEN COALESCE(first_response_at, now()) ELSE first_response_at END,
            updated_at = now()
        WHERE id = ${ticketId}::uuid AND tenant_id = ${context.tenantId}::uuid
      `;
      await tx.supportCase.updateMany({ where: { id: ticketId, tenantId: context.tenantId }, data: { status: handler ? 'ACKNOWLEDGED' : 'INVESTIGATING' } });
    }
  });

  if (!internalNote && handler && row.requester_user_id !== context.userId) {
    await prisma.notification.create({ data: { tenantId: context.tenantId, userId: row.requester_user_id, type: 'HELPDESK', title: `Reply on ${row.case_number}`, body: row.subject, actionUrl: '/helpdesk' } });
  } else if (!internalNote && requester) {
    await notifyQueue(context, row.current_queue_role, row.department_id, `New reply on ${row.case_number}`, row.subject);
  }
}

export async function assignHelpdeskTicketToSelf(ticketId: string) {
  const context = await requireActiveUserContext();
  const { row, handler } = await ticketAccess(context, ticketId);
  if (!handler) throw new HelpdeskError('Only the current helpdesk queue can assign this case.', 403);
  await prisma.$executeRaw`
    UPDATE campusos_helpdesk.tickets
    SET assigned_user_id = ${context.userId}::uuid, status = CASE WHEN status = 'OPEN' THEN 'IN_PROGRESS' ELSE status END, updated_at = now()
    WHERE id = ${ticketId}::uuid AND tenant_id = ${context.tenantId}::uuid
  `;
  await prisma.supportCase.updateMany({ where: { id: ticketId, tenantId: context.tenantId }, data: { status: 'INVESTIGATING' } });
  return { assignedUserId: context.userId, caseNumber: row.case_number };
}

export async function escalateHelpdeskTicket(ticketId: string, toRole: RoleType, reasonInput: string) {
  const context = await requireActiveUserContext();
  const reason = reasonInput.trim();
  if (reason.length < 5 || reason.length > 2000) throw new HelpdeskError('Escalation reason must contain 5 to 2,000 characters.');
  const { row, handler } = await ticketAccess(context, ticketId);
  if (!handler) throw new HelpdeskError('Only the current handling queue can escalate this case.', 403);
  if (!canEscalateTo(row.current_queue_role, toRole)) throw new HelpdeskError(`A ${helpdeskRoleLabel(row.current_queue_role)} case cannot be escalated directly to ${helpdeskRoleLabel(toRole)}.`, 403);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_helpdesk.escalations
        (id, tenant_id, ticket_id, from_role, to_role, escalated_by_user_id, reason, created_at)
      VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${ticketId}::uuid, ${row.current_queue_role}::text,
              ${toRole}::text, ${context.userId}::uuid, ${reason}, now())
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_helpdesk.messages
        (id, tenant_id, ticket_id, author_user_id, author_role, message_type, body, created_at)
      VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${ticketId}::uuid, ${context.userId}::uuid,
              ${context.activeRole}::text, 'ESCALATION', ${reason}, now())
    `;
    await tx.$executeRaw`
      UPDATE campusos_helpdesk.tickets
      SET current_queue_role = ${toRole}::text, assigned_user_id = NULL, status = 'ESCALATED', updated_at = now()
      WHERE id = ${ticketId}::uuid AND tenant_id = ${context.tenantId}::uuid
    `;
    await tx.supportCase.updateMany({ where: { id: ticketId, tenantId: context.tenantId }, data: { status: 'INVESTIGATING' } });
  });
  await notifyQueue(context, toRole, row.department_id, `Escalated helpdesk case ${row.case_number}`, row.subject);
}

export async function resolveHelpdeskTicket(ticketId: string) {
  const context = await requireActiveUserContext();
  const { row, handler } = await ticketAccess(context, ticketId);
  if (!handler) throw new HelpdeskError('Only the current handling queue can resolve this case.', 403);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE campusos_helpdesk.tickets
      SET status = 'RESOLVED', resolved_at = now(), updated_at = now()
      WHERE id = ${ticketId}::uuid AND tenant_id = ${context.tenantId}::uuid
    `;
    await tx.supportCase.updateMany({ where: { id: ticketId, tenantId: context.tenantId }, data: { status: 'RESOLVED' } });
  });
  if (row.requester_user_id !== context.userId) {
    await prisma.notification.create({ data: { tenantId: context.tenantId, userId: row.requester_user_id, type: 'HELPDESK', title: `${row.case_number} resolved`, body: row.subject, actionUrl: '/helpdesk' } });
  }
}

export async function createCompanySupportTicket(input: { category: string; subject: string; description: string; priority: HelpdeskPriority }) {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'INSTITUTION_ADMIN') throw new HelpdeskError('Only an Institution Administrator can contact CampusOS company support.', 403);
  const user = await prisma.user.findUnique({ where: { id: context.userId }, select: { name: true, email: true } });
  if (!user) throw new HelpdeskError('Institution administrator account is unavailable.', 403);
  const subject = input.subject.trim();
  const description = input.description.trim();
  if (subject.length < 3 || subject.length > 180) throw new HelpdeskError('Subject must contain 3 to 180 characters.');
  if (description.length < 5 || description.length > 8000) throw new HelpdeskError('Description must contain 5 to 8,000 characters.');
  const id = randomUUID();
  const supportReference = reference('COS-SUP');
  await prisma.$executeRaw`
    INSERT INTO campusos_control.institution_support_tickets
      (id, reference, institution_id, requester_user_id, requester_name, requester_email,
       category, subject, description, priority, status, created_at, updated_at)
    VALUES (${id}::uuid, ${supportReference}, ${context.tenantId}::uuid, ${context.userId}::uuid, ${user.name}, ${user.email},
            ${input.category.trim().slice(0, 80)}, ${subject}, ${description}, ${input.priority}, 'NEW', now(), now())
  `;
  return { id, reference: supportReference };
}

export async function replyCompanySupportAsInstitution(ticketId: string, bodyInput: string) {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'INSTITUTION_ADMIN') throw new HelpdeskError('Institution Administrator access is required.', 403);
  const body = bodyInput.trim();
  if (body.length < 1 || body.length > 8000) throw new HelpdeskError('Reply must contain 1 to 8,000 characters.');
  const tickets = await prisma.$queryRaw<Array<{ id: string; status: string }>>`
    SELECT id, status FROM campusos_control.institution_support_tickets
    WHERE id = ${ticketId}::uuid AND institution_id = ${context.tenantId}::uuid LIMIT 1
  `;
  const ticket = tickets[0];
  if (!ticket) throw new HelpdeskError('CampusOS support case not found.', 404);
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') throw new HelpdeskError('Resolved company support cases cannot receive new replies.', 409);
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO campusos_control.institution_support_messages
        (id, ticket_id, author_user_id, author_side, body, created_at)
      VALUES (${randomUUID()}::uuid, ${ticketId}::uuid, ${context.userId}::uuid, 'INSTITUTION', ${body}, now())
    `,
    prisma.$executeRaw`
      UPDATE campusos_control.institution_support_tickets
      SET status = 'OPEN', updated_at = now() WHERE id = ${ticketId}::uuid AND institution_id = ${context.tenantId}::uuid
    `,
  ]);
}
