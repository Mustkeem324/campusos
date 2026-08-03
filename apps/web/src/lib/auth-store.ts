import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, UserSession } from './types';

interface AuthState {
  currentSession: UserSession | null;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  isCmdPaletteOpen: boolean;

  setSession: (session: UserSession | null) => void;
  setRole: (role: UserRole) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setCmdPaletteOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentSession: null,
  isDarkMode: true,
  isSidebarCollapsed: false,
  isCmdPaletteOpen: false,

  setSession: (session: UserSession | null) => set({ currentSession: session }),

  setRole: (role: UserRole) =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, role }
        : null,
    })),

  toggleDarkMode: () =>
    set((state) => {
      const nextMode = !state.isDarkMode;
      if (typeof document !== 'undefined') {
        if (nextMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDarkMode: nextMode };
    }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setCmdPaletteOpen: (open: boolean) => set({ isCmdPaletteOpen: open }),
    }),
    {
      name: 'campusos-auth-storage',
    }
  )
);
