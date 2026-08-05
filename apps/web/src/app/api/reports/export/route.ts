import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  getPhase7Report,
  reportToCsv,
  reportToPdf,
  type Phase7ReportType,
  writePhase7Audit,
} from '@/lib/phase7';

const querySchema = z.object({
  type: z.enum([
    'my-account',
    'user-directory',
    'student-progress',
    'finance-aging',
    'library-circulation',
    'student-success',
  ]),
  format: z.enum(['csv', 'pdf']).default('csv'),
});

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const query = querySchema.parse({
      type: url.searchParams.get('type'),
      format: url.searchParams.get('format') || 'csv',
    });

    const report = await getPhase7Report(context, query.type as Phase7ReportType);
    const safeName = query.type.replace(/[^a-z0-9-]/g, '');

    await writePhase7Audit(
      context,
      'PHASE7_REPORT_EXPORTED',
      'Report',
      { type: query.type, format: query.format, rows: report.rows.length },
      request.headers.get('x-forwarded-for'),
    );

    if (query.format === 'pdf') {
      return new NextResponse(reportToPdf(report), {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${safeName}.pdf"`,
          'cache-control': 'private, no-store',
        },
      });
    }

    return new NextResponse(reportToCsv(report), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${safeName}.csv"`,
        'cache-control': 'private, no-store',
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Select a valid report type and format.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to export the report.' },
      { status: 403 },
    );
  }
}
