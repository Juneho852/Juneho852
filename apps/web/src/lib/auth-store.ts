'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

interface AuthState {
  token: string | null;
  userId: string | null;
  role: 'EMPLOYER' | 'HELPER' | 'BROKER' | 'ADMIN' | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requiresMfa?: boolean; userId?: string }>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  verifyMfa: (userId: string, token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      role: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.requiresMfa) {
          return { requiresMfa: true, userId: res.data.userId };
        }
        localStorage.setItem('matchai_token', res.data.accessToken);
        set({ token: res.data.accessToken, userId: res.data.userId, role: res.data.role, isAuthenticated: true });
        return {};
      },

      register: async (data) => {
        const res = await api.post('/auth/register', data);
        localStorage.setItem('matchai_token', res.data.accessToken);
        set({ token: res.data.accessToken, userId: res.data.userId, role: res.data.role, isAuthenticated: true });
      },

      verifyMfa: async (userId, token) => {
        const res = await api.post('/auth/mfa/verify', { userId, token });
        localStorage.setItem('matchai_token', res.data.accessToken);
        set({ token: res.data.accessToken, userId: res.data.userId, role: res.data.role, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('matchai_token');
        set({ token: null, userId: null, role: null, isAuthenticated: false });
      },
    }),
    { name: 'matchai-auth', partialize: (s) => ({ token: s.token, userId: s.userId, role: s.role, isAuthenticated: s.isAuthenticated }) },
  ),
);
