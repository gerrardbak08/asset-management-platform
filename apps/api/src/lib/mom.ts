// MoM 계산 헬퍼 — V16 applyM0Data 동등. 매트릭스 비교로 movers TOP 5 산출
import type { M0AssetMatrixRow, M0Mover } from '@aims/shared';

const SKIP_LABELS = new Set(['합계', '소계']);

function shouldSkip(r: { category: string; subcategory: string }): boolean {
  return SKIP_LABELS.has(r.category) || SKIP_LABELS.has(r.subcategory);
}

export function calculateMovers(
  current: M0AssetMatrixRow[],
  previous: M0AssetMatrixRow[],
  topN = 5,
): { top_up: M0Mover[]; top_down: M0Mover[] } {
  const prevMap = new Map<string, M0AssetMatrixRow>();
  for (const p of previous) {
    if (shouldSkip(p)) continue;
    prevMap.set(`${p.category}|${p.subcategory}`, p);
  }
  const movers: M0Mover[] = [];
  for (const c of current) {
    if (shouldSkip(c)) continue;
    const p = prevMap.get(`${c.category}|${c.subcategory}`);
    const prevTotal = p?.total ?? 0;
    const delta = c.total - prevTotal;
    const ratio = prevTotal === 0 ? 0 : delta / prevTotal;
    movers.push({
      category: c.category,
      subcategory: c.subcategory,
      current: c.total,
      previous: prevTotal,
      delta,
      ratio,
    });
  }
  const top_up = movers
    .filter((m) => m.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, topN);
  const top_down = movers
    .filter((m) => m.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, topN);
  return { top_up, top_down };
}

type Kpi = { tangible: number; intangible: number; supplies: number; total: number };
type LocationSum = { hq: number; store: number; logistics: number };
type SuppliesKpi = { stock: number; purchase: number; transfer: number; disposal: number };

const ratio = (cur: number, prev: number): number => (prev === 0 ? 0 : (cur - prev) / prev);

export function calculateMom(current: Kpi, previous: Kpi) {
  return {
    total: { value: current.total - previous.total, ratio: ratio(current.total, previous.total) },
    tangible: {
      value: current.tangible - previous.tangible,
      ratio: ratio(current.tangible, previous.tangible),
    },
    intangible: {
      value: current.intangible - previous.intangible,
      ratio: ratio(current.intangible, previous.intangible),
    },
    supplies: {
      value: current.supplies - previous.supplies,
      ratio: ratio(current.supplies, previous.supplies),
    },
  };
}

export function calculateLocationMom(current: LocationSum, previous: LocationSum) {
  return {
    hq: { value: current.hq - previous.hq, ratio: ratio(current.hq, previous.hq) },
    store: { value: current.store - previous.store, ratio: ratio(current.store, previous.store) },
    logistics: {
      value: current.logistics - previous.logistics,
      ratio: ratio(current.logistics, previous.logistics),
    },
  };
}

export function calculateSuppliesKpiMom(current: SuppliesKpi, previous: SuppliesKpi) {
  return {
    stock: { value: current.stock - previous.stock, ratio: ratio(current.stock, previous.stock) },
    purchase: {
      value: current.purchase - previous.purchase,
      ratio: ratio(current.purchase, previous.purchase),
    },
    transfer: {
      value: current.transfer - previous.transfer,
      ratio: ratio(current.transfer, previous.transfer),
    },
    disposal: {
      value: current.disposal - previous.disposal,
      ratio: ratio(current.disposal, previous.disposal),
    },
  };
}

export function previousPeriod(period: string): string {
  // 'YYYY-MM' → 한 달 전
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  let year = parseInt(m[1]!, 10);
  let month = parseInt(m[2]!, 10) - 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}
