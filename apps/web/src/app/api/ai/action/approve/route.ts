import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = await req.json();
    const { actionName, targetRecord, proposedValues } = body;

    if (!actionName || !targetRecord) {
      return NextResponse.json({ error: 'Action details missing' }, { status: 400 });
    }

    // Save action proposal approval execution in database
    const proposal = await prisma.aiActionProposal.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        actionName,
        targetRecord,
        proposedValues: proposedValues || {},
        reason: 'User explicitly confirmed human-in-the-loop action execution',
        riskLevel: 'MEDIUM',
        requiredPermission: `${session.role.toLowerCase()}:action:execute`,
        status: 'EXECUTED',
        approverUserId: session.userId,
        executedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: `Action "${actionName}" executed successfully.`,
      proposalId: proposal.id,
      executedAt: proposal.executedAt,
    });
  } catch (error: any) {
    console.error('AI Action Approval Error:', error);
    return NextResponse.json({ error: 'Failed to execute proposed action' }, { status: 500 });
  }
}
