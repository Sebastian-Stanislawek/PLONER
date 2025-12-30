import { httpClient } from './client';
import type { Animal, PaginatedResponse } from '@ploner/types';

interface GetAnimalsParams {
  species?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AnimalDetails extends Animal {
  events: Array<{
    id: string;
    eventType: string;
    eventDate: string;
    description: string | null;
  }>;
  documents: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
    submittedAt: string | null;
    irzDocNumber: string | null;
  }>;
  farm: {
    id: string;
    name: string | null;
    producerNumber: string;
  };
}

export const animalsHttp = {
  getByFarm: (farmId: string, params?: GetAnimalsParams) =>
    httpClient.get<PaginatedResponse<Animal>>(`/animals/farm/${farmId}`, { params }),

  getById: (id: string) => httpClient.get<AnimalDetails>(`/animals/${id}`),
};
