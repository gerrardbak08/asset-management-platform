// 임원용 비품 요약 — 41종 중 재고 상위 3 (V16 renderExecEqSummary 동등)
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes } from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';

const PERIOD = '2026-03';

export function ExecEqSummary() {
  const q = useQuery({
    queryKey: ['equipments', 'snapshots', PERIOD],
    queryFn: () => dashboardApi.equipmentSnapshots(PERIOD),
  });

  const top = useMemo(() => {
    const items = q.data ?? [];
    const map = new Map<string, { name: string; value: number }>();
    for (const s of items) {
      const cur = map.get(s.equipmentLegacyId) ?? { name: s.equipmentName, value: 0 };
      cur.value += s.inventoryAmount;
      map.set(s.equipmentLegacyId, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [q.data]);

  return (
    <Card className="p-5">
      <SectionHeader title="비품 요약 TOP 3" description="재고 상위" />
      <ul className="space-y-2">
        {top.length === 0 ? (
          <li className="text-caption text-muted-foreground">데이터 없음</li>
        ) : (
          top.map((it, i) => (
            <li
              key={it.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-caption font-semibold">
                  {i + 1}
                </span>
                <Boxes className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                <span className="truncate text-body text-foreground">{it.name}</span>
              </div>
              <span className="shrink-0 font-mono tabular-nums text-caption text-foreground">
                {fmtKR(it.value)}
              </span>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
