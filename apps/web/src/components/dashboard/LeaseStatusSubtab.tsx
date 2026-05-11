// 임대 현황 — V16 1:1 (KPI 4 + 임대율 바 + 면적 비교 + 취득가 산점도) + 수도권/지방 · 용도 4압축 행 펼침 → Drawer
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  Legend,
} from 'recharts';
import { buildingsApi, type Building } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { BuildingDrawer } from '@/components/buildings/BuildingDrawer';
import { fmtKRfull } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CHART_ANIM_MS } from '@/lib/motion';

// ── 분류 함수 ──
function regionBucket(addr: string): '수도권' | '지방' {
  const r = addr || '';
  if (r.includes('서울') || r.includes('경기') || r.includes('인천')) return '수도권';
  return '지방';
}

type UseBucket = '창고시설' | '판매시설' | '공동주택·업무시설' | '제1종근린생활시설' | '기타';
function bucketNameOfUse(use: string): UseBucket {
  const u = use || '';
  if (u.includes('창고')) return '창고시설';
  if (u.includes('판매시설')) return '판매시설';
  if (u.includes('공동주택') || u.includes('업무시설')) return '공동주택·업무시설';
  if (u.includes('근린생활')) return '제1종근린생활시설';
  return '기타';
}

function riskOf(rate: number): 'danger' | 'warning' | 'success' {
  if (rate < 85) return 'danger';
  if (rate < 95) return 'warning';
  return 'success';
}

const RISK_LABEL = { danger: '위험', warning: '주의', success: '안정' } as const;
const RISK_CLASS = {
  danger: 'text-danger bg-danger-subtle border-danger/30',
  warning: 'text-warning bg-warning-subtle border-warning/30',
  success: 'text-success bg-success-subtle border-success/30',
} as const;
const RISK_DOT = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
} as const;

const parsePrice = (p: string) => Number(p) / 1e8; // 억원

type GroupRow = {
  key: string;
  count: number;
  totalPrice: number;
  avgRate: number;
  buildings: Building[];
};

