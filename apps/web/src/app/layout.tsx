import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import './brand.css';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  jsonLd,
} from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: 'NAVEMORA — Connected Higher-Education Operations',
    template: '%s | NAVEMORA',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'higher education ERP',
    'student information system',
    'university management software',
    'college ERP',
    'academic management platform',
    'campus operations software',
  ],
  authors: [{ name: 'NAVEMORA Editorial Team', url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Higher Education Technology',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': absoluteUrl('/feed.xml'),
    },
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'NAVEMORA — Connected Higher-Education Operations',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'NAVEMORA connected higher-education operations platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NAVEMORA — Connected Higher-Education Operations',
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  robots: {
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1731' },
  ],
  colorScheme: 'light dark',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/icon.svg'),
  description: SITE_DESCRIPTION,
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${absoluteUrl('/resources/blog')}?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd([organizationSchema, websiteSchema]) }}
        />
        {children}
      </body>
    </html>
  );
}
