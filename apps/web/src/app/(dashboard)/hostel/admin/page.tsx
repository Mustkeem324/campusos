import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { HostelAdminConsole } from '@/components/campus/HostelAdminConsole';
import { getHostelAdminData } from '@/lib/hostel-operations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Hostel Control',
  robots: { index: false, follow: false },
};

export default async function HostelAdminPage() {
  try {
    const data = await getHostelAdminData();
    return (
      <HostelAdminConsole
        initialData={{
          ...data,
          providers: data.providers.map((provider) => ({
            ...provider,
            last_sync_at: provider.last_sync_at?.toISOString() ?? null,
          })),
        }}
      />
    );
  } catch {
    redirect('/dashboard');
  }
}
