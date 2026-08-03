import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db } = await requireTenantContext();
    
    const campuses = await db.campus.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(campuses);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[CAMPUSES_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
