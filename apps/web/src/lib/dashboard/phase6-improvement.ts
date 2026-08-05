import type { Phase6ExperienceData, Phase6QueueItem, Phase6Signal } from './phase6-contracts';

export type Phase6ImprovementAction = {
  id: string;
  title: string;
  evidence: string;
  href: string;
  kind: 'focus' | 'complete' | 'review' | 'maintain';
};

export type Phase6ImprovementPlan = {
  evidenceCoverage: number;
  strongestArea: {
    label: string;
    value: string | number;
    percentage: number;
  } | null;
  focusArea: {
    label: string;
    value: string | number;
    percentage: number;
  } | null;
  actions: Phase6ImprovementAction[];
};

/**
 * Builds a deterministic self-improvement plan from the role signals and
 * pending actions already authorised for the signed-in user. The percentage is
 * an evidence-coverage aid, not an employee, student or institutional rating.
 */
export function buildPhase6ImprovementPlan(data: Phase6ExperienceData): Phase6ImprovementPlan {
  const rankedSignals = [...data.signals].sort((left, right) => right.percentage - left.percentage);
  const strongestSignal = rankedSignals[0] ?? null;
  const focusSignal = rankedSignals.at(-1) ?? null;
  const evidenceCoverage = data.signals.length > 0
    ? Math.round(data.signals.reduce((sum, signal) => sum + signal.percentage, 0) / data.signals.length)
    : 0;

  const actions: Phase6ImprovementAction[] = [];

  if (focusSignal) {
    actions.push(actionFromSignal(focusSignal));
  }

  const firstQueueItem = data.queue.items[0];
  if (firstQueueItem) {
    actions.push(actionFromQueue(firstQueueItem));
  }

  if (data.context.unreadNotifications > 0) {
    actions.push({
      id: 'phase6-improvement-notifications',
      title: 'Review unread workspace updates',
      evidence: `${data.context.unreadNotifications} unread notification${data.context.unreadNotifications === 1 ? '' : 's'} may affect your next action.`,
      href: '/notifications',
      kind: 'review',
    });
  }

  if (data.context.openSupportCases > 0) {
    actions.push({
      id: 'phase6-improvement-support',
      title: 'Continue open support cases',
      evidence: `${data.context.openSupportCases} support case${data.context.openSupportCases === 1 ? '' : 's'} remain open for your account.`,
      href: '/support/cases',
      kind: 'complete',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'phase6-improvement-primary-action',
      title: data.blueprint.primaryAction.label,
      evidence: 'No urgent exception is currently available, so continue the primary role workflow.',
      href: data.blueprint.primaryAction.href,
      kind: 'maintain',
    });
  }

  const uniqueActions = actions.filter(
    (action, index, list) => list.findIndex((candidate) => candidate.href === action.href && candidate.title === action.title) === index,
  );

  return {
    evidenceCoverage: Math.max(0, Math.min(100, evidenceCoverage)),
    strongestArea: strongestSignal
      ? {
          label: strongestSignal.label,
          value: strongestSignal.value,
          percentage: strongestSignal.percentage,
        }
      : null,
    focusArea: focusSignal
      ? {
          label: focusSignal.label,
          value: focusSignal.value,
          percentage: focusSignal.percentage,
        }
      : null,
    actions: uniqueActions.slice(0, 3),
  };
}

function actionFromSignal(signal: Phase6Signal): Phase6ImprovementAction {
  return {
    id: `phase6-improvement-signal-${signal.id}`,
    title: signal.percentage >= 80 ? `Maintain ${signal.label}` : `Strengthen ${signal.label}`,
    evidence: `${signal.detail} · current evidence ${signal.percentage}%`,
    href: signal.href ?? '/dashboard',
    kind: signal.percentage >= 80 ? 'maintain' : 'focus',
  };
}

function actionFromQueue(item: Phase6QueueItem): Phase6ImprovementAction {
  return {
    id: `phase6-improvement-queue-${item.id}`,
    title: item.title,
    evidence: item.detail,
    href: item.href,
    kind: 'complete',
  };
}
