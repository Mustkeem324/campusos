import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DataMigrationConsole } from '@/components/system/DataMigrationConsole';
import { getDataMigrationWorkspace } from '@/lib/data-migration-workspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Data Migration Factory & Control Tower',
  robots: { index: false, follow: false },
};

export default async function DataMigrationPage() {
  try {
    const data = await getDataMigrationWorkspace();
    return <DataMigrationConsole initialData={data} />;
  } catch {
    redirect('/dashboard');
  }
}
