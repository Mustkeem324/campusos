import { NextResponse } from 'next/server';

import { getCareerOpeningBySlug } from '@/lib/careers-service';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const opening = getCareerOpeningBySlug(params.slug);

  if (!opening) {
    return NextResponse.json(
      {
        error: {
          code: 'CAREER_OPENING_NOT_FOUND',
          message: 'The requested role is not available.',
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { data: opening },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}
