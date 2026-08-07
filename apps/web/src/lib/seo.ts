import type { Metadata } from 'next';

export const SITE_NAME = 'NAVEMORA';
export const SITE_DESCRIPTION =
  'NAVEMORA is a connected higher-education operating platform for academic, administrative, finance and student-service teams.';

function normalizeSiteOrigin(value: string | undefined): string {
  const fallback = 'https://navemora.example';
  if (!value) return fallback;

  const candidate = value.startsWith('http://') || value.startsWith('https://')
    ? value
    : `https://${value}`;

  try {
    return new URL(candidate).origin;
  } catch {
    return fallback;
  }
}

export const SITE_URL = normalizeSiteOrigin(
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL,
);

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  imagePath?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  imagePath = '/opengraph-image',
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(imagePath);
  const commonOpenGraph = {
    siteName: SITE_NAME,
    title,
    description,
    url: canonical,
    images: [{ url: image, width: 1200, height: 630, alt: title }],
  };
  const openGraph: Metadata['openGraph'] = type === 'article'
    ? {
        ...commonOpenGraph,
        type: 'article',
        ...(publishedTime ? { publishedTime } : {}),
        ...(modifiedTime ? { modifiedTime } : {}),
        ...(authors ? { authors } : {}),
      }
    : { ...commonOpenGraph, type: 'website' };

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
