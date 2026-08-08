import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AIGovernanceConsole } from '@/components/ai/AIGovernanceConsole';
import { getAIGovernanceWorkspace } from '@/lib/ai-governance-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'AI Governance & Model Operations',
  robots: { index: false, follow: false },
};

export default async function AIGovernancePage() {
  try {
    const data = await getAIGovernanceWorkspace();
    return <AIGovernanceConsole initialData={data} />;
  } catch {
    redirect('/dashboard');
  }
}
