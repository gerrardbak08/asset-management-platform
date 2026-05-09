// 취득 연혁 — 연도별 취득 건수 + 누적 취득가 (V16 renderAcquisition 동등)
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { buildingsApi } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';

export function AcquisitionHistorySubtab() {
  const q = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });

  const data = useMemo(() => {
    const items = q.data ?? [];
    const map = new Map<number, { count: number; price: number }>();
    for (const b of items) {
      const year = new Date(b.acquisitionDate).getFullYear();
      const cur = map.get(year) ?? { count: 0, price: 0 };
      cur.count += 1;
      cur.price += Number(b.acquisitionPrice);
      map.set(year, cur);
    }
    const years = Array.from(map.keys()).sort((a, b) => a - b);
    let cumulative = 0;
    return years.map((y) => {
      const v = map.get(y)!;
      cumulative += v.price;
      return { year: String(y), count: v.count, price: v.price, cumulative };
    });
  }, [q.data]);

  return (
    <Card className="p-5">
      <SectionHeader title="취득 연혁" description="연도별 신규 취득 건수 + 누적 취득가" />
      <div className="h-[360px] w-full">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              tickFormatter={(v) => `${v}건`}
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              tickFormatter={(v) => fmtKR(Number(v))}
              width={60}
            />
            <Tooltip
              formatter={(v, name) =>
                name === '신규 취득 건수'
                  ? `${Number(v).toLocaleString('ko-KR')} 건`
                  : fmtKR(Number(v)) + '원'
              }
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 12,
                color: 'hsl(var(--foreground))',
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
            <Bar
              yAxisId="left"
              dataKey="count"
              name="신규 취득 건수"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="누적 취득가"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
