// 관리자 API — 사용자 관리 + 시스템 통계 + 본인 비밀번호 변경
import { api } from './index';

export type AdminRole = 'admin' | 'editor' | 'viewer' | 'auditor';
export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};
export type AdminStats = {
  users: number;
  buildings: number;
  equipments: number;
  equipmentSnapshots: number;
  stores: number;
  monthlySnapshots: number;
  periods: string[];
};

export const adminApi = {
  users: () => api.get<AdminUser[]>('/admin/users'),
  createUser: (email: string, password: string, role: AdminRole) =>
    api.post<AdminUser>('/admin/users', { email, password, role }),
  updateUser: (id: string, patch: { role?: AdminRole; password?: string }) =>
    api.put<AdminUser>(`/admin/users/${id}`, patch),
  deleteUser: (id: string) => api.delete<Record<string, never>>(`/admin/users/${id}`),
  stats: () => api.get<AdminStats>('/admin/stats'),
};

export const meApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<Record<string, never>>('/auth/change-password', { currentPassword, newPassword }),
};
