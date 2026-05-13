// MoM 변동 폭 — 전월 대비 항목별 증감 가로 막대 (V16 동등)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';
import { CHART_ANIM_MS } from '@/lib/motion';

type Props = { m0: M0Data };

export function MomBarChart({ m0 }: Props) {
  // V16 방식: 증가 항목만 표시 (top_up), delta 내림차순 상위 5건
  const data = (m0.movers?.top_up ?? [])
    .slice(0, 5)
    .map((m) => ({ name: m.subcategory, delta: m.delta }));

  const fmtDelta = (v: number) =>
    (v >= 0 ? '+' : '') + fmtKR(Math.abs(v)) + '원';

  return (
    <Card className="p-5">
      <SectionHeader
        title="MoM 변동 폭"
        description={`전월 대비 항목별 증감 (상위 ${data.length}건)`}
      />
      <div className="h-chart-sm w-full">
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 72, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              tickFormatter={(v: number) => fmtKR(Math.abs(v))}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: unknown) => [fmtDelta(Number(v)), '변동액']}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 12,
                color: 'hsl(var(--foreground))',
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Bar
              dataKey="delta"
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
              fill="hsl(var(--info))"
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
              label={{
                position: 'right',
                fontSize: 11,
                fill: 'hsl(var(--foreground))',
                formatter: (v: unknown) => fmtDelta(Number(v)),
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
