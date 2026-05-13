// 개요 Hero — 총자산 KPI + 자산유형별 도넛(우측 범례) + 이슈사항 (V16 동등 재구성)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { MomBadge } from './MomBadge';
import { buildingsApi } from '@/lib/api/buildings';
import { dashboardApi } from '@/lib/api/dashboard';
import { fmtKR, fmtKRfull } from '@/lib/format';
import { cardItemVariants, staggerContainerVariants, CHART_ANIM_MS } from '@/lib/motion';

const PERIOD = '2026-03';

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
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 md:auto-rows-fr md:grid-cols-3"
    >
      {/* 총자산 KPI — 메인 */}
      <motion.div variants={cardItemVariants} className="h-full">
        <Card className="flex h-full flex-col border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6">
          {/* 레이블 + MoM (우측 상단) */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-heading-sm font-bold tracking-tight text-primary">
                총 자산 규모
              </p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                기준월 <strong className="font-semibold text-foreground">{m0.meta.current_period}</strong>
              </p>
            </div>
            <MomBadge ratio={m0.mom.total.ratio} showLabel />
          </div>

          {/* 핵심 숫자 */}
          <div className="mt-4 flex items-end gap-2">
            <span className="tabular-nums text-kpi-hero tracking-tight text-foreground">
              {fmtKR(cur.total)}
            </span>
            <span className="mb-1 text-heading-lg font-semibold leading-none text-muted-foreground">
              원
            </span>
          </div>

          {/* 전월 대비 미니 바 차트 */}
          <div className="mt-4 space-y-2">
            {([
              { label: '유형자산', cur: cur.tangible.value, delta: m0.mom.tangible.value, color: 'hsl(var(--primary))' },
              { label: '무형자산', cur: cur.intangible.value, delta: m0.mom.intangible.value, color: 'hsl(var(--warning))' },
              { label: '비품', cur: cur.supplies.value, delta: m0.mom.supplies.value, color: 'hsl(var(--danger))' },
            ] as const).map(({ label, cur: c, delta, color }) => {
              const prev = c - delta;
              const max = Math.max(c, prev, 1);
              const curPct = (c / max) * 100;
              const prevPct = (prev / max) * 100;
              return (
                <div key={label}>
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <span className="text-micro text-muted-foreground">{label}</span>
                    <span className={`text-micro tabular-nums ${delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                      {delta > 0 ? '+' : ''}{fmtKR(delta)}원
                    </span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/50">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/20" style={{ width: `${prevPct}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${curPct}%`, background: color, opacity: 0.75 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 구분선 + 상세 */}
          <div className="mt-4 pt-3">
            <div className="mb-2 h-px bg-border/60" />
            <p className="text-caption text-muted-foreground">
              {fmtKRfull(cur.total)}
              <span className="mx-1.5 opacity-40">·</span>
              전월 <span className="text-foreground">{m0.meta.previous_period}</span> 대비
            </p>
          </div>
        </Card>
      </motion.div>

      {/* 도넛 차트 — 그래프 좌측 + 범례 우측 */}
      <motion.div variants={cardItemVariants} className="h-full">
      <Card className="flex h-full flex-col p-5">
        <p className="mb-3 text-body-strong text-muted-foreground">자산 유형별 구성</p>
        <div className="flex flex-1 flex-row items-center gap-3">
          <div className="flex flex-1 items-center justify-center">
            <div className="h-[160px] w-[160px]">
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
                    isAnimationActive
                    animationDuration={CHART_ANIM_MS}
                    animationEasing="ease-out"
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
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {donutData.map((d, i) => (
              <li key={d.subcategory} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-caption text-muted-foreground">
                    {d.subcategory}
                  </span>
                </span>
                <span className="shrink-0 text-right text-caption text-muted-foreground">
                  {cur.total > 0 ? ((d.total / cur.total) * 100).toFixed(1) : '0.0'}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
      </motion.div>

      {/* 이슈사항 패널 */}
      <motion.div variants={cardItemVariants} className="h-full">
        <IssuePanel />
      </motion.div>
    </motion.div>
  );
}

function IssuePanel() {
  const [vacancyExpanded, setVacancyExpanded] = useState(false);

  const bldQ = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });
  const eqQ = useQuery({
    queryKey: ['equipments', 'snapshots', PERIOD],
    queryFn: () => dashboardApi.equipmentSnapshots(PERIOD),
  });

  const vacantBuildings = (bldQ.data ?? []).filter((b) => b.rental.vacancy > 5);
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

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
        <span className="text-heading-sm text-foreground">이슈 사항</span>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {/* 공실률 섹션 */}
        <div className="pb-3">
          <span className="inline-flex items-center rounded-full bg-warning-subtle px-2 py-0.5 text-caption font-semibold text-warning">
            공실률 5% 이상
          </span>
          {vacantBuildings.length > 0 ? (
            <>
              <ul className="mt-2 space-y-1">
                {shownBuildings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-caption">
                    <span className="text-foreground">{b.name}</span>
                    <span className="tabular-nums text-warning">{b.rental.vacancy}%</span>
                  </li>
                ))}
              </ul>
              {vacantBuildings.length > 3 && (
                <button
                  type="button"
                  onClick={() => setVacancyExpanded((v) => !v)}
                  className="mt-1.5 text-caption text-primary hover:underline"
                >
                  {vacancyExpanded ? '접기 ▲' : `+${extraCount}곳 더 ▼`}
                </button>
              )}
            </>
          ) : (
            <p className="mt-1.5 text-caption text-muted-foreground">해당 없음</p>
          )}
        </div>

        {/* 폐기 섹션 */}
        <div className="pt-3">
          <span className="inline-flex items-center rounded-full bg-info-subtle px-2 py-0.5 text-caption font-semibold text-info">
            월 폐기액 상위
          </span>
          {topDisposal.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {topDisposal.map((d) => (
                <li key={d.name} className="flex items-center justify-between text-caption">
                  <span className="text-foreground">{d.name}</span>
                  <span className="tabular-nums text-muted-foreground">{fmtKR(d.amount)}원</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-caption text-muted-foreground">이번 달 폐기 없음</p>
          )}
        </div>
      </div>
    </Card>
  );
}
