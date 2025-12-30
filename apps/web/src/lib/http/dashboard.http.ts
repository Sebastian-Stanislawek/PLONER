import { httpClient } from './client';

export interface DashboardStats {
  animalsCount: number;
  animalsBySpecies: Record<string, number>;
  pendingDocuments: number;
  submittedDocuments: number;
  lastSyncAt: string | null;
  syncStatus: string;
}

export interface ActivityItem {
  id: string;
  type: 'SYNC' | 'DOCUMENT' | 'ANIMAL';
  action: string;
  description: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: 'BIRTH' | 'DEATH' | 'TRANSFER';
  message: string;
  dueDate: string;
  daysLeft: number;
  animalId?: string;
  earTagNumber?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const dashboardHttp = {
  getStats: (farmId: string) => httpClient.get<DashboardStats>(`/dashboard/stats/${farmId}`),

  getActivity: (farmId: string) => httpClient.get<ActivityItem[]>(`/dashboard/activity/${farmId}`),

  getReminders: (farmId: string) => httpClient.get<Reminder[]>(`/dashboard/reminders/${farmId}`),

  getActivityLogs: (limit = 50) => httpClient.get<ActivityLog[]>(`/dashboard/activity-logs?limit=${limit}`),
};

