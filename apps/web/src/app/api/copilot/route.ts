import { AiActionStatus, Prisma, RoleType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { phase7ApprovalDomainsForRole } from '@/lib/phase7-approval-policy';
import { answerPhase7Copilot, canApprovePhase7, writePhase7Audit } from '@/lib/phase7';

const copilotSchema = z.object({
  question: z.string().trim().min(2).max(500),
});

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

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const { question } = copilotSchema.parse(await request.json());
    const lower = question.toLowerCase();

    if (unsafePatterns.some((pattern) => lower.includes(pattern))) {
      await writePhase7Audit(context, 'PHASE7_COPILOT_BLOCKED_PROMPT', 'Copilot', {
        reason: 'prompt-injection-or-sensitive-data-pattern',
      });
      return NextResponse.json({
        success: true,
        blocked: true,
        answer: 'I cannot bypass permissions, expose secrets or manipulate protected records. Ask for an authorised summary or submit an approval proposal.',
        sources: [{ label: 'CampusOS security boundary', href: '/phase-7' }],
      });
    }

    if (/(fee|finance|payment|invoice|refund)/.test(lower) && context.activeRole === RoleType.PARENT) {
      await writePhase7Audit(context, 'PHASE7_COPILOT_QUERY', 'Copilot', {
        category: 'guardian-finance-boundary',
      });
      return NextResponse.json({
        success: true,
        blocked: false,
        answer: 'Guardian finance information must be opened through the verified linked-student workflow. Institution-wide finance totals are not available to the parent role.',
        sources: [{ label: 'Linked student dashboard', href: '/dashboard/parent' }],
      });
    }

    if (/(approval|request|action|pending work)/.test(lower)) {
      const canApprove = canApprovePhase7(context.activeRole);
      const domains = phase7ApprovalDomainsForRole(context.activeRole);
      const where: Prisma.AiActionProposalWhereInput = !canApprove
        ? { tenantId: context.tenantId, userId: context.userId, status: AiActionStatus.PROPOSED }
        : domains === null
          ? { tenantId: context.tenantId, status: AiActionStatus.PROPOSED }
          : {
              tenantId: context.tenantId,
              status: AiActionStatus.PROPOSED,
              OR: domains.map((domain) => ({
                requiredPermission: { startsWith: `${domain}:`, mode: 'insensitive' },
              })),
            };
      const pending = await prisma.aiActionProposal.count({ where });
      await writePhase7Audit(context, 'PHASE7_COPILOT_QUERY', 'Copilot', {
        category: 'approval-centre',
        pending,
      });
      return NextResponse.json({
        success: true,
        blocked: false,
        answer: `There are ${pending} pending approval proposal(s) in your role-authorised operational domain.`,
        sources: [{ label: 'Action and Approval Centre', href: '/phase-7#actions' }],
      });
    }

    if (/(risk|student success|intervention|academic concern)/.test(lower)) {
      if (context.activeRole === RoleType.FACULTY) {
        await writePhase7Audit(context, 'PHASE7_COPILOT_QUERY', 'Copilot', {
          category: 'faculty-success-boundary',
        });
        return NextResponse.json({
          success: true,
          blocked: false,
          answer: 'Institution-wide student-success case totals are not available to the faculty role. Use assigned teaching workflows or request an authorised department review.',
          sources: [{ label: 'Teaching dashboard', href: '/dashboard' }],
        });
      }

      if (context.activeRole === RoleType.HOD) {
        if (!context.departmentId) {
          return NextResponse.json({ error: 'The HOD department assignment could not be resolved.' }, { status: 403 });
        }
        const students = await prisma.student.findMany({
          where: {
            tenantId: context.tenantId,
            batch: { program: { departmentId: context.departmentId } },
          },
          select: { rollNumber: true },
        });
        const rollNumbers = students.map((student) => student.rollNumber);
        const scope = { tenantId: context.tenantId, studentRollNumber: { in: rollNumbers } };
        const [identified, active, resolved] = await Promise.all([
          prisma.studentSuccessCase.count({ where: { ...scope, status: 'IDENTIFIED' } }),
          prisma.studentSuccessCase.count({ where: { ...scope, status: { in: ['INTERVENTION_PLANNED', 'ACTIVE'] } } }),
          prisma.studentSuccessCase.count({ where: { ...scope, status: 'RESOLVED' } }),
        ]);
        await writePhase7Audit(context, 'PHASE7_COPILOT_QUERY', 'Copilot', {
          category: 'department-student-success',
          departmentId: context.departmentId,
        });
        return NextResponse.json({
          success: true,
          blocked: false,
          answer: `Your assigned department has ${identified} newly identified case(s), ${active} under intervention and ${resolved} resolved. These are explainable administrative signals requiring human review.`,
          sources: [{ label: 'Student-success workflow', href: '/phase-7#student-success' }],
        });
      }
    }

    const result = await answerPhase7Copilot(context, question);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a question between 2 and 500 characters.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The copilot could not answer this request.' },
      { status: 401 },
    );
  }
}
