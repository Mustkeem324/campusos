import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

import { SITE_DESCRIPTION, SITE_NAME } from './seo';

const require = createRequire(import.meta.url);
const transform = require('../../scripts/navemora-brand-loader.cjs') as (source: string) => string;

describe('NAVEMORA brand migration', () => {
  it('uses NAVEMORA as the public SEO identity', () => {
    expect(SITE_NAME).toBe('NAVEMORA');
    expect(SITE_DESCRIPTION).toContain('NAVEMORA');
    expect(SITE_DESCRIPTION).not.toContain('CampusOS');
  });

  it('rebrands the exact legacy product word across compiled source', () => {
    expect(transform('CampusOS platform | About CampusOS')).toBe('NAVEMORA platform | About NAVEMORA');
  });

  it('preserves technical identifiers that existing deployments depend on', () => {
    const technical = 'CAMPUSOS_AI_MODEL campusos_session campusos_control campusos:toggle-mobile-navigation';
    expect(transform(technical)).toBe(technical);
  });
});
