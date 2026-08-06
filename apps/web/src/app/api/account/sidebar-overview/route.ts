import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { loadAccountSidebarOverview } from '@/lib/account-sidebar';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const overview = await loadAccountSidebarOverview(context);

    return NextResponse.json(overview, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Account overview unavailable.';
    const status = message.startsWith('Unauthorized') ? 401 : 500;

    return NextResponse.json(
      { error: status === 401 ? 'Authentication required.' : 'Account overview unavailable.' },
      { status },
    );
  }
}
