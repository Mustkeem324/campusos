'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import type { Phase6ExperienceData } from '@/lib/dashboard/phase6-contracts';
import {
  buildPhase6ImprovementPlan,
  type Phase6ImprovementAction,
} from '@/lib/dashboard/phase6-improvement';

export function Phase6SelfImprovement({ data }: { data: Phase6ExperienceData | null }) {
  const pathname = usePathname();

  if (!data || !pathname.startsWith('/dashboard')) return null;

  const plan = buildPhase6ImprovementPlan(data);
  const style = {
    '--improvement-accent': data.blueprint.accent,
    '--improvement-soft': data.blueprint.softAccent,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="mb-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-950 sm:mb-6 sm:rounded-[28px]"
      aria-labelledby="phase6-self-improvement-title"
    >
      <div className="grid xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div className="border-b border-slate-200 bg-slate-950 p-5 text-white dark:border-slate-800 sm:p-6 xl:border-b-0 xl:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span
                className="inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-[10px] font-extrabold uppercase tracking-[0.13em]"
                style={{ backgroundColor: data.blueprint.accent }}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Self-improvement
              </span>
              <h2 id="phase6-self-improvement-title" className="mt-4 text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">
                Your next best actions
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                A rule-based plan generated from your authorised role signals, pending work and account context.
              </p>
            </div>
            <Target className="h-8 w-8 shrink-0" style={{ color: data.blueprint.accent }} aria-hidden="true" />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Evidence coverage</p>
                <p className="mt-2 text-3xl font-extrabold">{plan.evidenceCoverage}%</p>
              </div>
              <TrendingUp className="h-6 w-6" style={{ color: data.blueprint.accent }} aria-hidden="true" />
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-label={`Self-improvement evidence coverage ${plan.evidenceCoverage}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={plan.evidenceCoverage}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${plan.evidenceCoverage}%`, backgroundColor: data.blueprint.accent }}
              />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              Planning indicator only. It is not an official performance, academic or employment evaluation.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <InsightCard
              label="Strongest evidence"
              value={plan.strongestArea?.label ?? 'Not available'}
              detail={plan.strongestArea ? `${plan.strongestArea.percentage}% coverage` : 'More role evidence is needed'}
              icon={CheckCircle2}
            />
            <InsightCard
              label="Priority focus"
              value={plan.focusArea?.label ?? 'Start primary workflow'}
              detail={plan.focusArea ? `${plan.focusArea.percentage}% coverage` : data.blueprint.primaryAction.label}
              icon={Compass}
            />
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                Recommended plan
              </p>
              <h3 className="mt-2 text-xl font-extrabold tracking-[-0.025em] text-slate-950 dark:text-white">
                Focus, complete and review
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Updated with the current dashboard evidence</p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {plan.actions.map((action, index) => (
              <ImprovementActionCard
                key={action.id}
                action={action}
                index={index + 1}
                accent={data.blueprint.accent}
                softAccent={data.blueprint.softAccent}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: data.blueprint.accent }} aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold text-slate-950 dark:text-white">Keep the plan evidence-based</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Complete real workflows and the dashboard will update from persisted records; no manual score editing is used.
                </p>
              </div>
            </div>
            <Link
              href={data.blueprint.primaryAction.href}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              style={{ backgroundColor: data.blueprint.accent }}
            >
              {data.blueprint.primaryAction.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImprovementActionCard({
  action,
  index,
  accent,
  softAccent,
}: {
  action: Phase6ImprovementAction;
  index: number;
  accent: string;
  softAccent: string;
}) {
  return (
    <Link
      href={action.href}
      className="group flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:focus-visible:ring-offset-slate-950"
      style={{ '--tw-ring-color': accent } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold"
          style={{ color: accent, backgroundColor: softAccent }}
        >
          {index}
        </span>
        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {formatKind(action.kind)}
        </span>
      </div>
      <h4 className="mt-4 text-sm font-extrabold leading-6 text-slate-950 dark:text-white">{action.title}</h4>
      <p className="mt-2 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{action.evidence}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold" style={{ color: accent }}>
        Open action
        <ArrowRight className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}

function InsightCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-[9px] font-extrabold uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-extrabold text-white">{value}</p>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}

function formatKind(kind: Phase6ImprovementAction['kind']): string {
  return kind.replace(/\b\w/g, (character) => character.toUpperCase());
}
