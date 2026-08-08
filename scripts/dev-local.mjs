import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

import { createLocalServiceEnv, getLocalServicePorts } from './local-service-config.mjs';

const POSTGRES_READY_ATTEMPTS = 30;
const POSTGRES_READY_DELAY_MS = 1_000;

function bin(name) {
  return process.platform === 'win32'
    ? path.join(process.cwd(), 'node_modules', '.bin', `${name}.cmd`)
    : path.join(process.cwd(), 'node_modules', '.bin', name);
}

function run(command, args, label, env = process.env) {
  const result = spawnSync(command, args, {
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

function dockerComposeAvailable() {
  const result = spawnSync('docker', ['compose', 'version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  return result.status === 0;
}

async function waitForPostgres(localEnv) {
  for (let attempt = 1; attempt <= POSTGRES_READY_ATTEMPTS; attempt += 1) {
    const result = spawnSync(
      'docker',
      ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'campusos', '-d', 'campusos_db'],
      {
        env: localEnv,
        stdio: 'ignore',
        shell: process.platform === 'win32',
      },
    );

    if (result.status === 0) return;

    if (attempt < POSTGRES_READY_ATTEMPTS) {
      await sleep(POSTGRES_READY_DELAY_MS);
    }
  }

  throw new Error('Local PostgreSQL did not become ready. Run `npm run services:status` and inspect the postgres service.');
}

async function main() {
  if (!dockerComposeAvailable()) {
    throw new Error('Docker Compose is required for `npm run dev:local`. Install/start Docker, then retry.');
  }

  const ports = getLocalServicePorts();
  const localEnv = createLocalServiceEnv({
    CAMPUSOS_AUTO_DB_PUSH: 'true',
    CAMPUSOS_AUTO_SEED_SYNTHETIC: process.env.CAMPUSOS_AUTO_SEED_SYNTHETIC ?? 'false',
  });

  console.log(
    `Starting NAVEMORA local services (PostgreSQL:${ports.postgres}, Redis:${ports.redis}, MinIO:${ports.minioApi}, MailHog:${ports.mailhogUi})...`,
  );
  run('docker', ['compose', 'up', '-d', 'postgres', 'redis', 'minio', 'mailhog'], 'Docker Compose startup', localEnv);

  console.log('Waiting for PostgreSQL to become ready...');
  await waitForPostgres(localEnv);

  console.log('Generating Prisma Client...');
  run(bin('prisma'), ['generate', '--schema=packages/db/prisma/schema.prisma'], 'Prisma Client generation', localEnv);

  console.log('Preparing the local NAVEMORA database...');
  run(process.execPath, ['scripts/prepare-database.mjs'], 'Local database preparation', localEnv);

  console.log(`Local services are ready. Redis is available at ${localEnv.REDIS_URL}.`);
  console.log('Starting Next.js on http://localhost:3000 ...');
  const child = spawn(
    bin('next'),
    ['dev', 'apps/web', '--port', '3000', '--webpack'],
    {
      env: localEnv,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  child.on('error', (error) => {
    console.error(`Unable to start Next.js: ${error.message}`);
    process.exitCode = 1;
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exitCode = code ?? 1;
  });
}

main().catch((error) => {
  console.error(`Local development startup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
