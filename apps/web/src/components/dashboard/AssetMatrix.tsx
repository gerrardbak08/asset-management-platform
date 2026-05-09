// 자산 매트릭스 — V16 의 매트릭스 표 동등 (유형/무형/비품 × 본사/매장/물류)
import type { M0Data } from '@aims/shared';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';

type Row = { category: string; subcategory: string; hq: number; store: number; logistics: number; total: number };

type Props = { m0: M0Data };

export function AssetMatrix({ m0 }: Props) {
  const rows = (m0.current as { asset_matrix?: Row[] }).asset_matrix ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-3">
        <SectionHeader title="자산 매트릭스" description="유형/무형/비품 × 본사/매장/물류" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-caption">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <Th>분류</Th>
              <Th>세부</Th>
              <Th align="right">본사</Th>
              <Th align="right">매장</Th>
              <Th align="right">물류</Th>
              <Th align="right">합계</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isTotal = r.category === '합계' || r.subcategory === '합계' || r.subcategory === '소계';
              return (
                <tr
                  key={`${r.category}-${r.subcategory}-${i}`}
                  className={
                    isTotal
                      ? 'bg-muted/20 font-semibold text-foreground'
                      : 'border-t border-border text-foreground'
                  }
                >
                  <Td>{r.category}</Td>
                  <Td>{r.subcategory}</Td>
                  <Td align="right" mono>{fmtKR(r.hq)}</Td>
                  <Td align="right" mono>{fmtKR(r.store)}</Td>
                  <Td align="right" mono>{fmtKR(r.logistics)}</Td>
                  <Td align="right" mono>{fmtKR(r.total)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-3 py-2 text-micro font-semibold uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}
function Td({ children, align = 'left', mono = false }: { children: React.ReactNode; align?: 'left' | 'right'; mono?: boolean }) {
  return (
    <td
      className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'} ${mono ? 'font-mono tabular-nums' : ''}`}
    >
      {children}
    </td>
  );
}
