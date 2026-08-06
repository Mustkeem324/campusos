import crypto from 'crypto';

import {
  AiActionRiskLevel,
  AiActionStatus,
  PaymentStatus,
  RoleType,
} from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';

export const PHASE7_APPROVER_ROLES = new Set<RoleType>([
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.REGISTRAR,
  RoleType.DEAN,
  RoleType.HOD,
  RoleType.FINANCE_OFFICER,
  RoleType.ACCOUNTANT,
  RoleType.HR_ADMIN,
  RoleType.WARDEN,
  RoleType.LIBRARIAN,
  RoleType.TRANSPORT_MANAGER,
  RoleType.PLACEMENT_OFFICER,
  RoleType.ADMISSIONS_COUNSELLOR,
  RoleType.EXAMINATION_CONTROLLER,
]);

export const PHASE7_REPORT_ROLES = new Set<RoleType>([
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.REGISTRAR,
  RoleType.DEAN,
  RoleType.HOD,
  RoleType.FINANCE_OFFICER,
  RoleType.ACCOUNTANT,
  RoleType.HR_ADMIN,
  RoleType.LIBRARIAN,
  RoleType.PLACEMENT_OFFICER,
  RoleType.EXAMINATION_CONTROLLER,
]);

export const PHASE7_FINANCE_ROLES = new Set<RoleType>([
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.FINANCE_OFFICER,
  RoleType.ACCOUNTANT,
]);

export const PHASE7_LIBRARY_ROLES = new Set<RoleType>([
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.LIBRARIAN,
]);

export const PHASE7_SUCCESS_ROLES = new Set<RoleType>([
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.REGISTRAR,
  RoleType.DEAN,
  RoleType.HOD,
  RoleType.FACULTY,
]);

export type Phase7ReportType =
  | 'my-account'
  | 'user-directory'
  | 'student-progress'
  | 'finance-aging'
  | 'library-circulation'
  | 'student-success';

export type Phase7Overview = {
  account: {
    name: string;
    email: string;
    role: RoleType;
    institution: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    activeSessions: number;
  };
  actions: {
    canApprove: boolean;
    proposed: number;
    approved: number;
    rejected: number;
    items: Array<{
      id: string;
      actionName: string;
      targetRecord: string;
      reason: string;
      riskLevel: AiActionRiskLevel;
      status: AiActionStatus;
      requiredPermission: string;
      createdAt: string;
      proposerName: string;
      approverName: string | null;
      proposedValues: unknown;
    }>;
  };
  reports: Phase7ReportType[];
  finance: null | {
    invoiceCount: number;
    invoicedAmount: number;
    overdueCount: number;
    collectedAmount: number;
    failedPayments: number;
    pendingRefunds: number;
  };
  library: null | {
    catalogueItems: number;
    loans: number;
    itemsWithIsbn: number;
    recentLoans: Array<{ id: string; title: string; borrowedAt: string }>;
    capabilityNotice: string;
  };
  notifications: Array<{
    type: string;
    email: boolean;
    push: boolean;
    inApp: boolean;
  }>;
  studentSuccess: null | {
    identified: number;
    active: number;
    resolved: number;
    cases: Array<{
      id: string;
      studentRollNumber: string;
      studentName: string;
      riskCategory: string;
      riskLevel: string;
      status: string;
      notes: string;
      updatedAt: string;
    }>;
  };
};

export async function writePhase7Audit(
  context: Pick<ActiveUserContext, 'tenantId' | 'userId'>,
  action: string,
  entity: string,
  details?: unknown,
  ipAddress?: string | null,
) {
  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.userId,
      action,
      entity,
      diffJson: details === undefined ? null : JSON.stringify(details),
      ipAddress: ipAddress ?? null,
    },
  });
}

export function canApprovePhase7(role: RoleType) {
  return PHASE7_APPROVER_ROLES.has(role);
}

