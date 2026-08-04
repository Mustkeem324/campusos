'use client';

import React, { useState } from 'react';
import {
  AlertCircle, BarChart3, Bold, Calendar, FileText, Hash, Image as ImageIcon,
  Italic, Link as LinkIcon, List, Loader2, Minus, Plus, Send, Type, Video, X
} from 'lucide-react';
import { POST_TYPE_LABELS, PostTypeValue } from './community-types';

interface PostComposerProps {
  onSuccess: () => void;
}

const POST_TYPES: { value: PostTypeValue; label: string; description: string; restricted: boolean }[] = [
  { value: 'DISCUSSION', label: 'Discussion', description: 'Start a conversation', restricted: false },
  { value: 'QUESTION', label: 'Question', description: 'Ask the community', restricted: false },
  { value: 'RESOURCE', label: 'Resource', description: 'Share materials', restricted: false },
  { value: 'EVENT', label: 'Event', description: 'Share an event', restricted: false },
  { value: 'POLL', label: 'Poll', description: 'Create a poll', restricted: false },
  { value: 'ANNOUNCEMENT', label: 'Announcement', description: 'Course or department', restricted: true },
  { value: 'URGENT_NOTICE', label: 'Urgent Notice', description: 'Admin only', restricted: true },
  { value: 'IMPORTANT_NOTICE', label: 'Important Notice', description: 'Admin only', restricted: true },
];

export const PostComposer: React.FC<PostComposerProps> = ({ onSuccess }) => {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PostTypeValue>('DISCUSSION');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll fields
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);

  const isPoll = type === 'POLL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (isPoll) {
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        setError('A poll requires at least 2 options');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        visibility: 'INSTITUTION',
      };

      if (isPoll) {
        payload.pollOptions = pollOptions.filter(o => o.trim());
        payload.pollMultipleChoice = pollMultipleChoice;
      }

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create post');
      }

      setContent('');
      setTitle('');
      setType('DISCUSSION');
      setPollOptions(['', '']);
      setPollMultipleChoice(false);
      setExpanded(false);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions(pollOptions.map((o, i) => i === index ? value : o));
  };

  if (!expanded) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-4 cursor-pointer transition-shadow hover:shadow-sm"
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(true); }}
        role="button"
        tabIndex={0}
        aria-label="Create a new post"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary" aria-hidden="true">
            U
          </span>
          <span className="flex-1 text-sm text-text-muted">
            Share an update, ask a question or start a discussion…
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted" onClick={(e) => { e.stopPropagation(); setType('DISCUSSION'); setExpanded(true); }}>
            <ImageIcon size={14} className="text-emerald-600" /> Photo
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted" onClick={(e) => { e.stopPropagation(); setType('DISCUSSION'); setExpanded(true); }}>
            <Video size={14} className="text-blue-600" /> Video
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted" onClick={(e) => { e.stopPropagation(); setType('POLL'); setExpanded(true); }}>
            <BarChart3 size={14} className="text-amber-600" /> Poll
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted" onClick={(e) => { e.stopPropagation(); setType('RESOURCE'); setExpanded(true); }}>
            <FileText size={14} className="text-violet-600" /> File
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted" onClick={(e) => { e.stopPropagation(); setType('EVENT'); setExpanded(true); }}>
            <Calendar size={14} className="text-cyan-600" /> Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <form onSubmit={handleSubmit} aria-label="Create a new post">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-text-primary">Create post</h2>
          <button type="button" onClick={() => setExpanded(false)} className="p-1 rounded-md hover:bg-surface-muted text-text-muted" aria-label="Close composer">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger-soft flex items-center gap-2 text-sm text-danger" role="alert">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Post type selector */}
          <div>
            <label htmlFor="composer-type" className="text-xs font-medium text-text-secondary">Post type</label>
            <select
              id="composer-type"
              value={type}
              onChange={(e) => setType(e.target.value as PostTypeValue)}
              className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {POST_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="composer-title" className="text-xs font-medium text-text-secondary">Title {type !== 'DISCUSSION' && <span className="text-danger">*</span>}</label>
            <input
              id="composer-title"
              type="text"
              placeholder="Give your post a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              maxLength={300}
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="composer-content" className="text-xs font-medium text-text-secondary">Content <span className="text-danger">*</span></label>
            <div className="mt-1 rounded-lg border border-border focus-within:border-primary">
              {/* Simple formatting toolbar */}
              <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
                <button type="button" className="p-1.5 rounded text-text-muted hover:bg-surface-muted hover:text-text-primary" title="Bold" aria-label="Bold" onClick={() => setContent(c => c + '**bold**')}>
                  <Bold size={14} />
                </button>
                <button type="button" className="p-1.5 rounded text-text-muted hover:bg-surface-muted hover:text-text-primary" title="Italic" aria-label="Italic" onClick={() => setContent(c => c + '*italic*')}>
                  <Italic size={14} />
                </button>
                <button type="button" className="p-1.5 rounded text-text-muted hover:bg-surface-muted hover:text-text-primary" title="Heading" aria-label="Heading" onClick={() => setContent(c => c + '\n## Heading\n')}>
                  <Type size={14} />
                </button>
                <button type="button" className="p-1.5 rounded text-text-muted hover:bg-surface-muted hover:text-text-primary" title="List" aria-label="List" onClick={() => setContent(c => c + '\n- Item\n')}>
                  <List size={14} />
                </button>
                <button type="button" className="p-1.5 rounded text-text-muted hover:bg-surface-muted hover:text-text-primary" title="Link" aria-label="Link" onClick={() => setContent(c => c + '[link text](url)')}>
                  <LinkIcon size={14} />
                </button>
                <button type="button" className="p-1.5 rounded text-text-muted hover:bg-surface-muted hover:text-text-primary" title="Hashtag" aria-label="Hashtag" onClick={() => setContent(c => c + ' #tag')}>
                  <Hash size={14} />
                </button>
              </div>
              <textarea
                id="composer-content"
                rows={5}
                placeholder="What's on your mind? Use #hashtags and @mentions"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-text-muted"
                required
                aria-required="true"
                maxLength={50000}
              />
            </div>
          </div>

          {/* Poll options */}
          {isPoll && (
            <div className="space-y-2 rounded-lg border border-border bg-surface-muted p-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Poll options</h3>
              {pollOptions.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                    maxLength={500}
                    aria-label={`Poll option ${i + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={() => removePollOption(i)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-soft" aria-label={`Remove option ${i + 1}`}>
                      <Minus size={14} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 10 && (
                <button type="button" onClick={addPollOption} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <Plus size={12} /> Add option
                </button>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pollMultipleChoice}
                  onChange={(e) => setPollMultipleChoice(e.target.checked)}
                  className="accent-primary"
                />
                Allow multiple selections
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="flex items-center gap-1">
            <button type="button" className="p-2 text-text-muted hover:text-emerald-600 rounded-full hover:bg-surface-muted transition-colors" aria-label="Attach image">
              <ImageIcon size={18} />
            </button>
            <button type="button" className="p-2 text-text-muted hover:text-blue-600 rounded-full hover:bg-surface-muted transition-colors" aria-label="Attach video">
              <Video size={18} />
            </button>
            <button type="button" className="p-2 text-text-muted hover:text-violet-600 rounded-full hover:bg-surface-muted transition-colors" aria-label="Attach file">
              <FileText size={18} />
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 size={14} className="animate-spin" /> Publishing…</>
            ) : (
              <><Send size={14} /> Publish</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
