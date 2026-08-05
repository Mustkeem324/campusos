import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const nextOutput = path.join(projectRoot, 'apps', 'web', '.next');
const requiredFiles = [
  'BUILD_ID',
  'routes-manifest.json',
  'prerender-manifest.json',
  'required-server-files.json',
];

const missing = [];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(nextOutput, relativePath);
  try {
    await access(absolutePath);
  } catch {
    missing.push(relativePath);
  }
}

if (missing.length > 0) {
  console.error(`Next.js build output is incomplete. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

try {
  const routesManifest = JSON.parse(
    await readFile(path.join(nextOutput, 'routes-manifest.json'), 'utf8'),
  );

  if (!Array.isArray(routesManifest.staticRoutes) || !Array.isArray(routesManifest.dynamicRoutes)) {
    throw new Error('routes-manifest.json does not contain valid route arrays.');
  }
} catch (error) {
  console.error(
    error instanceof Error
      ? `Next.js routes manifest validation failed: ${error.message}`
      : 'Next.js routes manifest validation failed.',
  );
  process.exit(1);
}

console.log(`Verified Next.js deployment output at ${nextOutput}`);
