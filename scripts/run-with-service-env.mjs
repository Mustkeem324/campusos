import { spawn } from 'node:child_process';

const aliases = {
  DATABASE_URL: [
    'campusos_DATABASE_URL',
    'CAMPUSOS_DATABASE_URL',
    'campusos_POSTGRES_URL',
    'CAMPUSOS_POSTGRES_URL',
    'campusos_PRISMA_DATABASE_URL',
    'CAMPUSOS_PRISMA_DATABASE_URL',
  ],
  REDIS_URL: ['campusos_REDIS_URL', 'CAMPUSOS_REDIS_URL'],
};

for (const [canonicalName, aliasNames] of Object.entries(aliases)) {
  if (process.env[canonicalName]) continue;

  const sourceName = aliasNames.find((name) => process.env[name]);
  if (!sourceName) continue;

  process.env[canonicalName] = process.env[sourceName];
  console.log(`Resolved ${canonicalName} from ${sourceName}.`);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-with-service-env.mjs <command> [...args]');
  process.exit(1);
}

// Enforce the canonical NODE_ENV for Next.js tooling. A pre-set environment
// value (e.g. a shell exporting NODE_ENV=development) makes `next build` run in
// a broken mixed mode that fails static generation with hundreds of obscure
// prerender errors, so the toolchain must always win here.
if (command === 'next') {
  const arg = args[0] ?? '';
  if (arg === 'build' || arg === 'start') {
    process.env.NODE_ENV = 'production';
  } else if (arg === 'dev') {
    process.env.NODE_ENV = 'development';
  }
}

const child = spawn(command, args, {
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error(`Unable to start ${command}: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`${command} exited after receiving ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
