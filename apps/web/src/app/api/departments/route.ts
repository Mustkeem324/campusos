import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../lib/tenant-context';
import { requirePermission } from '../../../lib/rbac';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  campusId: z.string().uuid('Invalid Campus ID'),
});

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');

    const whereClause = campusId ? { campusId } : {};

    const departments = await db.department.findMany({
      where: whereClause,
      include: {
        campus: { select: { name: true } },
        _count: { select: { programs: true, courses: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(departments);
  } catch (error: any) {
    if (error?.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[DEPARTMENTS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    requirePermission(session.role as any, 'edit_academic_records');
    
    const body = await request.json();
    const validatedData = departmentSchema.parse(body);

    // Verify campus belongs to tenant (implicit via RLS/extension, but explicitly safe)
    const campus = await db.campus.findUnique({
      where: { id: validatedData.campusId }
    });

    if (!campus) {
      return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
    }

    const department = await db.department.create({
      data: { ...validatedData, tenantId: session.tenantId } as any,
      include: {
        campus: { select: { name: true } }
      }
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'DEPARTMENT',
        tenantId: session.tenantId,
        diffJson: JSON.stringify({ entityId: department.id, name: department.name, code: department.code }),
        userId: session.userId
      }
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    if (error?.message?.startsWith('Forbidden') || error?.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[DEPARTMENTS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