export function availablePhase7Reports(context: ActiveUserContext): Phase7ReportType[] {
  const reports: Phase7ReportType[] = ['my-account'];
  if (!PHASE7_REPORT_ROLES.has(context.activeRole)) return reports;

  reports.push('user-directory', 'student-progress', 'student-success');
  if (PHASE7_FINANCE_ROLES.has(context.activeRole)) reports.push('finance-aging');
  if (PHASE7_LIBRARY_ROLES.has(context.activeRole)) reports.push('library-circulation');
  return reports;
}

export async function loadPhase7Overview(context: ActiveUserContext): Promise<Phase7Overview> {
  const canApprove = canApprovePhase7(context.activeRole);
  const proposalScope = canApprove
    ? { tenantId: context.tenantId }
    : { tenantId: context.tenantId, userId: context.userId };

  const [
    user,
    institution,
    proposals,
    actionCounts,
    preferences,
  ] = await Promise.all([
    prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId, isActive: true },
      select: {
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        sessions: {
          where: { expiresAt: { gt: new Date() } },
          select: { id: true },
        },
      },
    }),
    prisma.institution.findFirst({
      where: { id: context.tenantId },
      select: { name: true },
    }),
    prisma.aiActionProposal.findMany({
      where: proposalScope,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true } },
        approver: { select: { name: true } },
      },
    }),
    Promise.all([
      prisma.aiActionProposal.count({ where: { ...proposalScope, status: AiActionStatus.PROPOSED } }),
      prisma.aiActionProposal.count({ where: { ...proposalScope, status: AiActionStatus.APPROVED } }),
      prisma.aiActionProposal.count({ where: { ...proposalScope, status: AiActionStatus.REJECTED } }),
    ]),
    prisma.notificationPreference.findMany({
      where: { tenantId: context.tenantId, userId: context.userId },
      orderBy: { type: 'asc' },
      select: { type: true, email: true, push: true, inApp: true },
    }),
  ]);

  if (!user || !institution) throw new Error('Phase 7 account context could not be resolved.');

  const [finance, library, studentSuccess] = await Promise.all([
    PHASE7_FINANCE_ROLES.has(context.activeRole) ? loadFinanceOverview(context) : null,
    PHASE7_LIBRARY_ROLES.has(context.activeRole) ? loadLibraryOverview(context) : null,
    PHASE7_SUCCESS_ROLES.has(context.activeRole) ? loadStudentSuccessOverview(context) : null,
  ]);

  return {
    account: {
      name: user.name,
      email: user.email,
      role: user.role,
      institution: institution.name,
      emailVerified: Boolean(user.emailVerified),
      mfaEnabled: user.mfaEnabled,
      activeSessions: user.sessions.length,
    },
    actions: {
      canApprove,
      proposed: actionCounts[0],
      approved: actionCounts[1],
      rejected: actionCounts[2],
      items: proposals.map((proposal) => ({
        id: proposal.id,
        actionName: proposal.actionName,
        targetRecord: proposal.targetRecord,
        reason: proposal.reason,
        riskLevel: proposal.riskLevel,
        status: proposal.status,
        requiredPermission: proposal.requiredPermission,
        createdAt: proposal.createdAt.toISOString(),
        proposerName: proposal.user.name,
        approverName: proposal.approver?.name ?? null,
        proposedValues: proposal.proposedValues,
      })),
    },
    reports: availablePhase7Reports(context),
    finance,
    library,
    notifications: preferences,
    studentSuccess,
  };
}