export function LeaseStatusSubtab() {
  const q = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });
  const items: Building[] = useMemo(() => q.data ?? [], [q.data]);

  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [expandedUse, setExpandedUse] = useState<string | null>(null);
  const [drawerBd, setDrawerBd] = useState<Building | null>(null);

  type DrillFilter = 'rented' | 'noVac' | 'hasVac' | 'area' | 'stable' | 'caution' | 'danger';
  const [activeFilter, setActiveFilter] = useState<DrillFilter | null>(null);

  function toggleFilter(f: DrillFilter) {
    setActiveFilter((prev) => (prev === f ? null : f));
  }

  // ── 요약 KPI (V16 동등) ──
  const summary = useMemo(() => {
    if (items.length === 0) return null;
    const rented = items.filter((b) => (b.rental?.rate ?? 0) > 0).length;
    const noVac = items.filter(
      (b) => (b.rental?.vacancy ?? 0) === 0 && (b.rental?.rate ?? 0) > 0,
    ).length;
    const hasVac = items.filter((b) => (b.rental?.vacancy ?? 0) > 0).length;
    const totalRentArea = items.reduce((s, b) => s + (b.rental?.area ?? 0), 0);
    const totalArea = items.reduce((s, b) => s + b.area.sqm, 0);
    const totalPrice = items.reduce((s, b) => s + parsePrice(b.acquisitionPrice), 0);
    const stable = items.filter((b) => riskOf(b.rental.rate) === 'success').length;
    const caution = items.filter((b) => riskOf(b.rental.rate) === 'warning').length;
    const danger = items.filter((b) => riskOf(b.rental.rate) === 'danger').length;
    return { rented, noVac, hasVac, totalRentArea, totalArea, totalPrice, stable, caution, danger };
  }, [items]);

  // ── 지역(수도권/지방) ──
  const regionGroups = useMemo((): GroupRow[] => {
    const map = new Map<string, GroupRow>();
    for (const b of items) {
      const key = regionBucket(b.address);
      const cur = map.get(key) ?? { key, count: 0, totalPrice: 0, avgRate: 0, buildings: [] };
      cur.count++;
      cur.totalPrice += parsePrice(b.acquisitionPrice);
      cur.avgRate += b.rental.rate;
      cur.buildings.push(b);
      map.set(key, cur);
    }
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        avgRate: g.count > 0 ? g.avgRate / g.count : 0,
        buildings: g.buildings.sort((a, b) => b.rental.rate - a.rental.rate),
      }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // ── 용도 4압축 ──
  const useGroups = useMemo((): GroupRow[] => {
    const map = new Map<string, GroupRow>();
    for (const b of items) {
      const key = bucketNameOfUse(b.use);
      const cur = map.get(key) ?? { key, count: 0, totalPrice: 0, avgRate: 0, buildings: [] };
      cur.count++;
      cur.totalPrice += parsePrice(b.acquisitionPrice);
      cur.avgRate += b.rental.rate;
      cur.buildings.push(b);
      map.set(key, cur);
    }
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        avgRate: g.count > 0 ? g.avgRate / g.count : 0,
        buildings: g.buildings.sort((a, b) => b.rental.rate - a.rental.rate),
      }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // ── 차트 데이터 ──
  const rateData = useMemo(
    () =>
      [...items]
        .filter((b) => (b.rental?.rate ?? 0) > 0)
        .map((b) => ({
          name: b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name,
          rate: b.rental.rate,
          vac: b.rental.vacancy,
          building: b,
        }))
        .sort((a, b) => b.rate - a.rate),
    [items],
  );

  const areaData = useMemo(
    () =>
      [...items]
        .filter((b) => b.area.sqm > 0)
        .sort((a, b) => b.area.sqm - a.area.sqm)
        .slice(0, 10)
        .map((b) => ({
          name: b.name.length > 10 ? b.name.slice(0, 10) + '…' : b.name,
          전체연면적: Math.round(b.area.sqm),
          임대면적: Math.round(b.rental?.area ?? 0),
          building: b,
        })),
    [items],
  );

  const scatterData = useMemo(
    () =>
      items
        .filter((b) => Number(b.acquisitionPrice) > 0)
        .map((b) => ({
          x: parsePrice(b.acquisitionPrice),
          y: b.rental.rate,
          name: b.name,
          vac: b.rental.vacancy,
          building: b,
        })),
    [items],
  );

  const drilldownBuildings = useMemo((): Building[] => {
    if (!activeFilter) return [];
    switch (activeFilter) {
      case 'rented':  return items.filter((b) => (b.rental?.rate ?? 0) > 0);
      case 'noVac':   return items.filter((b) => (b.rental?.vacancy ?? 0) === 0 && (b.rental?.rate ?? 0) > 0);
      case 'hasVac':  return items.filter((b) => (b.rental?.vacancy ?? 0) > 0);
      case 'area':    return [...items].filter((b) => (b.rental?.area ?? 0) > 0).sort((a, b) => b.rental.area - a.rental.area);
      case 'stable':  return items.filter((b) => riskOf(b.rental.rate) === 'success');
      case 'caution': return items.filter((b) => riskOf(b.rental.rate) === 'warning');
      case 'danger':  return items.filter((b) => riskOf(b.rental.rate) === 'danger');
    }
  }, [items, activeFilter]);

  const DRILL_TITLE: Record<string, string> = {
    rented:  '임대 운영 건물',
    noVac:   '완전 임대 건물 (공실률 0%)',
    hasVac:  '공실 발생 건물',
    area:    '임대면적 현황 (면적 큰 순)',
    stable:  '안정 건물 (임대율 95%↑)',
    caution: '주의 건물 (임대율 85~94%)',
    danger:  '위험 건물 (임대율 85%↓)',
  };

  if (q.isLoading) return <p className="text-caption text-muted-foreground">로딩 중…</p>;

  return (
    <div className="space-y-4">
      {/* ── ① KPI 4종 (V16) + 위험 배지 ── */}
      {summary && (
        <Card className="p-5">
          <SectionHeader title="건물 임대 현황" description={`총 ${items.length}동`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="임대 운영 건물"
              value={`${summary.rented}개`}
              sub={`전체 ${items.length}개 중`}
              isActive={activeFilter === 'rented'}
              onClick={() => toggleFilter('rented')}
            />
            <KpiCard
              label="완전 임대 건물"
              value={`${summary.noVac}개`}
              sub="공실률 0%"
              isActive={activeFilter === 'noVac'}
              onClick={() => toggleFilter('noVac')}
            />
            <KpiCard
              label="공실 발생 건물"
              value={`${summary.hasVac}개`}
              sub="관리 필요"
              isActive={activeFilter === 'hasVac'}
              onClick={() => toggleFilter('hasVac')}
            />
            <KpiCard
              label="총 임대면적"
              value={`${summary.totalRentArea.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}㎡`}
              sub="임차인 있는 건물 합산"
              isActive={activeFilter === 'area'}
              onClick={() => toggleFilter('area')}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RiskChip
              risk="success"
              text={`안정 ${summary.stable}동 (95%↑)`}
              isActive={activeFilter === 'stable'}
              onClick={() => toggleFilter('stable')}
            />
            <RiskChip
              risk="warning"
              text={`주의 ${summary.caution}동 (85-94%)`}
              isActive={activeFilter === 'caution'}
              onClick={() => toggleFilter('caution')}
            />
            <RiskChip
              risk="danger"
              text={`위험 ${summary.danger}동 (85%↓)`}
              isActive={activeFilter === 'danger'}
              onClick={() => toggleFilter('danger')}
            />
          </div>
        </Card>
      )}

      {/* ── 드릴다운 패널 ── */}
      {activeFilter && drilldownBuildings.length > 0 && (
        <DrilldownPanel
          title={DRILL_TITLE[activeFilter] ?? ''}
          buildings={drilldownBuildings}
          onClose={() => setActiveFilter(null)}
          onPickBuilding={setDrawerBd}
        />
      )}

      {/* ── ② 지역(수도권/지방) + 용도(4압축) 2열 테이블 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GroupTable
          title="지역별 현황"
          description="수도권 / 지방"
          groups={regionGroups}
          expanded={expandedRegion}
          onToggle={(k) => setExpandedRegion(expandedRegion === k ? null : k)}
          onPickBuilding={setDrawerBd}
        />
        <GroupTable
          title="건물용도별 현황"
          description={`${useGroups.length}개 용도 (4종 압축)`}
          groups={useGroups}
          expanded={expandedUse}
          onToggle={(k) => setExpandedUse(expandedUse === k ? null : k)}
          onPickBuilding={setDrawerBd}
        />
      </div>

      {/* ── ③ 건물별 임대율 + 면적 비교 + 산점도 (3열) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <SectionHeader title="건물별 임대율" description="공실 발생 건물은 주황 · 막대 클릭 시 상세" />
          <div className="h-[360px] w-full">
            <ResponsiveContainer>
              <BarChart data={rateData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 110]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(v, _n, p) => [`${v}% (공실 ${(p as { payload?: { vac?: number } })?.payload?.vac ?? 0}%)`, '임대율']}
                />
                <Bar
                  dataKey="rate"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={16}
                  isAnimationActive
                  animationDuration={CHART_ANIM_MS}
                  animationEasing="ease-out"
                  onClick={(d: unknown) => {
                    const b = (d as { payload?: { building?: Building } })?.payload?.building;
                    if (b) setDrawerBd(b);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {rateData.map((d, i) => (
                    <Cell key={i} fill={d.vac > 0 ? 'hsl(var(--warning))' : 'hsl(var(--success))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="임대면적 vs 전체면적 비교" description="상위 10동" />
          <div className="h-[360px] w-full">
            <ResponsiveContainer>
              <BarChart data={areaData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(v) => (v >= 10000 ? `${Math.round(v / 10000)}만` : `${v}`)}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(v) => `${Number(v).toLocaleString('ko-KR')}㎡`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="전체연면적"
                  fill="hsl(var(--muted-foreground) / 0.4)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={14}
                  isAnimationActive
                  animationDuration={CHART_ANIM_MS}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="임대면적"
                  fill="hsl(var(--success))"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={14}
                  isAnimationActive
                  animationDuration={CHART_ANIM_MS}
                  animationEasing="ease-out"
                  onClick={(d: unknown) => {
                    const b = (d as { payload?: { building?: Building } })?.payload?.building;
                    if (b) setDrawerBd(b);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="건물별 취득가 vs 임대율" description="점 클릭 시 상세" />
          <div className="h-[360px] w-full">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 4, right: 16, bottom: 30, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="취득가"
                  unit="억"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  label={{ value: '취득가 (억원)', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="임대율"
                  unit="%"
                  domain={[0, 110]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(v, n) =>
                    n === 'x' || n === '취득가'
                      ? [fmtKRfull(Number(v) * 1e8), '취득가']
                      : [`${v}%`, '임대율']
                  }
                  labelFormatter={(_, p) => p?.[0]?.payload?.name ?? ''}
                />
                <Scatter
                  data={scatterData}
                  isAnimationActive
                  animationDuration={CHART_ANIM_MS}
                  animationEasing="ease-out"
                  onClick={(d: unknown) => {
                    const b = (d as { payload?: { building?: Building } })?.payload?.building;
                    if (b) setDrawerBd(b);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {scatterData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.vac > 0
                          ? 'hsl(var(--warning))'
                          : d.y === 100
                            ? 'hsl(var(--success))'
                            : 'hsl(var(--primary))'
                      }
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {drawerBd && (
        <BuildingDrawer building={drawerBd} open={!!drawerBd} onClose={() => setDrawerBd(null)} />
      )}
    </div>
  );
}

/* ── sub-components ── */

function KpiCard({
  label,
  value,
  sub,
  isActive,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-3 text-left transition-all duration-150',
        isActive
          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
          : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="text-caption text-muted-foreground">{label}</div>
        {isActive && (
          <span className="shrink-0 text-micro font-medium text-primary">▾ 목록</span>
        )}
      </div>
      <div className="mt-1 font-mono text-heading-sm font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-micro text-muted-foreground">{sub}</div>
    </button>
  );
}

function RiskChip({
  risk,
  text,
  isActive,
  onClick,
}: {
  risk: 'danger' | 'warning' | 'success';
  text: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-medium transition-all duration-150',
        RISK_CLASS[risk],
        isActive ? 'ring-2 ring-offset-1' : 'hover:brightness-95',
        isActive && risk === 'success' && 'ring-success/50',
        isActive && risk === 'warning' && 'ring-warning/50',
        isActive && risk === 'danger' && 'ring-danger/50',
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', RISK_DOT[risk])} />
      {text}
      {isActive && <span className="ml-0.5">▾</span>}
    </button>
  );
}

function DrilldownPanel({
  title,
  buildings,
  onClose,
  onPickBuilding,
}: {
  title: string;
  buildings: Building[];
  onClose: () => void;
  onPickBuilding: (b: Building) => void;
}) {
  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <span className="text-heading-sm font-semibold text-foreground">{title}</span>
          <span className="ml-2 text-caption text-muted-foreground">{buildings.length}동</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2.5 py-1 text-caption text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="닫기"
        >
          닫기 ✕
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted/40 text-caption text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">건물명</th>
              <th className="px-3 py-2.5 text-left font-semibold">지역</th>
              <th className="hidden px-3 py-2.5 text-left font-semibold sm:table-cell">용도</th>
              <th className="px-3 py-2.5 text-right font-semibold">임대율</th>
              <th className="px-3 py-2.5 text-right font-semibold">공실률</th>
              <th className="hidden px-3 py-2.5 text-right font-semibold md:table-cell">취득가</th>
              <th className="hidden px-3 py-2.5 text-left font-semibold lg:table-cell">임차인</th>
              <th className="px-3 py-2.5 text-center font-semibold">상태</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => {
              const risk = riskOf(b.rental.rate);
              return (
                <tr
                  key={b.id}
                  className="border-t border-border transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => onPickBuilding(b)}
                      className="text-left font-medium text-primary hover:underline"
                    >
                      {b.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-caption text-muted-foreground">
                    {regionBucket(b.address)}
                  </td>
                  <td className="hidden px-3 py-2.5 text-caption text-muted-foreground sm:table-cell">
                    {b.use || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {b.rental.rate}%
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                    {b.rental.vacancy}%
                  </td>
                  <td className="hidden px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground md:table-cell">
                    {parsePrice(b.acquisitionPrice).toFixed(1)}억원
                  </td>
                  <td className="hidden max-w-[160px] truncate px-3 py-2.5 text-caption text-muted-foreground lg:table-cell">
                    {b.tenant || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <RiskBadge risk={risk} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RiskBadge({ risk }: { risk: 'danger' | 'warning' | 'success' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-micro font-medium',
        RISK_CLASS[risk],
      )}
    >
      {RISK_LABEL[risk]}
    </span>
  );
}

function GroupTable({
  title,
  description,
  groups,
  expanded,
  onToggle,
  onPickBuilding,
}: {
  title: string;
  description: string;
  groups: GroupRow[];
  expanded: string | null;
  onToggle: (key: string) => void;
  onPickBuilding: (b: Building) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4">
        <SectionHeader title={title} description={description} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40 text-caption text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">분류</th>
              <th className="px-3 py-2 text-right font-semibold">건수</th>
              <th className="px-3 py-2 text-right font-semibold">취득가 합계</th>
              <th className="px-3 py-2 text-right font-semibold">임대율</th>
              <th className="px-3 py-2 text-center font-semibold">상태</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const risk = riskOf(g.avgRate);
              const isOpen = expanded === g.key;
              return (
                <GroupRowFragment
                  key={g.key}
                  g={g}
                  risk={risk}
                  isOpen={isOpen}
                  onToggle={() => onToggle(g.key)}
                  onPickBuilding={onPickBuilding}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GroupRowFragment({
  g,
  risk,
  isOpen,
  onToggle,
  onPickBuilding,
}: {
  g: GroupRow;
  risk: 'danger' | 'warning' | 'success';
  isOpen: boolean;
  onToggle: () => void;
  onPickBuilding: (b: Building) => void;
}) {
  return (
    <>
      <tr
        className={cn(
          'cursor-pointer border-t border-border transition-colors',
          isOpen ? 'bg-muted/30' : 'hover:bg-muted/20',
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-2.5 font-medium text-foreground">
          <span className="flex items-center gap-1.5">
            {isOpen ? '▾' : '▸'} {g.key}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
          {g.count}동
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
          {g.totalPrice.toFixed(1)}억원
        </td>
        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
          {g.avgRate.toFixed(1)}%
        </td>
        <td className="px-3 py-2.5 text-center">
          <RiskBadge risk={risk} />
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={5} className="border-t border-border bg-muted/10 p-0">
            <div className="px-4 py-3">
              <p className="mb-2 text-caption text-muted-foreground">
                건물명을 클릭하면 상세 정보가 열립니다.
              </p>
              <table className="w-full">
                <thead className="text-caption text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="pb-1.5 text-left font-semibold">건물명</th>
                    <th className="pb-1.5 text-right font-semibold">임대율</th>
                    <th className="pb-1.5 text-right font-semibold">공실률</th>
                    <th className="pb-1.5 text-right font-semibold">취득가</th>
                    <th className="pb-1.5 text-center font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {g.buildings.map((b) => {
                    const r = riskOf(b.rental.rate);
                    return (
                      <tr key={b.id} className="border-t border-border/50">
                        <td className="py-1.5 pr-3">
                          <button
                            type="button"
                            onClick={() => onPickBuilding(b)}
                            className="text-left font-medium text-primary hover:underline"
                          >
                            {b.name}
                          </button>
                        </td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-foreground">
                          {b.rental.rate}%
                        </td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                          {b.rental.vacancy}%
                        </td>
                        <td className="py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                          {parsePrice(b.acquisitionPrice).toFixed(1)}억원
                        </td>
                        <td className="py-1.5 text-center">
                          <RiskBadge risk={r} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
