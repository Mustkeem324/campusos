import { AiActionStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { canApprovePhase7, writePhase7Audit } from '@/lib/phase7';

const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const context = await requireActiveUserContext();
    if (!canApprovePhase7(context.activeRole)) {
      return NextResponse.json({ error: 'This role cannot decide approval proposals.' }, { status: 403 });
    }

    const payload = decisionSchema.parse(await request.json());
    const proposal = await prisma.aiActionProposal.findFirst({
      where: {
        id: params.id,
        tenantId: context.tenantId,
        status: AiActionStatus.PROPOSED,
      },
      select: {
        id: true,
        userId: true,
        actionName: true,
        targetRecord: true,
        proposedValues: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'The pending proposal was not found.' }, { status: 404 });
    }

    const status = payload.decision === 'APPROVED'
      ? AiActionStatus.APPROVED
      : AiActionStatus.REJECTED;

    await prisma.$transaction([
      prisma.aiActionProposal.update({
        where: { id: proposal.id },
        data: {
          status,
          approverUserId: context.userId,
          currentValues: {
            decisionNote: payload.note ?? null,
            reviewedAt: new Date().toISOString(),
          },
        },
      }),
      prisma.notification.create({
        data: {
          tenantId: context.tenantId,
          userId: proposal.userId,
          title: `Action proposal ${status.toLowerCase()}`,
          body: `${proposal.actionName} for ${proposal.targetRecord} was ${status.toLowerCase()}.`,
          type: 'APPROVAL',
          actionUrl: '/phase-7#actions',
        },
      }),
    ]);

    await writePhase7Audit(
      context,
      `PHASE7_ACTION_${status}`,
      'AiActionProposal',
      {
        proposalId: proposal.id,
        actionName: proposal.actionName,
        targetRecord: proposal.targetRecord,
        note: payload.note ?? null,
      },
      request.headers.get('x-forwarded-for'),
    );

    return NextResponse.json({ success: true, status });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid decision.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to record the decision.' },
      { status: 401 },
    );
  }
}
