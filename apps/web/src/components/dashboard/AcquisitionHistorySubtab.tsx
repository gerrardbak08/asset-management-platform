// 취득 연혁 — 연도별 취득 건수 + 누적 취득가 + KPI 요약 + 지역별 도넛 + 전체 취득 내역 테이블
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { buildingsApi } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR, fmtKRfull } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CHART_ANIM_MS } from '@/lib/motion';

function regionOf(address: string) {
  return address.split(' ')[0] ?? '기타';
}

function cityOf(address: string) {
  const parts = address.split(' ');
  return parts.slice(0, 2).join(' ');
}

const LARGE_AMT = 10_000_000_000; // 100억
const REGION_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--danger))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
];

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

  const kpi = useMemo(() => {
    const items = q.data ?? [];
    if (items.length === 0) return null;
    const prices = items.map((b) => Number(b.acquisitionPrice));
    const total = prices.reduce((s, v) => s + v, 0);
    const max = Math.max(...prices);
    const earliest = items.reduce((a, b) =>
      new Date(a.acquisitionDate) < new Date(b.acquisitionDate) ? a : b,
    );
    return {
      total,
      avg: total / items.length,
      max,
      firstYear: new Date(earliest.acquisitionDate).getFullYear(),
    };
  }, [q.data]);

  const regionData = useMemo(() => {
    const items = q.data ?? [];
    const map = new Map<string, number>();
    for (const b of items) {
      const region = regionOf(b.address);
      map.set(region, (map.get(region) ?? 0) + Number(b.acquisitionPrice));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [q.data]);

  const totalRegion = regionData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 왼쪽 — 차트 + KPI 요약 + 지역별 도넛 */}
      <Card className="flex flex-col gap-3 p-4">
        {/* 연도별 차트 */}
        <div>
          <SectionHeader title="연도별 취득 건수 + 누적 취득가" description="신규 취득 건수(막대) + 누적 취득가(선)" compact />
          <div className="h-[180px] w-full">
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
        </div>

        {/* KPI 요약 */}
        {kpi && (
          <div className="grid grid-cols-4 gap-2 border-t border-border pt-3">
            <KpiCell label="총 취득가" value={fmtKRfull(kpi.total)} />
            <KpiCell label="평균 취득가" value={fmtKRfull(kpi.avg)} />
            <KpiCell label="최대 단건" value={fmtKRfull(kpi.max)} />
            <KpiCell label="최초 취득" value={`${kpi.firstYear}년`} />
          </div>
        )}

        {/* 지역별 도넛 */}
        {regionData.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-body-strong font-semibold text-foreground">지역별 취득가 분포</p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[210px] w-[210px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="50%"
                      outerRadius="82%"
                      paddingAngle={2}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                      isAnimationActive
                      animationDuration={CHART_ANIM_MS}
                    >
                      {regionData.map((_, i) => (
                        <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmtKRfull(Number(v))}
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
              <ul className="space-y-2">
                {regionData.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: REGION_COLORS[i % REGION_COLORS.length] }}
                      aria-hidden="true"
                    />
                    <span className="text-caption text-muted-foreground">
                      {d.name} <span className="font-medium text-foreground tabular-nums">{totalRegion > 0 ? ((d.value / totalRegion) * 100).toFixed(1) : '0.0'}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* 오른쪽 — 취득 내역 테이블 */}
      <Card className="flex flex-col p-5">
        <SectionHeader title="건물 취득 내역 (전체)" description={`총 ${tableRows.length}동`} compact />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed text-caption">
            <thead>
              <tr className="border-b border-border">
                <th className="w-[38%] pb-2 text-left font-semibold text-muted-foreground">건물명</th>
                <th className="w-[22%] pb-2 text-left font-semibold text-muted-foreground">취득일</th>
                <th className="w-[18%] pb-2 text-right font-semibold text-muted-foreground">취득가</th>
                <th className="w-[22%] pb-2 pl-3 text-left font-semibold text-muted-foreground">소재지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableRows.map((b) => {
                const price = Number(b.acquisitionPrice);
                const isLarge = price >= LARGE_AMT;
                return (
                  <tr key={b.id} className="transition-colors hover:bg-muted/40">
                    <td className="py-2 pr-3 font-medium text-foreground">
                      <div className="truncate">{b.name}</div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-muted-foreground whitespace-nowrap">
                      {b.acquisitionDate.slice(0, 10)}
                    </td>
                    <td className={cn('py-2 text-right tabular-nums font-semibold whitespace-nowrap', isLarge ? 'text-danger' : 'text-foreground')}>
                      {fmtKR(price)}원
                    </td>
                    <td className="py-2 pl-3 text-muted-foreground">
                      <div className="truncate">{cityOf(b.address)}</div>
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

function KpiCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <div className="text-micro uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-caption font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
