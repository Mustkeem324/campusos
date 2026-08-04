import { NextResponse } from 'next/server';
import { dashboardPathForRole, requireActiveUserContext } from '@/lib/active-user-context';

export const dynamic = 'force-dynamic';

/** Returns only the verified routing context; profile identifiers stay server-side. */
export async function GET() {
  try {
    const context = await requireActiveUserContext();
    return NextResponse.json({ role: context.activeRole, dashboardPath: dashboardPathForRole(context.activeRole) });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
