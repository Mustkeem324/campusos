import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { HostelManagementConsole } from '@/components/campus/HostelManagementConsole';
import { getHostelWorkspaceData } from '@/lib/hostel-operations';
import { clientSafeHostelWorkspace } from '@/lib/hostel-sanitize';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Hostel',
  robots: { index: false, follow: false },
};

export default async function HostelPage() {
  try {
    const data = clientSafeHostelWorkspace(await getHostelWorkspaceData());
    return <HostelManagementConsole initialData={data} />;
  } catch {
    redirect('/dashboard');
  }
}
