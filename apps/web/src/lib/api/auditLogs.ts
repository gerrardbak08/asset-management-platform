// 감사 로그 API 클라이언트
import { api } from './index';
import type { AuditLogPage } from '@aims/shared';

export type AuditLogParams = {
  page?: number;
  pageSize?: number;
  action?: string;
  resource?: string;
};

export const auditLogsApi = {
  list: (params: AuditLogParams = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.action) q.set('action', params.action);
    if (params.resource) q.set('resource', params.resource);
    const qs = q.toString();
    return api.get<AuditLogPage>(`/audit-logs${qs ? `?${qs}` : ''}`);
  },
};
