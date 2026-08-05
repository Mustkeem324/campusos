export const BLOG_STORAGE_KIND = 'CAMPUSOS_BLOG_V1' as const;

export const BLOG_STATUSES = ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export type BlogSource = 'starter' | 'database';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  keywords: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  noIndex: boolean;
  status: BlogStatus;
  scheduledAt?: string;
  source: BlogSource;
};

export type BlogEditorInput = Omit<
  BlogPost,
  'id' | 'author' | 'publishedAt' | 'updatedAt' | 'readingMinutes' | 'source'
> & {
  id?: string;
  publishedAt?: string;
  scheduledAt?: string;
};

export type StoredBlogPayload = {
  kind: typeof BLOG_STORAGE_KIND;
  version: 1;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  noIndex: boolean;
};

export type SeoCheck = {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  recommendation: string;
};

export type SeoAnalysis = {
  score: number;
  grade: 'Excellent' | 'Strong' | 'Needs work' | 'Incomplete';
  checks: SeoCheck[];
  wordCount: number;
  readingMinutes: number;
};

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*>]\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(value: string): number {
  const clean = stripMarkdown(value);
  return clean.length === 0 ? 0 : clean.split(/\s+/).length;
}

export function estimateReadingTime(value: string): number {
  return Math.max(1, Math.ceil(countWords(value) / 220));
}

export function serializeBlogPayload(input: BlogEditorInput): string {
  const payload: StoredBlogPayload = {
    kind: BLOG_STORAGE_KIND,
    version: 1,
    slug: slugify(input.slug || input.title),
    excerpt: input.excerpt.trim(),
    body: input.body.trim(),
    category: input.category.trim(),
    keywords: input.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    seoTitle: input.seoTitle.trim(),
    seoDescription: input.seoDescription.trim(),
    canonicalUrl: input.canonicalUrl?.trim() || undefined,
    coverImageUrl: input.coverImageUrl?.trim() || undefined,
    coverImageAlt: input.coverImageAlt?.trim() || undefined,
    noIndex: input.noIndex,
  };

  return JSON.stringify(payload);
}

export function parseBlogPayload(value: string): StoredBlogPayload | null {
  try {
    const candidate = JSON.parse(value) as Partial<StoredBlogPayload>;
    if (
      candidate.kind !== BLOG_STORAGE_KIND ||
      candidate.version !== 1 ||
      typeof candidate.slug !== 'string' ||
      typeof candidate.excerpt !== 'string' ||
      typeof candidate.body !== 'string' ||
      typeof candidate.category !== 'string' ||
      !Array.isArray(candidate.keywords) ||
      !candidate.keywords.every((keyword) => typeof keyword === 'string') ||
      typeof candidate.seoTitle !== 'string' ||
      typeof candidate.seoDescription !== 'string' ||
      typeof candidate.noIndex !== 'boolean'
    ) {
      return null;
    }

    return candidate as StoredBlogPayload;
  } catch {
    return null;
  }
}

function includesKeyword(value: string, keyword: string): boolean {
  return value.toLowerCase().includes(keyword.toLowerCase());
}

