import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { requirePermission } from '../../../../lib/rbac';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).toUpperCase().optional(),
});

export async function PUT(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    requirePermission(session.role as any, 'edit_academic_records');
    
    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const department = await db.department.update({
      where: { id: params.id },
      data: validatedData as any,
      include: { campus: { select: { name: true } } }
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'DEPARTMENT',
        tenantId: session.tenantId,
        diffJson: JSON.stringify({ entityId: department.id, ...validatedData }),
        userId: session.userId
      }
    });

    return NextResponse.json(department);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    if (error?.message?.startsWith('Forbidden') || error?.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[DEPARTMENTS_PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    requirePermission(session.role as any, 'edit_academic_records');
    
    const department = await db.department.delete({
      where: { id: params.id },
    });

    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'DEPARTMENT',
        tenantId: session.tenantId,
        diffJson: JSON.stringify({ entityId: department.id, name: department.name }),
        userId: session.userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    if (error?.message?.startsWith('Forbidden') || error?.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[DEPARTMENTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
