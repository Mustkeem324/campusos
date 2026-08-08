import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { InternationalStudentsConsole } from '@/components/international/InternationalStudentsConsole';
import { getInternationalWorkspace } from '@/lib/international-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'International Students & Global Mobility',
  robots: { index: false, follow: false },
};

export default async function InternationalPage() {
  try {
    const data = await getInternationalWorkspace();
    return <InternationalStudentsConsole initialData={data} />;
  } catch {
    redirect('/dashboard');
  }
}
