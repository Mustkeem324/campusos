import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function tenantModelsFromSchema(schema: string) {
  const models = new Set<string>();
  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  for (const match of schema.matchAll(modelPattern)) {
    const [, name, body] = match;
    if (/^\s*tenantId\s+\w+/m.test(body)) models.add(name);
  }
  return models;
}

function tenantModelsFromDbSource(source: string) {
  const listMatch = source.match(/const\s+TENANT_MODELS\s*=\s*\[([\s\S]*?)\];/);
  if (!listMatch) throw new Error('TENANT_MODELS list could not be parsed from db.ts');
  const models = new Set<string>();
  for (const match of listMatch[1].matchAll(/['"]([A-Za-z0-9_]+)['"]/g)) models.add(match[1]);
  return models;
}

describe('tenant ORM isolation coverage', () => {
  it('scopes every Prisma model that owns a direct tenantId field', () => {
    const schema = readFileSync(resolve(process.cwd(), 'packages/db/prisma/schema.prisma'), 'utf8');
    const dbSource = readFileSync(resolve(process.cwd(), 'apps/web/src/lib/db.ts'), 'utf8');
    const schemaModels = tenantModelsFromSchema(schema);
    const isolatedModels = tenantModelsFromDbSource(dbSource);

    const missing = [...schemaModels].filter((model) => !isolatedModels.has(model)).sort();
    const invalid = [...isolatedModels].filter((model) => !schemaModels.has(model)).sort();

    expect(missing, `Tenant models missing ORM isolation:\n${missing.join('\n')}`).toEqual([]);
    expect(invalid, `TENANT_MODELS entries without a direct tenantId field:\n${invalid.join('\n')}`).toEqual([]);
  });
});
