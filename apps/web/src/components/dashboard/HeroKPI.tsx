// 개요 Hero — 총자산 KPI + 자산유형별 도넛(우측 범례) + 이슈사항 (V16 동등 재구성)
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { MomBadge } from './MomBadge';
import { useBuildings, useEquipmentSnapshots } from '@/lib/queries';
import { fmtKR, fmtKRfull } from '@/lib/format';
import { CURRENT_PERIOD as PERIOD } from '@/lib/period';
import { VACANCY_RATE } from '@/lib/thresholds';

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--danger))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
];

type Props = { m0: M0Data };

const LEGEND_TOP = 5;

export function HeroKPI({ m0 }: Props) {
  const cur = m0.current.asset_kpi;
  const matrix = m0.current.asset_matrix ?? [];

  const allItems = matrix
    .filter((r) => r.subcategory !== '소계' && r.subcategory !== '합계' && r.total > 0)
    .sort((a, b) => b.total - a.total);

  const topItems = allItems.slice(0, LEGEND_TOP);
  const othersTotal = allItems.slice(LEGEND_TOP).reduce((s, d) => s + d.total, 0);
  const donutData =
    othersTotal > 0
      ? [
          ...topItems,
          { subcategory: '기타', total: othersTotal, category: '', hq: 0, store: 0, logistics: 0 },
        ]
      : topItems;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* 총자산 KPI */}
      <Card className="relative overflow-hidden p-5">
        <span aria-hidden="true" className="brand-stripe absolute left-0 right-0 top-0 h-1" />
        <p className="text-caption font-medium uppercase tracking-wider text-muted-foreground">
          총 자산 규모 · {m0.meta.current_period}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-heading-lg text-muted-foreground">₩</span>
          <span className="font-kpi-huge font-mono tabular-nums leading-none text-foreground">
            {fmtKR(cur.total)}
          </span>
          <span className="text-heading-lg text-muted-foreground">원</span>
        </div>
        <div className="mt-2">
          <MomBadge ratio={m0.mom.total.ratio} showLabel />
        </div>
        <p className="mt-3 text-caption text-muted-foreground">
          {fmtKRfull(cur.total)} · 기준월{' '}
          <strong className="text-foreground">{m0.meta.current_period}</strong> (전월{' '}
          {m0.meta.previous_period})
        </p>
      </Card>

      {/* 도넛 차트 — 그래프 좌측 + 범례 우측 */}
      <Card className="p-5">
        <p className="mb-3 text-body-strong text-muted-foreground">자산 유형별 구성</p>
        <div className="flex items-center gap-3">
          <div className="h-[160px] w-[140px] shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="total"
                  nameKey="subcategory"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={2}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown) => fmtKRfull(Number(v))}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {donutData.map((d, i) => (
              <li key={d.subcategory} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-caption text-muted-foreground">
                  {d.subcategory}
                </span>
                <span className="font-mono tabular-nums text-caption text-foreground">
                  {fmtKR(d.total)}원
                </span>
                <span className="w-9 text-right text-caption text-muted-foreground">
                  {cur.total > 0 ? ((d.total / cur.total) * 100).toFixed(1) : '0.0'}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* 이슈사항 패널 */}
      <IssuePanel />
    </div>
  );
}

function IssuePanel() {
  const [vacancyExpanded, setVacancyExpanded] = useState(false);

  const bldQ = useBuildings();
  const eqQ = useEquipmentSnapshots(PERIOD);

  const vacantBuildings = (bldQ.data ?? []).filter(
    (b) => b.rental.vacancy > VACANCY_RATE.ALERT_GT,
  );
  const shownBuildings = vacancyExpanded ? vacantBuildings : vacantBuildings.slice(0, 3);
  const extraCount = vacantBuildings.length - 3;

  const disposalMap = new Map<string, { name: string; amount: number }>();
  for (const s of eqQ.data ?? []) {
    if (s.disposalAmount > 0) {
      const cur = disposalMap.get(s.equipmentLegacyId) ?? { name: s.equipmentName, amount: 0 };
      cur.amount += s.disposalAmount;
      disposalMap.set(s.equipmentLegacyId, cur);
    }
  }
  const topDisposal = Array.from(disposalMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const isLoading = bldQ.isLoading || eqQ.isLoading;

  return (
    <Card className="min-h-[180px] p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
        <span className="text-heading-sm text-foreground">이슈 사항</span>
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-hidden="true">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <>
          {vacantBuildings.length > 0 ? (
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-0.5 text-caption font-medium text-warning">
                  공실률 5% 이상 {vacantBuildings.length}곳
                </span>
              </div>
              <p className="mt-1 text-caption text-muted-foreground">
                {shownBuildings.map((b) => `${b.name} ${b.rental.vacancy}%`).join(' · ')}
              </p>
              {vacantBuildings.length > 3 && (
                <button
                  type="button"
                  onClick={() => setVacancyExpanded((v) => !v)}
                  className="mt-1 text-caption text-primary transition-colors hover:underline"
                >
                  {vacancyExpanded ? '접기 ▲' : `+${extraCount}곳 더 ▼`}
                </button>
              )}
            </div>
          ) : (
            <p className="mb-3 text-body text-success">공실률 5% 이상 건물 없음</p>
          )}

          {topDisposal.length > 0 ? (
            <div className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-info" aria-hidden="true" />
              <div>
                <p className="text-body-strong text-foreground">월 폐기액 상위 품목</p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {topDisposal.map((d) => `${d.name} ${fmtKR(d.amount)}원`).join(' · ')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-body text-muted-foreground">이번 달 폐기 항목 없음</p>
          )}
        </>
      )}
    </Card>
  );
}
