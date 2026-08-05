import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

function shouldPrepareDatabase() {
  if (process.env.CAMPUSOS_AUTO_DB_PUSH === 'false') return false;
  return process.env.CAMPUSOS_AUTO_DB_PUSH === 'true' || process.env.VERCEL_ENV === 'production';
}

function runPrismaDbPush() {
  const binary = process.platform === 'win32'
    ? path.join(process.cwd(), 'node_modules', '.bin', 'prisma.cmd')
    : path.join(process.cwd(), 'node_modules', '.bin', 'prisma');

  const result = spawnSync(
    binary,
    ['db', 'push', '--schema=packages/db/prisma/schema.prisma', '--skip-generate'],
    { env: process.env, stdio: 'inherit' },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Prisma schema synchronization failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

async function prepareDatabase() {
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

  if (process.env.DEMO_MODE === 'true' && process.env.CAMPUSOS_AUTO_SEED_DEMO !== 'false') {
    console.log('DEMO_MODE is enabled. Ensuring the idempotent demo dataset exists...');
    const { bootstrapDemoDatabase } = await import('./bootstrap-demo.mjs');
    await bootstrapDemoDatabase();
    console.log('Demo dataset preparation completed.');
  } else {
    console.log('Demo dataset preparation skipped because DEMO_MODE is not enabled.');
  }
}

prepareDatabase().catch((error) => {
  console.error('Database preparation failed:', error);
  process.exit(1);
});
