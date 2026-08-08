import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, createResearchProject, listAccessibleProjects } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().min(1).max(300),
  abstract: z.string().max(4000).optional(),
  researchType: z.enum([
    'FACULTY_RESEARCH', 'STUDENT_PROJECT', 'CAPSTONE', 'DISSERTATION', 'THESIS',
    'PHD_RESEARCH', 'FUNDED_PROJECT', 'CONSULTANCY_RESEARCH', 'INSTITUTIONAL_PROJECT', 'OTHER',
  ]).optional(),
  departmentId: z.string().uuid().optional(),
  researchArea: z.string().max(200).optional(),
  keywords: z.array(z.string().max(80)).max(50).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expectedCompletion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fundingSource: z.string().max(300).optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const projects = await listAccessibleProjects(context);
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to list research projects.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid research project payload.' }, { status: 400 });
    const project = await createResearchProject(context, parsed.data as Parameters<typeof createResearchProject>[1]);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the research project.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
