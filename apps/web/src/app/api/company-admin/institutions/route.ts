import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword } from '@/lib/auth';
import { requireCompanySuperAdmin, writeCompanyAdminEvent } from '@/lib/company-admin';
import { prisma } from '@/lib/db';

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(180),
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  subdomain: z.string().trim().toLowerCase().min(2).max(63).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  status: z.enum(['TRIAL', 'ACTIVE']).default('TRIAL'),
  adminName: z.string().trim().min(2).max(120),
  adminEmail: z.string().trim().toLowerCase().email().max(200),
  temporaryPassword: z.string().min(10).max(128),
  planName: z.string().trim().min(2).max(100),
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
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endsAt'], message: 'Contract end date must be after the start date.' });
  }
});

function contractNumber(code: string) {
  return `COS-${new Date().getFullYear()}-${code.toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  const actor = await requireCompanySuperAdmin().catch(() => null);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = onboardingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Review the institution and contract fields.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const passwordHash = await hashPassword(input.temporaryPassword);
    const contractId = randomUUID();
    const number = contractNumber(input.code);
    const valueMinor = Math.round(input.contractValue * 100);

    const institution = await prisma.$transaction(async (tx) => {
      const created = await tx.institution.create({
        data: {
          name: input.name,
          code: input.code.toUpperCase(),
          subdomain: input.subdomain,
          status: input.status,
        },
        select: { id: true, name: true, code: true, subdomain: true, status: true },
      });

      await tx.user.create({
        data: {
          tenantId: created.id,
          email: input.adminEmail,
          name: input.adminName,
          passwordHash,
          role: 'INSTITUTION_ADMIN',
          isActive: true,
        },
      });

      await tx.$executeRaw`
        INSERT INTO campusos_control.platform_contracts
          (id, institution_id, contract_number, plan_name, status, currency,
           contract_value_minor, billing_cycle, starts_at, ends_at, auto_renew,
           renewal_notice_days, licensed_students, licensed_staff, modules,
           primary_contact_name, primary_contact_email, primary_contact_phone,
           account_owner, notes, created_at, updated_at)
        VALUES
          (${contractId}::uuid, ${created.id}::uuid, ${number}, ${input.planName},
           ${input.status === 'TRIAL' ? 'TRIAL' : 'ACTIVE'}, ${input.currency}, ${valueMinor},
           ${input.billingCycle}, ${startsAt}, ${endsAt}, ${input.autoRenew},
           ${input.renewalNoticeDays}, ${input.licensedStudents ?? null}, ${input.licensedStaff ?? null},
           CAST(${JSON.stringify(input.modules)} AS jsonb), ${input.primaryContactName || null},
           ${input.primaryContactEmail || null}, ${input.primaryContactPhone || null},
           ${input.accountOwner || null}, ${input.notes || null}, now(), now())
      `;

      return created;
    });

    await writeCompanyAdminEvent({
      actorUserId: actor.id,
      institutionId: institution.id,
      eventType: 'INSTITUTION_ONBOARDED',
      summary: `${institution.name} was added to the CampusOS portfolio.`,
      detail: {
        code: institution.code,
        subdomain: institution.subdomain,
        status: institution.status,
        contractNumber: number,
        planName: input.planName,
      },
    });

    return NextResponse.json({ success: true, institution, contractId, contractNumber: number }, { status: 201 });
  } catch (error: unknown) {
    console.error('Company admin institution onboarding failed:', error);
    const message = error instanceof Error && /unique/i.test(error.message)
      ? 'Institution code, workspace or administrator details conflict with an existing record.'
      : 'Unable to create the institution right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
