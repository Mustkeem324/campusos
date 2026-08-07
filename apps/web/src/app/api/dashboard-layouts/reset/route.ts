import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  DashboardLayoutError,
  resetDashboardLayoutSchema,
} from '@/lib/dashboard-layout-policy';
import { resetDashboardLayouts } from '@/lib/dashboard-layouts';

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
      error: status === 401 ? 'Authentication required.' : 'Dashboard layout reset failed.',
      code: status === 401 ? 'AUTHENTICATION_REQUIRED' : 'DASHBOARD_LAYOUT_RESET_FAILED',
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = resetDashboardLayoutSchema.parse(await request.json());
    const input = {
      expectedRevision: parsed.expectedRevision as number,
      dashboardKey: (parsed.dashboardKey ?? 'main') as string,
    };
    const response = await resetDashboardLayouts(
      context,
      input,
      request.headers.get('x-forwarded-for'),
    );

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
