// 임원용 인사이트 — 경영 요약 (V16 renderExecInsight 동등). DESIGN.md AI 블록 패턴
import { Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { M0Data } from '@aims/shared';
import { buildingsApi } from '@/lib/api/buildings';
import { fmtKR, fmtPct } from '@/lib/format';

type Props = { m0: M0Data };

export function ExecInsight({ m0 }: Props) {
  const total = m0.mom.total;
  const supplies = m0.mom.supplies_kpi;
  const top = m0.movers?.top_up?.[0];
  const bldQ = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });

  const lowRentBuildings = (bldQ.data ?? []).filter((b) => b.rental.rate < 85);
  const avgLowRent =
    lowRentBuildings.length > 0
      ? (
          lowRentBuildings.reduce((s, b) => s + b.rental.rate, 0) / lowRentBuildings.length
        ).toFixed(0)
      : '0';

  const lines: string[] = [];

  // 총자산 + 최대 변동 요인
  const topLine = top
    ? `전사 자산 ${fmtKR(m0.current.asset_kpi.total)}원, ${fmtPct(total.ratio)} 전월비. ${top.subcategory}이(가) +${fmtKR(top.delta)}원 (${fmtPct(top.ratio)})로 가장 큰 증가 요인.`
    : `전사 자산 ${fmtKR(m0.current.asset_kpi.total)}원, ${fmtPct(total.ratio)} 전월비.`;
  lines.push(topLine);

  // 임대 위험 건물
  if (lowRentBuildings.length > 0) {
    lines.push(
      `임대율 85% 미만 건물 ${lowRentBuildings.length}동 (평균 ${avgLowRent}%) 우선 점검 필요.`,
    );
  }

  // 비품 폐기 이상
  if (Math.abs(supplies.disposal.ratio) > 0.1) {
    lines.push(`비품 폐기 ${fmtPct(supplies.disposal.ratio)} 주목.`);
  }

  return (
    <div className="min-h-[88px] rounded-2xl border border-info/30 bg-info-subtle p-4">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-info" aria-hidden="true" />
        <span className="text-caption font-semibold text-info">
          경영 요약 · {m0.meta.current_period}
        </span>
      </div>
      {bldQ.isLoading ? (
        <div className="space-y-1.5" aria-hidden="true">
          <div className="h-3 w-full animate-pulse rounded bg-info/15" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-info/15" />
        </div>
      ) : (
        <p className="text-body leading-relaxed text-foreground">{lines.join(' ')}</p>
      )}
    </div>
  );
}