async function loadFinanceOverview(context: ActiveUserContext) {
  const now = new Date();
  const [invoiceCount, invoiced, overdueCount, collected, failedPayments, pendingRefunds] = await Promise.all([
    prisma.invoice.count({ where: { tenantId: context.tenantId } }),
    prisma.invoice.aggregate({ where: { tenantId: context.tenantId }, _sum: { amount: true } }),
    prisma.invoice.count({
      where: {
        tenantId: context.tenantId,
        dueDate: { lt: now },
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
      },
    }),
    prisma.payment.aggregate({
      where: { tenantId: context.tenantId, status: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { tenantId: context.tenantId, status: PaymentStatus.FAILED } }),
    prisma.refundRequest.count({ where: { tenantId: context.tenantId, status: 'PENDING' } }),
  ]);

  return {
    invoiceCount,
    invoicedAmount: invoiced._sum.amount ?? 0,
    overdueCount,
    collectedAmount: collected._sum.amount ?? 0,
    failedPayments,
    pendingRefunds,
  };
}

async function loadLibraryOverview(context: ActiveUserContext) {
  const [catalogueItems, loans, itemsWithIsbn, recentLoans] = await Promise.all([
    prisma.libraryItem.count({ where: { tenantId: context.tenantId } }),
    prisma.loan.count({ where: { libraryItem: { tenantId: context.tenantId } } }),
    prisma.libraryItem.count({ where: { tenantId: context.tenantId, isbn: { not: null } } }),
    prisma.loan.findMany({
      where: { libraryItem: { tenantId: context.tenantId } },
      orderBy: { borrowedAt: 'desc' },
      take: 8,
      select: { id: true, borrowedAt: true, libraryItem: { select: { title: true } } },
    }),
  ]);

  return {
    catalogueItems,
    loans,
    itemsWithIsbn,
    recentLoans: recentLoans.map((loan) => ({
      id: loan.id,
      title: loan.libraryItem.title,
      borrowedAt: loan.borrowedAt.toISOString(),
    })),
    capabilityNotice:
      'Current reviewed storage supports catalogue items and circulation timestamps. Reservations, returns, due dates and fines are routed through the approval centre until dedicated persisted fields are approved.',
  };
}

async function loadStudentSuccessOverview(context: ActiveUserContext) {
  const [identified, active, resolved, cases] = await Promise.all([
    prisma.studentSuccessCase.count({
      where: { tenantId: context.tenantId, status: 'IDENTIFIED' },
    }),
    prisma.studentSuccessCase.count({
      where: { tenantId: context.tenantId, status: { in: ['INTERVENTION_PLANNED', 'ACTIVE'] } },
    }),
    prisma.studentSuccessCase.count({
      where: { tenantId: context.tenantId, status: 'RESOLVED' },
    }),
    prisma.studentSuccessCase.findMany({
      where: { tenantId: context.tenantId },
      orderBy: [{ riskLevel: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        studentRollNumber: true,
        studentName: true,
        riskCategory: true,
        riskLevel: true,
        status: true,
        notes: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    identified,
    active,
    resolved,
    cases: cases.map((item) => ({ ...item, updatedAt: item.updatedAt.toISOString() })),
  };
}

export async function scanStudentSuccess(context: ActiveUserContext) {
  if (!PHASE7_SUCCESS_ROLES.has(context.activeRole)) {
    throw new Error('This role is not authorised to run student-success scans.');
  }

  const students = await prisma.student.findMany({
    where: { tenantId: context.tenantId },
    select: {
      id: true,
      rollNumber: true,
      cgpa: true,
      user: { select: { name: true } },
      invoices: {
        where: {
          dueDate: { lt: new Date() },
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        },
        select: { amount: true, dueDate: true, status: true },
      },
    },
  });

  let created = 0;
  let alreadyOpen = 0;

  for (const student of students) {
    const findings: Array<{
      category: string;
      level: string;
      notes: string;
    }> = [];

    if (student.cgpa > 0 && student.cgpa < 5) {
      findings.push({
        category: 'ACADEMIC_DISCREPANCY',
        level: student.cgpa < 4 ? 'CRITICAL' : 'HIGH',
        notes: `Persisted CGPA is ${student.cgpa.toFixed(2)}. Human academic review is required before any intervention decision.`,
      });
    }

    if (student.invoices.length > 0) {
      const overdueAmount = student.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      findings.push({
        category: 'FEE_OVERDUE',
        level: overdueAmount >= 50000 ? 'HIGH' : 'MEDIUM',
        notes: `${student.invoices.length} overdue invoice record(s) total ${formatCurrency(overdueAmount)}. This is an administrative blocker signal, not a judgement about the student.`,
      });
    }

    for (const finding of findings) {
      const existing = await prisma.studentSuccessCase.findFirst({
        where: {
          tenantId: context.tenantId,
          studentRollNumber: student.rollNumber,
          riskCategory: finding.category,
          status: { not: 'RESOLVED' },
        },
        select: { id: true },
      });

      if (existing) {
        alreadyOpen += 1;
        continue;
      }

      await prisma.studentSuccessCase.create({
        data: {
          tenantId: context.tenantId,
          studentRollNumber: student.rollNumber,
          studentName: student.user.name,
          riskCategory: finding.category,
          riskLevel: finding.level,
          status: 'IDENTIFIED',
          assignedAdvisorId: context.activeRole === RoleType.FACULTY ? context.userId : null,
          notes: finding.notes,
        },
      });
      created += 1;
    }
  }

  await writePhase7Audit(context, 'PHASE7_STUDENT_SUCCESS_SCAN', 'StudentSuccessCase', {
    scannedStudents: students.length,
    created,
    alreadyOpen,
  });

  return { scannedStudents: students.length, created, alreadyOpen };
}

export async function answerPhase7Copilot(context: ActiveUserContext, rawQuestion: string) {
  const question = rawQuestion.trim().slice(0, 500);
  if (!question) throw new Error('Enter a question for the CampusOS copilot.');

  const lower = question.toLowerCase();
  const unsafePatterns = [
    'ignore previous',
    'system prompt',
    'developer message',
    'drop table',
    'delete all',
    'bypass permission',
    'show password',
    'show token',
    'raw sql',
  ];

  if (unsafePatterns.some((pattern) => lower.includes(pattern))) {
    await writePhase7Audit(context, 'PHASE7_COPILOT_BLOCKED_PROMPT', 'Copilot', {
      reason: 'prompt-injection-or-sensitive-data-pattern',
    });
    return {
      answer:
        'I cannot follow instructions that attempt to bypass permissions, expose secrets or directly manipulate protected records. Ask for an authorised summary or create an approval proposal instead.',
      sources: [{ label: 'CampusOS security boundary', href: '/phase-7' }],
      blocked: true,
    };
  }

  let answer: string;
  let sources: Array<{ label: string; href: string }>;

  if (/(fee|finance|payment|invoice|refund)/.test(lower)) {
    if (!PHASE7_FINANCE_ROLES.has(context.activeRole) && context.activeRole !== RoleType.STUDENT && context.activeRole !== RoleType.PARENT) {
      answer = 'Your active role is not authorised for institution-wide finance summaries.';
      sources = [{ label: 'Role access policy', href: '/phase-7' }];
    } else if (context.studentProfileId) {
      const [count, total] = await Promise.all([
        prisma.invoice.count({ where: { tenantId: context.tenantId, studentId: context.studentProfileId } }),
        prisma.invoice.aggregate({
          where: {
            tenantId: context.tenantId,
            studentId: context.studentProfileId,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
          },
          _sum: { amount: true },
        }),
      ]);
      answer = `Your authorised student account has ${count} invoice record(s) and ${formatCurrency(total._sum.amount ?? 0)} currently pending or partial.`;
      sources = [{ label: 'My fee records', href: '/fees' }];
    } else {
      const finance = await loadFinanceOverview(context);
      answer = `The active institution has ${finance.invoiceCount} invoice record(s), ${finance.overdueCount} overdue, ${formatCurrency(finance.collectedAmount)} collected and ${finance.failedPayments} failed payment record(s).`;
      sources = [
        { label: 'Finance operations', href: '/phase-7#finance' },
        { label: 'Payments', href: '/payments' },
      ];
    }
  } else if (/(library|book|catalogue|loan|circulation)/.test(lower)) {
    if (!PHASE7_LIBRARY_ROLES.has(context.activeRole)) {
      answer = 'Your active role is not authorised for institution-wide library operations.';
      sources = [{ label: 'Role access policy', href: '/phase-7' }];
    } else {
      const library = await loadLibraryOverview(context);
      answer = `The catalogue contains ${library.catalogueItems} item(s), ${library.itemsWithIsbn} with ISBN data, and ${library.loans} recorded circulation event(s).`;
      sources = [
        { label: 'Library operations', href: '/phase-7#library' },
        { label: 'Catalogue', href: '/opac' },
      ];
    }
  } else if (/(risk|student success|intervention|academic concern)/.test(lower)) {
    if (!PHASE7_SUCCESS_ROLES.has(context.activeRole)) {
      answer = 'Your role does not have access to institution-wide student-success cases.';
      sources = [{ label: 'Role access policy', href: '/phase-7' }];
    } else {
      const success = await loadStudentSuccessOverview(context);
      answer = `${success.identified} case(s) are newly identified, ${success.active} are under intervention and ${success.resolved} are resolved. These are explainable administrative signals and require human review.`;
      sources = [{ label: 'Student-success workflow', href: '/phase-7#student-success' }];
    }
  } else if (/(approval|request|action|pending work)/.test(lower)) {
    const where = canApprovePhase7(context.activeRole)
      ? { tenantId: context.tenantId, status: AiActionStatus.PROPOSED }
      : { tenantId: context.tenantId, userId: context.userId, status: AiActionStatus.PROPOSED };
    const pending = await prisma.aiActionProposal.count({ where });
    answer = `There are ${pending} pending approval proposal(s) in your authorised action-centre scope.`;
    sources = [{ label: 'Action and Approval Centre', href: '/phase-7#actions' }];
  } else {
    const [unread, support] = await Promise.all([
      prisma.notification.count({
        where: { tenantId: context.tenantId, userId: context.userId, isRead: false },
      }),
      prisma.supportCase.count({
        where: {
          tenantId: context.tenantId,
          userId: context.userId,
          status: { in: ['NEW', 'IN_PROGRESS'] },
        },
      }),
    ]);
    answer = `Your current workspace has ${unread} unread notification(s) and ${support} open support case(s). I can summarise approvals, finance, library operations or student-success evidence within your role scope.`;
    sources = [
      { label: 'Notifications', href: '/notifications' },
      { label: 'My support cases', href: '/support/cases' },
    ];
  }

  await writePhase7Audit(context, 'PHASE7_COPILOT_QUERY', 'Copilot', {
    question,
    sourceCount: sources.length,
  });

  return { answer, sources, blocked: false };
}

export async function getPhase7Report(context: ActiveUserContext, type: Phase7ReportType) {
  if (!availablePhase7Reports(context).includes(type)) {
    throw new Error('This report is not available for the active role.');
  }

  if (type === 'my-account') {
    const user = await prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId },
      select: { name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });
    return {
      title: 'My account report',
      headers: ['Name', 'Email', 'Role', 'Active', 'Last sign-in', 'Member since'],
      rows: user
        ? [[user.name, user.email, user.role, yesNo(user.isActive), iso(user.lastLoginAt), iso(user.createdAt)]]
        : [],
    };
  }

  if (type === 'user-directory') {
    const users = await prisma.user.findMany({
      where: { tenantId: context.tenantId },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: { name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    return {
      title: 'Institution user directory',
      headers: ['Name', 'Email', 'Role', 'Active', 'Created'],
      rows: users.map((user) => [user.name, user.email, user.role, yesNo(user.isActive), iso(user.createdAt)]),
    };
  }

  if (type === 'student-progress') {
    const students = await prisma.student.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { rollNumber: 'asc' },
      select: {
        rollNumber: true,
        cgpa: true,
        creditsEarned: true,
        user: { select: { name: true, email: true } },
        batch: { select: { name: true } },
      },
    });
    return {
      title: 'Student progress report',
      headers: ['Roll number', 'Student', 'Email', 'Batch', 'CGPA', 'Credits earned'],
      rows: students.map((student) => [
        student.rollNumber,
        student.user.name,
        student.user.email,
        student.batch.name,
        student.cgpa.toFixed(2),
        String(student.creditsEarned),
      ]),
    };
  }

  if (type === 'finance-aging') {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true,
        student: { select: { rollNumber: true, user: { select: { name: true } } } },
      },
    });
    const now = Date.now();
    return {
      title: 'Finance aging report',
      headers: ['Invoice', 'Roll number', 'Student', 'Amount', 'Due date', 'Status', 'Age days'],
      rows: invoices.map((invoice) => [
        invoice.id.slice(0, 8),
        invoice.student.rollNumber,
        invoice.student.user.name,
        invoice.amount.toFixed(2),
        iso(invoice.dueDate),
        invoice.status,
        String(Math.max(0, Math.floor((now - invoice.dueDate.getTime()) / 86_400_000))),
      ]),
    };
  }

  if (type === 'library-circulation') {
    const loans = await prisma.loan.findMany({
      where: { libraryItem: { tenantId: context.tenantId } },
      orderBy: { borrowedAt: 'desc' },
      select: { id: true, borrowedAt: true, libraryItem: { select: { title: true, isbn: true } } },
    });
    return {
      title: 'Library circulation report',
      headers: ['Loan', 'Title', 'ISBN', 'Borrowed at'],
      rows: loans.map((loan) => [loan.id.slice(0, 8), loan.libraryItem.title, loan.libraryItem.isbn ?? '', iso(loan.borrowedAt)]),
    };
  }

  const cases = await prisma.studentSuccessCase.findMany({
    where: { tenantId: context.tenantId },
    orderBy: { updatedAt: 'desc' },
    select: {
      studentRollNumber: true,
      studentName: true,
      riskCategory: true,
      riskLevel: true,
      status: true,
      notes: true,
      updatedAt: true,
    },
  });
  return {
    title: 'Student-success case report',
    headers: ['Roll number', 'Student', 'Category', 'Risk', 'Status', 'Notes', 'Updated'],
    rows: cases.map((item) => [
      item.studentRollNumber,
      item.studentName,
      item.riskCategory,
      item.riskLevel,
      item.status,
      item.notes,
      iso(item.updatedAt),
    ]),
  };
}

export function reportToCsv(report: { headers: string[]; rows: string[][] }) {
  return [report.headers, ...report.rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n');
}

export function reportToPdf(report: { title: string; headers: string[]; rows: string[][] }) {
  const lines = [report.title, '', report.headers.join(' | '), ...report.rows.slice(0, 48).map((row) => row.join(' | '))]
    .map((line) => ascii(line).slice(0, 112));
  const streamLines = ['BT', '/F1 10 Tf', '48 752 Td'];
  lines.forEach((line, index) => {
    if (index > 0) streamLines.push('0 -14 Td');
    streamLines.push(`(${pdfEscape(line)}) Tj`);
  });
  streamLines.push('ET');
  const stream = streamLines.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

export function validatePasswordStrength(password: string) {
  const reasons: string[] = [];
  if (password.length < 12) reasons.push('Use at least 12 characters.');
  if (!/[a-z]/.test(password)) reasons.push('Add a lowercase letter.');
  if (!/[A-Z]/.test(password)) reasons.push('Add an uppercase letter.');
  if (!/\d/.test(password)) reasons.push('Add a number.');
  if (!/[^A-Za-z0-9]/.test(password)) reasons.push('Add a symbol.');
  return { valid: reasons.length === 0, reasons };
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes));
}

export function totpUri(secret: string, email: string, institution: string) {
  const label = encodeURIComponent(`${institution}:${email}`);
  const issuer = encodeURIComponent('CampusOS');
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
  const cleanCode = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanCode)) return false;
  const counter = Math.floor(now / 30_000);
  return [-1, 0, 1].some((offset) => generateTotp(secret, counter + offset) === cleanCode);
}

export function sealMfaSecret(secret: string) {
  const key = mfaEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function unsealMfaSecret(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
    throw new Error('Stored MFA secret is invalid.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', mfaEncryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function hashOneTimeToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function randomOneTimeToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateTotp(secret: string, counter: number) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, '0');
}

function base32Encode(input: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string) {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const character of input.replace(/=+$/g, '').toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function mfaEncryptionKey() {
  const source = process.env.MFA_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!source && process.env.NODE_ENV === 'production') {
    throw new Error('MFA_ENCRYPTION_KEY or JWT_SECRET must be configured in production.');
  }
  return crypto.createHash('sha256').update(source || 'campusos-development-mfa-key').digest();
}

function csvCell(value: string) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function ascii(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '?');
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No';
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : '';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
