import { AiActionRiskLevel, AiActionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { canApprovePhase7, writePhase7Audit } from '@/lib/phase7';

const createProposalSchema = z.object({
  actionName: z.string().trim().min(3).max(80),
  targetRecord: z.string().trim().min(2).max(160),
  reason: z.string().trim().min(10).max(1000),
  riskLevel: z.nativeEnum(AiActionRiskLevel).default(AiActionRiskLevel.MEDIUM),
  requiredPermission: z.string().trim().min(3).max(120),
  proposedValues: z.record(z.unknown()).default({}),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const where = canApprovePhase7(context.activeRole)
      ? { tenantId: context.tenantId }
      : { tenantId: context.tenantId, userId: context.userId };

    const proposals = await prisma.aiActionProposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true } },
        approver: { select: { name: true } },
      },
    });

    return NextResponse.json({
      canApprove: canApprovePhase7(context.activeRole),
      proposals: proposals.map((proposal) => ({
        id: proposal.id,
        actionName: proposal.actionName,
        targetRecord: proposal.targetRecord,
        reason: proposal.reason,
        riskLevel: proposal.riskLevel,
        requiredPermission: proposal.requiredPermission,
        status: proposal.status,
        createdAt: proposal.createdAt,
        proposedValues: proposal.proposedValues,
        proposerName: proposal.user.name,
        approverName: proposal.approver?.name ?? null,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load the action centre.' },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const payload = createProposalSchema.parse(await request.json());

    const proposal = await prisma.aiActionProposal.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        actionName: payload.actionName,
        targetRecord: payload.targetRecord,
        currentValues: null,
        proposedValues: payload.proposedValues,
        reason: payload.reason,
        riskLevel: payload.riskLevel,
        requiredPermission: payload.requiredPermission,
        status: AiActionStatus.PROPOSED,
      },
      select: { id: true, actionName: true, status: true, createdAt: true },
    });

    await writePhase7Audit(
      context,
      'PHASE7_ACTION_PROPOSED',
      'AiActionProposal',
      {
        proposalId: proposal.id,
        actionName: proposal.actionName,
        riskLevel: payload.riskLevel,
        requiredPermission: payload.requiredPermission,
      },
      request.headers.get('x-forwarded-for'),
    );

    return NextResponse.json({ success: true, proposal }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid proposal.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create the proposal.' },
      { status: 401 },
    );
  }
}
