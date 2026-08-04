'use client';

import React, { useCallback, useState } from 'react';
import {
  AlertTriangle, Bookmark, Check, ChevronDown, ChevronUp, Copy, Eye, Flag,
  Heart, Lock, MessageSquare, MoreHorizontal, Pencil, Pin, Send, Shield, Trash2, X
} from 'lucide-react';
import {
  CommunityPost, CommunityReply, POST_TYPE_COLORS, POST_TYPE_LABELS,
  PostTypeValue, REACTION_TYPES, REPORT_REASONS, getInitials, relativeTime, roleLabel
} from './community-types';
import { ReplyThread } from './ReplyThread';
import { PollCard } from './PollCard';

interface PostCardProps {
  post: CommunityPost;
  onDeleted: () => void;
  onUpdated?: (post: CommunityPost) => void;
}

export function PostCard({ post, onDeleted, onUpdated }: PostCardProps) {
  const [bookmarked, setBookmarked] = useState(post.bookmarked);
  const [userVote, setUserVote] = useState(post.userVote);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [userReactions, setUserReactions] = useState<string[]>(post.userReactions);
  const [reactionSummary, setReactionSummary] = useState(post.reactionSummary);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [acknowledged, setAcknowledged] = useState(post.acknowledged);
  const [showReplies, setShowReplies] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [shareMsg, setShareMsg] = useState('');
  const [pollData, setPollData] = useState(post.poll);

  const initials = getInitials(post.author.name);
  const typeInfo = POST_TYPE_COLORS[post.type as PostTypeValue] || POST_TYPE_COLORS.DISCUSSION;
  const typeLabel = POST_TYPE_LABELS[post.type as PostTypeValue] || post.type;
  const isNotice = ['ANNOUNCEMENT', 'URGENT_NOTICE', 'IMPORTANT_NOTICE'].includes(post.type);
  const isUrgent = post.type === 'URGENT_NOTICE';
  const isImportant = post.type === 'IMPORTANT_NOTICE';

  const handleVote = useCallback(async (value: 1 | -1) => {
    const prevVote = userVote;
    const newVote = prevVote === value ? 0 : value;
    // Optimistic update
    setUserVote(newVote);
    setUpvotes(prev => prev + (value === 1 ? (newVote === 1 ? 1 : -1) : (prevVote === 1 ? -1 : 0)));
    setDownvotes(prev => prev + (value === -1 ? (newVote === -1 ? 1 : -1) : (prevVote === -1 ? -1 : 0)));

    try {
      const res = await fetch(`/api/community/posts/${post.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        setUserVote(prevVote);
        setUpvotes(post.upvotes);
        setDownvotes(post.downvotes);
      }
    } catch {
      setUserVote(prevVote);
      setUpvotes(post.upvotes);
      setDownvotes(post.downvotes);
    }
  }, [userVote, post.id, post.upvotes, post.downvotes]);

  const handleReaction = useCallback(async (type: string) => {
    const hadReaction = userReactions.includes(type);
    // Optimistic
    setUserReactions(prev => hadReaction ? prev.filter(r => r !== type) : [...prev, type]);
    setReactionSummary(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + (hadReaction ? -1 : 1),
    }));
    setReactionCount(prev => prev + (hadReaction ? -1 : 1));
    setShowReactions(false);

    try {
      const res = await fetch(`/api/community/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        setUserReactions(post.userReactions);
        setReactionSummary(post.reactionSummary);
        setReactionCount(post.reactionCount);
      }
    } catch {
      setUserReactions(post.userReactions);
      setReactionSummary(post.reactionSummary);
      setReactionCount(post.reactionCount);
    }
  }, [userReactions, post.id, post.userReactions, post.reactionSummary, post.reactionCount]);

  const handleBookmark = useCallback(async () => {
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/bookmark`, { method: 'POST' });
      if (!res.ok) setBookmarked(prev);
    } catch { setBookmarked(prev); }
  }, [bookmarked, post.id]);

  const handleAcknowledge = useCallback(async () => {
    if (acknowledged) return;
    setAcknowledged(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/acknowledge`, { method: 'POST' });
      if (!res.ok) setAcknowledged(false);
    } catch { setAcknowledged(false); }
  }, [acknowledged, post.id]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/community/post/${post.id}`;
    navigator.clipboard.writeText(url)
      .then(() => setShareMsg('Link copied'))
      .catch(() => setShareMsg('Failed to copy'));
    setTimeout(() => setShareMsg(''), 2000);
  }, [post.id]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) onDeleted();
    } catch { /* ignore */ }
    setShowMenu(false);
  }, [post.id, onDeleted]);

  const handleReport = useCallback(async () => {
    if (!reportReason) return;
    setReportStatus('sending');
    try {
      const res = await fetch(`/api/community/posts/${post.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, details: reportDetails || undefined }),
      });
      setReportStatus(res.ok ? 'sent' : 'error');
      if (res.ok) setTimeout(() => { setShowReport(false); setReportStatus('idle'); }, 1500);
    } catch {
      setReportStatus('error');
    }
  }, [post.id, reportReason, reportDetails]);

  const handlePollVote = useCallback(async (optionId: string) => {
    if (!pollData) return;
    try {
      const res = await fetch(`/api/community/posts/${post.id}/poll-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      if (res.ok) {
        setPollData(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          const wasVoted = prev.options.find(o => o.id === optionId)?.voted;
          updated.options = prev.options.map(o => {
            if (o.id === optionId) {
              return { ...o, voted: !wasVoted, voteCount: o.voteCount + (wasVoted ? -1 : 1) };
            }
            if (!prev.isMultipleChoice && o.voted) {
              return { ...o, voted: false, voteCount: o.voteCount - 1 };
            }
            return o;
          });
          updated.totalVotes = updated.options.reduce((s, o) => s + o.voteCount, 0);
          return updated;
        });
      }
    } catch { /* ignore */ }
  }, [post.id, pollData]);

  const urgentBorderClass = isUrgent ? 'border-l-4 border-l-red-400' : isImportant ? 'border-l-4 border-l-amber-400' : '';

  return (
    <article
      className={`rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md ${urgentBorderClass}`}
      aria-labelledby={`post-title-${post.id}`}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-3 p-4 pb-0">
        <div className="flex min-w-0 gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-text-primary">{post.author.name}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                <Shield size={10} aria-hidden="true" />
                {roleLabel(post.author.role)}
              </span>
              {post.isPinned && <Pin size={14} className="text-primary" aria-label="Pinned" />}
              {post.isLocked && <Lock size={14} className="text-text-muted" aria-label="Comments locked" />}
            </div>
            <p className="mt-0.5 text-xs text-text-muted">
              <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
              {post.editedAt && <span className="ml-1">(edited)</span>}
              {' · '}
              <span>{post.visibility.toLowerCase()}</span>
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-md p-2 text-text-muted hover:bg-surface-muted"
            aria-label="Post actions"
            aria-expanded={showMenu}
          >
            <MoreHorizontal size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 z-20 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg" role="menu">
              <button type="button" onClick={handleShare} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted" role="menuitem">
                <Copy size={14} /> Copy link
              </button>
              <button type="button" onClick={handleBookmark} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted" role="menuitem">
                <Bookmark size={14} /> {bookmarked ? 'Remove bookmark' : 'Bookmark'}
              </button>
              <button type="button" onClick={() => { setShowReport(true); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-muted" role="menuitem">
                <Flag size={14} /> Report
              </button>
              <hr className="my-1 border-border" />
              <button type="button" onClick={handleDelete} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-muted" role="menuitem">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-3 pb-2">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeInfo.bg} ${typeInfo.text}`}>
          {isUrgent && <AlertTriangle size={11} className="mr-1 inline" />}
          {typeLabel}
        </span>
        {post.title && (
          <h2 id={`post-title-${post.id}`} className="mt-2 text-lg font-semibold text-text-primary leading-snug">
            {post.title}
          </h2>
        )}
        <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">
          {post.content}
        </div>
      </div>

      {/* Poll */}
      {pollData && (
        <div className="px-4 pb-2">
          <PollCard poll={pollData} onVote={handlePollVote} />
        </div>
      )}

      {/* Notice acknowledgement */}
      {isNotice && (
        <div className="mx-4 mb-2 flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
          <button
            type="button"
            onClick={handleAcknowledge}
            disabled={acknowledged}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              acknowledged
                ? 'bg-success-soft text-success cursor-default'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
            aria-label={acknowledged ? 'You have acknowledged this notice' : 'Acknowledge this notice'}
          >
            <Check size={14} />
            {acknowledged ? 'Acknowledged' : 'I have read this'}
          </button>
          <span className="text-xs text-text-muted">
            {post.acknowledgementCount} acknowledgement{post.acknowledgementCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* View count */}
      {post.viewCount > 0 && (
        <div className="flex items-center gap-1 px-4 pb-1 text-xs text-text-muted">
          <Eye size={12} /> {post.viewCount} view{post.viewCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Reactions summary */}
      {reactionCount > 0 && (
        <div className="flex items-center gap-2 px-4 pb-2 text-xs text-text-secondary">
          <span className="flex -space-x-0.5">
            {Object.entries(reactionSummary)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([type]) => {
                const r = REACTION_TYPES.find(rt => rt.key === type);
                return r ? <span key={type} title={r.label}>{r.emoji}</span> : null;
              })}
          </span>
          <span>{reactionCount}</span>
        </div>
      )}

      {/* Action bar */}
      <footer className="flex flex-wrap items-center gap-1 border-t border-border px-3 py-1.5">
        {/* Upvote */}
        <button
          type="button"
          onClick={() => handleVote(1)}
          className={`inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm transition-colors ${
            userVote === 1 ? 'text-primary font-semibold' : 'text-text-secondary hover:bg-surface-muted'
          }`}
          aria-label="Upvote this post"
          aria-pressed={userVote === 1}
          title="Upvote this post"
        >
          <ChevronUp size={16} /> {upvotes > 0 ? upvotes : ''}
        </button>

        {/* Downvote */}
        <button
          type="button"
          onClick={() => handleVote(-1)}
          className={`inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-sm transition-colors ${
            userVote === -1 ? 'text-danger font-semibold' : 'text-text-secondary hover:bg-surface-muted'
          }`}
          aria-label="Downvote this post"
          aria-pressed={userVote === -1}
          title="Downvote this post"
        >
          <ChevronDown size={16} />
        </button>

        {/* Reaction picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            className={`inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm transition-colors ${
              userReactions.length > 0 ? 'text-primary' : 'text-text-secondary hover:bg-surface-muted'
            }`}
            aria-label="React to this post"
            title="React to this post"
          >
            <Heart size={16} fill={userReactions.length > 0 ? 'currentColor' : 'none'} /> {reactionCount > 0 ? reactionCount : ''}
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-1 z-20 flex gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-lg" role="listbox">
              {REACTION_TYPES.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleReaction(r.key)}
                  className={`rounded-md p-1.5 text-lg transition-transform hover:scale-110 ${
                    userReactions.includes(r.key) ? 'bg-primary-soft' : 'hover:bg-surface-muted'
                  }`}
                  aria-label={r.label}
                  title={r.label}
                  role="option"
                  aria-selected={userReactions.includes(r.key)}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Replies */}
        <button
          type="button"
          onClick={() => setShowReplies(!showReplies)}
          disabled={!post.commentsEnabled}
          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm text-text-secondary hover:bg-surface-muted disabled:opacity-50"
          aria-label={`${showReplies ? 'Hide' : 'View'} replies`}
          aria-expanded={showReplies}
          title={post.commentsEnabled ? 'View and write replies' : 'Replies are disabled'}
        >
          <MessageSquare size={16} /> {post.replyCount > 0 ? post.replyCount : ''}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm text-text-secondary hover:bg-surface-muted"
          aria-label="Copy or share post link"
          title="Copy or share post link"
        >
          <Send size={14} />
        </button>
        {shareMsg && <span className="text-xs text-text-muted" role="status">{shareMsg}</span>}

        {/* Bookmark */}
        <button
          type="button"
          onClick={handleBookmark}
          className={`inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm transition-colors ${
            bookmarked ? 'text-primary' : 'text-text-secondary hover:bg-surface-muted'
          }`}
          aria-label="Save to bookmarks"
          aria-pressed={bookmarked}
          title="Save to bookmarks"
        >
          <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </footer>

      {/* Reply thread - lazy loaded */}
      {showReplies && (
        <div className="border-t border-border px-4 py-3">
          <ReplyThread postId={post.id} isLocked={post.isLocked} commentsEnabled={post.commentsEnabled} />
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-label="Report post">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Report post</h3>
              <button type="button" onClick={() => setShowReport(false)} className="p-1 rounded-md hover:bg-surface-muted" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {reportStatus === 'sent' ? (
              <div className="text-center py-6">
                <Check size={32} className="mx-auto text-success mb-2" />
                <p className="font-medium text-text-primary">Report submitted</p>
                <p className="mt-1 text-sm text-text-secondary">Our moderation team will review this content.</p>
              </div>
            ) : (
              <>
                <fieldset>
                  <legend className="text-sm font-medium text-text-primary mb-2">Reason</legend>
                  <div className="space-y-2">
                    {REPORT_REASONS.map(r => (
                      <label key={r.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.value}
                          checked={reportReason === r.value}
                          onChange={() => setReportReason(r.value)}
                          className="accent-primary"
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="mt-3">
                  <label htmlFor="report-details" className="text-sm font-medium text-text-primary">Details (optional)</label>
                  <textarea
                    id="report-details"
                    rows={3}
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                    maxLength={2000}
                  />
                </div>
                {reportStatus === 'error' && (
                  <p className="mt-2 text-sm text-danger" role="alert">Failed to submit report. Please try again.</p>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowReport(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Cancel</button>
                  <button
                    type="button"
                    onClick={handleReport}
                    disabled={!reportReason || reportStatus === 'sending'}
                    className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {reportStatus === 'sending' ? 'Submitting…' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
