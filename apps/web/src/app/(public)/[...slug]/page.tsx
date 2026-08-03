import { cookies } from 'next/headers';
import { PublicPage } from '@/components/public/PublicPage';
import { titleFromSlug, type Region } from '@/components/public/site-data';
export async function generateMetadata({ params }: { params: { slug: string[] } }) { const title = titleFromSlug(params.slug.at(-1) || 'CampusOS'); const path = '/' + params.slug.join('/'); return { title: `${title} | CampusOS`, description: `${title} resources and product information for connected higher education operations.`, alternates: { canonical: path }, openGraph: { title: `${title} | CampusOS`, description: `${title} for modern higher education.` } }; }
export default function CatchAll({ params }: { params: { slug: string[] } }) { const r = (cookies().get('campus_region')?.value || 'us') as Region; return <PublicPage segments={params.slug} region={r} />; }
