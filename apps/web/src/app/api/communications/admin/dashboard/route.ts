import { NextResponse } from 'next/server';

import { getCommunicationAdminDashboard, CommunicationError } from '@/lib/communications';
import { getCommunicationAudit, getTemplateCatalog } from '@/lib/communications-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [dashboard, templates, audit] = await Promise.all([
      getCommunicationAdminDashboard(),
      getTemplateCatalog(),
      getCommunicationAudit(50),
    ]);
    return NextResponse.json({ ...dashboard, templateCatalog: templates, audit }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CommunicationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Communications admin dashboard failed:', error);
    return NextResponse.json({ error: 'Communications administration is unavailable.' }, { status: 500 });
  }
}
