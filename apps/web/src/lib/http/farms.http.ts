import { httpClient } from './client';
import type { Farm, CreateFarmRequest, UpdateFarmRequest, SetIrzCredentialsRequest } from '@ploner/types';

export const farmsHttp = {
  getAll: () => httpClient.get<Farm[]>('/farms'),

  getById: (id: string) => httpClient.get<Farm>(`/farms/${id}`),

  create: (data: CreateFarmRequest) => httpClient.post<Farm>('/farms', data),

  update: (id: string, data: UpdateFarmRequest) => httpClient.put<Farm>(`/farms/${id}`, data),

  setIrzCredentials: (id: string, data: SetIrzCredentialsRequest) =>
    httpClient.post(`/farms/${id}/irz-credentials`, data),
};


