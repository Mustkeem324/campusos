import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isWorkforceOperator } from '@/lib/workforce-policy';

import { EmployeeSelfService } from '../../../components/workforce/EmployeeSelfService';

export const dynamic = 'force-dynamic';

export default async function WorkforcePage() {
  const context = await requireActiveUserContext();
  if (isWorkforceOperator(context)) {
    redirect('/workforce/admin');
  }
  // Self-service is available to any account with a linked employee profile
  // (faculty, HOD, deans and operational staff). Students/parents get the
  // dashboard instead — they have no employee records.
  if (context.activeRole === 'STUDENT' || context.activeRole === 'PARENT') {
    redirect('/dashboard');
  }
  return <EmployeeSelfService />;
}
