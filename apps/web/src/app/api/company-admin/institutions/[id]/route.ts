import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireCompanySuperAdmin, writeCompanyAdminEvent } from '@/lib/company-admin';
import { prisma } from '@/lib/db';

const updateSchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'DISABLED']),
  reason: z.string().trim().max(500).optional().default(''),
});

const BLOCKED_STATUSES = new Set(['SUSPENDED', 'INACTIVE', 'DISABLED']);

export async function PATCH(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  const actor = await requireCompanySuperAdmin().catch(() => null);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid institution status update.' }, { status: 400 });
    }

    const current = await prisma.institution.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, status: true },
    });
    if (!current) return NextResponse.json({ error: 'Institution not found.' }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.update({
        where: { id: current.id },
        data: { status: parsed.data.status },
        select: { id: true, name: true, status: true, updatedAt: true },
      });

      if (BLOCKED_STATUSES.has(parsed.data.status)) {
        // Revoke customer sessions immediately. Company SUPER_ADMIN sessions are
        // preserved even if their required tenant relation points at this record.
        const customerUsers = await tx.user.findMany({
          where: {
            tenantId: current.id,
            role: { not: 'SUPER_ADMIN' },
          },
          select: { id: true },
        });

        if (customerUsers.length > 0) {
          await tx.session.deleteMany({
            where: { userId: { in: customerUsers.map((user) => user.id) } },
          });
        }
      }

      return institution;
    });

    await writeCompanyAdminEvent({
      actorUserId: actor.id,
      institutionId: current.id,
      eventType: 'INSTITUTION_STATUS_CHANGED',
      summary: `${current.name} changed from ${current.status} to ${updated.status}.`,
      detail: {
        previousStatus: current.status,
        newStatus: updated.status,
        reason: parsed.data.reason || null,
        customerSessionsRevoked: BLOCKED_STATUSES.has(parsed.data.status),
      },
    });

    return NextResponse.json({
      success: true,
      institution: { ...updated, updatedAt: updated.updatedAt.toISOString() },
    });
  } catch (error) {
    console.error('Company admin institution status update failed:', error);
    return NextResponse.json({ error: 'Unable to update institution status.' }, { status: 500 });
  }
}
