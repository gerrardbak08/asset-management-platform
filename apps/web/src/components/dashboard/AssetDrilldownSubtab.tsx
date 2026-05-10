// 자산 드릴다운 — V16 3단 계층 탐색 (좌 300px 네비 · 우 원장 테이블)
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { fmtKRfull } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { M0Data } from '@aims/shared';

const PERIOD = '2026-03';

type DrillType = 'tangible' | 'intangible' | 'equipment';

interface GroupItem {
  label: string;
  hq: number;
  store: number;
  logistics: number;
  total: number;
}

interface Group {
  label: string;
  total: number;
  items: GroupItem[];
}

interface Props {
  m0: M0Data;
}

export function AssetDrilldownSubtab({ m0 }: Props) {
  const [drillType, setDrillType] = useState<DrillType>('tangible');
  const [drillItem, setDrillItem] = useState<string>('집기비품');

  const groups = useMemo((): Record<DrillType, Group> => {
    const matrix = m0.current.asset_matrix;
    const kpi = m0.current.asset_kpi;

    const toItems = (cat: string): GroupItem[] =>
      matrix
        .filter((r) => r.category === cat)
        .map((r) => ({ label: r.subcategory, hq: r.hq, store: r.store, logistics: r.logistics, total: r.total }));

    return {
      tangible: { label: '유형자산', total: kpi.tangible.value, items: toItems('유형자산') },
      intangible: { label: '무형자산', total: kpi.intangible.value, items: toItems('무형자산') },
      equipment: { label: '비품', total: kpi.supplies.value, items: toItems('비품') },
    };
  }, [m0]);

  const eqQuery = useQuery({
    queryKey: ['equipments', 'snapshots', PERIOD],
    queryFn: () => dashboardApi.equipmentSnapshots(PERIOD),
    enabled: drillType === 'equipment',
  });

  const handleTypeChange = (type: DrillType) => {
    setDrillType(type);
    const first = groups[type].items[0]?.label ?? '';
    setDrillItem(first);
  };

  const activeGroup = groups[drillType];
  const activeItem = activeGroup.items.find((i) => i.label === drillItem) ?? activeGroup.items[0];

  const eqRows = useMemo(() => {
    if (drillType !== 'equipment') return [];
    const snapshots = eqQuery.data ?? [];
    const map = new Map<
      string,
      { name: string; legacyId: string; hq: number; store: number; logistics: number; purchase: number; disposal: number }
    >();
    for (const s of snapshots) {
      const key = s.equipmentLegacyId;
      const cur = map.get(key) ?? {
        name: s.equipmentName,
        legacyId: s.equipmentLegacyId,
        hq: 0,
        store: 0,
        logistics: 0,
        purchase: 0,
        disposal: 0,
      };
      if (s.locationType === 'hq') cur.hq += s.inventoryAmount;
      else if (s.locationType === 'store') cur.store += s.inventoryAmount;
      else if (s.locationType === 'logistics') cur.logistics += s.inventoryAmount;
      cur.purchase += s.purchaseAmount;
      cur.disposal += s.disposalAmount;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.hq + b.store + b.logistics - (a.hq + a.store + a.logistics),
    );
  }, [eqQuery.data, drillType]);

  const breadcrumb = ['자산', activeGroup.label, activeItem?.label ?? '전체'];
  const sourceNote =
    drillType === 'equipment'
      ? '비품_재고 기준'
      : drillType === 'tangible'
        ? '원장_유형자산 기준'
        : '원장_무형자산 기준';

  return (
    <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-4">
      {/* ── 좌: 3단 네비 ── */}
      <div className="rounded-xl border border-border bg-card p-4">
        {/* 1 DEPTH */}
        <Stage title="1 DEPTH">
          <DrillBtn active>자산</DrillBtn>
        </Stage>

        {/* 2 DEPTH */}
        <Stage title="2 DEPTH">
          {(Object.entries(groups) as [DrillType, Group][]).map(([key, g]) => (
            <DrillBtn key={key} active={drillType === key} onClick={() => handleTypeChange(key)}>
              {g.label} · {fmtKRfull(g.total)}
            </DrillBtn>
          ))}
        </Stage>

        {/* 3 DEPTH */}
        <Stage title="3 DEPTH" last>
          {activeGroup.items.map((item) => (
            <DrillBtn
              key={item.label}
              active={drillItem === item.label}
              onClick={() => setDrillItem(item.label)}
            >
              {item.label} · {fmtKRfull(item.total)}
            </DrillBtn>
          ))}
        </Stage>
      </div>

      {/* ── 우: 원장 테이블 ── */}
      <div className="rounded-xl border border-border bg-card p-4">
        {/* 브레드크럼 */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {breadcrumb.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-[rgba(30,58,95,0.06)] px-2.5 py-1 text-micro font-extrabold text-[#1E3A5F]"
            >
              {chip}
              {i < breadcrumb.length - 1 && (
                <span className="ml-1.5 font-normal text-muted-foreground">›</span>
              )}
            </span>
          ))}
        </div>

        {/* 출처 노트 */}
        <p className="mb-2.5 text-caption text-muted-foreground">{sourceNote}</p>

        {/* 스크롤 테이블 */}
        <div className="max-h-[560px] overflow-auto rounded-xl border border-border">
          {drillType === 'equipment' ? (
            <EquipmentTable rows={eqRows} loading={eqQuery.isLoading} />
          ) : activeItem ? (
            <LocationTable item={activeItem} />
          ) : (
            <p className="p-6 text-center text-caption text-muted-foreground">데이터 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── sub-components ── */

function Stage({
  title,
  last = false,
  children,
}: {
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', !last && 'mb-4')}>
      <p className="text-micro font-extrabold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function DrillBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-2 text-left text-caption font-bold transition-colors duration-150',
        active
          ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
          : 'border-border bg-muted text-muted-foreground hover:text-foreground',
        !onClick && 'cursor-default',
      )}
    >
      {children}
    </button>
  );
}

function EquipmentTable({
  rows,
  loading,
}: {
  rows: { name: string; legacyId: string; hq: number; store: number; logistics: number; purchase: number; disposal: number }[];
  loading: boolean;
}) {
  if (loading)
    return <p className="p-6 text-center text-caption text-muted-foreground">로딩 중…</p>;

  return (
    <table className="w-full border-collapse text-caption">
      <thead>
        <tr>
          <StickyTh align="left">비품명</StickyTh>
          <StickyTh align="center">코드</StickyTh>
          <StickyTh>본사</StickyTh>
          <StickyTh>매장</StickyTh>
          <StickyTh>물류</StickyTh>
          <StickyTh>구매</StickyTh>
          <StickyTh>폐기</StickyTh>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.legacyId} className="border-t border-border hover:bg-muted/40">
            <td
              className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 font-medium text-foreground"
              title={r.name}
            >
              {r.name}
            </td>
            <td className="px-3 py-2 text-center text-micro text-muted-foreground">{r.legacyId}</td>
            <NumTd>{fmtKRfull(r.hq)}</NumTd>
            <NumTd>{fmtKRfull(r.store)}</NumTd>
            <NumTd>{fmtKRfull(r.logistics)}</NumTd>
            <NumTd>{fmtKRfull(r.purchase)}</NumTd>
            <NumTd>{fmtKRfull(r.disposal)}</NumTd>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="p-6 text-center text-muted-foreground">
              데이터 없음
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function LocationTable({ item }: { item: GroupItem }) {
  const locs: [string, number, string][] = [
    ['본사', item.hq, '#1E3A5F'],
    ['매장', item.store, '#059669'],
    ['물류', item.logistics, '#7C3AED'],
  ];
  return (
    <table className="w-full border-collapse text-caption">
      <thead>
        <tr>
          <StickyTh align="left">구분</StickyTh>
          <StickyTh>금액</StickyTh>
          <StickyTh>비중</StickyTh>
        </tr>
      </thead>
      <tbody>
        {locs.map(([loc, val, color]) => (
          <tr key={loc} className="border-t border-border hover:bg-muted/40">
            <td className="px-3 py-2 font-medium" style={{ color }}>
              {loc}
            </td>
            <NumTd>{fmtKRfull(val)}</NumTd>
            <NumTd>
              {item.total > 0 ? `${((val / item.total) * 100).toFixed(1)}%` : '-'}
            </NumTd>
          </tr>
        ))}
        <tr className="border-t border-border bg-[rgba(30,58,95,0.06)]">
          <td className="px-3 py-2 font-extrabold text-[#1E3A5F]">합계</td>
          <td className="px-3 py-2 text-right font-mono font-extrabold tabular-nums text-[#1E3A5F]">
            {fmtKRfull(item.total)}
          </td>
          <td className="px-3 py-2 text-right font-mono font-extrabold tabular-nums text-[#1E3A5F]">
            100%
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function StickyTh({
  children,
  align = 'right',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th
      className={cn(
        'sticky top-0 z-10 bg-muted px-3 py-2 text-micro font-semibold uppercase tracking-wider text-muted-foreground',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function NumTd({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">{children}</td>
  );
}
