import { redirect } from 'next/navigation';

import { CompanyInstitutionSupportInbox } from '@/components/company-admin/CompanyInstitutionSupportInbox';
import { getCompanySupportInboxData } from '@/lib/company-admin-support';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Institution Support | CampusOS Control Center',
  robots: { index: false, follow: false },
};

export default async function CompanyInstitutionSupportPage() {
  try {
    const data = await getCompanySupportInboxData();
    return <CompanyInstitutionSupportInbox data={data} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Forbidden')) redirect('/dashboard');
    redirect('/login');
  }
}
