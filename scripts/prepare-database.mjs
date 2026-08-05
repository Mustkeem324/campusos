import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

function shouldPrepareDatabase() {
  if (process.env.CAMPUSOS_AUTO_DB_PUSH === 'false') return false;
  return process.env.CAMPUSOS_AUTO_DB_PUSH === 'true' || process.env.VERCEL_ENV === 'production';
}

function shouldSeedSyntheticCampus() {
  if (process.env.CAMPUSOS_AUTO_SEED_SYNTHETIC === 'false') return false;
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
  runCommand(
    process.execPath,
    ['scripts/seed-synthetic-campus.mjs', '--allow-synthetic-seed', '--reset'],
    'Synthetic campus seed',
    { CAMPUSOS_ALLOW_SYNTHETIC_SEED: 'true' },
  );
}

function prepareDatabase() {
  if (!shouldPrepareDatabase()) {
    console.log('Database preparation skipped outside production. Set CAMPUSOS_AUTO_DB_PUSH=true to run it explicitly.');
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for production database preparation.');
  }

  console.log('Synchronizing the Prisma schema with the production database...');
  runPrismaDbPush();
  console.log('Prisma schema synchronization completed.');

  if (shouldSeedSyntheticCampus()) {
    console.log('CAMPUSOS_AUTO_SEED_SYNTHETIC is enabled. Rebuilding the realistic synthetic campus dataset...');
    runSyntheticCampusSeed();
    console.log('Synthetic campus dataset preparation completed.');
  } else {
    console.log('Synthetic dataset preparation skipped. Set CAMPUSOS_AUTO_SEED_SYNTHETIC=true only for approved sample environments.');
  }
}

try {
  prepareDatabase();
} catch (error) {
  console.error('Database preparation failed:', error);
  process.exit(1);
}
