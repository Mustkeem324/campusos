import { redirect } from 'next/navigation';

import { CompanyContactInbox } from '@/components/company-admin/CompanyContactInbox';
import { getCompanyContactInboxData } from '@/lib/company-admin-contact';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Enquiry Inbox | CampusOS Control Center',
  robots: { index: false, follow: false },
};

export default async function CompanyContactInboxPage() {
  try {
    const data = await getCompanyContactInboxData();
    return <CompanyContactInbox data={data} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Forbidden')) redirect('/dashboard');
    redirect('/login');
  }
}
