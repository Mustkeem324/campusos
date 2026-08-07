import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

function shouldPrepareDatabase() {
  if (process.env.CAMPUSOS_AUTO_DB_PUSH === 'false') return false;

  // Preview builds are validation environments and must not mutate a connected
  // database implicitly. Production may prepare automatically; any other
  // environment must opt in explicitly.
  return (
    process.env.CAMPUSOS_AUTO_DB_PUSH === 'true' ||
    process.env.VERCEL_ENV === 'production'
  );
}

function shouldSeedSyntheticCampus() {
  // Synthetic data is an explicit development/QA tool only. Deployments no
  // longer create, reset or refresh synthetic institutions automatically.
  return process.env.CAMPUSOS_AUTO_SEED_SYNTHETIC === 'true';
}

function prismaBinary() {
  return process.platform === 'win32'
    ? path.join(process.cwd(), 'node_modules', '.bin', 'prisma.cmd')
    : path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
}

function runCommand(command, args, label, extraEnv = {}) {
  const result = spawnSync(command, args, {
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

function runPrismaDbPush() {
  runCommand(
    prismaBinary(),
    ['db', 'push', '--schema=packages/db/prisma/schema.prisma', '--skip-generate'],
    'Prisma schema synchronization',
  );
}

function executeSqlFile(file, label) {
  runCommand(
    prismaBinary(),
    [
      'db',
      'execute',
      `--file=${file}`,
      '--schema=packages/db/prisma/schema.prisma',
    ],
    label,
  );
}

function provisionCompanyAdminStorage() {
  executeSqlFile(
    'packages/db/prisma/company-admin.sql',
    'Company administration control-plane provisioning',
  );
}

function provisionPaymentPortalStorage() {
  executeSqlFile(
    'packages/db/prisma/payment-portal.sql',
    'Payment portal orchestration provisioning',
  );
}

function provisionTransportGpsStorage() {
  executeSqlFile(
    'packages/db/prisma/transport-gps.sql',
    'Optional transport GPS module provisioning',
  );
}

function provisionHelpdeskStorage() {
  executeSqlFile(
    'packages/db/prisma/helpdesk.sql',
    'Institution helpdesk and company support provisioning',
  );
}

function provisionHostelStorage() {
  executeSqlFile(
    'packages/db/prisma/hostel-operations.sql',
    'Optional hostel operations module provisioning',
  );
}

function provisionAttendanceStorage() {
  executeSqlFile(
    'packages/db/prisma/attendance-smart.sql',
    'Timetable-driven smart attendance provisioning',
  );
}

function runSyntheticCampusSeed() {
  const seedEnv = { CAMPUSOS_ALLOW_SYNTHETIC_SEED: 'true' };

  runCommand(
    process.execPath,
    ['scripts/reset-synthetic-campus.mjs', '--allow-synthetic-seed'],
    'Synthetic campus reset',
    seedEnv,
  );

  runCommand(
    process.execPath,
    ['scripts/seed-synthetic-campus.mjs', '--allow-synthetic-seed'],
    'Synthetic campus seed',
    seedEnv,
  );
}

function prepareDatabase() {
  if (!shouldPrepareDatabase()) {
    console.log('Database preparation skipped. Set CAMPUSOS_AUTO_DB_PUSH=true to run it explicitly.');
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for database preparation.');
  }

  console.log('Synchronizing the Prisma schema with the connected database...');
  runPrismaDbPush();
  console.log('Prisma schema synchronization completed.');

  console.log('Provisioning CampusOS company administration control-plane tables...');
  provisionCompanyAdminStorage();
  console.log('Company administration storage is ready.');

  console.log('Provisioning CampusOS payment orchestration tables...');
  provisionPaymentPortalStorage();
  console.log('Payment orchestration storage is ready.');

  console.log('Provisioning optional CampusOS transport GPS tables...');
  provisionTransportGpsStorage();
  console.log('Transport GPS storage is ready. Institutions remain opted out until an Institution Admin enables the module.');

  console.log('Provisioning CampusOS role-aware helpdesk tables...');
  provisionHelpdeskStorage();
  console.log('Institution helpdesk and company support storage are ready.');

  console.log('Provisioning optional CampusOS hostel operations tables...');
  provisionHostelStorage();
  console.log('Hostel operations storage is ready. Institutions remain opted out until an Institution Admin enables the module.');

  console.log('Provisioning NAVEMORA timetable-driven smart attendance tables...');
  provisionAttendanceStorage();
  console.log('Smart attendance storage is ready.');

  if (shouldSeedSyntheticCampus()) {
    console.warn('Explicit synthetic seed opt-in detected. This should only be used in isolated development or QA databases.');
    runSyntheticCampusSeed();
    console.log('Synthetic campus dataset preparation completed.');
  } else {
    console.log('Synthetic dataset preparation skipped. Deployments never seed sample institutions unless CAMPUSOS_AUTO_SEED_SYNTHETIC=true is explicitly set.');
  }
}

try {
  prepareDatabase();
} catch (error) {
  console.error('Database preparation failed:', error);
  process.exit(1);
}
