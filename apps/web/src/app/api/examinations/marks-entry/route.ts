import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { requirePermission } from '../../../../lib/rbac';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const marksSchema = z.object({
  examinationId: z.string().uuid(),
  courseOfferingId: z.string().uuid(),
  studentMarks: z.array(z.object({
    studentId: z.string().uuid(),
    marksObtained: z.number().min(0),
    maxMarks: z.number().min(1),
    isAbsent: z.boolean().default(false)
  }))
});

export async function POST(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    requirePermission(session.role as any, 'edit_academic_records'); // Faculty or Admin
    
    const body = await request.json();
    const { examinationId, courseOfferingId, studentMarks } = marksSchema.parse(body);

    const faculty = await db.staff.findUnique({
      where: { userId: session.userId }
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    // Upsert MarksEntryBatch
    let batch = await db.marksEntryBatch.findFirst({
      where: { examinationId, courseOfferingId, tenantId: session.tenantId }
    });

    if (!batch) {
      batch = await db.marksEntryBatch.create({
        data: {
          tenantId: session.tenantId,
          examinationId,
          courseOfferingId,
          facultyId: faculty.id,
          status: 'SUBMITTED'
        }
      });
    } else {
      await db.marksEntryBatch.update({
        where: { id: batch.id },
        data: { status: 'SUBMITTED' }
      });
    }

    // Update marks
    for (const markData of studentMarks) {
      const existing = await db.studentMarks.findFirst({
        where: { marksEntryBatchId: batch.id, studentId: markData.studentId }
      });

      if (existing) {
        await db.studentMarks.update({
          where: { id: existing.id },
          data: {
            marksObtained: markData.marksObtained,
            maxMarks: markData.maxMarks,
            isAbsent: markData.isAbsent
          }
        });
      } else {
        await db.studentMarks.create({
          data: {
            tenantId: session.tenantId,
            marksEntryBatchId: batch.id,
            studentId: markData.studentId,
            marksObtained: markData.marksObtained,
            maxMarks: markData.maxMarks,
            isAbsent: markData.isAbsent
          }
        });
      }
    }

    return NextResponse.json({ message: 'Marks saved successfully', batchId: batch.id });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[MARKS_ENTRY]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
