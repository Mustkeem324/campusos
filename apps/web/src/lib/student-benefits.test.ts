import { describe, expect, it } from 'vitest';

import {
  STUDENT_BENEFITS,
  filterStudentBenefits,
  studentBenefitCategoryCounts,
} from './student-benefits';

describe('student benefit directory', () => {
  it('uses unique ids and secure official links', () => {
    const ids = STUDENT_BENEFITS.map((benefit) => benefit.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const benefit of STUDENT_BENEFITS) {
      const url = new URL(benefit.officialUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname.endsWith(benefit.officialDomain)).toBe(true);
      expect(benefit.eligibility.length).toBeGreaterThan(20);
      expect(benefit.requirements.length).toBeGreaterThan(0);
      expect(benefit.steps.length).toBeGreaterThan(0);
      expect(benefit.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('searches providers, descriptions, tags and access labels', () => {
    expect(filterStudentBenefits(STUDENT_BENEFITS, { query: 'GitHub' }).length).toBeGreaterThan(3);
    expect(filterStudentBenefits(STUDENT_BENEFITS, { query: 'scholarship' }).some((item) => item.id === 'national-scholarship-portal')).toBe(true);
    expect(filterStudentBenefits(STUDENT_BENEFITS, { query: 'free access' }).length).toBeGreaterThan(0);
  });

  it('combines category, access and region filters', () => {
    const results = filterStudentBenefits(STUDENT_BENEFITS, {
      category: 'career',
      access: 'free',
      region: 'india',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((benefit) => benefit.category === 'career')).toBe(true);
    expect(results.every((benefit) => benefit.access === 'free')).toBe(true);
    expect(results.every((benefit) => benefit.regions.includes('india'))).toBe(true);
  });

  it('puts featured resources first and supports alphabetical sorting', () => {
    const featured = filterStudentBenefits(STUDENT_BENEFITS, { sort: 'featured' });
    const firstNonFeaturedIndex = featured.findIndex((benefit) => !benefit.featured);
    expect(featured.slice(0, firstNonFeaturedIndex).every((benefit) => benefit.featured)).toBe(true);

    const alphabetical = filterStudentBenefits(STUDENT_BENEFITS, { sort: 'az' });
    const titles = alphabetical.map((benefit) => benefit.title);
    expect(titles).toEqual([...titles].sort((left, right) => left.localeCompare(right, 'en-IN')));
  });

  it('counts every category without losing records', () => {
    const counts = studentBenefitCategoryCounts(STUDENT_BENEFITS);
    expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(STUDENT_BENEFITS.length);
    expect(counts.technology).toBeGreaterThan(0);
    expect(counts.wellbeing).toBeGreaterThan(0);
  });
});
