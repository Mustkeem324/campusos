'use client';

import React from 'react';
import { BarChart3, Clock } from 'lucide-react';
import { PostPoll, relativeTime } from './community-types';

interface PollCardProps {
  poll: PostPoll;
  onVote: (optionId: string) => void;
}

export function PollCard({ poll, onVote }: PollCardProps) {
  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false;
  const hasVoted = poll.options.some(o => o.voted);

  return (
    <div className="rounded-lg border border-border bg-surface-muted p-4" role="group" aria-label="Poll">
      <div className="space-y-2">
        {poll.options.map(option => {
          const pct = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
          const showResults = hasVoted || isExpired;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !isExpired && onVote(option.id)}
              disabled={isExpired}
              className={`relative w-full overflow-hidden rounded-lg border text-left text-sm transition-all ${
                option.voted
                  ? 'border-primary bg-primary-soft font-medium text-primary'
                  : 'border-border bg-surface text-text-primary hover:border-primary/50'
              } ${isExpired ? 'cursor-default' : 'cursor-pointer'}`}
              aria-pressed={option.voted}
              aria-label={`${option.text}${showResults ? `, ${pct}%` : ''}`}
            >
              {showResults && (
                <div
                  className={`absolute inset-y-0 left-0 ${option.voted ? 'bg-primary/10' : 'bg-surface-muted'}`}
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              )}
              <span className="relative flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2">
                  {!showResults && (
                    <span className={`inline-block h-4 w-4 shrink-0 rounded-full border-2 ${
                      option.voted ? 'border-primary bg-primary' : 'border-border'
                    }`} aria-hidden="true" />
                  )}
                  {option.text}
                </span>
                {showResults && (
                  <span className="shrink-0 text-xs font-medium">
                    {pct}% · {option.voteCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1">
          <BarChart3 size={12} /> {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
        </span>
        {poll.isMultipleChoice && <span>Multiple choice</span>}
        {poll.isAnonymous && <span>Anonymous</span>}
        {poll.expiresAt && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {isExpired ? 'Closed' : `Ends ${relativeTime(poll.expiresAt)}`}
          </span>
        )}
      </div>
    </div>
  );
}
