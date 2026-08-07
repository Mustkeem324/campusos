import Link from 'next/link';
import { Headphones, Inbox } from 'lucide-react';
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
    return (
      <>
        <CompanyAdminConsole data={data} />
        <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-stretch gap-2 sm:flex-row">
          <Link
            href="/company-admin/support"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#2C405F] bg-[#101D38] px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(16,29,56,0.24)] transition hover:bg-[#172A4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
          >
            <Headphones className="h-4.5 w-4.5" />
            Institution support
          </Link>
          <Link
            href="/company-admin/inbox"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#0F3EB9] bg-[#1754E8] px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(23,84,232,0.32)] transition hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
          >
            <Inbox className="h-4.5 w-4.5" />
            Enquiry inbox
          </Link>
        </div>
      </>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Forbidden')) redirect('/dashboard');
    redirect('/login');
  }
}
