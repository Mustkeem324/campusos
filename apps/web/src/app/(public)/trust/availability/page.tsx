import { PublicPage } from '@/components/public/PublicPage';
import type { Region } from '@/components/public/site-data';
import { cookies } from 'next/headers';

export const metadata = { title: 'Availability | CampusOS Trust Centre', description: 'CampusOS availability and continuity information.' };

export default async function AvailabilityPage() {
  const region = ((await cookies()).get('campus_region')?.value || 'us') as Region;
  return <PublicPage segments={['trust', 'availability']} region={region} />;
}
