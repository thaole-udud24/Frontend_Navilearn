import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useSubjectStore } from '@/hooks/useSubjectStore';
import type { User } from '@/services/account/account.auth.types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// Global UI/session state only — server data (e.g. list results) belongs in React Query, not here.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    useSubjectStore.getState().reset();
    set({ user: null });
  },
}));
