import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  status: 'Active' | 'Inactive';
  email?: string;
  phoneNumber?: string;
  employeeName?: string;
  department?: string;
  employeeCode?: string;
  pageAccess: string[];
  employeeId?: string;
  pagePermissions: Record<string, 'modify' | 'view_only'>;
  locationAccess: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (employeeId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (employeeId: string, password: string, employeeName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,

      login: async (employeeId, password) => {
        try {
          const trimmedId = String(employeeId || '').trim();
          const response = await fetch(
            'http://localhost:5000/api/auth/login',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employeeId: trimmedId,
                password,
              }),
            }
          );

          const result = await response.json();

          if (!response.ok || !result.success) {
            return {
              success: false,
              message: result.message || 'Invalid Employee ID or password',
            };
          }

          set({
            isAuthenticated: true,
            token: result.data.token,
            user: result.data.user,
          });

          return { success: true };
        } catch (error: any) {
          console.error('Login error:', error);
          return {
            success: false,
            message: 'Unable to connect to authentication server. Please try again.',
          };
        }
      },

      register: async (employeeId, password, employeeName) => {
        try {
          const trimmedId = String(employeeId || '').trim();
          const response = await fetch(
            'http://localhost:5000/api/auth/register',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employeeId: trimmedId,
                password,
                employeeName,
              }),
            }
          );

          const result = await response.json();

          if (!response.ok || !result.success) {
            return {
              success: false,
              message: result.message || 'Registration failed. Please try again.',
            };
          }

          return { success: true, message: result.message };
        } catch (error: any) {
          console.error('Registration error:', error);
          return {
            success: false,
            message: 'Unable to connect to authentication server. Please try again.',
          };
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          user: null,
        });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      refreshUser: async () => {
        const { token, user } = get();
        if (!token || !user) return;
        try {
          const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.status === 401) {
            set({ isAuthenticated: false, token: null, user: null });
            return;
          }
          const result = await res.json();
          if (res.ok && result.success && result.data) {
            set({ user: result.data });
          }
        } catch (err) {
          console.error('Failed to refresh user:', err);
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;