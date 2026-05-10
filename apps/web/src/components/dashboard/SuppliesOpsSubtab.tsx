// 비품 — 운영(KPI·TOP5)과 흐름(TOP10 차트) 통합 (V16 비품 운영+흐름 동등)
import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import type { M0Data } from '@aims/shared';
import { useEquipmentSnapshots } from '@/lib/queries';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR, fmtKRfull, fmtPct } from '@/lib/format';
import { MomBadge } from './MomBadge';
import { cn } from '@/lib/utils';
import { CURRENT_PERIOD as PERIOD } from '@/lib/period';
import { LOCATION_CONCENTRATION } from '@/lib/thresholds';

type FlowKind = 'inventory' | 'purchase' | 'transfer' | 'disposal';
const FLOW_LABEL: Record<FlowKind, string> = {
  inventory: '재고',
  purchase: '구매',
  transfer: '이동',
  disposal: '폐기',
};
const FLOW_COLOR: Record<FlowKind, string> = {
  inventory: 'hsl(var(--primary))',
  purchase: 'hsl(var(--info))',
  transfer: 'hsl(var(--accent))',
  disposal: 'hsl(var(--danger))',
};

type Props = { m0: M0Data };

const LOC_LABEL: Record<string, string> = { hq: '본사', store: '매장', logistics: '물류' };

