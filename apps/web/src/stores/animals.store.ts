import { create } from 'zustand';
import { animalsHttp } from '@/lib/http/animals.http';
import type { Animal, AnimalFilters } from '@ploner/types';

interface AnimalsState {
  animals: Animal[];
  total: number;
  isLoading: boolean;
  error: string | null;
  filters: AnimalFilters;

  fetchAnimals: (farmId: string) => Promise<void>;
  setFilters: (filters: Partial<AnimalFilters>) => void;
  clearAnimals: () => void;
}

export const useAnimalsStore = create<AnimalsState>((set, get) => ({
  animals: [],
  total: 0,
  isLoading: false,
  error: null,
  filters: { page: 1, pageSize: 20 },

  fetchAnimals: async (farmId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await animalsHttp.getByFarm(farmId, get().filters);
      set({ animals: data.items, total: data.total, isLoading: false });
    } catch {
      set({ error: 'Nie udało się pobrać zwierząt', isLoading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearAnimals: () => set({ animals: [], total: 0 }),
}));


