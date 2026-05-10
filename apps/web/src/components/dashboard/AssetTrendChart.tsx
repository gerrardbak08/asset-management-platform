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
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '@/lib/api/dashboard';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { CHART_ANIM_MS } from '@/lib/motion';

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
  }));

  const baseLabel = base.period.slice(2).replace('-', '.');

  return (
    <Card className="p-5">
      <SectionHeader
        title="자산 유형별 추이"
        description={`기준월(${baseLabel}) = 100 · 항목별 규모 차이를 제거하고 변화율만 비교 · 툴팁에서 실제 금액 확인`}
      />
      <div className="h-[240px] w-full">
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
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 12,
                color: 'hsl(var(--foreground))',
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="총자산"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ r: 4 }}
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
              dot={{ r: 4 }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="무형자산"
              stroke="hsl(var(--info))"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={{ r: 3 }}
              isAnimationActive
              animationDuration={CHART_ANIM_MS}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="비품"
              stroke="hsl(var(--accent))"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 3 }}
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
