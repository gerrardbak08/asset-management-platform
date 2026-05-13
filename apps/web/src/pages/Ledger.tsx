import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Search } from 'lucide-react';
import type { EquipmentLedger } from '@aims/shared';
import { phase2Api } from '@/lib/api/phase2';
import { fmtKRprice } from '@/lib/format';
import { ledgerTxLabel, locationLabel } from '@/lib/phase2Labels';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

const TX_CLASS: Record<string, string> = {
  purchase:   'bg-success-subtle text-success border-success/30',
  transfer:   'bg-info-subtle text-info border-info/30',
  disposal:   'bg-danger-subtle text-danger border-danger/30',
  adjustment: 'bg-warning-subtle text-warning border-warning/30',
};

export default function Ledger() {
  const [q, setQ] = useState('');
  const ledgerQ = useQuery({ queryKey: ['ledger'], queryFn: () => phase2Api.ledger() });

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return ledgerQ.data ?? [];
    return (ledgerQ.data ?? []).filter((row) =>
      [row.equipmentName, row.equipmentLegacyId, row.legacyAssetNo, row.reason]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [ledgerQ.data, q]);

  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <PageShell title="비품 원장" description={`거래 ${rows.length}건 · 금액 ${fmtKRprice(total)}원`}>
      <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="비품명, 자산번호, 사유 검색"
          className="h-10 min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[120px,1fr,100px,140px,120px,120px] border-b border-border bg-muted/40 px-4 py-2 text-micro font-semibold uppercase tracking-wide text-muted-foreground max-xl:hidden">
          <span>일자</span>
          <span>비품</span>
          <span>유형</span>
          <span>위치</span>
          <span>수량</span>
          <span className="text-right">금액</span>
        </div>
        {ledgerQ.isLoading ? (
          <p className="p-4 text-caption text-muted-foreground">로딩 중…</p>
        ) : ledgerQ.isError ? (
          <p className="p-4 text-caption text-danger">로드 실패 — {ledgerQ.error.message}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="원장 거래 없음"
            description="구매·이동·폐기·조정 거래가 등록되면 표시됩니다."
          />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <LedgerRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

function LedgerRow({ row }: { row: EquipmentLedger }) {
  const from = row.fromLocation ? locationLabel[row.fromLocation] : '-';
  const to = row.toLocation ? locationLabel[row.toLocation] : '-';
  return (
    <div className="grid gap-2 px-4 py-2.5 text-caption xl:grid-cols-[120px,1fr,100px,140px,120px,120px] xl:items-center">
      <span className="text-muted-foreground">{row.txDate}</span>
      <div className="min-w-0">
        <div className="truncate font-semibold text-foreground">{row.equipmentName ?? row.equipmentItemId}</div>
        <div className="truncate text-micro text-muted-foreground">{row.legacyAssetNo ?? row.reason ?? row.period}</div>
      </div>
      <span className={`w-fit rounded-full border px-2 py-0.5 text-micro font-medium ${TX_CLASS[row.txType] ?? 'bg-muted text-muted-foreground border-border'}`}>
        {ledgerTxLabel[row.txType]}
      </span>
      <span className="text-muted-foreground">
        {from} → {to}
      </span>
      <span className="tabular-nums">{row.quantity.toLocaleString('ko-KR')}</span>
      <span className="font-semibold tabular-nums text-foreground xl:text-right">{fmtKRprice(Number(row.amount))}원</span>
    </div>
  );
}
