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
            <div className="grid grid-cols-[1.2fr,1fr,120px,120px,140px] border-b border-border px-4 py-2 text-caption font-semibold text-muted-foreground">
              <span className="text-center">건물</span>
              <span className="text-center">임차인</span>
              <span className="text-center">상태</span>
              <span className="text-center">만료</span>
              <span className="text-center">월 임대료</span>
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
                      className="grid grid-cols-[1.2fr,1fr,120px,120px,140px] items-center gap-4 px-4 py-3 text-caption"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{lease.buildingName ?? lease.buildingId}</div>
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
