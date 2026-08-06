import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireCompanySuperAdmin, writeCompanyAdminEvent } from '@/lib/company-admin';
import { prisma } from '@/lib/db';

const contractSchema = z.object({
  institutionId: z.string().uuid(),
  planName: z.string().trim().min(2).max(100),
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED']).default('ACTIVE'),
  currency: z.string().trim().toUpperCase().length(3).default('INR'),
  contractValue: z.coerce.number().min(0).max(100_000_000_000),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']).default('ANNUAL'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  autoRenew: z.boolean().default(false),
  renewalNoticeDays: z.coerce.number().int().min(0).max(3650).default(60),
  licensedStudents: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  licensedStaff: z.coerce.number().int().min(0).max(1_000_000).nullable().optional(),
  modules: z.array(z.string().trim().min(1).max(80)).max(60).default([]),
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

function makeContractNumber(code: string) {
  return `COS-${new Date().getFullYear()}-${code}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  const actor = await requireCompanySuperAdmin().catch(() => null);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = contractSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Review the contract fields.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const institution = await prisma.institution.findUnique({
      where: { id: input.institutionId },
      select: { id: true, name: true, code: true },
    });
    if (!institution) return NextResponse.json({ error: 'Institution not found.' }, { status: 404 });

    const id = randomUUID();
    const number = makeContractNumber(institution.code.toUpperCase());
    const valueMinor = Math.round(input.contractValue * 100);

    await prisma.$executeRaw`
      INSERT INTO platform_contracts
        (id, institution_id, contract_number, plan_name, status, currency,
         contract_value_minor, billing_cycle, starts_at, ends_at, auto_renew,
         renewal_notice_days, licensed_students, licensed_staff, modules,
         primary_contact_name, primary_contact_email, primary_contact_phone,
         account_owner, notes, created_at, updated_at)
      VALUES
        (${id}::uuid, ${institution.id}::uuid, ${number}, ${input.planName}, ${input.status},
         ${input.currency}, ${valueMinor}, ${input.billingCycle}, ${new Date(input.startsAt)},
         ${new Date(input.endsAt)}, ${input.autoRenew}, ${input.renewalNoticeDays},
         ${input.licensedStudents ?? null}, ${input.licensedStaff ?? null},
         CAST(${JSON.stringify(input.modules)} AS jsonb), ${input.primaryContactName || null},
         ${input.primaryContactEmail || null}, ${input.primaryContactPhone || null},
         ${input.accountOwner || null}, ${input.notes || null}, now(), now())
    `;

    await writeCompanyAdminEvent({
      actorUserId: actor.id,
      institutionId: institution.id,
      eventType: 'CONTRACT_CREATED',
      summary: `A new ${input.planName} contract was created for ${institution.name}.`,
      detail: { contractId: id, contractNumber: number, endsAt: input.endsAt, status: input.status },
    });

    return NextResponse.json({ success: true, id, contractNumber: number }, { status: 201 });
  } catch (error) {
    console.error('Company admin contract creation failed:', error);
    return NextResponse.json({ error: 'Unable to create the contract.' }, { status: 500 });
  }
}
