import { redirect } from 'next/navigation';
import { dashboardPathForRole, requireActiveUserContext } from '@/lib/active-user-context';
import { dashboardRouteForRole } from '@/lib/dashboard/registry';

/**
 * Role-aware dashboard landing.
 *
 * - Roles with a defined dashboard route (Student, Faculty, Parent, Admin) are
 *   redirected to their dedicated dashboard.
 * - Roles without a dashboard yet render a role-scoped placeholder instead of
 *   redirecting to themselves (fixes the previous redirect-to-self loop).
 */
export default async function DashboardPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const route = dashboardRouteForRole(context.activeRole);
  if (route !== '/dashboard') {
    redirect(dashboardPathForRole(context.activeRole));
  }

  const roleLabel = context.activeRole
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-[12px] font-bold text-primary">
          {roleLabel} Workspace
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-text-primary">
          Welcome to your workspace
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
          A dedicated {roleLabel} dashboard is being prepared for your role. Use the
          navigation to access the modules available to you.
        </p>
      </header>
    </section>
  );
}
