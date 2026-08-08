import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('library membership bootstrap', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/web/src/lib/library-membership-bootstrap.ts'), 'utf8');

  it('derives a student program through the canonical batch relationship', () => {
    expect(source).toContain('JOIN public.batches b');
    expect(source).toContain('b.id = s.batch_id');
    expect(source).toContain('b.program_id');
    expect(source).not.toMatch(/\bs\.program_id\b/);
    expect(source).not.toMatch(/\bs\.is_active\b/);
  });

  it('keeps tenant scope on the academic join', () => {
    expect(source).toContain('b.tenant_id = s.tenant_id');
    expect(source).toContain('s.tenant_id = ${context.tenantId}::uuid');
    expect(source).toContain('s.user_id = ${context.userId}::uuid');
  });
});
