// 비품 운영 KPI 4종 — 재고 / 구매 / 이동 / 폐기 (V16 의 비품 KPI 동등)
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';
import { MomBadge } from './MomBadge';

type Props = { m0: M0Data };

export function SuppliesKpi({ m0 }: Props) {
  const k = m0.mom.supplies_kpi;
  const items = [
    { label: '재고', value: k.stock.value, ratio: k.stock.ratio, positive: true },
    { label: '구매', value: k.purchase.value, ratio: k.purchase.ratio, positive: true },
    { label: '이동', value: k.transfer.value, ratio: k.transfer.ratio, positive: false },
    { label: '폐기', value: k.disposal.value, ratio: k.disposal.ratio, positive: false },
  ] as const;

  return (
    <Card className="p-5">
      <SectionHeader title="비품 운영" description="MoM 변동" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="text-caption font-medium text-muted-foreground">{it.label}</div>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <span className="font-kpi-inline font-mono tabular-nums text-foreground">
                {it.value > 0 ? '+' : ''}
                {fmtKR(Math.abs(it.value))}
              </span>
              <MomBadge ratio={it.ratio} positiveIsGood={it.positive} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
