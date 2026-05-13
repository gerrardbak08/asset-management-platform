import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Wrench } from 'lucide-react';
import type { MaintenanceLog, MaintenanceStatus } from '@aims/shared';
import { phase2Api } from '@/lib/api/phase2';
import { fmtKRprice } from '@/lib/format';
import {
  maintenanceCategoryLabel,
  maintenancePriorityLabel,
  maintenanceStatusLabel,
} from '@/lib/phase2Labels';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

const COLUMNS: MaintenanceStatus[] = ['open', 'in_progress', 'closed', 'cancelled'];

const COL_CLASS: Record<MaintenanceStatus, string> = {
  open:        'text-warning',
  in_progress: 'text-info',
  closed:      'text-success',
  cancelled:   'text-muted-foreground',
};

const PRIORITY_CLASS: Record<string, string> = {
  critical: 'bg-danger-subtle text-danger',
  high:     'bg-warning-subtle text-warning',
  normal:   'bg-info-subtle text-info',
  low:      'bg-muted text-muted-foreground',
};

export default function Maintenance() {
  const logsQ = useQuery({ queryKey: ['maintenance'], queryFn: () => phase2Api.maintenance() });
  const costQ = useQuery({
    queryKey: ['maintenance', 'cost-summary'],
    queryFn: () => phase2Api.maintenanceCostSummary(),
  });

  const byStatus = useMemo(() => {
    const map = new Map<MaintenanceStatus, MaintenanceLog[]>();
    for (const status of COLUMNS) map.set(status, []);
    for (const log of logsQ.data ?? []) {
      map.get(log.status)?.push(log);
    }
    return map;
  }, [logsQ.data]);
  const activeCount = (byStatus.get('open')?.length ?? 0) + (byStatus.get('in_progress')?.length ?? 0);

  return (
    <PageShell
      title="유지보수"
      description={`진행 대상 ${activeCount}건 · 누적 비용 ${fmtKRprice(Number(costQ.data?.total ?? 0))}원`}
    >
      {logsQ.isLoading ? (
        <p className="text-caption text-muted-foreground">로딩 중…</p>
      ) : logsQ.isError ? (
        <p className="text-caption text-danger">로드 실패 — {logsQ.error.message}</p>
      ) : !logsQ.data?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="유지보수 로그 없음"
          description="건물별 점검·수리 이력을 등록하면 칸반에 표시됩니다."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          {COLUMNS.map((status) => (
            <Card key={status} className="min-h-chart-md p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className={`text-body-strong font-semibold ${COL_CLASS[status]}`}>
                  {maintenanceStatusLabel[status]}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-semibold text-muted-foreground">
                  {byStatus.get(status)?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(byStatus.get(status) ?? []).map((log) => (
                  <MaintenanceCard key={log.id} log={log} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function MaintenanceCard({ log }: { log: MaintenanceLog }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-caption font-semibold text-foreground">{log.title}</div>
          <div className="mt-0.5 truncate text-micro text-muted-foreground">{log.buildingName ?? log.buildingId}</div>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-micro font-bold', PRIORITY_CLASS[log.priority] ?? PRIORITY_CLASS.low)}>
          {maintenancePriorityLabel[log.priority]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-micro font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
          <Wrench className="h-3 w-3" aria-hidden="true" />
          {maintenanceCategoryLabel[log.category]}
        </span>
        {log.cost ? <span className="rounded-md bg-muted px-2 py-1">{fmtKRprice(Number(log.cost))}원</span> : null}
        {log.startedAt ? <span className="rounded-md bg-muted px-2 py-1">{log.startedAt}</span> : null}
      </div>
    </div>
  );
}
