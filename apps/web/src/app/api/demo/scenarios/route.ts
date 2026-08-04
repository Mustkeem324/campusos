import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant-context';
import { SCENARIO_CATALOGUE } from '@/lib/demo/scenarios';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db, session, tenantId } = await requireTenantContext();

    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const instances = await db.demoScenarioInstance.findMany({
      where: { tenantId, userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        events: {
          orderBy: { stepIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({
      catalogue: SCENARIO_CATALOGUE,
      instances,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to fetch demo scenarios';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
