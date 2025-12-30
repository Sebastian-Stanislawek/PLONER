import { httpClient } from './client';
import type { StartSyncResponse, SyncStatusResponse, SyncLog } from '@ploner/types';

export const syncHttp = {
  start: (farmId: string) => httpClient.post<StartSyncResponse>('/sync/start', { farmId }),

  getStatus: (jobId: string) => httpClient.get<SyncStatusResponse>(`/sync/status/${jobId}`),

  getLogs: (farmId: string) => httpClient.get<SyncLog[]>(`/sync/logs/${farmId}`),
};


