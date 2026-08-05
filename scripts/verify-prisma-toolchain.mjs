import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const packageLock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));

const clientSpec = packageJson.dependencies?.['@prisma/client'];
const cliSpec = packageJson.devDependencies?.prisma;
const clientVersion = packageLock.packages?.['node_modules/@prisma/client']?.version;
const cliVersion = packageLock.packages?.['node_modules/prisma']?.version;

const failures = [];

if (!clientSpec || !cliSpec) {
  failures.push('Both @prisma/client and prisma must be declared in package.json.');
}

if (!clientVersion || !cliVersion) {
  failures.push('Both @prisma/client and prisma must be resolved in package-lock.json.');
}

const major = (value) => {
  const match = String(value ?? '').match(/\d+/);
  return match ? Number(match[0]) : Number.NaN;
};

if (clientSpec && cliSpec && major(clientSpec) !== major(cliSpec)) {
  failures.push(
    `package.json Prisma major versions differ: @prisma/client=${clientSpec}, prisma=${cliSpec}.`,
  );
}

if (clientVersion && cliVersion && major(clientVersion) !== major(cliVersion)) {
  failures.push(
    `package-lock.json Prisma major versions differ: @prisma/client=${clientVersion}, prisma=${cliVersion}.`,
  );
}

if (failures.length > 0) {
  console.error('Prisma toolchain verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Upgrade prisma and @prisma/client together, with a reviewed migration plan for major releases.');
  process.exit(1);
}

console.log(
  `Verified compatible Prisma toolchain: @prisma/client ${clientVersion}, prisma ${cliVersion}.`,
);
