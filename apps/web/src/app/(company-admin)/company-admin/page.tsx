import { redirect } from 'next/navigation';

import { CompanyAdminConsole } from '@/components/company-admin/CompanyAdminConsole';
import { getCompanyAdminDashboardData } from '@/lib/company-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'CampusOS Control Center',
  robots: { index: false, follow: false },
};

export default async function CompanyAdminPage() {
  try {
    const data = await getCompanyAdminDashboardData();
    return <CompanyAdminConsole data={data} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Forbidden')) redirect('/dashboard');
    redirect('/login');
  }
}
