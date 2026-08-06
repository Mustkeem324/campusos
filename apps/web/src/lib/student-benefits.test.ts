import { describe, expect, it } from 'vitest';

import {
  STUDENT_BENEFITS,
  filterStudentBenefits,
} from './student-benefits';

describe('student benefits directory', () => {
  it('contains unique, official HTTPS destinations with review dates', () => {
    const ids = new Set(STUDENT_BENEFITS.map((benefit) => benefit.id));

    expect(ids.size).toBe(STUDENT_BENEFITS.length);
    expect(STUDENT_BENEFITS.length).toBeGreaterThanOrEqual(18);

    for (const benefit of STUDENT_BENEFITS) {
      expect(benefit.claimUrl.startsWith('https://')).toBe(true);
      expect(benefit.sourceUrl.startsWith('https://')).toBe(true);
      expect(benefit.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(benefit.requirements.length).toBeGreaterThan(0);
      expect(benefit.tags.length).toBeGreaterThan(0);
    }
  });

  it('searches titles, providers, descriptions and tags', () => {
    const python = filterStudentBenefits(STUDENT_BENEFITS, { query: 'Python' });
    const microsoft = filterStudentBenefits(STUDENT_BENEFITS, { query: 'Microsoft' });

    expect(python.some((benefit) => benefit.id === 'jetbrains-student-pack')).toBe(true);
    expect(python.some((benefit) => benefit.id === 'datacamp-pack')).toBe(true);
    expect(microsoft.map((benefit) => benefit.id)).toEqual(
      expect.arrayContaining(['azure-for-students', 'office-365-education']),
    );
  });

  it('combines category, offer type and saved-only filters', () => {
    const savedIds = new Set(['azure-for-students', 'digitalocean-pack', 'github-student-pack']);
    const results = filterStudentBenefits(STUDENT_BENEFITS, {
      category: 'cloud',
      kind: 'credit',
      savedIds,
      savedOnly: true,
    });

    expect(results.map((benefit) => benefit.id)).toEqual([
      'azure-for-students',
      'digitalocean-pack',
    ]);
  });

  it('does not describe every benefit as free', () => {
    const kinds = new Set(STUDENT_BENEFITS.map((benefit) => benefit.kind));

    expect(kinds).toEqual(new Set(['free', 'credit', 'discount', 'institution']));
  });
});
