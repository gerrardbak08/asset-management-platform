// 자산 유형별 추이 꺾은선 차트 — 기준월=100 지수화 (V16 동등)
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

type TrendPayloadItem = { dataKey?: string; value?: number; color?: string; payload?: Record<string, number> };
type TrendTooltipProps = { active?: boolean; payload?: TrendPayloadItem[]; label?: string };

function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
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
      <p style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
        {label}
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
  const raw = q.data ?? [];
  const base = raw[0];

  if (raw.length < 2 || !base) {
    return (
      <Card className="p-5">
        <SectionHeader title="자산 유형별 추이" description="데이터 2개월 이상 시 표시" />
        <p className="text-caption text-muted-foreground">
          {raw.length < 2 ? '추이 차트는 2개월 이상 데이터가 필요합니다.' : ''}
        </p>
      </Card>
    );
  }

  const data = raw.map((s) => ({
    period: s.period.slice(2).replace('-', '.'),
    총자산: base.totalAsset > 0 ? +((s.totalAsset / base.totalAsset) * 100).toFixed(1) : 100,
    유형자산: base.tangible > 0 ? +((s.tangible / base.tangible) * 100).toFixed(1) : 100,
    무형자산: base.intangible > 0 ? +((s.intangible / base.intangible) * 100).toFixed(1) : 100,
    비품: base.equipment > 0 ? +((s.equipment / base.equipment) * 100).toFixed(1) : 100,
    _raw_총자산: s.totalAsset,
    _raw_유형자산: s.tangible,
    _raw_무형자산: s.intangible,
    _raw_비품: s.equipment,
  }));

  const baseLabel = base.period.slice(2).replace('-', '.');

  return (
    <Card className="p-5">
      <SectionHeader
        title="자산 유형별 추이"
        description={`기준월(${baseLabel}) = 100 · 항목별 규모 차이를 제거하고 변화율만 비교 · 툴팁에서 실제 금액 확인`}
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
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<TrendTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {/* 기준선 100 근방 회색 밴드 */}
            <ReferenceArea y1={97} y2={103} fill="hsl(var(--muted-foreground))" fillOpacity={0.08} stroke="none" />
            <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="총자산"
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--foreground))' }}
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
              dot={{ r: 3.5, fill: 'hsl(var(--primary))' }}
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
              dot={{ r: 3, fill: 'hsl(var(--warning))' }}
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
              dot={{ r: 3, fill: 'hsl(var(--danger))' }}
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
