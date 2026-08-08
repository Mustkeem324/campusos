import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant-context';
import { SCENARIO_CATALOGUE } from '@/lib/demo/scenarios';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params: paramsPromise }: { params: Promise<{ instanceId: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, tenantId } = await requireTenantContext();

    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const instance = await db.demoScenarioInstance.findUnique({
      where: { id: params.instanceId, tenantId },
      include: {
        events: {
          orderBy: { stepIndex: 'asc' },
        },
      },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Scenario instance not found' }, { status: 404 });
    }

    const scenario = SCENARIO_CATALOGUE.find((s) => s.id === instance.scenarioId);

    return NextResponse.json({ instance, scenario });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to fetch scenario instance';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
