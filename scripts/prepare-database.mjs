import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

function isVercelPreview() {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview';
}

function shouldPrepareDatabase() {
  if (process.env.CAMPUSOS_AUTO_DB_PUSH === 'false') return false;

  return (
    process.env.CAMPUSOS_AUTO_DB_PUSH === 'true' ||
    process.env.VERCEL_ENV === 'production' ||
    isVercelPreview()
  );
}

function shouldSeedSyntheticCampus() {
  // Synthetic data is an explicit development/QA tool only. Deployments no
  // longer create, reset or refresh synthetic institutions automatically.
  return process.env.CAMPUSOS_AUTO_SEED_SYNTHETIC === 'true';
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
  const binary = process.platform === 'win32'
    ? path.join(process.cwd(), 'node_modules', '.bin', 'prisma.cmd')
    : path.join(process.cwd(), 'node_modules', '.bin', 'prisma');

  runCommand(
    binary,
    ['db', 'push', '--schema=packages/db/prisma/schema.prisma', '--skip-generate'],
    'Prisma schema synchronization',
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
