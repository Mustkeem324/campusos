import { NextResponse } from 'next/server';

import { getSystemHealth } from '@/lib/system-health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Public liveness/readiness surface. Keep the anonymous payload intentionally
 * small: deployment region, commit/version, process uptime and database latency
 * are operational diagnostics, not public product data.
 */
export async function GET() {
  const health = await getSystemHealth();

  return NextResponse.json(
    {
      status: health.status,
      service: health.service,
      timestamp: health.timestamp,
    },
    {
      status: health.status === 'operational' ? 200 : 503,
      headers: {
        // A very short shared cache limits anonymous health-check amplification
        // while still surfacing outages quickly to status monitors.
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
      },
    },
  );
}
