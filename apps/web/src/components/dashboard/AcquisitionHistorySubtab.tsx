// 취득 연혁 — 연도별 취득 건수 + 누적 취득가 + 전체 취득 내역 테이블
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
import { cn } from '@/lib/utils';
import { CHART_ANIM_MS } from '@/lib/motion';

function cityOf(address: string) {
  const parts = address.split(' ');
  return parts.slice(0, 2).join(' ');
}

const LARGE_AMT = 10_000_000_000; // 100억

export function AcquisitionHistorySubtab() {
  const q = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });

  const chartData = useMemo(() => {
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

  const tableRows = useMemo(() => {
    return [...(q.data ?? [])]
      .sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime());
  }, [q.data]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      {/* 차트 */}
      <Card className="p-5">
        <SectionHeader title="연도별 취득 건수 + 누적 취득가" description="신규 취득 건수(막대) + 누적 취득가(선)" />
        <div className="h-[360px] w-full">
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
                isAnimationActive
                animationDuration={CHART_ANIM_MS}
                animationEasing="ease-out"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name="누적 취득가"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                isAnimationActive
                animationDuration={CHART_ANIM_MS}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 취득 내역 테이블 */}
      <Card className="flex flex-col p-5">
        <SectionHeader title="건물 취득 내역 (전체)" description={`총 ${tableRows.length}동`} />
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-caption">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-semibold text-muted-foreground">건물명</th>
                <th className="pb-2 text-left font-semibold text-muted-foreground">취득일</th>
                <th className="pb-2 text-right font-semibold text-muted-foreground">취득가</th>
                <th className="pb-2 text-left font-semibold text-muted-foreground pl-3">소재지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableRows.map((b) => {
                const price = Number(b.acquisitionPrice);
                const isLarge = price >= LARGE_AMT;
                return (
                  <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-3 text-foreground font-medium">{b.name}</td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground whitespace-nowrap">
                      {b.acquisitionDate.slice(0, 10)}
                    </td>
                    <td className={cn('py-2 text-right tabular-nums font-semibold whitespace-nowrap', isLarge ? 'text-danger' : 'text-foreground')}>
                      {fmtKR(price)}원
                    </td>
                    <td className="py-2 pl-3 text-muted-foreground whitespace-nowrap">
                      {cityOf(b.address)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
