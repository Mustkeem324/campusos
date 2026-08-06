import { NextResponse } from 'next/server';

import { getSystemHealth } from '@/lib/system-health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const health = await getSystemHealth();

  return NextResponse.json(health, {
    status: health.status === 'operational' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
