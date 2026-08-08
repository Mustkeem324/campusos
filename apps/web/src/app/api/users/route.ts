import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../lib/tenant-context';
import { requirePermission } from '../../../lib/rbac';
import { decodeCursor, InvalidCursorError, pageInfo, pageSize } from '@/lib/platform/pagination';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Establish strict tenant context from the verified session
    const ctx = await requireTenantContext();
    
    // 2. Enforce Role-Based Access Control
    requirePermission(ctx.role, 'manage_users');

    // 3. Fetch data using the Tenant-Scoped DB layer
    // This will AUTOMATICALLY append { tenantId: ctx.tenantId } to the where clause!
    // No risk of cross-tenant leakage even if the developer forgets to add the where clause.
    const url = new URL(request.url);
    const size = pageSize(url.searchParams.get('limit'));
    const cursor = decodeCursor(url.searchParams.get('cursor'), ctx.tenantId);
    const rows = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: { id: 'asc' },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      take: size + 1,
    });
    const result = pageInfo(rows, size, ctx.tenantId);

    return NextResponse.json({ success: true, users: result.items, ...result });
  } catch (error: any) {
    if (error instanceof InvalidCursorError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error.message.startsWith('Forbidden') || error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
