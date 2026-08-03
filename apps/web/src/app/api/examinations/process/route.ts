import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { requirePermission } from '../../../../lib/rbac';
import { processExaminationResults } from '../../../../lib/results-processing';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const processSchema = z.object({
  examinationId: z.string().uuid('Invalid Examination ID'),
});

export async function POST(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    requirePermission(session.role as any, 'edit_academic_records'); // Or 'EXAMINATION_CONTROLLER' check
    
    const body = await request.json();
    const { examinationId } = processSchema.parse(body);

    const exam = await db.examinations.findUnique({
      where: { id: examinationId, tenantId: session.tenantId }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Examination not found' }, { status: 404 });
    }

    const results = await processExaminationResults(db, examinationId, session.tenantId);

    // Update examination status
    await db.examinations.update({
      where: { id: examinationId },
      data: { status: 'COMPLETED' }
    });

    return NextResponse.json({ message: 'Results processed successfully', count: results.length });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[EXAMINATIONS_PROCESS]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
