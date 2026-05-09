// 인증 API — login / me / logout
import { api } from './index';

export type AuthUser = { id: string; email: string; role: 'admin' | 'editor' | 'viewer' | 'auditor' };

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: AuthUser }>('/auth/login', { email, password }),
  me: () => api.get<{ user: AuthUser }>('/auth/me'),
  logout: () => api.post<Record<string, never>>('/auth/logout'),
};
