import { PublicPage } from '@/components/public/PublicPage';
export const metadata = { title: 'CampusOS Legal Information', description: 'CampusOS legal and data handling information.' };
export default function Page() { return <PublicPage segments={["legal","dpa"]} />; }
