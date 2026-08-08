import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';

/**
 * Ensure a library membership exists before the wider workspace loader runs.
 *
 * Core Student intentionally has no direct program_id column: the canonical
 * academic path is students.batch_id -> batches.program_id. Keeping that
 * relationship here prevents raw library SQL from drifting away from Prisma's
 * authoritative academic model.
 */
export async function ensureCanonicalLibraryMembership(context: ActiveUserContext) {
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM campusos_library.library_memberships
    WHERE tenant_id = ${context.tenantId}::uuid
      AND user_id = ${context.userId}::uuid
    LIMIT 1
  `;
  if (existing[0]) return existing[0].id;

  const identity = await prisma.$queryRaw<Array<{
    member_type: string;
    program_id: string | null;
    department_id: string | null;
  }>>`
    SELECT 'STUDENT'::text AS member_type,
           b.program_id,
           NULL::uuid AS department_id
    FROM public.students s
    JOIN public.batches b
      ON b.id = s.batch_id
     AND b.tenant_id = s.tenant_id
    WHERE s.tenant_id = ${context.tenantId}::uuid
      AND s.user_id = ${context.userId}::uuid

    UNION ALL

    SELECT 'FACULTY'::text AS member_type,
           NULL::uuid AS program_id,
           st.department_id
    FROM public.staff st
    WHERE st.tenant_id = ${context.tenantId}::uuid
      AND st.user_id = ${context.userId}::uuid
    LIMIT 1
  `;

  const derived = identity[0];
  const memberType = derived?.member_type
    ?? (context.activeRole === 'STUDENT' ? 'STUDENT' : context.activeRole === 'FACULTY' ? 'FACULTY' : 'STAFF');
  const memberId = randomUUID();
  const memberNumber = `LIB/MEM/${memberType.slice(0, 3)}/${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;

  await prisma.$executeRaw`
    INSERT INTO campusos_library.library_memberships
      (id, tenant_id, user_id, member_type, member_number, status, program_id,
       department_id, source, created_by, created_at, updated_at)
    VALUES
      (${memberId}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid,
       ${memberType}, ${memberNumber}, 'ACTIVE',
       ${derived?.program_id ? Prisma.sql`${derived.program_id}::uuid` : Prisma.sql`NULL`},
       ${derived?.department_id ? Prisma.sql`${derived.department_id}::uuid` : Prisma.sql`NULL`},
       'DERIVED', ${context.userId}::uuid, now(), now())
    ON CONFLICT (tenant_id, user_id) DO NOTHING
  `;

  const membership = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM campusos_library.library_memberships
    WHERE tenant_id = ${context.tenantId}::uuid
      AND user_id = ${context.userId}::uuid
    LIMIT 1
  `;
  return membership[0]?.id ?? null;
}
