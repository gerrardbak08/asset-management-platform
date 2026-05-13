// 자산 유형별 추이 꺾은선 차트 — 역추정(2025-01~) + 실데이터(2026-02~) 자동 병합
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '@/lib/api/dashboard';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';
import { CHART_ANIM_MS } from '@/lib/motion';

const LINE_COLORS: Record<string, string> = {
  총자산: 'hsl(var(--foreground))',
  유형자산: 'hsl(var(--primary))',
  무형자산: 'hsl(var(--warning))',
  비품: 'hsl(var(--danger))',
};

// 역추정 시작 기준월
const BACKFILL_START = '2025-01';

// 자산 유형별 월간 성장률 (역추정용 — 과거로 갈수록 이 비율만큼 낮아짐)
const RATES = { tangible: 0.015, intangible: 0.030, equipment: 0.020 };

type SnapRow = { period: string; totalAsset: number; tangible: number; intangible: number; equipment: number };

function periodsBetween(from: string, to: string): string[] {
  const result: string[] = [];
  const fp = from.split('-').map(Number);
  const tp = to.split('-').map(Number);
  let y = fp[0]!;
  let m = fp[1]!;
  const ty = tp[0]!;
  const tm = tp[1]!;
  while (y < ty || (y === ty && m <= tm)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

function prevPeriod(p: string): string {
  const parts = p.split('-').map(Number);
  let y = parts[0]!;
  let m = parts[1]!;
  m--;
  if (m < 1) { m = 12; y--; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** 가장 이른 실데이터 기준으로 BACKFILL_START까지 역추정 포인트 생성 */
function buildBackfill(earliest: SnapRow): SnapRow[] {
  if (earliest.period <= BACKFILL_START) return [];
  const periods = periodsBetween(BACKFILL_START, prevPeriod(earliest.period));
  const points: SnapRow[] = [];
  let tangible = earliest.tangible;
  let intangible = earliest.intangible;
  let equipment = earliest.equipment;
  // 역방향으로 계산
  for (let i = 0; i < periods.length; i++) {
    tangible = tangible / (1 + RATES.tangible);
    intangible = intangible / (1 + RATES.intangible);
    equipment = equipment / (1 + RATES.equipment);
    points.unshift({
      period: periods[periods.length - 1 - i]!,
      tangible: Math.round(tangible),
      intangible: Math.round(intangible),
      equipment: Math.round(equipment),
      totalAsset: Math.round(tangible + intangible + equipment),
    });
  }
  return points;
}

type TrendPayloadItem = { dataKey?: string; value?: number; color?: string; payload?: Record<string, number> };
type TrendTooltipProps = { active?: boolean; payload?: TrendPayloadItem[]; label?: string };

function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  const isEst = payload[0]?.payload?.['_est'] === 1;
  return (
    <div
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 12,
        padding: '10px 14px',
        minWidth: 180,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
        {label}{isEst ? ' (역추정)' : ''}
      </p>
      {payload.map((p) => {
        const raw = p.payload?.[`_raw_${p.dataKey}`];
        const key = p.dataKey ?? '';
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'hsl(var(--foreground))' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: LINE_COLORS[key] ?? p.color, flexShrink: 0 }} />
              {key}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: LINE_COLORS[key] ?? p.color, textAlign: 'right' }}>
              {p.value}
              <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))', marginLeft: 4 }}>
                {raw !== undefined ? `(${fmtKR(raw)}원)` : ''}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AssetTrendChart() {
  const q = useQuery({ queryKey: ['snapshots'], queryFn: dashboardApi.snapshots });
  const realRows: SnapRow[] = q.data ?? [];

  // 역추정 포인트 생성 (실데이터가 없으면 스킵)
  const earliest = realRows[0];
  const backfill = earliest ? buildBackfill(earliest) : [];

  // 전체 = 역추정 + 실데이터 (중복 period 없음)
  const allRows: (SnapRow & { _est: boolean })[] = [
    ...backfill.map((r) => ({ ...r, _est: true })),
    ...realRows.map((r) => ({ ...r, _est: false })),
  ];

  if (allRows.length < 2) {
    return (
      <Card className="p-5">
        <SectionHeader title="자산 유형별 추이" description="데이터 로딩 중…" />
      </Card>
    );
  }

  const base = allRows[0]!;
  const lastEstPeriodLabel = backfill.length > 0
    ? backfill[backfill.length - 1]!.period.slice(2).replace('-', '.')
    : null;
  const firstRealPeriodLabel = earliest?.period.slice(2).replace('-', '.') ?? null;

  const data = allRows.map((s) => ({
    period: s.period.slice(2).replace('-', '.'),
    총자산: base.totalAsset > 0 ? +((s.totalAsset / base.totalAsset) * 100).toFixed(1) : 100,
    유형자산: base.tangible > 0 ? +((s.tangible / base.tangible) * 100).toFixed(1) : 100,
    무형자산: base.intangible > 0 ? +((s.intangible / base.intangible) * 100).toFixed(1) : 100,
    비품: base.equipment > 0 ? +((s.equipment / base.equipment) * 100).toFixed(1) : 100,
    _raw_총자산: s.totalAsset,
    _raw_유형자산: s.tangible,
    _raw_무형자산: s.intangible,
    _raw_비품: s.equipment,
    _est: s._est ? 1 : 0,
  }));

  const baseLabel = base.period.slice(2).replace('-', '.');

  return (
    <Card className="p-5">
      <SectionHeader
        title="자산 유형별 추이"
        description={`기준월(${baseLabel}) = 100 · 음영 구간은 역추정(월 1.5–3%) · 실선 구간은 실데이터`}
      />
      <div className="h-chart-sm w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<TrendTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />

            {/* 역추정 구간 음영 */}
            {lastEstPeriodLabel && firstRealPeriodLabel && (
              <ReferenceArea
                x1={baseLabel}
                x2={lastEstPeriodLabel}
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.07}
                stroke="none"
              />
            )}

            {/* 실데이터 시작 경계선 */}
            {firstRealPeriodLabel && (
              <ReferenceLine
                x={firstRealPeriodLabel}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                label={{ value: '실데이터', position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--primary))', opacity: 0.7 }}
              />
            )}

            {/* 기준선 100 근방 밴드 */}
            <ReferenceArea y1={97} y2={103} fill="hsl(var(--muted-foreground))" fillOpacity={0.06} stroke="none" />
            <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.4} />

            <Line
              type="monotone"
              dataKey="총자산"
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'hsl(var(--foreground))' }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="유형자산"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 2.5, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="무형자산"
              stroke="hsl(var(--warning))"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={{ r: 2.5, fill: 'hsl(var(--warning))' }}
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="비품"
              stroke="hsl(var(--danger))"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 2.5, fill: 'hsl(var(--danger))' }}
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
