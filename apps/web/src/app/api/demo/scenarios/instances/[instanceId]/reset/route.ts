import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params: paramsPromise }: { params: Promise<{ instanceId: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session, tenantId } = await requireTenantContext();

    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const instance = await db.demoScenarioInstance.findUnique({
      where: { id: params.instanceId, tenantId },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Scenario instance not found' }, { status: 404 });
    }

    // Reset instance step to 1 and status to NOT_STARTED transactionally
    const updatedInstance = await db.demoScenarioInstance.update({
      where: { id: instance.id },
      data: {
        currentStep: 1,
        status: 'NOT_STARTED',
        resetAt: new Date(),
      },
    });

    // Clear scenario events for clean restart
    await db.demoScenarioEvent.deleteMany({
      where: { instanceId: instance.id },
    });

    // Record Reset Audit Log
    await db.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: 'RESET_DEMO_SCENARIO',
        entity: 'DemoScenarioInstance',
        diffJson: JSON.stringify({ scenarioId: instance.scenarioId, resetAt: new Date().toISOString() }),
      },
    });

    return NextResponse.json({ success: true, instance: updatedInstance });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to reset scenario instance';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
