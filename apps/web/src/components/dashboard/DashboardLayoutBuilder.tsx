'use client';

import Link from 'next/link';
import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  GripVertical,
  LayoutDashboard,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import {
  createDashboardWidgetPlacement,
  dashboardPlacementsEqual,
  moveDashboardWidget,
  packDashboardWidgets,
  removeDashboardWidget,
  reorderDashboardWidget,
  resizeDashboardWidget,
  type EditableWidgetDefinition,
  type EditableWidgetPlacement,
} from '../../lib/dashboard-layout-editor';
import styles from './DashboardLayoutBuilder.module.css';

type SavedDashboardLayout = {
  id: string;
  name: string;
  dashboardKey: string;
  source: 'default' | 'custom';
  version: number;
  widgets: EditableWidgetPlacement[];
  createdAt: string;
  updatedAt: string;
};

type DashboardLayoutResponse = {
  schemaVersion: number;
  revision: number;
  dashboardKey: string;
  activeLayoutId: string | null;
  activeLayout: SavedDashboardLayout | null;
  layouts: SavedDashboardLayout[];
  catalog: EditableWidgetDefinition[];
  limits: {
    gridColumns: number;
    maxLayouts: number;
    maxWidgetsPerLayout: number;
    maxWidgetSettingsBytes: number;
  };
};

type ApiErrorPayload = {
  error?: string;
  code?: string;
};

type DashboardLayoutBuilderProps = {
  roleLabel: string;
};

type BusyAction =
  | 'load'
  | 'save'
  | 'create'
  | 'duplicate'
  | 'activate'
  | 'delete'
  | 'reset'
  | null;

const ALL_CATEGORIES = 'all';

function asApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    return String((payload as ApiErrorPayload).error ?? fallback);
  }
  return fallback;
}

