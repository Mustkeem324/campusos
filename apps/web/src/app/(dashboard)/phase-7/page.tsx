import { RoleType } from '@prisma/client';
import { redirect } from 'next/navigation';

import { Phase7CommandCentre } from '@/components/phase7/Phase7CommandCentre';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { canReviewPhase7Proposal } from '@/lib/phase7-approval-policy';
import { phase7ReportsForRole } from '@/lib/phase7-report-policy';
import { loadPhase7Overview, type Phase7Overview } from '@/lib/phase7';

export const dynamic = 'force-dynamic';

export default async function Phase7Page() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const overview = await loadPhase7Overview(context);
  const visibleActions = overview.actions.canApprove
    ? overview.actions.items.filter((item) =>
        canReviewPhase7Proposal(context.activeRole, item.requiredPermission),
      )
    : overview.actions.items;
  const studentSuccess = await scopeStudentSuccess(overview, context.activeRole, context.tenantId, context.departmentId);
  const safeOverview: Phase7Overview = {
    ...overview,
    reports: phase7ReportsForRole(context.activeRole),
    studentSuccess,
    actions: {
      ...overview.actions,
      items: visibleActions,
      proposed: visibleActions.filter((item) => item.status === 'PROPOSED').length,
      approved: visibleActions.filter((item) => item.status === 'APPROVED').length,
      rejected: visibleActions.filter((item) => item.status === 'REJECTED').length,
    },
  };

  return <Phase7CommandCentre overview={safeOverview} />;
}

async function scopeStudentSuccess(
  overview: Phase7Overview,
  role: RoleType,
  tenantId: string,
  departmentId?: string | null,
): Promise<Phase7Overview['studentSuccess']> {
  if (role === RoleType.FACULTY) return null;
  if (role !== RoleType.HOD || !overview.studentSuccess) return overview.studentSuccess;
  if (!departmentId) return null;

  const students = await prisma.student.findMany({
    where: {
      tenantId,
      batch: {
        program: {
          departmentId,
        },
      },
    },
    select: { rollNumber: true },
  });
  const allowedRollNumbers = new Set(students.map((student) => student.rollNumber));
  const cases = overview.studentSuccess.cases.filter((item) =>
    allowedRollNumbers.has(item.studentRollNumber),
  );

  return {
    identified: cases.filter((item) => item.status === 'IDENTIFIED').length,
    active: cases.filter((item) => ['INTERVENTION_PLANNED', 'ACTIVE'].includes(item.status)).length,
    resolved: cases.filter((item) => item.status === 'RESOLVED').length,
    cases,
  };
}
