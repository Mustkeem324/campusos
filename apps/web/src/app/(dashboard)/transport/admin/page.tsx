import { redirect } from 'next/navigation';

import { TransportAdminConsole } from '../../../../components/campus/TransportAdminConsole';
import { TransportPhase2AdminPanel } from '../../../../components/campus/TransportPhase2AdminPanel';
import { getTransportAdminData, TransportError } from '../../../../lib/transport-gps';
import { getTransportPhase2AdminData, TransportPhase2Error } from '../../../../lib/transport-gps-phase2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Transport GPS Control | CampusOS',
  robots: { index: false, follow: false },
};

export default async function TransportAdminPage() {
  try {
    const [data, phase2] = await Promise.all([
      getTransportAdminData(),
      getTransportPhase2AdminData(),
    ]);
    return (
      <>
        <TransportAdminConsole data={data} />
        <TransportPhase2AdminPanel data={phase2} />
      </>
    );
  } catch (error) {
    if ((error instanceof TransportError || error instanceof TransportPhase2Error) && error.status === 403) redirect('/dashboard');
    redirect('/login');
  }
}
