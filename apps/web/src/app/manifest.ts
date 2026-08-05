import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CampusOS',
    short_name: 'CampusOS',
    description:
      'Connected higher-education operations for academic, administrative and student-service teams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F8FC',
    theme_color: '#0B1731',
    orientation: 'portrait-primary',
    categories: ['education', 'business', 'productivity'],
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