export function SuppliesOpsSubtab({ m0 }: Props) {
  const [selectedEq, setSelectedEq] = useState<string | null>(null);
  const [flowKind, setFlowKind] = useState<FlowKind>('inventory');

  const eqSnapshots = useEquipmentSnapshots(PERIOD);

  const snapshots = eqSnapshots.data ?? [];

  // 흐름 TOP10 (kind 별)
  const flowData = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    for (const s of snapshots) {
      const cur = map.get(s.equipmentLegacyId) ?? { name: s.equipmentName, value: 0 };
      const v =
        flowKind === 'inventory'
          ? s.inventoryAmount
          : flowKind === 'purchase'
            ? s.purchaseAmount
            : flowKind === 'transfer'
              ? s.transferAmount
              : s.disposalAmount;
      cur.value += v;
      map.set(s.equipmentLegacyId, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [snapshots, flowKind]);

  // 장비명별 재고 합계 → TOP5
  const topCats = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of snapshots) {
      map.set(s.equipmentName, (map.get(s.equipmentName) ?? 0) + s.inventoryAmount);
    }
    const grandTotal = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return {
      items: Array.from(map.entries())
        .map(([name, amount]) => ({
          name,
          amount,
          pct: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
      grandTotal,
      categoryCount: map.size,
    };
  }, [snapshots]);

  // 선택된 장비 상세
  const selectedDetail = useMemo(() => {
    if (!selectedEq) return null;
    const items = snapshots.filter((s) => s.equipmentName === selectedEq);
    const byLoc: Record<string, number> = {};
    let disposal = 0, purchase = 0, transfer = 0, total = 0;
    for (const s of items) {
      byLoc[s.locationType] = (byLoc[s.locationType] ?? 0) + s.inventoryAmount;
      disposal += s.disposalAmount;
      purchase += s.purchaseAmount;
      transfer += s.transferAmount;
      total += s.inventoryAmount;
    }
    const maxLocEntry = Object.entries(byLoc).sort(([, a], [, b]) => b - a)[0];
    const maxLocPct = total > 0 && maxLocEntry ? (maxLocEntry[1] / total) * 100 : 0;
    return { byLoc, disposal, purchase, transfer, total, maxLocEntry, maxLocPct };
  }, [selectedEq, snapshots]);

  const cur = m0.current.supplies_kpi;
  const momKpi = m0.mom.supplies_kpi;
  const totalAssets = m0.current.asset_kpi.total;
  const stockPct = totalAssets > 0 && cur?.stock ? (cur.stock / totalAssets) * 100 : 0;

  const top1 = topCats.items[0];

  return (
    <div className="space-y-4">
      {/* 요약 패널 */}
      <Card className="p-5">
        <SectionHeader title="비품 운영 현황" description="필터 없음 · 전사 기준" />
        <div className="space-y-1.5">
          <SummaryLine
            label="규모"
            text={[
              `재고 ${fmtKRfull(cur?.stock ?? 0)}`,
              `전사 자산의 ${stockPct.toFixed(1)}%`,
              `등록 카테고리 ${topCats.categoryCount}종`,
            ].join(' · ')}
          />
          <SummaryLine
            label="활동"
            text={[
              `구매 ${fmtKRfull(cur?.purchase ?? 0)}`,
              `이동 ${fmtKRfull(cur?.transfer ?? 0)}`,
              `폐기 ${fmtKRfull(cur?.disposal ?? 0)}`,
            ].join(' · ')}
          />
          {top1 && (
            <SummaryLine
              label="집중"
              text={`최대 비중 ${top1.name} (${fmtKRfull(top1.amount)}, ${top1.pct.toFixed(1)}%) · 변동 주목: 폐기 ${fmtPct(momKpi.disposal.ratio)}`}
            />
          )}
        </div>
      </Card>

      {/* KPI 4종 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '비품 재고', value: cur?.stock ?? 0, mom: momKpi.stock, positive: true },
          { label: '비품 구매', value: cur?.purchase ?? 0, mom: momKpi.purchase, positive: true },
          { label: '비품 이동', value: cur?.transfer ?? 0, mom: momKpi.transfer, positive: false },
          { label: '비품 폐기', value: cur?.disposal ?? 0, mom: momKpi.disposal, positive: false },
        ].map((it) => (
          <div key={it.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-caption text-muted-foreground">{it.label}</div>
            <div className="mt-2 font-mono text-heading-sm font-semibold tabular-nums text-foreground">
              {fmtKRfull(it.value)}
            </div>
            <div className="mt-1.5">
              <MomBadge ratio={it.mom.ratio} positiveIsGood={it.positive} />
            </div>
          </div>
        ))}
      </div>

      {/* 재고 상위 카테고리 TOP5 + 상세 패널 */}
      <Card className="p-5">
        <SectionHeader
          title="재고 상위 카테고리 TOP 5"
          description="클릭 시 상세"
        />
        <div className="space-y-2">
          {topCats.items.map((cat) => {
            const isSelected = selectedEq === cat.name;
            return (
              <div key={cat.name}>
                <button
                  type="button"
                  onClick={() => setSelectedEq(isSelected ? null : cat.name)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors',
                    isSelected
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/40',
                  )}
                >
                  <span className="w-28 shrink-0 truncate text-body text-foreground">
                    {cat.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-4 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isSelected ? 'bg-primary' : 'bg-primary/70 group-hover:bg-primary',
                        )}
                        style={{ width: `${Math.max(cat.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-20 shrink-0 text-right font-mono tabular-nums text-body text-foreground">
                    {fmtKRfull(cat.amount)}
                  </span>
                  <span className="w-10 shrink-0 text-right text-caption text-muted-foreground">
                    {cat.pct.toFixed(1)}%
                  </span>
                </button>

                {/* 인라인 상세 패널 */}
                {isSelected && selectedDetail && (
                  <div className="mx-2 mb-2 mt-1 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-body-strong text-foreground">
                        {cat.name} · {fmtKRfull(selectedDetail.total)}{' '}
                        <span className="text-caption font-normal text-muted-foreground">
                          ({cat.pct.toFixed(1)}% of total)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedEq(null)}
                        className="rounded-full px-2.5 py-0.5 text-caption text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        닫기 ×
                      </button>
                    </div>

                    {/* 위치별 재고 분포 */}
                    <p className="mb-2 text-caption font-medium text-muted-foreground">
                      위치별 재고 분포
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(selectedDetail.byLoc)
                        .sort(([, a], [, b]) => b - a)
                        .map(([loc, amount]) => {
                          const pct =
                            selectedDetail.total > 0
                              ? (amount / selectedDetail.total) * 100
                              : 0;
                          return (
                            <div key={loc} className="flex items-center gap-3">
                              <span className="w-10 text-caption text-muted-foreground">
                                {LOC_LABEL[loc] ?? loc}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="h-3 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${Math.max(pct, 1)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="w-20 text-right font-mono tabular-nums text-caption text-foreground">
                                {fmtKRfull(amount)}
                              </span>
                              <span className="w-10 text-right text-caption text-muted-foreground">
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    {/* 이번 달 운영 현황 */}
                    {(selectedDetail.purchase > 0 ||
                      selectedDetail.transfer > 0 ||
                      selectedDetail.disposal > 0) && (
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="mb-1.5 text-caption font-medium text-muted-foreground">
                          이번 달 운영 현황
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {selectedDetail.purchase > 0 && (
                            <span className="text-caption text-foreground">
                              구매: {fmtKRfull(selectedDetail.purchase)}
                            </span>
                          )}
                          {selectedDetail.transfer > 0 && (
                            <span className="text-caption text-foreground">
                              이동: {fmtKRfull(selectedDetail.transfer)}
                            </span>
                          )}
                          {selectedDetail.disposal > 0 && (
                            <span className="text-caption text-foreground">
                              폐기: {fmtKRfull(selectedDetail.disposal)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 이상 감지 메시지 */}
                    {selectedDetail.maxLocPct > LOCATION_CONCENTRATION.WARN_GT &&
                      selectedDetail.maxLocEntry && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-subtle px-3 py-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                        <p className="text-caption text-warning">
                          재고 {selectedDetail.maxLocPct.toFixed(0)}%가{' '}
                          {LOC_LABEL[selectedDetail.maxLocEntry[0]] ?? selectedDetail.maxLocEntry[0]}에 집중됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 비품 흐름 TOP10 (구 비품 흐름 탭) */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <SectionHeader
            title="비품 흐름 TOP 10"
            description={`${FLOW_LABEL[flowKind]} 기준 · ${PERIOD}`}
          />
          <div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1">
            {(['inventory', 'purchase', 'transfer', 'disposal'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFlowKind(k)}
                className={cn(
                  'rounded-md px-2 py-1 text-caption font-medium transition-colors duration-150',
                  flowKind === k
                    ? 'bg-card text-foreground shadow-elev-1'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {FLOW_LABEL[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[420px] w-full">
          <ResponsiveContainer>
            <BarChart data={flowData} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(v) => fmtKR(Number(v))}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => fmtKRfull(Number(v))}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'hsl(var(--foreground))',
                }}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="value" fill={FLOW_COLOR[flowKind]} radius={[0, 6, 6, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function SummaryLine({ label, text }: { label: string; text: string }) {
  return (
    <p className="text-body text-muted-foreground">
      <span className="mr-2 font-semibold text-foreground/60">{label}</span>
      {text}
    </p>
  );
}