function makeInstanceId(widgetKey: string) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${widgetKey}-${Date.now().toString(36)}-${randomPart}`;
}

function formatCategory(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function DashboardLayoutBuilder({ roleLabel }: DashboardLayoutBuilderProps) {
  const [data, setData] = React.useState<DashboardLayoutResponse | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [draftWidgets, setDraftWidgets] = React.useState<EditableWidgetPlacement[]>([]);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState(ALL_CATEGORIES);
  const [showGallery, setShowGallery] = React.useState(true);
  const [showCreatePanel, setShowCreatePanel] = React.useState(false);
  const [newLayoutName, setNewLayoutName] = React.useState('My dashboard');
  const [copyCurrentLayout, setCopyCurrentLayout] = React.useState(true);
  const [draggedInstanceId, setDraggedInstanceId] = React.useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
  const [busyAction, setBusyAction] = React.useState<BusyAction>('load');
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const selectedLayout = React.useMemo(
    () => data?.layouts.find((layout) => layout.id === selectedLayoutId) ?? null,
    [data, selectedLayoutId],
  );

  const catalogByKey = React.useMemo(
    () => new Map((data?.catalog ?? []).map((widget) => [widget.key, widget])),
    [data],
  );

  const categories = React.useMemo(
    () => Array.from(new Set((data?.catalog ?? []).map((widget) => widget.category))).sort(),
    [data],
  );

  const filteredCatalog = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.catalog ?? []).filter((widget) => {
      const matchesCategory = category === ALL_CATEGORIES || widget.category === category;
      const matchesQuery =
        !query ||
        widget.title.toLowerCase().includes(query) ||
        widget.description.toLowerCase().includes(query) ||
        widget.category.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [category, data, search]);

  const hasUnsavedChanges = Boolean(
    selectedLayout &&
      (draftName !== selectedLayout.name ||
        !dashboardPlacementsEqual(draftWidgets, selectedLayout.widgets)),
  );

  const loadLayouts = React.useCallback(async (preferredLayoutId?: string | null) => {
    setBusyAction('load');
    setError(null);

    try {
      const response = await fetch('/api/dashboard-layouts?dashboardKey=main', {
        method: 'GET',
        cache: 'no-store',
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(asApiError(payload, 'Unable to load dashboard layouts.'));

      const next = payload as DashboardLayoutResponse;
      const nextSelectedId =
        (preferredLayoutId && next.layouts.some((layout) => layout.id === preferredLayoutId)
          ? preferredLayoutId
          : null) ??
        next.activeLayoutId ??
        next.layouts[0]?.id ??
        null;
      const nextSelected = next.layouts.find((layout) => layout.id === nextSelectedId) ?? null;

      setData(next);
      setSelectedLayoutId(nextSelectedId);
      setDraftName(nextSelected?.name ?? '');
      setDraftWidgets(packDashboardWidgets(nextSelected?.widgets ?? []));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to load dashboard layouts.');
    } finally {
      setBusyAction(null);
    }
  }, []);

  React.useEffect(() => {
    void loadLayouts();
  }, [loadLayouts]);

  React.useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateFromResponse = (response: DashboardLayoutResponse, preferredLayoutId?: string | null) => {
    const nextSelectedId =
      (preferredLayoutId && response.layouts.some((layout) => layout.id === preferredLayoutId)
        ? preferredLayoutId
        : null) ??
      response.activeLayoutId ??
      response.layouts[0]?.id ??
      null;
    const nextSelected = response.layouts.find((layout) => layout.id === nextSelectedId) ?? null;

    setData(response);
    setSelectedLayoutId(nextSelectedId);
    setDraftName(nextSelected?.name ?? '');
    setDraftWidgets(packDashboardWidgets(nextSelected?.widgets ?? []));
  };

  const requestJson = async (
    url: string,
    options: RequestInit,
    fallback: string,
  ): Promise<DashboardLayoutResponse & { createdLayoutId?: string }> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorPayload = payload as ApiErrorPayload;
      if (response.status === 409 && errorPayload.code === 'DASHBOARD_LAYOUT_REVISION_CONFLICT') {
        throw new Error('This layout changed in another session. Reload the latest version before saving.');
      }
      throw new Error(asApiError(payload, fallback));
    }
    return payload as DashboardLayoutResponse & { createdLayoutId?: string };
  };

  const handleSelectLayout = (layoutId: string) => {
    if (layoutId === selectedLayoutId) return;
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Discard unsaved changes and switch layouts?');
      if (!confirmed) return;
    }

    const layout = data?.layouts.find((candidate) => candidate.id === layoutId) ?? null;
    setSelectedLayoutId(layoutId);
    setDraftName(layout?.name ?? '');
    setDraftWidgets(packDashboardWidgets(layout?.widgets ?? []));
    setError(null);
    setNotice(null);
  };

  const saveLayout = async () => {
    if (!data || !selectedLayout) return;
    setBusyAction('save');
    setError(null);
    setNotice(null);

    try {
      const response = await requestJson(
        `/api/dashboard-layouts/${encodeURIComponent(selectedLayout.id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            expectedRevision: data.revision,
            name: draftName.trim(),
            widgets: packDashboardWidgets(draftWidgets),
          }),
        },
        'Unable to save the dashboard layout.',
      );
      updateFromResponse(response, selectedLayout.id);
      setNotice('Dashboard layout saved successfully.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to save the dashboard layout.');
    } finally {
      setBusyAction(null);
    }
  };

  const createLayout = async () => {
    if (!data) return;
    setBusyAction('create');
    setError(null);
    setNotice(null);

    try {
      const response = await requestJson(
        '/api/dashboard-layouts',
        {
          method: 'POST',
          body: JSON.stringify({
            expectedRevision: data.revision,
            name: newLayoutName.trim(),
            dashboardKey: 'main',
            copyFromLayoutId: copyCurrentLayout ? selectedLayoutId ?? undefined : undefined,
            activate: true,
          }),
        },
        'Unable to create the dashboard layout.',
      );
      updateFromResponse(response, response.createdLayoutId ?? response.activeLayoutId);
      setShowCreatePanel(false);
      setNewLayoutName('My dashboard');
      setNotice('New dashboard layout created and activated.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to create the dashboard layout.');
    } finally {
      setBusyAction(null);
    }
  };

  const duplicateLayout = async () => {
    if (!data || !selectedLayout) return;
    setBusyAction('duplicate');
    setError(null);
    setNotice(null);

    try {
      const response = await requestJson(
        '/api/dashboard-layouts',
        {
          method: 'POST',
          body: JSON.stringify({
            expectedRevision: data.revision,
            name: `${selectedLayout.name} copy`.slice(0, 60),
            dashboardKey: selectedLayout.dashboardKey,
            copyFromLayoutId: selectedLayout.id,
            activate: true,
          }),
        },
        'Unable to duplicate the dashboard layout.',
      );
      updateFromResponse(response, response.createdLayoutId ?? response.activeLayoutId);
      setNotice('Dashboard layout duplicated.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to duplicate the dashboard layout.');
    } finally {
      setBusyAction(null);
    }
  };

  const activateLayout = async () => {
    if (!data || !selectedLayout) return;
    if (hasUnsavedChanges) {
      setError('Save or discard your changes before activating this layout.');
      return;
    }

    setBusyAction('activate');
    setError(null);
    setNotice(null);
    try {
      const response = await requestJson(
        `/api/dashboard-layouts/${encodeURIComponent(selectedLayout.id)}/activate`,
        {
          method: 'POST',
          body: JSON.stringify({ expectedRevision: data.revision }),
        },
        'Unable to activate the dashboard layout.',
      );
      updateFromResponse(response, selectedLayout.id);
      setNotice('This is now your active dashboard layout.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to activate the dashboard layout.');
    } finally {
      setBusyAction(null);
    }
  };

  const deleteLayout = async () => {
    if (!data || !selectedLayout) return;
    const confirmed = window.confirm(`Delete “${selectedLayout.name}”? This cannot be undone.`);
    if (!confirmed) return;

    setBusyAction('delete');
    setError(null);
    setNotice(null);
    try {
      const response = await requestJson(
        `/api/dashboard-layouts/${encodeURIComponent(selectedLayout.id)}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ expectedRevision: data.revision }),
        },
        'Unable to delete the dashboard layout.',
      );
      updateFromResponse(response);
      setNotice('Dashboard layout deleted.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete the dashboard layout.');
    } finally {
      setBusyAction(null);
    }
  };

  const resetLayouts = async () => {
    if (!data) return;
    const confirmed = window.confirm(
      'Reset the main dashboard to the recommended role layout? Saved layouts for this dashboard will be removed.',
    );
    if (!confirmed) return;

    setBusyAction('reset');
    setError(null);
    setNotice(null);
    try {
      const response = await requestJson(
        '/api/dashboard-layouts/reset',
        {
          method: 'POST',
          body: JSON.stringify({
            expectedRevision: data.revision,
            dashboardKey: 'main',
          }),
        },
        'Unable to reset dashboard layouts.',
      );
      updateFromResponse(response);
      setNotice('Recommended role layout restored.');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset dashboard layouts.');
    } finally {
      setBusyAction(null);
    }
  };

  const discardChanges = () => {
    if (!selectedLayout) return;
    setDraftName(selectedLayout.name);
    setDraftWidgets(packDashboardWidgets(selectedLayout.widgets));
    setError(null);
    setNotice('Unsaved changes discarded.');
  };

  const addWidget = (definition: EditableWidgetDefinition) => {
    if (!data) return;
    if (draftWidgets.length >= data.limits.maxWidgetsPerLayout) {
      setError(`A layout may contain at most ${data.limits.maxWidgetsPerLayout} widgets.`);
      return;
    }

    const placement = createDashboardWidgetPlacement(definition, makeInstanceId(definition.key));
    setDraftWidgets((current) => packDashboardWidgets([...current, placement]));
    setNotice(`${definition.title} added. Save the layout to keep this change.`);
    setError(null);
  };

  const onDropWidget = (targetInstanceId: string) => {
    if (!draggedInstanceId) return;
    setDraftWidgets((current) =>
      reorderDashboardWidget(current, draggedInstanceId, targetInstanceId),
    );
    setDraggedInstanceId(null);
    setDropTargetId(null);
    setNotice('Widget order updated. Save the layout to keep this change.');
  };

  if (busyAction === 'load' && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
          Loading dashboard designer…
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
        <CircleAlert className="h-6 w-6" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-extrabold">Dashboard designer unavailable</h1>
        <p className="mt-2 text-sm">{error ?? 'The saved-layout service could not be loaded.'}</p>
        <button
          type="button"
          onClick={() => void loadLayouts()}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-extrabold text-white"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  const activeLayout = data.layouts.find((layout) => layout.id === data.activeLayoutId) ?? null;
  const canAddLayout = data.layouts.length < data.limits.maxLayouts;
  const isBusy = busyAction !== null;

  return (
    <main className="min-h-full bg-[#F4F7FB] px-4 py-5 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="rounded-[28px] border border-[#D7E1EF] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#738095] dark:text-slate-400">
                <span>Phase 8B</span>
                <span aria-hidden="true">/</span>
                <span>{roleLabel}</span>
                <span aria-hidden="true">/</span>
                <span>Personal dashboard</span>
              </div>
              <div className="mt-3 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EFFF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
                  <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tight text-[#101D38] dark:text-white sm:text-3xl">
                    Dashboard layout designer
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085] dark:text-slate-400">
                    Choose authorised widgets, drag them into order, resize cards and save multiple personal layouts. The designer stores presentation preferences only; widget data remains protected by each server-side role and tenant policy.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#CBD8EA] bg-white px-4 text-sm font-extrabold text-[#334155] transition hover:bg-[#F7F9FC] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setShowGallery((value) => !value)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#CBD8EA] bg-white px-4 text-sm font-extrabold text-[#334155] transition hover:bg-[#F7F9FC] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {showGallery ? 'Hide widgets' : 'Show widgets'}
              </button>
              <button
                type="button"
                onClick={() => void saveLayout()}
                disabled={!hasUnsavedChanges || isBusy || !selectedLayout}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(23,84,232,0.25)] transition hover:bg-[#1247C7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAction === 'save' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                Save layout
              </button>
            </div>
          </div>
        </header>

        {(error || notice) && (
          <div className="mt-4" aria-live="polite">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
            {notice && !error && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{notice}</span>
                <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        <section className="mt-5 rounded-[24px] border border-[#D7E1EF] bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Saved layouts">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)]">
              <label className="block">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#738095] dark:text-slate-400">
                  Saved layout
                </span>
                <span className="relative mt-2 block">
                  <select
                    value={selectedLayoutId ?? ''}
                    onChange={(event) => handleSelectLayout(event.target.value)}
                    className="min-h-12 w-full appearance-none rounded-xl border border-[#CBD8EA] bg-white px-4 pr-10 text-sm font-bold text-[#101D38] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {data.layouts.map((layout) => (
                      <option key={layout.id} value={layout.id}>
                        {layout.name}{layout.id === data.activeLayoutId ? ' — Active' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B8798]" aria-hidden="true" />
                </span>
              </label>

              <label className="block">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#738095] dark:text-slate-400">
                  Layout name
                </span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value.slice(0, 60))}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#CBD8EA] bg-white px-4 text-sm font-bold text-[#101D38] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  minLength={2}
                  maxLength={60}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCreatePanel((value) => !value)}
                disabled={!canAddLayout || isBusy}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD8EA] px-3 text-xs font-extrabold text-[#334155] hover:bg-[#F7F9FC] disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New
              </button>
              <button
                type="button"
                onClick={() => void duplicateLayout()}
                disabled={!selectedLayout || !canAddLayout || isBusy || hasUnsavedChanges}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD8EA] px-3 text-xs font-extrabold text-[#334155] hover:bg-[#F7F9FC] disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                {busyAction === 'duplicate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => void activateLayout()}
                disabled={!selectedLayout || selectedLayout.id === data.activeLayoutId || isBusy || hasUnsavedChanges}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#BFD0E7] bg-[#EDF3FF] px-3 text-xs font-extrabold text-[#1754E8] disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {busyAction === 'activate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Make active
              </button>
              <button
                type="button"
                onClick={discardChanges}
                disabled={!hasUnsavedChanges || isBusy}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD8EA] px-3 text-xs font-extrabold text-[#334155] disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Discard
              </button>
              <button
                type="button"
                onClick={() => void deleteLayout()}
                disabled={!selectedLayout || isBusy}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
              >
                {busyAction === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#667085] dark:text-slate-400">
            <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
              {data.layouts.length}/{data.limits.maxLayouts} layouts
            </span>
            <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
              {draftWidgets.length}/{data.limits.maxWidgetsPerLayout} widgets
            </span>
            <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
              Revision {data.revision}
            </span>
            {selectedLayout && (
              <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
                Updated {formatDate(selectedLayout.updatedAt)}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 font-extrabold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Unsaved changes
              </span>
            )}
            {activeLayout && (
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-extrabold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                Active: {activeLayout.name}
              </span>
            )}
          </div>

          {showCreatePanel && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-[#CBD8EA] bg-[#F7F9FC] p-4 dark:border-slate-700 dark:bg-slate-950 md:grid-cols-[1fr_auto_auto] md:items-end">
              <label className="block">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#738095] dark:text-slate-400">
                  New layout name
                </span>
                <input
                  value={newLayoutName}
                  onChange={(event) => setNewLayoutName(event.target.value.slice(0, 60))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-[#CBD8EA] bg-white px-4 text-sm font-bold outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  minLength={2}
                  maxLength={60}
                />
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#CBD8EA] bg-white px-4 text-sm font-bold text-[#334155] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={copyCurrentLayout}
                  onChange={(event) => setCopyCurrentLayout(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Copy current widgets
              </label>
              <button
                type="button"
                onClick={() => void createLayout()}
                disabled={newLayoutName.trim().length < 2 || busyAction === 'create'}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white disabled:opacity-50"
              >
                {busyAction === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </button>
            </div>
          )}
        </section>

        <div className={`mt-5 grid gap-5 ${showGallery ? 'xl:grid-cols-[340px_minmax(0,1fr)]' : ''}`}>
          {showGallery && (
            <aside className="rounded-[24px] border border-[#D7E1EF] bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Widget gallery">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[#101D38] dark:text-white">Widget gallery</h2>
                  <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">
                    Only widgets authorised for {roleLabel} are shown.
                  </p>
                </div>
                <span className="rounded-full bg-[#E8EFFF] px-2.5 py-1 text-xs font-extrabold text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
                  {filteredCatalog.length}
                </span>
              </div>

              <label className="relative mt-4 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A96A8]" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search widgets"
                  className="min-h-11 w-full rounded-xl border border-[#CBD8EA] bg-white pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:flex-wrap">
                <button
                  type="button"
                  onClick={() => setCategory(ALL_CATEGORIES)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${
                    category === ALL_CATEGORIES
                      ? 'bg-[#1754E8] text-white'
                      : 'bg-[#F1F4F8] text-[#526175] dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  All
                </button>
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${
                      category === item
                        ? 'bg-[#1754E8] text-white'
                        : 'bg-[#F1F4F8] text-[#526175] dark:bg-slate-950 dark:text-slate-300'
                    }`}
                  >
                    {formatCategory(item)}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-[700px] space-y-2 overflow-y-auto pr-1">
                {filteredCatalog.map((widget) => (
                  <article key={widget.key} className="rounded-2xl border border-[#E0E7F0] bg-[#F8FAFC] p-3.5 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#101D38] dark:text-white">{widget.title}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7B8798] dark:text-slate-500">
                          {formatCategory(widget.category)} · {widget.defaultWidth}×{widget.defaultHeight}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addWidget(widget)}
                        className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EFFF] text-[#1754E8] hover:bg-[#DCE7FF] dark:bg-blue-950 dark:text-blue-300"
                        aria-label={`Add ${widget.title}`}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{widget.description}</p>
                  </article>
                ))}
                {filteredCatalog.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#CBD5E1] p-5 text-center text-sm text-[#667085] dark:border-slate-700 dark:text-slate-400">
                    No authorised widgets match this search.
                  </div>
                )}
              </div>
            </aside>
          )}

          <section className="min-w-0 rounded-[24px] border border-[#D7E1EF] bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-labelledby="dashboard-layout-canvas-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="dashboard-layout-canvas-title" className="text-lg font-black text-[#101D38] dark:text-white">
                  Layout canvas
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">
                  Drag cards to reorder. Use card controls for precise keyboard-friendly movement and resizing.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDraftWidgets((current) => packDashboardWidgets(current))}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD8EA] px-3 text-xs font-extrabold text-[#334155] dark:border-slate-700 dark:text-slate-200"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Auto arrange
                </button>
                <button
                  type="button"
                  onClick={() => void resetLayouts()}
                  disabled={isBusy}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-200 px-3 text-xs font-extrabold text-amber-800 disabled:opacity-50 dark:border-amber-900 dark:text-amber-300"
                >
                  {busyAction === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Reset recommended
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-[#C7D5E8] bg-[#F6F8FC] p-3 dark:border-slate-700 dark:bg-slate-950 sm:p-4">
              {draftWidgets.length > 0 ? (
                <div className={styles.canvas}>
                  {draftWidgets.map((widget, index) => {
                    const definition = catalogByKey.get(widget.widgetKey);
                    if (!definition) return null;
                    const isDragging = draggedInstanceId === widget.instanceId;
                    const isDropTarget = dropTargetId === widget.instanceId && draggedInstanceId !== widget.instanceId;
                    const cardStyle = {
                      '--widget-x': widget.x,
                      '--widget-y': widget.y,
                      '--widget-width': widget.width,
                      '--widget-height': widget.height,
                    } as React.CSSProperties;

                    return (
                      <article
                        key={widget.instanceId}
                        draggable
                        onDragStart={(event) => {
                          setDraggedInstanceId(widget.instanceId);
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', widget.instanceId);
                        }}
                        onDragEnd={() => {
                          setDraggedInstanceId(null);
                          setDropTargetId(null);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          setDropTargetId(widget.instanceId);
                        }}
                        onDragLeave={() => {
                          if (dropTargetId === widget.instanceId) setDropTargetId(null);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          onDropWidget(widget.instanceId);
                        }}
                        style={cardStyle}
                        className={`${styles.widget} ${isDragging ? styles.widgetDragging : ''} ${isDropTarget ? styles.dropTarget : ''} flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#D8E2EF] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900`}
                      >
                        <header className="flex items-start gap-3 border-b border-[#E4EAF2] p-3 dark:border-slate-800">
                          <button
                            type="button"
                            className="mt-0.5 inline-flex min-h-9 min-w-9 cursor-grab items-center justify-center rounded-xl bg-[#F1F4F8] text-[#667085] active:cursor-grabbing dark:bg-slate-950 dark:text-slate-400"
                            aria-label={`Drag ${definition.title}`}
                          >
                            <GripVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">{definition.title}</h3>
                            <p className="mt-1 truncate text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7B8798] dark:text-slate-500">
                              {formatCategory(definition.category)} · {widget.width}×{widget.height}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDraftWidgets((current) => removeDashboardWidget(current, widget.instanceId))}
                            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                            aria-label={`Remove ${definition.title}`}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </header>

                        <div className="min-h-0 flex-1 overflow-hidden p-3">
                          <p className="text-xs leading-5 text-[#667085] dark:text-slate-400">{definition.description}</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl bg-[#F4F7FB] p-2.5 dark:bg-slate-950">
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8A96A8]">Data policy</p>
                              <p className="mt-1 text-xs font-bold text-[#334155] dark:text-slate-200">Server authorised</p>
                            </div>
                            <div className="rounded-xl bg-[#F4F7FB] p-2.5 dark:bg-slate-950">
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8A96A8]">Preview</p>
                              <p className="mt-1 text-xs font-bold text-[#334155] dark:text-slate-200">No fabricated values</p>
                            </div>
                          </div>
                        </div>

                        <footer className="border-t border-[#E4EAF2] bg-[#FAFBFD] p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1" aria-label="Move widget">
                              <IconButton
                                label="Move earlier"
                                disabled={index === 0}
                                onClick={() => setDraftWidgets((current) => moveDashboardWidget(current, widget.instanceId, -1))}
                                icon={ArrowUp}
                              />
                              <IconButton
                                label="Move later"
                                disabled={index === draftWidgets.length - 1}
                                onClick={() => setDraftWidgets((current) => moveDashboardWidget(current, widget.instanceId, 1))}
                                icon={ArrowDown}
                              />
                            </div>
                            <div className="flex items-center gap-1" aria-label="Resize widget width">
                              <IconButton
                                label="Decrease width"
                                disabled={widget.width <= definition.minWidth}
                                onClick={() => setDraftWidgets((current) => resizeDashboardWidget(current, widget.instanceId, definition, { width: -1 }))}
                                icon={ArrowLeft}
                              />
                              <span className="min-w-12 text-center text-[10px] font-extrabold text-[#667085] dark:text-slate-400">Width</span>
                              <IconButton
                                label="Increase width"
                                disabled={widget.width >= Math.min(definition.maxWidth, data.limits.gridColumns)}
                                onClick={() => setDraftWidgets((current) => resizeDashboardWidget(current, widget.instanceId, definition, { width: 1 }))}
                                icon={ArrowRight}
                              />
                            </div>
                            <div className="flex items-center gap-1" aria-label="Resize widget height">
                              <IconButton
                                label="Decrease height"
                                disabled={widget.height <= definition.minHeight}
                                onClick={() => setDraftWidgets((current) => resizeDashboardWidget(current, widget.instanceId, definition, { height: -1 }))}
                                icon={Minus}
                              />
                              <span className="min-w-12 text-center text-[10px] font-extrabold text-[#667085] dark:text-slate-400">Height</span>
                              <IconButton
                                label="Increase height"
                                disabled={widget.height >= definition.maxHeight}
                                onClick={() => setDraftWidgets((current) => resizeDashboardWidget(current, widget.instanceId, definition, { height: 1 }))}
                                icon={Plus}
                              />
                            </div>
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EFFF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
                    <LayoutDashboard className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-black text-[#101D38] dark:text-white">Start your personal layout</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#667085] dark:text-slate-400">
                    Add authorised widgets from the gallery. Nothing is saved until you choose Save layout.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Browse widgets
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-[#D8E2EF] bg-[#F8FAFC] p-4 text-xs leading-5 text-[#667085] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <p className="font-extrabold text-[#101D38] dark:text-white">Safe preview boundary</p>
              <p className="mt-1">
                This canvas previews structure, order and size only. It deliberately does not invent academic, financial or operational values. Live widget bindings will continue to use the existing role-scoped dashboard loaders and APIs.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  icon: Icon,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-[#D8E2EF] bg-white text-[#526175] transition hover:border-[#B7C9E1] hover:text-[#1754E8] disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      aria-label={label}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}
