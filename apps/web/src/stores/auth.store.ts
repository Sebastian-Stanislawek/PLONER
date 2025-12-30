import { create } from 'zustand';
import { authHttp } from '@/lib/http/auth.http';
import type { UserInfo } from '@ploner/types';

interface AuthState {
  user: UserInfo | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: UserInfo | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authHttp.login({ email, password });
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      set({ user: data.user, isLoading: false });
      return true;
    } catch {
      set({ error: 'Nieprawidłowe dane logowania', isLoading: false });
      return false;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authHttp.register({ email, password });
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      set({ user: data.user, isLoading: false });
      return true;
    } catch {
      set({ error: 'Rejestracja nie powiodła się', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));


