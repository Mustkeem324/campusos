import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { SCENARIO_CATALOGUE } from '../../../../lib/demo/scenarios';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db, session, tenantId } = await requireTenantContext();

    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const instances = await db.demoScenarioInstance.findMany({
      where: { tenantId, userId: session.userId },
    });

    const completedScenarios = instances.filter((i) => i.status === 'COMPLETED').length;
    const inProgressScenarios = instances.filter((i) => i.status === 'ACTIVE' || i.status === 'ACTION_REQUIRED' || i.status === 'WAITING_FOR_ROLE').length;

    const totalScenarios = SCENARIO_CATALOGUE.length;
    const progressPct = totalScenarios > 0 ? Math.round((completedScenarios / totalScenarios) * 100) : 0;

    return NextResponse.json({
      totalScenarios,
      completedScenarios,
      inProgressScenarios,
      progressPct,
      instances,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to fetch demo progress';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
