import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const SOURCE_ROOT = resolve(process.cwd(), 'apps/web/src');
const API_ROOT = resolve(SOURCE_ROOT, 'app/api');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(directory: string): string[] {
  const output: string[] = [];
  for (const name of readdirSync(directory)) {
    if (name === 'node_modules' || name === '.next') continue;
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) output.push(...walk(path));
    else if (SOURCE_EXTENSIONS.has(extname(path))) output.push(path);
  }
  return output;
}

function routeFileFor(apiPath: string) {
  const clean = apiPath.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '');
  return resolve(API_ROOT, clean, 'route.ts');
}

describe('frontend API route contracts', () => {
  it('does not call missing literal API routes', () => {
    const missing: string[] = [];
    const fetchPattern = /fetch\(\s*(['"])(\/api\/[^'"\s]+)\1/g;

    for (const file of walk(SOURCE_ROOT)) {
      if (file.startsWith(API_ROOT) || file.includes(`${join('__tests__', '')}`)) continue;
      const content = readFileSync(file, 'utf8');
      for (const match of content.matchAll(fetchPattern)) {
        const apiPath = match[2];
        // Template/dynamic URLs cannot be resolved statically by this contract test.
        if (apiPath.includes('${') || apiPath.includes('*')) continue;
        const routeFile = routeFileFor(apiPath);
        if (!existsSync(routeFile)) {
          missing.push(`${relative(SOURCE_ROOT, file)} -> ${apiPath}`);
        }
      }
    }

    expect(missing, `Frontend calls missing API routes:\n${missing.join('\n')}`).toEqual([]);
  });
});
