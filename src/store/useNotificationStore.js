import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notification: null,
  history: [],
  showNotification: (title, message, type = 'success', duration = 4000) => {
    const newNotif = { title, message, type, id: Date.now(), read: false, timestamp: new Date().toISOString() };
    
    set((state) => ({ 
      notification: newNotif,
      history: [newNotif, ...state.history]
    }));
    
    // Haptic feedback nativo
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'success' ? [30, 50, 30] : [50, 100, 50]);
    }

    setTimeout(() => {
      set((state) => {
        if (state.notification?.id === newNotif.id) {
          return { notification: null };
        }
        return state;
      });
    }, duration);
  },
  hideNotification: () => set({ notification: null }),
  markAsRead: () => set((state) => ({
    history: state.history.map(n => ({ ...n, read: true }))
  })),
  clearHistory: () => set({ history: [] })
}));
