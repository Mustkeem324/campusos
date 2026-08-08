import Link from 'next/link';
import { Radio, Settings2 } from 'lucide-react';

import { SecureExaminationWorkspaceClient } from '@/components/examinations/SecureExaminationWorkspaceClient';

export default function ExaminationAdminPage() {
  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pt-4 sm:px-6 lg:px-8">
        <Link href="/examinations/proctor" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><Radio className="h-4 w-4 text-red-600" />Live proctoring</Link>
        <Link href="/examinations/runtime" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><Settings2 className="h-4 w-4 text-blue-700" />Media, AI & secure client</Link>
      </div>
      <SecureExaminationWorkspaceClient />
    </>
  );
}