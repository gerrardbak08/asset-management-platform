import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, FileText } from 'lucide-react';
import type { LeaseContract } from '@aims/shared';
import { phase2Api } from '@/lib/api/phase2';
import { fmtKRprice } from '@/lib/format';
import { leaseStatusLabel } from '@/lib/phase2Labels';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

const MS_DAY = 24 * 60 * 60 * 1000;

function daysUntil(value: string): number {
  const end = new Date(`${value}T00:00:00`);
  const today = new Date();
  return Math.ceil((end.getTime() - today.getTime()) / MS_DAY);
}

function timelineWidth(lease: LeaseContract): number {
  const start = new Date(`${lease.contractStart}T00:00:00`).getTime();
  const end = new Date(`${lease.contractEnd}T00:00:00`).getTime();
  const total = Math.max(end - start, MS_DAY);
  const elapsed = Math.max(0, Math.min(Date.now() - start, total));
  return Math.max(6, Math.min(100, (elapsed / total) * 100));
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
        <MetricCard icon={FileText} label="전체 계약" value={`${leasesQ.data?.length ?? 0}건`} />
        <MetricCard icon={CalendarClock} label="월 임대료" value={`${fmtKRprice(totalRent)}원`} />
        <MetricCard
          icon={AlertTriangle}
          label="만료 임박"
          value={`${expiringCount}건`}
          tone={expiringCount > 0 ? 'danger' : 'default'}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[1.2fr,1fr,120px,120px,140px] border-b border-border px-4 py-2 text-caption font-semibold text-muted-foreground">
              <span>건물</span>
              <span>임차인</span>
              <span>상태</span>
              <span>만료</span>
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
                      className="grid grid-cols-[1.2fr,1fr,120px,120px,140px] items-center gap-4 px-4 py-3 text-body"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{lease.buildingName ?? lease.buildingId}</div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              left <= 7 ? 'bg-danger' : left <= 30 ? 'bg-warning' : 'bg-primary',
                            )}
                            style={{ width: `${timelineWidth(lease)}%` }}
                          />
                        </div>
                      </div>
                      <div className="truncate text-muted-foreground whitespace-nowrap">{lease.tenantName}</div>
                      <span className="w-fit whitespace-nowrap rounded-full bg-muted px-2 py-1 text-caption font-semibold">
                        {leaseStatusLabel[lease.status]}
                      </span>
                      <span className={cn('text-caption whitespace-nowrap', left <= 30 ? 'text-danger' : 'text-muted-foreground')}>
                        {lease.contractEnd} · {left >= 0 ? `${left}일` : `${Math.abs(left)}일 경과`}
                      </span>
                      <span className="whitespace-nowrap text-right font-semibold text-foreground">
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

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <Card className="flex min-h-[92px] items-center gap-3 p-4">
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-xl',
          tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-muted text-primary',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <div className="text-caption text-muted-foreground">{label}</div>
        <div className="mt-1 text-heading-md font-bold text-foreground">{value}</div>
      </div>
    </Card>
  );
}