export function calculateSeoScore(input: Pick<
  BlogEditorInput,
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'body'
  | 'keywords'
  | 'seoTitle'
  | 'seoDescription'
  | 'canonicalUrl'
  | 'coverImageUrl'
  | 'coverImageAlt'
>): SeoAnalysis {
  const primaryKeyword = input.keywords[0]?.trim() ?? '';
  const wordCount = countWords(input.body);
  const headingCount = (input.body.match(/^##\s+/gm) ?? []).length;
  const internalLinkCount = (input.body.match(/\]\(\//g) ?? []).length;
  const opening = stripMarkdown(input.body).slice(0, 300);

  const checks: SeoCheck[] = [
    {
      id: 'seo-title',
      label: 'SEO title length',
      passed: input.seoTitle.length >= 40 && input.seoTitle.length <= 60,
      points: 12,
      recommendation: 'Keep the SEO title between 40 and 60 characters.',
    },
    {
      id: 'meta-description',
      label: 'Meta description length',
      passed: input.seoDescription.length >= 120 && input.seoDescription.length <= 160,
      points: 14,
      recommendation: 'Write a specific meta description between 120 and 160 characters.',
    },
    {
      id: 'clean-slug',
      label: 'Readable URL slug',
      passed: input.slug.length >= 8 && input.slug.length <= 75 && input.slug === slugify(input.slug),
      points: 8,
      recommendation: 'Use a concise lowercase slug with meaningful words.',
    },
    {
      id: 'primary-keyword',
      label: 'Primary keyword placement',
      passed:
        primaryKeyword.length > 0 &&
        includesKeyword(`${input.title} ${input.excerpt} ${opening}`, primaryKeyword),
      points: 12,
      recommendation: 'Use the primary keyword naturally in the title, excerpt or opening.',
    },
    {
      id: 'content-depth',
      label: 'Content depth',
      passed: wordCount >= 350,
      points: 12,
      recommendation: 'Develop the article to at least 350 useful words.',
    },
    {
      id: 'headings',
      label: 'Scannable headings',
      passed: headingCount >= 3,
      points: 10,
      recommendation: 'Add at least three descriptive H2 sections.',
    },
    {
      id: 'internal-links',
      label: 'Internal linking',
      passed: internalLinkCount >= 1,
      points: 8,
      recommendation: 'Link to at least one relevant CampusOS guide or product page.',
    },
    {
      id: 'keyword-set',
      label: 'Keyword coverage',
      passed: input.keywords.length >= 3 && input.keywords.length <= 8,
      points: 8,
      recommendation: 'Use three to eight closely related search phrases.',
    },
    {
      id: 'excerpt',
      label: 'Editorial excerpt',
      passed: input.excerpt.length >= 90 && input.excerpt.length <= 190,
      points: 8,
      recommendation: 'Keep the excerpt between 90 and 190 characters.',
    },
    {
      id: 'social-image',
      label: 'Social image accessibility',
      passed:
        (!input.coverImageUrl && !input.coverImageAlt) ||
        (Boolean(input.coverImageUrl) && Boolean(input.coverImageAlt?.trim())),
      points: 4,
      recommendation: 'When using a cover image, include meaningful alt text.',
    },
    {
      id: 'canonical',
      label: 'Canonical URL',
      passed: !input.canonicalUrl || /^https?:\/\//.test(input.canonicalUrl),
      points: 4,
      recommendation: 'Use a valid absolute canonical URL or leave it blank for the default.',
    },
    {
      id: 'title-alignment',
      label: 'Title alignment',
      passed:
        input.title.length > 0 &&
        (input.seoTitle.toLowerCase().includes(input.title.toLowerCase().slice(0, 24)) ||
          input.title.toLowerCase().includes(input.seoTitle.toLowerCase().slice(0, 24))),
      points: 4,
      recommendation: 'Keep the editorial and search titles closely aligned.',
    },
  ];

  const score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
  const grade = score >= 90 ? 'Excellent' : score >= 75 ? 'Strong' : score >= 50 ? 'Needs work' : 'Incomplete';

  return { score, grade, checks, wordCount, readingMinutes: estimateReadingTime(input.body) };
}

export function starterPost(input: Omit<BlogPost, 'id' | 'author' | 'readingMinutes' | 'seoTitle' | 'seoDescription' | 'noIndex' | 'status' | 'source'>): BlogPost {
  return {
    ...input,
    id: `starter:${input.slug}`,
    author: 'CampusOS Editorial Team',
    readingMinutes: estimateReadingTime(input.body),
    seoTitle: input.title.length <= 60 ? input.title : `${input.title.slice(0, 57).trim()}...`,
    seoDescription: input.excerpt.length <= 160 ? input.excerpt : `${input.excerpt.slice(0, 157).trim()}...`,
    noIndex: false,
    status: 'PUBLISHED',
    source: 'starter',
  };
}
