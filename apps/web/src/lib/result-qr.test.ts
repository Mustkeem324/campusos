import crypto from 'crypto';
import { describe, expect, it } from 'vitest';

import { createResultQrMatrix, resultQrSvgDataUri } from './result-qr';

const KNOWN_URL = 'https://campus.example.edu/verify/result/12345678-1234-1234-1234-123456789abc.ABCDEFGHIJKLMNOPQRSTUVWXYZA';

describe('official result verification QR', () => {
  it('matches a known standards-compliant Version 6-L byte-mode matrix', () => {
    const matrix = createResultQrMatrix(KNOWN_URL);
    expect(matrix).not.toBeNull();
    expect(matrix).toHaveLength(41);
    expect(matrix?.every((row) => row.length === 41)).toBe(true);

    const bits = matrix!.flat().map((value) => value ? '1' : '0').join('');
    expect(matrix!.flat().filter(Boolean)).toHaveLength(866);
    expect(crypto.createHash('sha256').update(bits).digest('hex')).toBe('542f54a0ab4d7618f118c056d1dc4ffb036e0a7b0b81fa9939a2a9203017d11e');
  });

  it('returns a usable SVG data URI for supported verification URLs', () => {
    const uri = resultQrSvgDataUri(KNOWN_URL);
    expect(uri).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(decodeURIComponent(uri!)).toContain('<svg');
  });

  it('refuses payloads beyond the fixed QR version capacity', () => {
    expect(createResultQrMatrix('x'.repeat(135))).toBeNull();
  });
});
