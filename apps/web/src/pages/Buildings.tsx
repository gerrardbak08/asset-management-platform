// 건물 목록 페이지 — 카드/표 모드 토글 + 필터/정렬 + admin/editor 인라인 편집 + 5탭 드로어
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building as BuildingIcon, LayoutGrid, Table2 } from 'lucide-react';
import { buildingsApi, type Building } from '@/lib/api/buildings';
import { useAuthStore } from '@/store/auth';
import { PageShell } from '@/components/ui/PageShell';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { BuildingCard } from '@/components/buildings/BuildingCard';
import { BuildingDrawer } from '@/components/buildings/BuildingDrawer';
import { BuildingFilters } from '@/components/buildings/BuildingFilters';
import { BuildingEditTable } from '@/components/buildings/BuildingEditTable';
import { regionBucketOf, categoryOfUse, type RegionBucket, type SortKey, type UseGroup } from '@/lib/buildingHelpers';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'table';

export default function Buildings() {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'admin' || role === 'editor';

  const [selected, setSelected] = useState<Building | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const region = (searchParams.get('region') as RegionBucket | null) ?? null;
  const useGroup = (searchParams.get('useGroup') as UseGroup | null) ?? null;
  const sort: SortKey = (searchParams.get('sort') as SortKey) || 'acq_desc';
  const q = searchParams.get('q') ?? '';
  const view: ViewMode = (searchParams.get('view') as ViewMode) || 'cards';

  function setParam(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace: true });
  }

  const query = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });

  const items = useMemo(() => {
    let arr = query.data ?? [];
    if (region) arr = arr.filter((b) => regionBucketOf(b.address) === region);
    if (useGroup) arr = arr.filter((b) => categoryOfUse(b.use) === useGroup);
    if (q) {
      const ql = q.toLowerCase();
      arr = arr.filter(
        (b) =>
          b.name.toLowerCase().includes(ql) ||
          b.address.includes(q) ||
          b.tenant.includes(q),
      );
    }
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case 'acq_desc':
          return b.acquisitionDate.localeCompare(a.acquisitionDate);
        case 'acq_asc':
          return a.acquisitionDate.localeCompare(b.acquisitionDate);
        case 'price_desc':
          return Number(b.acquisitionPrice) - Number(a.acquisitionPrice);
        case 'price_asc':
          return Number(a.acquisitionPrice) - Number(b.acquisitionPrice);
        case 'name_asc':
          return a.name.localeCompare(b.name, 'ko-KR');
        default:
          return 0;
      }
    });
    return arr;
  }, [query.data, region, useGroup, q, sort]);

  return (
    <PageShell
      title="건물"
      description={query.data ? `전국 ${query.data.length}동 · 필터링 ${items.length}동` : ''}
      action={
        <div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setParam('view', 'cards')}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium transition-colors duration-150',
              view === 'cards'
                ? 'bg-card text-foreground shadow-elev-1'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="카드 뷰"
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            카드
          </button>
          <button
            type="button"
            onClick={() => setParam('view', 'table')}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium transition-colors duration-150',
              view === 'table'
                ? 'bg-card text-foreground shadow-elev-1'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="표 뷰"
          >
            <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
            표
          </button>
        </div>
      }
    >
      <BuildingFilters
        buildings={query.data ?? []}
        region={region}
        setRegion={(v) => setParam('region', v)}
        useGroup={useGroup}
        setUseGroup={(v) => setParam('useGroup', v)}
        sort={sort}
        setSort={(v) => setParam('sort', v)}
        q={q}
        setQ={(v) => setParam('q', v)}
      />

      <SectionHeader
        title="건물 목록"
        description={view === 'cards' ? '카드를 클릭해 상세를 봅니다' : 'admin/editor 는 행 편집 가능'}
      />

      {query.isLoading ? (
        <p className="text-caption text-muted-foreground">로딩 중…</p>
      ) : query.isError ? (
        <p className="text-caption text-danger">로드 실패 — {query.error.message}</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BuildingIcon}
          title="조건에 맞는 건물이 없습니다"
          description="필터를 초기화하거나 검색어를 줄여보세요."
        />
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <BuildingCard key={b.id} building={b} onClick={() => setSelected(b)} />
          ))}
        </div>
      ) : canEdit ? (
        <BuildingEditTable items={items} />
      ) : (
        <EmptyState
          icon={Table2}
          title="표 편집은 editor 이상"
          description="viewer 는 카드 뷰만 사용 가능합니다."
        />
      )}

      {selected ? (
        <BuildingDrawer
          building={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </PageShell>
  );
}
