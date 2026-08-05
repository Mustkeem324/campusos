import { NextResponse } from 'next/server';

import { getCareerOpenings } from '@/lib/careers-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const openings = getCareerOpenings();

  return NextResponse.json(
    {
      data: openings,
      meta: {
        count: openings.length,
        generatedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}
