import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant-context';
import { SCENARIO_CATALOGUE } from '@/lib/demo/scenarios';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db, session, tenantId } = await requireTenantContext();

    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const scenarioId = params.id;
    const scenario = SCENARIO_CATALOGUE.find((s) => s.id === scenarioId);

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario definition not found' }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.demoScenarioInstance.deleteMany({
      where: { tenantId, userId: session.userId, scenarioId },
    });

    const instance = await db.demoScenarioInstance.create({
      data: {
        tenantId,
        userId: session.userId,
        scenarioId,
        version: 1,
        seedVersion: 'v2.0',
        startingPersona: scenario.startingPersona,
        currentPersona: scenario.startingPersona,
        currentStep: 1,
        status: 'ACTIVE',
        expiresAt,
        snapshotJson: { created: new Date().toISOString(), initialStep: 1 },
      },
      include: {
        events: true,
      },
    });

    await db.demoScenarioEvent.create({
      data: {
        instanceId: instance.id,
        tenantId,
        stepIndex: 1,
        actorPersona: scenario.startingPersona,
        actorRole: scenario.startingRole,
        action: 'SCENARIO_STARTED',
        module: 'Scenario Engine',
        result: `Started scenario: ${scenario.title}`,
        nextRole: scenario.steps[0]?.nextRole ?? scenario.startingRole,
      },
    });

    return NextResponse.json({ instance, scenario });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to start demo scenario';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
