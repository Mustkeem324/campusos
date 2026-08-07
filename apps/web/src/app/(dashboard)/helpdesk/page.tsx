import { redirect } from 'next/navigation';

import { RoleHelpdeskConsole } from '../../../components/campus/RoleHelpdeskConsole';
import { getHelpdeskWorkspaceData, HelpdeskError } from '../../../lib/helpdesk';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Helpdesk & Escalation Center | CampusOS',
  robots: { index: false, follow: false },
};

export default async function HelpdeskPage() {
  try {
    const data = await getHelpdeskWorkspaceData();
    return <RoleHelpdeskConsole data={data} />;
  } catch (error) {
    if (error instanceof HelpdeskError && error.status === 403) redirect('/company-admin/support');
    redirect('/login');
  }
}
