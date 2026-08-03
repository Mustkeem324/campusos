import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../lib/tenant-context';
import { requirePermission } from '../../../lib/rbac';

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
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    if (error.message.startsWith('Forbidden') || error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
