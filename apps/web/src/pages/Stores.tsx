// 사업장 검색 + 선택 사업장의 KPI 4종 + 카테고리 TOP 10 + 자산유형 도넛
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Store as StoreIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { storesApi, type StoreDetail, type StoreListItem } from '@/lib/api/stores';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StoreTimeline } from '@/components/stores/StoreTimeline';
import { fmtKR, fmtKRfull } from '@/lib/format';

const TYPE_COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--danger))'];

export default function Stores() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [supplyMode, setSupplyMode] = useState<'amount' | 'count'>('amount');

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const list = useQuery({
    queryKey: ['stores', debounced],
    queryFn: () => storesApi.list(debounced, 1, 50),
  });

  // 첫 결과 자동 선택 (선택값이 결과에 없으면)
  useEffect(() => {
    const items = list.data?.items ?? [];
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!items.find((s) => s.id === selectedId)) {
      const first = items[0];
      if (first) setSelectedId(first.id);
    }
  }, [list.data, selectedId]);

  const detail = useQuery({
    queryKey: ['store', selectedId],
    queryFn: () => (selectedId ? storesApi.detail(selectedId) : Promise.resolve(null)),
    enabled: !!selectedId,
  });

  return (
    <PageShell title="사업장" description={list.data ? `검색 결과 ${list.data.total} 건` : ''}>
      <Card className="p-4">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="조직명 또는 사업장명 검색…"
            className="w-full bg-transparent text-body text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>
      </Card>

      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-[300px,1fr] lg:items-stretch"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-3 text-caption font-semibold text-muted-foreground">
            검색 결과 {list.data ? `(${list.data.items.length}/${list.data.total})` : ''}
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto pb-12 custom-scrollbar">
            {(list.data?.items ?? []).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={
                    'flex w-full items-center justify-between gap-2 border-t border-border px-4 py-2 text-left transition-colors duration-150 hover:bg-muted ' +
                    (selectedId === s.id ? 'bg-muted' : '')
                  }
                >
                  <div className="min-w-0">
                    <div className="truncate text-body font-medium text-foreground">{s.name}</div>
                    {s.siteType ? (
                      <div className="truncate text-caption text-muted-foreground">{s.siteType}</div>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono tabular-nums text-caption text-muted-foreground">
                    {fmtKR(s.assetValue)}
                  </span>
                </button>
              </li>
            ))}
            {list.isLoading ? (
              <li className="px-4 py-3 text-caption text-muted-foreground">검색 중…</li>
            ) : null}
            {!list.isLoading && (list.data?.items.length ?? 0) === 0 ? (
              <li className="px-4 py-6 text-center text-caption text-muted-foreground">검색 결과 없음</li>
            ) : null}
          </ul>
        </Card>

        {selectedId && detail.data ? (
          <SelectedPanel detail={detail.data} mode={supplyMode} setMode={setSupplyMode} />
        ) : (
          <EmptyStorePanel selected={list.data?.items.find((i: StoreListItem) => i.id === selectedId) ?? null} />
        )}
      </div>
    </PageShell>
  );
}

function EmptyStorePanel({ selected }: { selected: StoreListItem | null }) {
  return (
    <Card className="p-5">
      <EmptyState
        icon={StoreIcon}
        title={selected ? '사업장 데이터를 불러오는 중…' : '사업장을 선택하세요'}
        description="좌측 목록에서 항목을 선택하면 자산·비품 KPI 가 표시됩니다."
      />
    </Card>
  );
}

function SelectedPanel({
  detail,
  mode,
  setMode,
}: {
  detail: StoreDetail;
  mode: 'amount' | 'count';
  setMode: (m: 'amount' | 'count') => void;
}) {
  const supplyData = useMemo(() => {
    const src = mode === 'amount' ? detail.supplyByCategory : detail.supplyByCategoryCount;
    return Object.entries(src ?? {})
      .map(([name, v]) => ({ name, value: Number(v) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [detail, mode]);

  const typeData = useMemo(
    () => Object.entries(detail.assetByType ?? {}).map(([name, v]) => ({ name, value: Number(v) })),
    [detail],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto custom-scrollbar pb-12">
      <Card className="shrink-0 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h2 className="truncate text-heading-lg font-semibold tracking-tight text-foreground">{detail.name}</h2>
              {detail.siteType ? (
                <span className="truncate text-caption text-muted-foreground">· {detail.siteType}</span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 text-caption font-medium text-muted-foreground">
            {detail.period} 기준
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="자산 장부가" value={fmtKRfull(detail.assetValue)} />
          <Kpi label="자산 항목 수" value={detail.assetCount.toLocaleString('ko-KR') + ' 건'} />
          <Kpi label="비품 재고액" value={fmtKRfull(detail.supplyValue)} />
          <Kpi
            label="비품 카테고리 수"
            value={Object.keys(detail.supplyByCategory ?? {}).length + ' 종'}
          />
        </div>
      </Card>

      <div className="grid h-[240px] shrink-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        {/* 비품 카테고리 TOP 10 */}
        <Card className="flex flex-col p-4 overflow-hidden">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <SectionHeader title="비품 카테고리 TOP 10" description={mode === 'amount' ? '금액 기준' : '수량 기준'} />
            <div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode('amount')}
                className={
                  'rounded-md px-2 py-1 text-caption font-medium transition-colors duration-150 ' +
                  (mode === 'amount' ? 'bg-card text-foreground shadow-elev-1' : 'text-muted-foreground hover:text-foreground')
                }
              >
                금액
              </button>
              <button
                type="button"
                onClick={() => setMode('count')}
                className={
                  'rounded-md px-2 py-1 text-caption font-medium transition-colors duration-150 ' +
                  (mode === 'count' ? 'bg-card text-foreground shadow-elev-1' : 'text-muted-foreground hover:text-foreground')
                }
              >
                수량
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplyData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tickFormatter={(v) => fmtKR(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => (mode === 'amount' ? fmtKRfull(Number(v)) : Number(v).toLocaleString('ko-KR') + ' 개')}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                  }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 자산 유형별 구성 — 도넛 좌측 · 범례 우측 */}
        <Card className="flex flex-col p-4 overflow-hidden">
          <div className="mb-3 shrink-0">
            <SectionHeader title="자산 유형별 구성" description="장부가 기준" />
          </div>
          {typeData.length === 0 ? (
            <p className="text-caption text-muted-foreground">자산 유형 데이터 없음.</p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-row items-center gap-4">
              {/* 도넛 */}
              <div className="h-[160px] w-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="52%"
                      outerRadius="82%"
                      paddingAngle={2}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
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
              {/* 범례 */}
              <ul className="min-w-0 flex-1 space-y-2">
                {typeData.map((d, i) => (
                  <li key={d.name} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: TYPE_COLORS[i % TYPE_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-caption text-muted-foreground">{d.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-caption text-foreground">
                      {fmtKRfull(d.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="shrink-0">
        <StoreTimeline detail={detail} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-kpi-inline text-heading-sm tabular-nums text-foreground">{value}</div>
    </div>
  );
}
