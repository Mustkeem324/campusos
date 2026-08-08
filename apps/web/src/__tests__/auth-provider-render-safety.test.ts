import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AuthProvider render safety', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/web/src/app/(dashboard)/AuthProvider.tsx'), 'utf8');

  it('does not mutate the auth store synchronously while rendering', () => {
    expect(source).not.toContain('useAuthStore.getState().setSession');
    expect(source).not.toContain('if (!initialized.current)');
    expect(source).toContain('useEffect(() =>');
    expect(source).toContain('setSession(initialSession)');
  });
});
