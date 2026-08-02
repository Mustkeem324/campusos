import { create } from 'zustand';
import { UserRole, UserSession } from './types';

interface AuthState {
  currentSession: UserSession;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  isCmdPaletteOpen: boolean;

  setRole: (role: UserRole) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setCmdPaletteOpen: (open: boolean) => void;
}

const DEFAULT_SESSION: UserSession = {
  id: 'usr_demo_101',
  email: 'admin@apexuniversity.edu',
  name: 'Dr. Sarah Vance',
  tenantId: 'inst_apex_univ',
  institutionName: 'Apex Technological University',
  role: 'SUPER_ADMIN',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  departmentId: 'dept_cs_01'
};

export const useAuthStore = create<AuthState>((set) => ({
  currentSession: DEFAULT_SESSION,
  isDarkMode: true,
  isSidebarCollapsed: false,
  isCmdPaletteOpen: false,

  setRole: (role: UserRole) =>
    set((state) => ({
      currentSession: { ...state.currentSession, role }
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
}));
