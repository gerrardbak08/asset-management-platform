// 감사 로그 페이지 — admin/auditor 전용, 시스템 조작 이력 테이블 + 필터
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { auditLogsApi } from '@/lib/api/auditLogs';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import type { AuditAction } from '@aims/shared';

const ACTION_LABELS: Record<AuditAction, string> = {
  login: '로그인',
  logout: '로그아웃',
  create: '생성',
  update: '수정',
  delete: '삭제',
  export: '내보내기',
  upload: '업로드',
};

const ACTION_TONE: Record<AuditAction, string> = {
  login: 'bg-success/10 text-success',
  logout: 'bg-muted text-muted-foreground',
  create: 'bg-info/10 text-info',
  update: 'bg-warning/10 text-warning',
  delete: 'bg-danger/10 text-danger',
  export: 'bg-primary/10 text-primary',
  upload: 'bg-primary/10 text-primary',
};

const ACTIONS: AuditAction[] = ['login', 'logout', 'create', 'update', 'delete', 'export', 'upload'];

const RESOURCE_LABELS: Record<string, string> = {
  building: '건물',
  lease: '임대계약',
  maintenance: '유지보수',
  ledger: '비품원장',
  user: '사용자',
  snapshot: '스냅샷',
  depreciation: '감가상각',
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterResource, setFilterResource] = useState<string>('');
  const pageSize = 50;

  const query = useQuery({
    queryKey: ['audit-logs', page, filterAction, filterResource],
    queryFn: () =>
      auditLogsApi.list({
        page,
        pageSize,
        action: filterAction || undefined,
        resource: filterResource || undefined,
      }),
  });

  const totalPages = query.data ? Math.ceil(query.data.total / pageSize) : 1;

  return (
    <PageShell title="감사 로그" description="시스템 조작 이력 — admin/auditor 전용">
      {/* 필터 칩 */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-1">
          <span className="self-center text-micro font-semibold uppercase tracking-wider text-muted-foreground">액션.</span>
          {ACTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setFilterAction(filterAction === a ? '' : a); setPage(1); }}
              className={cn(
                'rounded-full border px-1.5 py-0.5 text-micro font-medium transition-colors',
                filterAction === a
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              {ACTION_LABELS[a]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="self-center text-micro font-semibold uppercase tracking-wider text-muted-foreground">리소스.</span>
          {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setFilterResource(filterResource === key ? '' : key); setPage(1); }}
              className={cn(
                'rounded-full border px-1.5 py-0.5 text-micro font-medium transition-colors',
                filterResource === key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 로그 테이블 */}
      {query.isLoading ? (
        <p className="text-caption text-muted-foreground">로딩 중…</p>
      ) : query.isError ? (
        <p className="text-caption text-danger">로드 실패 — {query.error.message}</p>
      ) : !query.data || query.data.items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="감사 로그가 없습니다"
          description="시스템 조작이 기록되면 여기에 표시됩니다."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[640px] text-caption">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">시각</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">사용자</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">액션</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">리소스</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">상세</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((log, i) => (
                  <tr
                    key={log.id}
                    className={cn(
                      'border-b border-border transition-colors hover:bg-muted/30',
                      i % 2 === 0 ? '' : 'bg-muted/10',
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-2 font-mono tabular-nums text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2 text-foreground">{log.userEmail ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-micro font-semibold',
                          ACTION_TONE[log.action as AuditAction] ?? 'bg-muted text-muted-foreground',
                        )}
                      >
                        {ACTION_LABELS[log.action as AuditAction] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {log.resource ? (RESOURCE_LABELS[log.resource] ?? log.resource) : '—'}
                      {log.resourceId ? (
                        <span className="ml-1 font-mono text-micro opacity-60">#{log.resourceId.slice(0, 8)}</span>
                      ) : null}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-muted-foreground">
                      {log.detail ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-micro text-muted-foreground">
                      {log.ip ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-caption text-muted-foreground">
                {query.data.total.toLocaleString('ko-KR')}건 중 {((page - 1) * pageSize + 1).toLocaleString('ko-KR')}–{Math.min(page * pageSize, query.data.total).toLocaleString('ko-KR')}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border px-3 py-1.5 text-caption disabled:opacity-40 hover:bg-muted"
                >
                  이전
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border px-3 py-1.5 text-caption disabled:opacity-40 hover:bg-muted"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </PageShell>
  );
}
