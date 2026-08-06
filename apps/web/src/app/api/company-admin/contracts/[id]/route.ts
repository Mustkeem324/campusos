import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireCompanySuperAdmin, writeCompanyAdminEvent } from '@/lib/company-admin';
import { prisma } from '@/lib/db';

const updateSchema = z.object({
  planName: z.string().trim().min(2).max(100),
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']),
  currency: z.string().trim().toUpperCase().length(3),
  contractValue: z.coerce.number().min(0).max(100_000_000_000),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  autoRenew: z.boolean(),
  renewalNoticeDays: z.coerce.number().int().min(0).max(3650),
  licensedStudents: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  licensedStaff: z.coerce.number().int().min(0).max(1_000_000).nullable().optional(),
  modules: z.array(z.string().trim().min(1).max(80)).max(60),
  primaryContactName: z.string().trim().max(120).optional().default(''),
  primaryContactEmail: z.union([z.string().trim().email().max(200), z.literal('')]).optional().default(''),
  primaryContactPhone: z.string().trim().max(40).optional().default(''),
  accountOwner: z.string().trim().max(120).optional().default(''),
  notes: z.string().trim().max(4000).optional().default(''),
}).superRefine((value, context) => {
  if (new Date(value.endsAt) <= new Date(value.startsAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endsAt'], message: 'End date must be after start date.' });
  }
});

type ContractIdentity = {
  id: string;
  institution_id: string;
  contract_number: string;
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireCompanySuperAdmin().catch(() => null);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Review the contract fields.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const current = await prisma.$queryRaw<ContractIdentity[]>`
      SELECT id, institution_id, contract_number
      FROM campusos_control.platform_contracts
      WHERE id = ${params.id}::uuid
      LIMIT 1
    `;
    if (!current[0]) return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });

    const input = parsed.data;
    const valueMinor = Math.round(input.contractValue * 100);

    await prisma.$executeRaw`
      UPDATE campusos_control.platform_contracts
      SET plan_name = ${input.planName},
          status = ${input.status},
          currency = ${input.currency},
          contract_value_minor = ${valueMinor},
          billing_cycle = ${input.billingCycle},
          starts_at = ${new Date(input.startsAt)},
          ends_at = ${new Date(input.endsAt)},
          auto_renew = ${input.autoRenew},
          renewal_notice_days = ${input.renewalNoticeDays},
          licensed_students = ${input.licensedStudents ?? null},
          licensed_staff = ${input.licensedStaff ?? null},
          modules = CAST(${JSON.stringify(input.modules)} AS jsonb),
          primary_contact_name = ${input.primaryContactName || null},
          primary_contact_email = ${input.primaryContactEmail || null},
          primary_contact_phone = ${input.primaryContactPhone || null},
          account_owner = ${input.accountOwner || null},
          notes = ${input.notes || null},
          updated_at = now()
      WHERE id = ${params.id}::uuid
    `;

    await writeCompanyAdminEvent({
      actorUserId: actor.id,
      institutionId: current[0].institution_id,
      eventType: 'CONTRACT_UPDATED',
      summary: `Contract ${current[0].contract_number} was updated.`,
      detail: {
        contractId: params.id,
        status: input.status,
        planName: input.planName,
        endsAt: input.endsAt,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Company admin contract update failed:', error);
    return NextResponse.json({ error: 'Unable to update the contract.' }, { status: 500 });
  }
}
