// MoM 상위 변동 — top_up 5건 (V16 의 movers 동등)
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';
import { MomBadge } from './MomBadge';

type Props = { m0: M0Data };

export function MoversList({ m0 }: Props) {
  const top = m0.movers?.top_up?.slice(0, 5) ?? [];
  if (top.length === 0) {
    return (
      <Card className="p-5">
        <SectionHeader title="상승 변동 TOP 5" />
        <p className="text-caption text-muted-foreground">전월 대비 변동 데이터 없음.</p>
      </Card>
    );
  }
  return (
    <Card className="p-5">
      <SectionHeader title="상승 변동 TOP 5" description="전월 대비 증감액 순" />
      <ul className="space-y-2">
        {top.map((m) => (
          <li key={`${m.category}-${m.subcategory}`} className="flex items-center justify-between gap-3 text-body">
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{m.subcategory}</div>
              <div className="truncate text-caption text-muted-foreground">{m.category}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono tabular-nums text-foreground">
                {m.delta > 0 ? '+' : ''}
                {fmtKR(Math.abs(m.delta))}
              </span>
              <MomBadge ratio={m.ratio} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
