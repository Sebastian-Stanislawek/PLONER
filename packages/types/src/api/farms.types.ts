import type { SyncStatus } from '../common';

export interface Farm {
  id: string;
  userId: string;
  producerNumber: string;
  herdNumber: string;
  name: string | null;
  address: string | null;
  lastSyncAt: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  animalsCount?: number;
}

export interface CreateFarmRequest {
  producerNumber: string;
  herdNumber: string;
  name?: string;
  address?: string;
}

export interface UpdateFarmRequest {
  name?: string;
  address?: string;
}

export interface SetIrzCredentialsRequest {
  irzLogin: string;
  irzPassword: string;
}


