// 자산 유형 3분할 KPI 카드 + 세부 드릴다운 패널 (V16 동등)
import { useState } from 'react';
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { MomBadge } from './MomBadge';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR, fmtKRfull, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';

type AssetCategory = 'tangible' | 'intangible' | 'supplies';

const CAT_META: Record<
  AssetCategory,
  { label: string; matrixLabel: string; accentClass: string; desc: string }
> = {
  tangible: {
    label: '유형자산',
    matrixLabel: '유형자산',
    accentClass: 'bg-primary',
    desc: '건물·토지·집기비품·기계장치·차량운반구',
  },
  intangible: {
    label: '무형자산',
    matrixLabel: '무형자산',
    accentClass: 'bg-info',
    desc: '소프트웨어·영업권·임차권리금·상표권·특허권',
  },
  supplies: {
    label: '비품',
    matrixLabel: '비품',
    accentClass: 'bg-accent',
    desc: '비품',
  },
};

type Props = { m0: M0Data };

export function AssetKpiCards({ m0 }: Props) {
  const [selected, setSelected] = useState<AssetCategory>('tangible');
  const [panelOpen, setPanelOpen] = useState(false);

  const cur = m0.current.asset_kpi;
  const mom = m0.mom;
  const matrix = m0.current.asset_matrix ?? [];
  const prevMatrix = m0.previous?.asset_matrix ?? [];

  const cards: Array<{ key: AssetCategory; current: number; momVal: number; momRatio: number }> = [
    { key: 'tangible', current: cur.tangible.value, momVal: mom.tangible.value, momRatio: mom.tangible.ratio },
    { key: 'intangible', current: cur.intangible.value, momVal: mom.intangible.value, momRatio: mom.intangible.ratio },
    { key: 'supplies', current: cur.supplies.value, momVal: mom.supplies.value, momRatio: mom.supplies.ratio },
  ];

  const meta = CAT_META[selected];
  const rows = matrix.filter(
    (r) => r.category === meta.matrixLabel && r.subcategory !== '소계' && r.subcategory !== '합계',
  );
  const subtotalRow = matrix.find(
    (r) => r.category === meta.matrixLabel && r.subcategory === '소계',
  );
  const prevSubtotalRow = prevMatrix.find(
    (r) => r.category === meta.matrixLabel && r.subcategory === '소계',
  );

  const selectedTotal = subtotalRow?.total ?? rows.reduce((s, r) => s + r.total, 0);
  const maxRow = [...rows].sort((a, b) => b.total - a.total)[0];
  const totalRatio = cur.total > 0 ? (selectedTotal / cur.total) * 100 : 0;
  const inCatRatio = selectedTotal > 0 && maxRow ? (maxRow.total / selectedTotal) * 100 : 0;

  // 가장 큰 MoM 변동 항목
  const maxMomRow = rows.reduce<{ subcategory: string; delta: number; ratio: number }>(
    (best, row) => {
      const prev = prevMatrix.find(
        (p) => p.category === row.category && p.subcategory === row.subcategory,
      );
      const prevVal = prev?.total ?? 0;
      const ratio = prevVal > 0 ? Math.abs((row.total - prevVal) / prevVal) : 0;
      return ratio > best.ratio
        ? { subcategory: row.subcategory, delta: row.total - prevVal, ratio }
        : best;
    },
    { subcategory: '', delta: 0, ratio: 0 },
  );

  const momRatioPct =
    prevSubtotalRow && prevSubtotalRow.total > 0
      ? fmtPct((selectedTotal - prevSubtotalRow.total) / prevSubtotalRow.total)
      : null;

  const summaryLines = [
    `${meta.label} 합계 ${fmtKRfull(selectedTotal)} · 전사 자산의 ${totalRatio.toFixed(1)}%`,
    rows.length > 0 && maxRow
      ? `${rows.length}개 세부항목 · 최대 비중은 ${maxRow.subcategory} (${fmtKRfull(maxRow.total)}, ${inCatRatio.toFixed(1)}%)`
      : '',
    momRatioPct && maxMomRow.subcategory
      ? `전월 대비 ${momRatioPct} · 전년 동월 대비 — · 가장 큰 변동: ${maxMomRow.subcategory} (${maxMomRow.delta >= 0 ? '+' : ''}${fmtKR(Math.abs(maxMomRow.delta))}원)`
      : prevSubtotalRow && prevSubtotalRow.total > 0
        ? `전월 대비 ${selectedTotal > prevSubtotalRow.total ? '+' : ''}${fmtKR(Math.abs(selectedTotal - prevSubtotalRow.total))}원`
        : '전월 데이터 없음',
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {/* 3분할 카드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => {
          const m = CAT_META[c.key];
          const isSelected = selected === c.key;
          const isOpen = isSelected && panelOpen;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                if (isSelected && panelOpen) {
                  setPanelOpen(false);
                } else {
                  setSelected(c.key);
                  setPanelOpen(true);
                }
              }}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-150',
                isOpen
                  ? 'border-primary bg-card shadow-elev-2'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('absolute left-0 top-0 h-full w-1', m.accentClass)}
              />
              <div className="flex items-start justify-between gap-2">
                <span className="text-heading-sm text-muted-foreground">● {m.label}</span>
                <MomBadge ratio={c.momRatio} />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-kpi-metric font-mono tabular-nums text-foreground">
                  {fmtKR(c.current)}
                </span>
                <span className="text-caption text-muted-foreground">원</span>
              </div>
              <div className="mt-1 text-body text-muted-foreground">
                전월비 {c.momVal >= 0 ? '+' : ''}
                {fmtKR(Math.abs(c.momVal))}원
              </div>
              <div className="mt-3 flex justify-end">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-caption transition-colors',
                    isOpen
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}
                >
                  세부 현황 {isOpen ? '▲' : '→'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 드릴다운 패널 */}
      {panelOpen && (
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <SectionHeader title={`${meta.label} 세부 현황`} description={meta.desc} />
              <ul className="mt-1 space-y-0.5">
                {summaryLines.map((line, i) => (
                  <li key={i} className="text-body text-muted-foreground">
                    <span className="mr-2 font-semibold text-foreground/60">
                      {(['규모', '구성', '변동'] as const)[i]}
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="shrink-0 rounded-full px-2.5 py-1 text-caption text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              닫기 ×
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 text-body text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">세부항목</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground/60">
                    전년동월
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">전 월</th>
                  <th className="px-3 py-2 text-right font-semibold">당 월</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground/60">
                    YOY
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">MOM</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const prevRow = prevMatrix.find(
                    (p) => p.category === row.category && p.subcategory === row.subcategory,
                  );
                  const prevVal = prevRow?.total ?? 0;
                  const momRatio = prevVal > 0 ? (row.total - prevVal) / prevVal : 0;
                  const rowTotal = row.hq + row.store + row.logistics;
                  return (
                    <tr key={row.subcategory} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground">{row.subcategory}</div>
                        {rowTotal > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {row.hq > 0 && (
                              <LocationTag
                                label={`본사 ${((row.hq / rowTotal) * 100).toFixed(0)}%`}
                              />
                            )}
                            {row.store > 0 && (
                              <LocationTag
                                label={`매장 ${((row.store / rowTotal) * 100).toFixed(0)}%`}
                              />
                            )}
                            {row.logistics > 0 && (
                              <LocationTag
                                label={`물류 ${((row.logistics / rowTotal) * 100).toFixed(0)}%`}
                              />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground/50">
                        —
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {prevVal > 0 ? fmtKR(prevVal) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-medium text-foreground">
                        {fmtKR(row.total)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground/50">—</td>
                      <td className="px-3 py-2.5 text-right">
                        {prevVal > 0 ? (
                          <MomBadge ratio={momRatio} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* 소계 행 */}
                {subtotalRow && (
                  <tr className="border-t-2 border-border bg-muted/20 font-semibold">
                    <td className="px-4 py-2.5 text-foreground">소 계</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground/50">—</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                      {prevSubtotalRow && prevSubtotalRow.total > 0
                        ? fmtKR(prevSubtotalRow.total)
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
                      {fmtKR(subtotalRow.total)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground/50">—</td>
                    <td className="px-3 py-2.5 text-right">
                      {prevSubtotalRow && prevSubtotalRow.total > 0 ? (
                        <MomBadge
                          ratio={
                            (subtotalRow.total - prevSubtotalRow.total) / prevSubtotalRow.total
                          }
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function LocationTag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-micro text-muted-foreground">
      {label}
    </span>
  );
}
