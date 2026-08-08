import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, createEmployee, listEmployees } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const createEmployeeSchema = z.object({
  userId: z.string().uuid(),
  employeeType: z.enum([
    'FACULTY', 'ADJUNCT_FACULTY', 'VISITING_FACULTY', 'RESEARCHER', 'TEACHING_ASSISTANT',
    'LAB_STAFF', 'ADMINISTRATIVE_STAFF', 'FINANCE_STAFF', 'HR_STAFF', 'IT_STAFF',
    'LIBRARY_STAFF', 'HOSTEL_STAFF', 'TRANSPORT_STAFF', 'SECURITY_STAFF',
    'MAINTENANCE_STAFF', 'CONTRACTOR', 'CONSULTANT', 'TEMPORARY', 'INTERN', 'OTHER',
  ]),
  employmentType: z.enum(['PERMANENT', 'PROBATION', 'CONTRACT', 'PART_TIME', 'FULL_TIME', 'TEMPORARY', 'VISITING', 'CONSULTANT', 'INTERN']),
  designation: z.string().min(2).max(120),
  grade: z.string().max(40).optional(),
  departmentId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contractStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  contractEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  workLocation: z.string().max(200).optional(),
  workMode: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']).optional(),
  personalEmail: z.string().email().max(200).optional(),
  workEmail: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  emergencyContact: z.record(z.unknown()).optional(),
  bankAccountMasked: z.string().max(40).optional(),
  bankIfsc: z.string().max(20).optional(),
});

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const filters = {
      search: url.searchParams.get('search') ?? undefined,
      departmentId: url.searchParams.get('departmentId') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      employeeType: url.searchParams.get('employeeType') ?? undefined,
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
      pageSize: url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : undefined,
    };
    const result = await listEmployees(context, filters);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to list employees.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = createEmployeeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid employee payload.' }, { status: 400 });
    const employee = await createEmployee(context, parsed.data as Parameters<typeof createEmployee>[1]);
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the employee.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
