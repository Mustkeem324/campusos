import type { EnterpriseHomeData } from './workspace';

/**
 * Explicit client boundary for the homepage payload.
 *
 * Several underlying dashboard loaders intentionally carry internal identifiers
 * on their identity objects. The public-layout homepage never needs those IDs,
 * so construct the exact client-safe shape before React serialises the payload.
 */
export function sanitizeEnterpriseHomeData(data: EnterpriseHomeData): EnterpriseHomeData {
  return {
    role: data.role,
    identity: {
      name: data.identity.name,
      email: data.identity.email,
      title: data.identity.title,
    },
    heading: { ...data.heading },
    metrics: data.metrics.map((item) => ({ ...item })),
    summaries: data.summaries.map((item) => ({ ...item })),
    work: {
      title: data.work.title,
      description: data.work.description,
      items: data.work.items.map((item) => ({ ...item })),
    },
    upcoming: data.upcoming.map((item) => ({ ...item })),
    alerts: data.alerts.map((item) => ({ ...item })),
    actions: data.actions.map((item) => ({ ...item })),
    notices: data.notices.map((item) => ({ ...item })),
    activity: data.activity.map((item) => ({ ...item })),
    generatedAt: data.generatedAt,
    dataScopeLabel: data.dataScopeLabel,
  };
}
