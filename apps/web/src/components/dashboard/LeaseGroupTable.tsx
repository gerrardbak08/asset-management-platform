// 임대 현황 탭 — 지역/용도별 그룹 테이블 (GroupTable · GroupRowFragment · RiskBadge)
import { type Building } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { leaseRiskOf, type RiskLevel } from '@/lib/thresholds';

export type GroupRow = {
  key: string;
  count: number;
  totalPrice: number;
  avgRate: number;
  buildings: Building[];
};

const RISK_LABEL = { danger: '위험', warning: '주의', success: '안정' } as const;
const RISK_CLASS = {
  danger: 'text-danger bg-danger-subtle border-danger/30',
  warning: 'text-warning bg-warning-subtle border-warning/30',
  success: 'text-success bg-success-subtle border-success/30',
} as const;

export function GroupTable({
  title,
  description,
  groups,
  expanded,
  onToggle,
  onPickBuilding,
}: {
  title: string;
  description: string;
  groups: GroupRow[];
  expanded: string | null;
  onToggle: (key: string) => void;
  onPickBuilding: (b: Building) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4">
        <SectionHeader title={title} description={description} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40 text-caption text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">분류</th>
              <th className="px-3 py-2 text-right font-semibold">건수</th>
              <th className="px-3 py-2 text-right font-semibold">취득가 합계</th>
              <th className="px-3 py-2 text-right font-semibold">임대율</th>
              <th className="px-3 py-2 text-center font-semibold">상태</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const risk = leaseRiskOf(g.avgRate);
              const isOpen = expanded === g.key;
              return (
                <GroupRowFragment
                  key={g.key}
                  g={g}
                  risk={risk}
                  isOpen={isOpen}
                  onToggle={() => onToggle(g.key)}
                  onPickBuilding={onPickBuilding}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GroupRowFragment({
  g,
  risk,
  isOpen,
  onToggle,
  onPickBuilding,
}: {
  g: GroupRow;
  risk: RiskLevel;
  isOpen: boolean;
  onToggle: () => void;
  onPickBuilding: (b: Building) => void;
}) {
  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        className={cn(
          'cursor-pointer border-t border-border transition-colors',
          isOpen ? 'bg-muted/30' : 'hover:bg-muted/20',
        )}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <td className="px-4 py-2.5 font-medium text-foreground">
          <span className="flex items-center gap-1.5">
            {isOpen ? '▾' : '▸'} {g.key}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
          {g.count}동
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
          {fmtKR(g.totalPrice)}억원
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
          {g.avgRate.toFixed(1)}%
        </td>
        <td className="px-3 py-2.5 text-center">
          <RiskBadge risk={risk} />
        </td>
      </tr>
      <tr>
        <td colSpan={5} className={cn('border-t border-border bg-muted/10 p-0', !isOpen && 'hidden')}>
          <div className="px-4 py-3">
            <p className="mb-2 text-caption text-muted-foreground">
              건물명을 클릭하면 상세 정보가 열립니다.
            </p>
            <table className="w-full">
              <thead className="text-caption text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="pb-1.5 text-left font-semibold">건물명</th>
                  <th className="pb-1.5 text-right font-semibold">임대율</th>
                  <th className="pb-1.5 text-right font-semibold">공실률</th>
                  <th className="pb-1.5 text-right font-semibold">취득가</th>
                  <th className="pb-1.5 text-center font-semibold">상태</th>
                </tr>
              </thead>
              <tbody>
                {g.buildings.map((b) => {
                  const r = leaseRiskOf(b.rental.rate);
                  const price = Number(b.acquisitionPrice) / 1e8;
                  return (
                    <tr key={b.id} className="border-t border-border/50">
                      <td className="py-1.5 pr-3">
                        <button
                          type="button"
                          onClick={() => onPickBuilding(b)}
                          className="text-left font-medium text-primary hover:underline"
                        >
                          {b.name}
                        </button>
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-foreground">
                        {b.rental.rate}%
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                        {b.rental.vacancy}%
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                        {fmtKR(price)}억원
                      </td>
                      <td className="py-1.5 text-center">
                        <RiskBadge risk={r} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-micro font-medium',
        RISK_CLASS[risk],
      )}
    >
      {RISK_LABEL[risk]}
    </span>
  );
}
