import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { GovernanceConsole } from '@/components/governance/GovernanceConsole';
import { getGovernanceWorkspace } from '@/lib/governance-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Institutional Governance',
  robots: { index: false, follow: false },
};

export default async function GovernancePage() {
  try {
    const data = await getGovernanceWorkspace();
    return <GovernanceConsole initialData={data} />;
  } catch {
    redirect('/dashboard');
  }
}
