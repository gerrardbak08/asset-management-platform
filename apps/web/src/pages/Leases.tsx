import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, FileText } from 'lucide-react';
import { phase2Api } from '@/lib/api/phase2';
import { fmtKRprice } from '@/lib/format';
import { leaseStatusLabel } from '@/lib/phase2Labels';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

const STATUS_CLASS: Record<string, string> = {
  active:     'bg-success-subtle text-success border-success/30',
  expired:    'bg-danger-subtle text-danger border-danger/30',
  terminated: 'bg-muted text-muted-foreground border-border',
  pending:    'bg-warning-subtle text-warning border-warning/30',
};

const MS_DAY = 24 * 60 * 60 * 1000;

function daysUntil(value: string): number {
  const end = new Date(`${value}T00:00:00`);
  const today = new Date();
  return Math.ceil((end.getTime() - today.getTime()) / MS_DAY);
}


export default function Leases() {
  const leasesQ = useQuery({ queryKey: ['leases'], queryFn: () => phase2Api.leases() });
  const expiringQ = useQuery({
    queryKey: ['leases', 'expiring', 30],
    queryFn: () => phase2Api.expiringLeases(30),
  });

  const active = useMemo(
    () => (leasesQ.data ?? []).filter((lease) => lease.status === 'active'),
    [leasesQ.data],
  );
  const totalRent = active.reduce((sum, lease) => sum + Number(lease.monthlyRent), 0);
  const expiringCount =
    (expiringQ.data?.critical.length ?? 0) + (expiringQ.data?.warning.length ?? 0);

  return (
    <PageShell title="임대계약" description={`활성 ${active.length}건 · 30일 내 만료 ${expiringCount}건`}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard icon={FileText} label="전체 계약" value={`${leasesQ.data?.length ?? 0}건`} />
        <KpiCard icon={CalendarClock} label="월 임대료" value={`${fmtKRprice(totalRent)}원`} />
        <KpiCard
          icon={AlertTriangle}
          label="만료 임박"
          value={`${expiringCount}건`}
          tone={expiringCount > 0 ? 'danger' : 'default'}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[1.2fr,1fr,100px,140px,140px] border-b border-border bg-muted/40 px-4 py-2 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
              <span>건물</span>
              <span>임차인</span>
              <span className="text-center">상태</span>
              <span>만료일</span>
              <span className="text-right">월 임대료</span>
            </div>
            {leasesQ.isLoading ? (
              <p className="p-4 text-caption text-muted-foreground">로딩 중…</p>
            ) : leasesQ.isError ? (
              <p className="p-4 text-caption text-danger">로드 실패 — {leasesQ.error.message}</p>
            ) : !leasesQ.data?.length ? (
              <EmptyState
                icon={FileText}
                title="임대계약 데이터 없음"
                description="V16 스냅샷 ETL 또는 신규 계약 등록 후 표시됩니다."
              />
            ) : (
              <div className="divide-y divide-border">
                {leasesQ.data.map((lease) => {
                  const left = daysUntil(lease.contractEnd);
                  return (
                    <div
                      key={lease.id}
                      className="grid grid-cols-[1.2fr,1fr,100px,140px,140px] items-center gap-3 px-4 py-2.5 text-caption"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{lease.buildingName ?? lease.buildingId}</div>
                      </div>
                      <div className="truncate text-muted-foreground">{lease.tenantName}</div>
                      <span className={cn(
                        'w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-micro font-medium',
                        STATUS_CLASS[lease.status] ?? STATUS_CLASS.terminated,
                      )}>
                        {leaseStatusLabel[lease.status]}
                      </span>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-muted-foreground">{lease.contractEnd}</span>
                        <span className={cn(
                          'rounded-full px-1.5 py-0.5 text-micro font-medium',
                          left <= 7  ? 'bg-danger-subtle text-danger' :
                          left <= 30 ? 'bg-warning-subtle text-warning' :
                          left < 0   ? 'bg-muted text-muted-foreground' :
                                       'bg-success-subtle text-success',
                        )}>
                          {left >= 0 ? `${left}일` : `${Math.abs(left)}일 경과`}
                        </span>
                      </div>
                      <span className="whitespace-nowrap text-right font-medium text-foreground">
                        {fmtKRprice(Number(lease.monthlyRent))}원
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
