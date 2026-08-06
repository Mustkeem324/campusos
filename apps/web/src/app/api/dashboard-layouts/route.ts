import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  DashboardLayoutError,
  createDashboardLayoutSchema,
  dashboardKeySchema,
} from '@/lib/dashboard-layout-policy';
import {
  createDashboardLayout,
  loadDashboardLayouts,
} from '@/lib/dashboard-layouts';

export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Invalid dashboard layout request.', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  if (error instanceof DashboardLayoutError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : '';
  const status = message.startsWith('Unauthorized') ? 401 : 500;
  return NextResponse.json(
    {
      error: status === 401 ? 'Authentication required.' : 'Dashboard layouts are unavailable.',
      code: status === 401 ? 'AUTHENTICATION_REQUIRED' : 'DASHBOARD_LAYOUTS_UNAVAILABLE',
    },
    { status },
  );
}

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const dashboardKey = dashboardKeySchema.parse(
      new URL(request.url).searchParams.get('dashboardKey') ?? 'main',
    );
    const response = await loadDashboardLayouts(context, dashboardKey);

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const input = createDashboardLayoutSchema.parse(await request.json());
    const response = await createDashboardLayout(
      context,
      input,
      request.headers.get('x-forwarded-for'),
    );

    return NextResponse.json(response, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
