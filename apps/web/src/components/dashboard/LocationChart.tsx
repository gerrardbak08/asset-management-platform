// 위치별 자산 분포 (Recharts BarChart) — 본사 / 매장 / 물류
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR, fmtKRfull } from '@/lib/format';

type Props = { m0: M0Data };

export function LocationChart({ m0 }: Props) {
  const matrix = (m0.current as { asset_matrix?: Array<{ category: string; subcategory: string; hq: number; store: number; logistics: number }> }).asset_matrix ?? [];
  const totalRow = matrix.find((m) => m.category === '합계' || m.subcategory === '합계');
  const data = totalRow
    ? [
        { name: '본사', value: totalRow.hq },
        { name: '매장', value: totalRow.store },
        { name: '물류', value: totalRow.logistics },
      ]
    : [];

  return (
    <Card className="p-5">
      <SectionHeader title="위치별 자산" description="본사·매장·물류 합계" />
      <div className="h-[260px] w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(v: number) => fmtKR(v)}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              width={50}
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
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
