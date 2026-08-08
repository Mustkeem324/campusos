import { RoleType } from '@prisma/client';
import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  ASSIGNMENT_SUBMISSION_ACTION,
  ASSIGNMENT_SUBMISSION_FILE_ACTION,
  assignmentError,
  assertAssignmentAccess,
  fileEntity,
  loadAssignmentWorkspace,
  loadSubmissionMeta,
  prepareAssignmentFile,
  submissionEntity,
  type AssignmentFileMeta,
  type AssignmentSubmissionMeta,
} from '@/lib/assignment-workspace';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ assignmentId: string }>; }) {
  const params = await paramsPromise;

  try {
    const context = await requireActiveUserContext();
    if (context.activeRole !== RoleType.STUDENT || !context.studentProfileId) throw new Error('ASSIGNMENT_FORBIDDEN');
    const assignment = await assertAssignmentAccess(context, params.assignmentId);
    const workspace = await loadAssignmentWorkspace(context.tenantId, assignment.id);
    const form = await request.formData();
    const textResponse = String(form.get('textResponse') ?? '').trim().slice(0, 12000);
    const files = form.getAll('files').filter((value): value is File => value instanceof File && value.size > 0);
    if (!workspace.allowTextResponse && textResponse) {
      return NextResponse.json({ error: 'This assignment accepts file submissions only.' }, { status: 422 });
    }
    if (files.length > workspace.maxSubmissionFiles) throw new Error('ASSIGNMENT_TOO_MANY_FILES');
    if (!textResponse && files.length === 0) throw new Error('ASSIGNMENT_EMPTY_SUBMISSION');

    const now = new Date();
    const isLate = now.getTime() > assignment.dueDate.getTime();
    if (isLate && !workspace.lateSubmissionAllowed) throw new Error('ASSIGNMENT_DEADLINE_CLOSED');

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: context.studentProfileId } },
      select: { id: true, marksObtained: true },
    });
    if (existing?.marksObtained !== null && existing?.marksObtained !== undefined) throw new Error('ASSIGNMENT_GRADED_LOCKED');
    if (existing && !workspace.allowResubmission) throw new Error('ASSIGNMENT_RESUBMIT_DISABLED');
    const previousMeta = existing ? await loadSubmissionMeta(context.tenantId, existing.id) : null;
    const prepared = await Promise.all(files.map(prepareAssignmentFile));

    const result = await prisma.$transaction(async (tx) => {
      const createdFiles: AssignmentFileMeta[] = [];
      const createdFileUrls: string[] = [];
      for (const item of prepared) {
        const file = await tx.file.create({
          data: { tenantId: context.tenantId, fileName: item.fileName, fileUrl: item.fileUrl, mimeType: item.mimeType },
          select: { id: true },
        });
        createdFileUrls.push(item.fileUrl);
        const metadata: AssignmentFileMeta = {
          fileId: file.id,
          fileName: item.fileName,
          mimeType: item.mimeType,
          fileSizeBytes: item.fileSizeBytes,
          kind: item.kind,
        };
        createdFiles.push(metadata);
      }

      const submission = await tx.submission.upsert({
        where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: context.studentProfileId! } },
        create: {
          tenantId: context.tenantId,
          assignmentId: assignment.id,
          studentId: context.studentProfileId!,
          submittedAt: now,
          fileUrl: createdFileUrls[0] ?? null,
        },
        update: {
          submittedAt: now,
          fileUrl: createdFileUrls[0] ?? null,
        },
        select: { id: true, submittedAt: true },
      });

      const metadata: AssignmentSubmissionMeta = {
        version: 2,
        textResponse,
        isLate,
        attemptNumber: (previousMeta?.attemptNumber ?? 0) + 1,
        files: createdFiles,
      };
      await tx.auditLog.create({
        data: {
          tenantId: context.tenantId,
          userId: context.userId,
          action: ASSIGNMENT_SUBMISSION_ACTION,
          entity: submissionEntity(submission.id),
          diffJson: JSON.stringify(metadata),
        },
      });
      for (const file of createdFiles) {
        await tx.auditLog.create({
          data: {
            tenantId: context.tenantId,
            userId: context.userId,
            action: ASSIGNMENT_SUBMISSION_FILE_ACTION,
            entity: fileEntity(file.fileId),
            diffJson: JSON.stringify({ assignmentId: assignment.id, submissionId: submission.id, studentId: context.studentProfileId, ...file }),
          },
        });
      }

      await tx.notification.create({
        data: {
          tenantId: context.tenantId,
          userId: assignment.courseOffering.faculty.userId,
          title: `${isLate ? 'Late submission' : 'Assignment submitted'} · ${assignment.courseOffering.course.code}`,
          body: `${assignment.title} received from a student${isLate ? ' after the deadline' : ''}.`,
          type: 'ASSIGNMENT',
          actionUrl: `/assignments/${assignment.id}`,
        },
      });

      return { submissionId: submission.id, submittedAt: submission.submittedAt.toISOString(), isLate, attemptNumber: metadata.attemptNumber };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: unknown) {
    const failure = assignmentError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
