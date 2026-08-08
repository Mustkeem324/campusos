/*
 * Dedicated performance-environment generator. It intentionally requires
 * existing synthetic tenant/course/student IDs so it cannot run accidentally
 * during normal development or against an unknown database.
 *
 * Example:
 * DATABASE_URL=... npm run perf:seed-million-attendance -- --tenant <uuid> --course <uuid> --student <uuid>
 */
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const valueFor = (flag) => args[args.indexOf(flag) + 1];
const tenantId = valueFor('--tenant');
const courseId = valueFor('--course');
const studentId = valueFor('--student');
const count = Number(valueFor('--count') || 1_000_000);
const batchSize = Math.min(10_000, Math.max(100, Number(valueFor('--batch-size') || 5_000)));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!uuid.test(tenantId || '') || !uuid.test(courseId || '') || !uuid.test(studentId || '') || !Number.isSafeInteger(count) || count < 1) {
  throw new Error('Usage: --tenant <uuid> --course <uuid> --student <uuid> [--count 1000000] [--batch-size 5000]');
}

const prisma = new PrismaClient();
try {
  for (let offset = 0; offset < count; offset += batchSize) {
    const size = Math.min(batchSize, count - offset);
    // MD5-derived UUIDs are deterministic for resumability and scoped by the
    // supplied tenant. `ON CONFLICT DO NOTHING` makes interrupted runs safe.
    await prisma.$executeRawUnsafe(`
      WITH series AS (
        SELECT generate_series(${offset}, ${offset + size - 1}) AS n
      ), sessions AS (
        INSERT INTO attendance_sessions (id, tenant_id, course_offering_id, session_date)
        SELECT (substr(md5('${tenantId}:session:' || n), 1, 8) || '-' || substr(md5('${tenantId}:session:' || n), 9, 4) || '-4' || substr(md5('${tenantId}:session:' || n), 14, 3) || '-a' || substr(md5('${tenantId}:session:' || n), 18, 3) || '-' || substr(md5('${tenantId}:session:' || n), 21, 12))::uuid,
               '${tenantId}'::uuid, '${courseId}'::uuid, now() - (n || ' minutes')::interval
        FROM series
        ON CONFLICT DO NOTHING
        RETURNING id
      )
      INSERT INTO attendance_records (id, tenant_id, attendance_session_id, student_id, status)
      SELECT (substr(md5('${tenantId}:record:' || id), 1, 8) || '-' || substr(md5('${tenantId}:record:' || id), 9, 4) || '-4' || substr(md5('${tenantId}:record:' || id), 14, 3) || '-a' || substr(md5('${tenantId}:record:' || id), 18, 3) || '-' || substr(md5('${tenantId}:record:' || id), 21, 12))::uuid,
             '${tenantId}'::uuid, id, '${studentId}'::uuid, 'PRESENT'::"AttendanceStatus"
      FROM sessions
      ON CONFLICT DO NOTHING
    `);
    if ((offset + size) % 100_000 === 0 || offset + size === count) console.log(`Seeded ${offset + size}/${count} attendance events`);
  }
} finally {
  await prisma.$disconnect();
}
