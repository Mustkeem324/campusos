import { redirect } from 'next/navigation';

import { TransportPhase2LivePanel } from '../../../components/campus/TransportPhase2LivePanel';
import { TransportTrackerConsole } from '../../../components/campus/TransportTrackerConsole';
import { getTransportWorkspaceData, TransportError } from '../../../lib/transport-gps';
import { getTransportPhase2LiveData, TransportPhase2Error } from '../../../lib/transport-gps-phase2';
import { clientSafeTransportWorkspace } from '../../../lib/transport-gps-sanitize';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Live Transport GPS | CampusOS',
};

export default async function Page() {
  try {
    const [workspace, phase2] = await Promise.all([
      getTransportWorkspaceData(),
      getTransportPhase2LiveData(),
    ]);
    const data = clientSafeTransportWorkspace(workspace);
    return (
      <>
        <TransportTrackerConsole initialData={data} />
        <TransportPhase2LivePanel initialData={phase2} />
      </>
    );
  } catch (error) {
    if ((error instanceof TransportError || error instanceof TransportPhase2Error) && error.status === 403) redirect('/dashboard');
    redirect('/login');
  }
}
