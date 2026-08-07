import { redirect } from 'next/navigation';

import { TransportAdminConsole } from '../../../../components/campus/TransportAdminConsole';
import { getTransportAdminData, TransportError } from '../../../../lib/transport-gps';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Transport GPS Control | CampusOS',
  robots: { index: false, follow: false },
};

export default async function TransportAdminPage() {
  try {
    const data = await getTransportAdminData();
    return <TransportAdminConsole data={data} />;
  } catch (error) {
    if (error instanceof TransportError && error.status === 403) redirect('/dashboard');
    redirect('/login');
  }
}
