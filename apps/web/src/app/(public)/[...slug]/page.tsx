import { cookies } from 'next/headers';

import { PublicPage } from '@/components/public/PublicPage';
import { publicPageProfileForPath } from '@/components/public/public-page-data';
import type { Region } from '@/components/public/site-data';

type CatchAllProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params: paramsPromise }: CatchAllProps) {
  const params = await paramsPromise;
  const path = `/${params.slug.join('/')}`;
  const profile = publicPageProfileForPath(path);

  return {
    title: `${profile.title} | CampusOS`,
    description: profile.summary,
    alternates: { canonical: path },
    openGraph: {
      title: `${profile.title} | CampusOS`,
      description: profile.summary,
      type: 'website',
    },
  };
}

export default async function CatchAll({ params: paramsPromise }: CatchAllProps) {
  const params = await paramsPromise;
  const region = ((await cookies()).get('campus_region')?.value || 'global') as Region;
  return <PublicPage segments={params.slug} region={region} />;
}
