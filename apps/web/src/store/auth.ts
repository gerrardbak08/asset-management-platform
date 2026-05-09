// 인증 상태 — Zustand. 첫 마운트 시 GET /api/auth/me 로 현재 사용자 조회 (boot)
import { create } from 'zustand';
import type { AuthUser } from '@/lib/api/auth';
import { authApi } from '@/lib/api/auth';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  boot: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  boot: async () => {
    set({ loading: true, error: null });
    try {
      const { user } = await authApi.me();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user } = await authApi.login(email, password);
      set({ user, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인 실패';
      set({ user: null, loading: false, error: message });
      throw err;
    }
  },
  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
}));
