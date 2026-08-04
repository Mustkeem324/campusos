'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, MessageSquare, Send } from 'lucide-react';
import { CommunityReply, getInitials, relativeTime, roleLabel } from './community-types';

interface ReplyThreadProps {
  postId: string;
  isLocked: boolean;
  commentsEnabled: boolean;
}

export function ReplyThread({ postId, isLocked, commentsEnabled }: ReplyThreadProps) {
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReplies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/posts/${postId}/replies`);
      if (!res.ok) throw new Error('Failed to load replies');
      const data = await res.json();
      setReplies(data.replies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load replies');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadReplies();
  }, [loadReplies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="animate-spin text-primary" size={20} aria-label="Loading replies" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-text-primary" role="alert">
        {error}
        <button type="button" onClick={loadReplies} className="ml-2 font-semibold text-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replies.length === 0 && !isLocked && commentsEnabled && (
        <p className="text-sm text-text-muted py-2">No replies yet. Be the first to reply.</p>
      )}

      {replies.map(reply => (
        <ReplyItem key={reply.id} reply={reply} postId={postId} onReplyAdded={loadReplies} />
      ))}

      {!isLocked && commentsEnabled && (
        <ReplyComposer postId={postId} parentId={null} onSuccess={loadReplies} />
      )}

      {isLocked && (
        <p className="text-sm text-text-muted italic py-2">Replies are locked for this post.</p>
      )}
    </div>
  );
}

function ReplyItem({ reply, postId, onReplyAdded }: { reply: CommunityReply; postId: string; onReplyAdded: () => void }) {
  const [showChildren, setShowChildren] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const initials = getInitials(reply.author.name);

  if (reply.deletedAt) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-sm text-text-muted italic">
        This reply was removed.
      </div>
    );
  }

  return (
    <div className="relative pl-4 before:absolute before:left-0 before:top-10 before:bottom-0 before:w-px before:bg-border">
      <div className="flex gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary" aria-hidden="true">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-text-primary">{reply.author.name}</span>
            <span className="text-[11px] text-text-muted">{roleLabel(reply.author.role)}</span>
            <span className="text-[11px] text-text-muted">
              <time dateTime={reply.createdAt}>{relativeTime(reply.createdAt)}</time>
              {reply.editedAt && ' (edited)'}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">{reply.content}</p>
          <div className="mt-1.5 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-primary"
              aria-label="Reply to this comment"
            >
              <MessageSquare size={12} /> Reply
            </button>
            {(reply._count.children > 0 || (reply.children && reply.children.length > 0)) && (
              <button
                type="button"
                onClick={() => setShowChildren(!showChildren)}
                className="inline-flex items-center gap-1 text-text-secondary hover:text-primary"
                aria-expanded={showChildren}
              >
                {showChildren ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {reply._count.children || reply.children?.length || 0} repl{reply._count.children === 1 ? 'y' : 'ies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {showChildren && reply.children && reply.children.length > 0 && (
        <div className="mt-2 ml-6 space-y-2">
          {reply.children.map(child => (
            <NestedReplyItem key={child.id} reply={child} />
          ))}
        </div>
      )}

      {/* Reply composer */}
      {showReplyBox && (
        <div className="mt-2 ml-10">
          <ReplyComposer
            postId={postId}
            parentId={reply.id}
            onSuccess={() => { setShowReplyBox(false); onReplyAdded(); }}
            onCancel={() => setShowReplyBox(false)}
          />
        </div>
      )}
    </div>
  );
}

function NestedReplyItem({ reply }: { reply: CommunityReply }) {
  const initials = getInitials(reply.author.name);
  if (reply.deletedAt) {
    return <div className="rounded-lg border border-dashed border-border p-2 text-xs text-text-muted italic">This reply was removed.</div>;
  }
  return (
    <div className="flex gap-2">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-muted text-[10px] font-bold text-text-secondary" aria-hidden="true">
        {initials}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-text-primary">{reply.author.name}</span>
          <span className="text-text-muted">{relativeTime(reply.createdAt)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">{reply.content}</p>
      </div>
    </div>
  );
}

function ReplyComposer({ postId, parentId, onSuccess, onCancel }: {
  postId: string;
  parentId: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), parentId: parentId || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to post reply');
      }
      setContent('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2" aria-label={parentId ? 'Reply to comment' : 'Write a reply'}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={parentId ? 'Write a reply…' : 'Add a comment…'}
        rows={2}
        className="min-w-0 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        required
        aria-label={parentId ? 'Reply content' : 'Comment content'}
        disabled={sending}
      />
      <div className="flex flex-col gap-1">
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="rounded-lg bg-primary p-2 text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          aria-label="Submit reply"
        >
          <Send size={14} />
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border p-2 text-text-muted hover:bg-surface-muted"
            aria-label="Cancel reply"
          >
            ✕
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger mt-1" role="alert">{error}</p>}
    </form>
  );
}
