// 자산현황 페이지 — Radix Tabs 5개: 개요/드릴다운/비품/취득연혁/임대현황
import * as Tabs from '@radix-ui/react-tabs';
import { useQuery } from '@tanstack/react-query';
import { Database } from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard';
import { PageShell } from '@/components/ui/PageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroKPI } from '@/components/dashboard/HeroKPI';
import { AssetKpiCards } from '@/components/dashboard/AssetKpiCards';
import { AssetTrendChart } from '@/components/dashboard/AssetTrendChart';
import { MomBarChart } from '@/components/dashboard/MomBarChart';
import { AssetDrilldownSubtab } from '@/components/dashboard/AssetDrilldownSubtab';
import { SuppliesOpsSubtab } from '@/components/dashboard/SuppliesOpsSubtab';
import { AcquisitionHistorySubtab } from '@/components/dashboard/AcquisitionHistorySubtab';
import { LeaseStatusSubtab } from '@/components/dashboard/LeaseStatusSubtab';
import { ExecInsight } from '@/components/dashboard/ExecInsight';
import { cn } from '@/lib/utils';

const PERIOD = '2026-03';

const SUBTABS = [
  { value: 'overview', label: '개요' },
  { value: 'drill', label: '자산 드릴다운' },
  { value: 'supplies', label: '비품' },
  { value: 'acquisition', label: '취득 연혁' },
  { value: 'lease', label: '임대 현황' },
] as const;

export default function Dashboard() {
  const q = useQuery({
    queryKey: ['mom', PERIOD],
    queryFn: () => dashboardApi.mom(PERIOD),
  });

  return (
    <PageShell title="자산현황" description={`${PERIOD} 기준 (전월 대비)`}>
      {q.isLoading ? (
        <p className="text-caption text-muted-foreground">로딩 중…</p>
      ) : q.isError ? (
        <EmptyState
          icon={Database}
          title="MoM 데이터 없음"
          description={`'pnpm --filter api etl:migrate' 를 실행해 V16 데이터를 적재한 뒤 새로고침하세요. (${q.error.message})`}
        />
      ) : !q.data ? null : (
        <Tabs.Root defaultValue="overview" className="flex flex-col gap-3">
          <Tabs.List className="-mx-1 flex shrink-0 gap-1 overflow-x-auto border-b border-border px-1">
            {SUBTABS.map((t) => (
              <Tabs.Trigger
                key={t.value}
                value={t.value}
                className={cn(
                  'shrink-0 border-b-2 border-transparent px-3 py-2 text-body font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground',
                  'data-[state=active]:border-primary data-[state=active]:text-foreground',
                )}
              >
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="overview" className="space-y-4 outline-none">
            <HeroKPI m0={q.data} />
            <AssetKpiCards m0={q.data} />
            <ExecInsight m0={q.data} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AssetTrendChart />
              <MomBarChart m0={q.data} />
            </div>
          </Tabs.Content>

          <Tabs.Content value="drill" className="outline-none">
            <AssetDrilldownSubtab m0={q.data} />
          </Tabs.Content>

          <Tabs.Content value="supplies" className="outline-none">
            <SuppliesOpsSubtab m0={q.data} />
          </Tabs.Content>

          <Tabs.Content value="acquisition" className="outline-none">
            <AcquisitionHistorySubtab />
          </Tabs.Content>

          <Tabs.Content value="lease" className="outline-none">
            <LeaseStatusSubtab />
          </Tabs.Content>
        </Tabs.Root>
      )}
    </PageShell>
  );
}
