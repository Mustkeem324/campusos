import { RoleType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import {
  getPhase7Report,
  reportToCsv,
  reportToPdf,
  type Phase7ReportType,
  writePhase7Audit,
} from '@/lib/phase7';
import { canExportPhase7Report } from '@/lib/phase7-report-policy';

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

type ReportData = {
  title: string;
  headers: string[];
  rows: string[][];
};

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const query = querySchema.parse({
      type: url.searchParams.get('type'),
      format: url.searchParams.get('format') || 'csv',
    });
    const type = query.type as Phase7ReportType;

    if (!canExportPhase7Report(context.activeRole, type)) {
      return NextResponse.json(
        { error: 'This report is not available for the active role.' },
        { status: 403 },
      );
    }

    const report = context.activeRole === RoleType.HOD && type === 'student-progress'
      ? await getHodStudentProgressReport(context.tenantId, context.departmentId)
      : await getPhase7Report(context, type);
    const safeName = type.replace(/[^a-z0-9-]/g, '');

    await writePhase7Audit(
      context,
      'PHASE7_REPORT_EXPORTED',
      'Report',
      { type, format: query.format, rows: report.rows.length },
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

async function getHodStudentProgressReport(
  tenantId: string,
  departmentId: string | null,
): Promise<ReportData> {
  if (!departmentId) {
    throw new Error('The HOD department assignment could not be resolved.');
  }

  const students = await prisma.student.findMany({
    where: {
      tenantId,
      batch: {
        program: {
          departmentId,
        },
      },
    },
    orderBy: { rollNumber: 'asc' },
    select: {
      rollNumber: true,
      cgpa: true,
      creditsEarned: true,
      user: { select: { name: true, email: true } },
      batch: { select: { name: true } },
    },
  });

  return {
    title: 'Department student progress report',
    headers: ['Roll number', 'Student', 'Email', 'Batch', 'CGPA', 'Credits earned'],
    rows: students.map((student) => [
      student.rollNumber,
      student.user.name,
      student.user.email,
      student.batch.name,
      student.cgpa.toFixed(2),
      String(student.creditsEarned),
    ]),
  };
}
