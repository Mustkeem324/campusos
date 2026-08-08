import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireCompanySuperAdmin, writeCompanyAdminEvent } from '@/lib/company-admin';
import { prisma } from '@/lib/db';

const updateSchema = z.object({
  status: z.enum(['NEW', 'OPEN', 'WAITING_CUSTOMER', 'RESOLVED', 'SPAM']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedToMe: z.boolean().optional(),
}).refine((value) => value.status || value.priority || value.assignedToMe !== undefined, {
  message: 'Provide at least one enquiry update.',
});

type InquiryIdentity = {
  id: string;
  reference: string;
  name: string;
  email: string;
};

export async function PATCH(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  const actor = await requireCompanySuperAdmin().catch(() => null);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Review the enquiry update.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const current = await prisma.$queryRaw<InquiryIdentity[]>`
      SELECT id, reference, name, email
      FROM campusos_control.platform_contact_inquiries
      WHERE id = ${params.id}::uuid
      LIMIT 1
    `;
    if (!current[0]) return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });

    const input = parsed.data;
    const updates: Prisma.Sql[] = [Prisma.sql`updated_at = now()`];
    if (input.status) {
      updates.push(Prisma.sql`status = ${input.status}`);
      updates.push(input.status === 'RESOLVED'
        ? Prisma.sql`resolved_at = COALESCE(resolved_at, now())`
        : Prisma.sql`resolved_at = NULL`);
    }
    if (input.priority) updates.push(Prisma.sql`priority = ${input.priority}`);
    if (input.assignedToMe !== undefined) {
      updates.push(input.assignedToMe
        ? Prisma.sql`assigned_to = ${actor.id}::uuid`
        : Prisma.sql`assigned_to = NULL`);
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE campusos_control.platform_contact_inquiries
      SET ${Prisma.join(updates, ', ')}
      WHERE id = ${params.id}::uuid
    `);

    await writeCompanyAdminEvent({
      actorUserId: actor.id,
      eventType: 'CONTACT_INQUIRY_UPDATED',
      summary: `Enquiry ${current[0].reference} was updated.`,
      detail: {
        inquiryId: params.id,
        reference: current[0].reference,
        status: input.status,
        priority: input.priority,
        assignedToMe: input.assignedToMe,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Company contact enquiry update failed:', error);
    return NextResponse.json({ error: 'Unable to update the enquiry.' }, { status: 500 });
  }
}
