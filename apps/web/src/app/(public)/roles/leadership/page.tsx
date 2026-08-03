import { cookies } from 'next/headers';
import { PublicPage } from '@/components/public/PublicPage';
import type { Region } from '@/components/public/site-data';
export const metadata = { title: 'CampusOS | Higher Education Operations', description: 'CampusOS product information for connected higher education operations.' };
export default function Page() { const region = (cookies().get('campus_region')?.value || 'us') as Region; return <PublicPage segments={["roles","leadership"]} region={region} />; }
