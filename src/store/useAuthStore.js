import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true, // true by default to avoid flashing public routes on mount
  
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  
  clearAuth: () => set({ user: null, isLoading: false })
}));
