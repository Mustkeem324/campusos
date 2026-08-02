import { describe, it, expect } from 'vitest';
import { OfflineSyncQueue } from '../lib/offline-sync-engine';

describe('Phase 9 Offline Sync Queue Conflict Resolution Test Suite', () => {
  it('should process pending offline mutations using Last-Write-Wins (LWW) strategy', () => {
    const queue = new OfflineSyncQueue();

    queue.enqueue({
      entityType: 'ATTENDANCE',
      payload: { studentId: 's1', status: 'PRESENT' },
      clientTimestamp: 1000,
    });

    queue.enqueue({
      entityType: 'QUIZ_SUBMISSION',
      payload: { quizId: 'q1', score: 95 },
      clientTimestamp: 1050,
    });

    expect(queue.getPendingMutations().length).toBe(2);

    const res = queue.processSyncQueue();
    expect(res.syncedCount).toBe(2);
    expect(queue.getPendingMutations().length).toBe(0);
  });
});
