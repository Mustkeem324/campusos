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
  id: 'usr_mustkeem_500129078',
  email: 'mustkeem.129078@stu.upes.ac.in',
  name: 'MUSTKEEM AHMAD',
  tenantId: 'inst_upes_univ',
  institutionName: 'UPES University',
  role: 'STUDENT',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  departmentId: 'dept_mba_ba_upes'
};

export const useAuthStore = create<AuthState>((set) => ({
  currentSession: DEFAULT_SESSION,
  isDarkMode: true,
  isSidebarCollapsed: false,
  isCmdPaletteOpen: false,

  setRole: (role: UserRole) =>
    set((state) => ({
      currentSession:
        role === 'STUDENT'
          ? DEFAULT_SESSION
          : { ...state.currentSession, role }
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
