import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  ASSIGNMENT_RESOURCE_ACTION,
  ASSIGNMENT_WORKSPACE_ACTION,
  assignmentEntity,
  assignmentError,
  assertOfferingManagement,
  fileEntity,
  MAX_ASSIGNMENT_FILES,
  prepareAssignmentFile,
  type AssignmentFileMeta,
  type AssignmentWorkspaceMeta,
} from '@/lib/assignment-workspace';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const assignmentSchema = z.object({
  courseOfferingId: z.string().uuid(),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(3).max(3000),
  instructions: z.string().trim().max(12000).default(''),
  submissionInstructions: z.string().trim().max(4000).default(''),
  dueDate: z.string().datetime(),
  maxMarks: z.coerce.number().positive().max(10000),
  lateSubmissionAllowed: z.coerce.boolean().default(true),
  latePenaltyPercent: z.coerce.number().min(0).max(100).default(10),
  allowTextResponse: z.coerce.boolean().default(true),
  allowResubmission: z.coerce.boolean().default(true),
  maxSubmissionFiles: z.coerce.number().int().min(1).max(MAX_ASSIGNMENT_FILES).default(6),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const form = await request.formData();
    const raw = {
      courseOfferingId: String(form.get('courseOfferingId') ?? ''),
      title: String(form.get('title') ?? ''),
      description: String(form.get('description') ?? ''),
      instructions: String(form.get('instructions') ?? ''),
      submissionInstructions: String(form.get('submissionInstructions') ?? ''),
      dueDate: String(form.get('dueDate') ?? ''),
      maxMarks: String(form.get('maxMarks') ?? '100'),
      lateSubmissionAllowed: String(form.get('lateSubmissionAllowed') ?? 'true') === 'true',
      latePenaltyPercent: String(form.get('latePenaltyPercent') ?? '10'),
      allowTextResponse: String(form.get('allowTextResponse') ?? 'true') === 'true',
      allowResubmission: String(form.get('allowResubmission') ?? 'true') === 'true',
      maxSubmissionFiles: String(form.get('maxSubmissionFiles') ?? '6'),
    };
    const input = assignmentSchema.parse(raw);
    const dueDate = new Date(input.dueDate);
    if (dueDate.getTime() <= Date.now() + 60_000) {
      return NextResponse.json({ error: 'Choose a deadline at least one minute in the future.' }, { status: 422 });
    }

    const offering = await assertOfferingManagement(context, input.courseOfferingId);
    const files = form.getAll('resources').filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length > MAX_ASSIGNMENT_FILES) throw new Error('ASSIGNMENT_TOO_MANY_FILES');
    const prepared = await Promise.all(files.map(prepareAssignmentFile));

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          tenantId: context.tenantId,
          courseOfferingId: input.courseOfferingId,
          title: input.title,
          description: input.description,
          dueDate,
          maxMarks: input.maxMarks,
        },
        select: { id: true, title: true },
      });

      const resources: AssignmentFileMeta[] = [];
      for (const item of prepared) {
        const file = await tx.file.create({
          data: { tenantId: context.tenantId, fileName: item.fileName, fileUrl: item.fileUrl, mimeType: item.mimeType },
          select: { id: true },
        });
        const metadata: AssignmentFileMeta = {
          fileId: file.id,
          fileName: item.fileName,
          mimeType: item.mimeType,
          fileSizeBytes: item.fileSizeBytes,
          kind: item.kind,
        };
        resources.push(metadata);
        await tx.auditLog.create({
          data: {
            tenantId: context.tenantId,
            userId: context.userId,
            action: ASSIGNMENT_RESOURCE_ACTION,
            entity: fileEntity(file.id),
            diffJson: JSON.stringify({ assignmentId: created.id, ...metadata }),
          },
        });
      }

      const workspace: AssignmentWorkspaceMeta = {
        version: 2,
        instructions: input.instructions,
        submissionInstructions: input.submissionInstructions || 'Upload the requested work before the deadline. Verify every file before submitting.',
        lateSubmissionAllowed: input.lateSubmissionAllowed,
        latePenaltyPercent: input.latePenaltyPercent,
        allowTextResponse: input.allowTextResponse,
        allowResubmission: input.allowResubmission,
        maxSubmissionFiles: input.maxSubmissionFiles,
        resources,
      };
      await tx.auditLog.create({
        data: {
          tenantId: context.tenantId,
          userId: context.userId,
          action: ASSIGNMENT_WORKSPACE_ACTION,
          entity: assignmentEntity(created.id),
          diffJson: JSON.stringify(workspace),
        },
      });

      const studentUserIds = [...new Set(offering.enrollments.map((item) => item.student.userId).filter(Boolean))];
      if (studentUserIds.length) {
        await tx.notification.createMany({
          data: studentUserIds.map((userId) => ({
            tenantId: context.tenantId,
            userId,
            title: `New assignment · ${offering.course.code}`,
            body: `${input.title} is due ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(dueDate)}.`,
            type: 'ASSIGNMENT',
            actionUrl: `/assignments/${created.id}`,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, assignmentId: assignment.id }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Please check the assignment details.', details: error.errors }, { status: 400 });
    const failure = assignmentError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
