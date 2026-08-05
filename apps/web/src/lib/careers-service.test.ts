import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCareerOpeningBySlug, getCareerOpenings } from './careers-service';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('careers service', () => {
  it('returns no placeholder vacancies in normal production configuration', () => {
    vi.stubEnv('DEMO_MODE', 'false');
    vi.stubEnv('CAREERS_JOBS_JSON', '');

    expect(getCareerOpenings()).toEqual([]);
  });

  it('returns clearly labelled example openings only in demo mode', () => {
    vi.stubEnv('DEMO_MODE', 'true');
    vi.stubEnv('CAREERS_JOBS_JSON', '');

    const openings = getCareerOpenings();

    expect(openings.length).toBeGreaterThan(0);
    expect(openings.every((opening) => opening.isDemo === true)).toBe(true);
    expect(openings.every((opening) => opening.status === 'PUBLISHED')).toBe(true);
  });

  it('does not expose unpublished configured openings through the public query', () => {
    vi.stubEnv('DEMO_MODE', 'false');
    vi.stubEnv(
      'CAREERS_JOBS_JSON',
      JSON.stringify([
        {
          id: 'published-role',
          referenceCode: 'CAR-001',
          slug: 'published-role',
          title: 'Published role',
          summary: 'Published role summary',
          department: 'Engineering',
          team: 'Platform',
          location: 'India',
          workplaceType: 'REMOTE',
          employmentType: 'FULL_TIME',
          experienceLevel: 'Mid-level',
          status: 'PUBLISHED',
          responsibilities: ['Build reliable services'],
          requiredQualifications: ['TypeScript experience'],
          preferredQualifications: [],
          skills: ['TypeScript'],
          benefits: [],
        },
        {
          id: 'draft-role',
          referenceCode: 'CAR-002',
          slug: 'draft-role',
          title: 'Draft role',
          summary: 'Draft role summary',
          department: 'Design',
          team: 'Product Design',
          location: 'India',
          workplaceType: 'HYBRID',
          employmentType: 'FULL_TIME',
          experienceLevel: 'Senior',
          status: 'DRAFT',
          responsibilities: ['Design workflows'],
          requiredQualifications: ['Product design experience'],
          preferredQualifications: [],
          skills: ['Product Design'],
          benefits: [],
        },
      ]),
    );

    expect(getCareerOpenings().map((opening) => opening.id)).toEqual(['published-role']);
    expect(getCareerOpenings({ includeUnpublished: true })).toHaveLength(2);
    expect(getCareerOpeningBySlug('draft-role')).toBeNull();
  });
});
