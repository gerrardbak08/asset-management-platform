import { useQuery } from '@tanstack/react-query';
import { Calculator, Landmark } from 'lucide-react';
import type { DepreciationSchedule } from '@aims/shared';
import { phase2Api } from '@/lib/api/phase2';
import { fmtKRprice } from '@/lib/format';
import { depMethodLabel } from '@/lib/phase2Labels';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

const PERIOD = '2026-03';

export default function Depreciation() {
  const summaryQ = useQuery({
    queryKey: ['depreciation-summary', PERIOD],
    queryFn: () => phase2Api.depreciationSummary(PERIOD),
  });
  const schedulesQ = useQuery({
    queryKey: ['depreciation-schedules'],
    queryFn: () => phase2Api.depreciationSchedules(),
  });

  return (
    <PageShell
      title="감가상각"
      description={`${PERIOD} 기준 · 총 ${fmtKRprice(Number(summaryQ.data?.total ?? 0))}원`}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard label="건물" value={`${fmtKRprice(Number(summaryQ.data?.buildings ?? 0))}원`} />
        <SummaryCard label="비품" value={`${fmtKRprice(Number(summaryQ.data?.equipments ?? 0))}원`} />
        <SummaryCard label="합계" value={`${fmtKRprice(Number(summaryQ.data?.total ?? 0))}원`} />
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.2fr,100px,120px,120px,140px] border-b border-border px-4 py-2 text-caption font-semibold text-muted-foreground max-lg:hidden">
          <span>자산</span>
          <span>방법</span>
          <span>내용연수</span>
          <span>취득일</span>
          <span className="text-right">장부가</span>
        </div>
        {schedulesQ.isLoading ? (
          <p className="p-4 text-caption text-muted-foreground">로딩 중…</p>
        ) : schedulesQ.isError ? (
          <p className="p-4 text-caption text-danger">로드 실패 — {schedulesQ.error.message}</p>
        ) : !schedulesQ.data?.length ? (
          <EmptyState
            icon={Calculator}
            title="감가상각 스케줄 없음"
            description="ETL 또는 자산 등록 후 스케줄이 생성됩니다."
          />
        ) : (
          <div className="divide-y divide-border">
            {schedulesQ.data.map((schedule) => (
              <ScheduleRow key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex min-h-[92px] items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary">
        <Landmark className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <div className="text-caption text-muted-foreground">{label}</div>
        <div className="mt-1 text-heading-md font-bold text-foreground">{value}</div>
      </div>
    </Card>
  );
}

function ScheduleRow({ schedule }: { schedule: DepreciationSchedule }) {
  const latest = schedule.entries?.[0];
  return (
    <div className="grid gap-2 px-4 py-3 text-body lg:grid-cols-[1.2fr,100px,120px,120px,140px] lg:items-center">
      <div className="min-w-0">
        <div className="truncate font-semibold text-foreground">
          {schedule.buildingName ?? schedule.equipmentName ?? schedule.id}
        </div>
        <div className="text-caption text-muted-foreground">
          {schedule.assetType === 'building' ? '건물' : '비품'} · 취득가 {fmtKRprice(Number(schedule.acquisitionPrice))}원
        </div>
      </div>
      <span>{depMethodLabel[schedule.method]}</span>
      <span>{schedule.usefulLifeYears}년</span>
      <span className="text-caption text-muted-foreground">{schedule.acquisitionDate}</span>
      <span className="font-semibold text-foreground lg:text-right">
        {latest ? `${fmtKRprice(Number(latest.bookValue))}원` : '-'}
      </span>
    </div>
  );
}
