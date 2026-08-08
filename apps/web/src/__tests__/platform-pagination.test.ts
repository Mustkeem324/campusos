import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor, MAX_PAGE_SIZE, pageInfo, pageSize } from '@/lib/platform/pagination';

describe('platform pagination', () => {
  it('clamps client page sizes to the safe maximum', () => {
    expect(pageSize('1000000')).toBe(MAX_PAGE_SIZE);
    expect(pageSize('nope')).toBe(50);
  });

  it('rejects a cursor from another tenant', () => {
    expect(() => decodeCursor(encodeCursor('tenant-a', 'row-a'), 'tenant-b')).toThrow(/invalid/i);
  });

  it('does not expose an extra fetched row', () => {
    const page = pageInfo([{ id: '1' }, { id: '2' }, { id: '3' }], 2, 'tenant-a');
    expect(page.items).toEqual([{ id: '1' }, { id: '2' }]);
    expect(page.pageInfo.hasNextPage).toBe(true);
  });
});
