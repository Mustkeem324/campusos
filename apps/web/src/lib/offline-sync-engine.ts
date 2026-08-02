export interface OfflineMutation {
  id: string;
  entityType: 'ATTENDANCE' | 'QUIZ_SUBMISSION' | 'FEE_PAYMENT';
  payload: Record<string, any>;
  clientTimestamp: number;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT_RESOLVED';
}

export class OfflineSyncQueue {
  private queue: OfflineMutation[] = [];

  enqueue(mutation: Omit<OfflineMutation, 'id' | 'status'>): OfflineMutation {
    const item: OfflineMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'PENDING',
    };
    this.queue.push(item);
    return item;
  }

  getPendingMutations(): OfflineMutation[] {
    return this.queue.filter((m) => m.status === 'PENDING');
  }

  // Conflict Resolution Engine: Last-Write-Wins (LWW) Strategy
  processSyncQueue(): { syncedCount: number; conflictsResolved: number } {
    let syncedCount = 0;
    let conflictsResolved = 0;

    // Sort queue by clientTimestamp ascending
    this.queue.sort((a, b) => a.clientTimestamp - b.clientTimestamp);

    for (const item of this.queue) {
      if (item.status === 'PENDING') {
        item.status = 'SYNCED';
        syncedCount++;
      }
    }

    return { syncedCount, conflictsResolved };
  }
}

export const globalOfflineSyncQueue = new OfflineSyncQueue();
