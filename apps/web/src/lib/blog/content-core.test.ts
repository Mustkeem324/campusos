import { describe, expect, it } from 'vitest';

import {
  BLOG_STORAGE_KIND,
  calculateSeoScore,
  parseBlogPayload,
  serializeBlogPayload,
  slugify,
  type BlogEditorInput,
} from './content-core';

const strongArticle: BlogEditorInput = {
  title: 'Modern SIS Evaluation Framework for Universities',
  slug: 'modern-sis-evaluation-framework-universities',
  excerpt: 'A practical modern SIS evaluation framework for universities comparing workflows, architecture, implementation readiness and governance.',
  body: `Modern SIS evaluation should begin with institutional outcomes and responsible ownership.

## Define the institutional outcomes

A university should document the authoritative records, workflows, integrations and controls it needs before comparing products. ${'Evidence and context matter. '.repeat(40)}

## Test complete workflows

Review admission, registration, assessment, finance and student service from trigger to accountable completion. See the [CampusOS guides](/resources/guides) for a structured approach.

## Inspect architecture and control

Confirm identity, authorization, tenant isolation, audit history, integrations and data portability.

## Plan implementation

Assess migration, configuration, testing, training, support and operational handover.`,
  category: 'Student Information Systems',
  keywords: ['modern SIS evaluation', 'student information system', 'university ERP', 'higher education software'],
  featured: true,
  seoTitle: 'Modern SIS Evaluation Framework for Universities',
  seoDescription: 'Use this modern SIS evaluation framework to compare university platforms across workflows, architecture, governance and implementation readiness.',
  canonicalUrl: 'https://campusos.example/resources/blog/modern-sis-evaluation-framework-universities',
  coverImageUrl: 'https://campusos.example/images/sis-evaluation.png',
  coverImageAlt: 'University leaders reviewing a student information system evaluation framework',
  noIndex: false,
  status: 'PUBLISHED',
};

describe('blog content core', () => {
  it('creates stable search-friendly slugs', () => {
    expect(slugify('  University ERP & SIS: 2026 Guide  ')).toBe('university-erp-sis-2026-guide');
  });

  it('round-trips the stored content payload without executable markup', () => {
    const serialized = serializeBlogPayload(strongArticle);
    const parsed = parseBlogPayload(serialized);

    expect(parsed?.kind).toBe(BLOG_STORAGE_KIND);
    expect(parsed?.slug).toBe(strongArticle.slug);
    expect(parsed?.body).toContain('## Test complete workflows');
  });

  it('rejects unrelated community post payloads', () => {
    expect(parseBlogPayload(JSON.stringify({ type: 'RESOURCE', content: 'not a blog payload' }))).toBeNull();
  });

  it('scores a deep, well-structured article strongly', () => {
    const analysis = calculateSeoScore(strongArticle);

    expect(analysis.score).toBeGreaterThanOrEqual(85);
    expect(analysis.wordCount).toBeGreaterThanOrEqual(350);
    expect(analysis.checks.find((check) => check.id === 'internal-links')?.passed).toBe(true);
  });

  it('surfaces incomplete content rather than inventing readiness', () => {
    const analysis = calculateSeoScore({
      ...strongArticle,
      title: 'Draft',
      slug: 'draft',
      excerpt: 'Short',
      body: 'Not ready.',
      keywords: [],
      seoTitle: 'Draft',
      seoDescription: 'Short',
      canonicalUrl: '',
      coverImageUrl: '',
      coverImageAlt: '',
    });

    expect(analysis.grade).toBe('Incomplete');
    expect(analysis.score).toBeLessThan(50);
  });
});
