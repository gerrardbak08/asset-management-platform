// 자산 유형별 도넛 (Recharts PieChart) — 유형 / 무형 / 비품
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKRfull } from '@/lib/format';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))'];

type Props = { m0: M0Data };

export function AssetTypeChart({ m0 }: Props) {
  const cur = m0.current.asset_kpi;
  const data = [
    { name: '유형자산', value: cur.tangible.value },
    { name: '무형자산', value: cur.intangible.value },
    { name: '비품', value: cur.supplies.value },
  ];

  return (
    <Card className="p-5">
      <SectionHeader title="자산 유형별 구성" description="총자산 내 비중" />
      <div className="h-[260px] w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
      <ul className="mt-3 space-y-1 text-caption">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
                aria-hidden="true"
              />
              {d.name}
            </span>
            <span className="font-mono tabular-nums text-foreground">{fmtKRfull(d.value)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
