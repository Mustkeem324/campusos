import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  DashboardLayoutError,
  revisionMutationSchema,
  updateDashboardLayoutSchema,
} from '@/lib/dashboard-layout-policy';
import {
  deleteDashboardLayout,
  updateDashboardLayout,
} from '@/lib/dashboard-layouts';

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
      error: status === 401 ? 'Authentication required.' : 'Dashboard layout update failed.',
      code: status === 401 ? 'AUTHENTICATION_REQUIRED' : 'DASHBOARD_LAYOUT_UPDATE_FAILED',
    },
    { status },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { layoutId: string } },
) {
  try {
    const context = await requireActiveUserContext();
    const input = updateDashboardLayoutSchema.parse(await request.json());
    const response = await updateDashboardLayout(
      context,
      params.layoutId,
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

export async function DELETE(
  request: Request,
  { params }: { params: { layoutId: string } },
) {
  try {
    const context = await requireActiveUserContext();
    const { expectedRevision } = revisionMutationSchema.parse(await request.json());
    const response = await deleteDashboardLayout(
      context,
      params.layoutId,
      expectedRevision,
      request.headers.get('x-forwarded-for'),
    );

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
