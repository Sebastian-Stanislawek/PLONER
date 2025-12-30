import type { SyncStatus } from '../common';

export interface StartSyncRequest {
  farmId: string;
}

export interface StartSyncResponse {
  jobId: string;
  status: SyncStatus;
}

export interface SyncStatusResponse {
  jobId: string;
  status: SyncStatus;
  progress?: number;
  entitiesSynced?: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface SyncLog {
  id: string;
  farmId: string;
  direction: 'PULL' | 'PUSH';
  status: SyncStatus;
  entitiesSynced: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}


