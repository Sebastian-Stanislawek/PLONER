import type { Species, Gender, AnimalStatus, PaginatedResponse } from '../common';

export interface Animal {
  id: string;
  farmId: string;
  irzId: string | null;
  earTagNumber: string;
  species: Species;
  breed: string | null;
  gender: Gender;
  birthDate: string | null;
  motherEarTag: string | null;
  status: AnimalStatus;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnimalFilters {
  species?: Species;
  status?: AnimalStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type AnimalListResponse = PaginatedResponse<Animal>;

export interface AnimalEvent {
  id: string;
  animalId: string;
  eventType: string;
  eventDate: string;
  description: string | null;
}


