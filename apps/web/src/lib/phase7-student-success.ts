import { PaymentStatus, RoleType } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { writePhase7Audit } from './phase7';

const CAMPUS_SUCCESS_ROLES = new Set<RoleType>([
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.REGISTRAR,
  RoleType.DEAN,
]);

export async function scanScopedStudentSuccess(context: ActiveUserContext) {
  const isCampusScope = CAMPUS_SUCCESS_ROLES.has(context.activeRole);
  const isDepartmentScope = context.activeRole === RoleType.HOD;

  if (!isCampusScope && !isDepartmentScope) {
    throw new Error('This role is not authorised to run a student-success scan.');
  }
  if (isDepartmentScope && !context.departmentId) {
    throw new Error('The HOD department assignment could not be resolved.');
  }

  const students = await prisma.student.findMany({
    where: {
      tenantId: context.tenantId,
      ...(isDepartmentScope
        ? {
            batch: {
              program: {
                departmentId: context.departmentId,
              },
            },
          }
        : {}),
    },
    select: {
      rollNumber: true,
      cgpa: true,
      user: { select: { name: true } },
      invoices: {
        where: {
          dueDate: { lt: new Date() },
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        },
        select: { amount: true },
      },
    },
  });

  let created = 0;
  let alreadyOpen = 0;

  for (const student of students) {
    const findings: Array<{ category: string; level: string; notes: string }> = [];

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
        level: overdueAmount >= 50_000 ? 'HIGH' : 'MEDIUM',
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
          assignedAdvisorId: null,
          notes: finding.notes,
        },
      });
      created += 1;
    }
  }

  await writePhase7Audit(context, 'PHASE7_STUDENT_SUCCESS_SCAN', 'StudentSuccessCase', {
    scope: isDepartmentScope ? 'department' : 'institution',
    departmentId: isDepartmentScope ? context.departmentId : null,
    scannedStudents: students.length,
    created,
    alreadyOpen,
  });

  return {
    scope: isDepartmentScope ? 'department' : 'institution',
    scannedStudents: students.length,
    created,
    alreadyOpen,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
