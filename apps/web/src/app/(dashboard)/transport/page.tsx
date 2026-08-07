import { redirect } from 'next/navigation';

import { TransportTrackerConsole } from '../../../components/campus/TransportTrackerConsole';
import { getTransportWorkspaceData, TransportError } from '../../../lib/transport-gps';
import { clientSafeTransportWorkspace } from '../../../lib/transport-gps-sanitize';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Live Transport GPS | CampusOS',
};

export default async function Page() {
  try {
    const data = clientSafeTransportWorkspace(await getTransportWorkspaceData());
    return <TransportTrackerConsole initialData={data} />;
  } catch (error) {
    if (error instanceof TransportError && error.status === 403) redirect('/dashboard');
    redirect('/login');
  }
}
