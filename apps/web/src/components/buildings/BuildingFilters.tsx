// 건물 필터 — 지역 칩 + 용도 칩 + 정렬 셀렉트 + 검색 (V16 .ac-chips 동등)
import type { Building } from '@/lib/api/buildings';
import {
  ALL_REGION_BUCKETS,
  ALL_USE_GROUPS,
  SORT_LABEL,
  type RegionBucket,
  type SortKey,
  type UseGroup,
  regionBucketOf,
  categoryOfUse,
} from '@/lib/buildingHelpers';
import { cn } from '@/lib/utils';

type Props = {
  buildings: Building[];
  region: RegionBucket | null;
  setRegion: (v: RegionBucket | null) => void;
  useGroup: UseGroup | null;
  setUseGroup: (v: UseGroup | null) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  q: string;
  setQ: (v: string) => void;
};

export function BuildingFilters({
  buildings,
  region,
  setRegion,
  useGroup,
  setUseGroup,
  sort,
  setSort,
  q,
  setQ,
}: Props) {
  const buckets = Array.from(new Set(buildings.map((b) => regionBucketOf(b.address))));
  const orderedBuckets = ALL_REGION_BUCKETS.filter((b) => buckets.includes(b));
  const groups = Array.from(new Set(buildings.map((b) => categoryOfUse(b.use))));
  const orderedGroups = ALL_USE_GROUPS.filter((g) => groups.includes(g));

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
      {/* 지역 + 용도 한 행 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <FilterLabel>지역</FilterLabel>
        <Chip active={region === null} onClick={() => setRegion(null)}>
          전체 ({buildings.length})
        </Chip>
        {orderedBuckets.map((r) => {
          const count = buildings.filter((b) => regionBucketOf(b.address) === r).length;
          return (
            <Chip key={r} active={region === r} onClick={() => setRegion(r)}>
              {r} ({count})
            </Chip>
          );
        })}
        <span className="h-3.5 w-px shrink-0 bg-border" aria-hidden="true" />
        <FilterLabel>용도</FilterLabel>
        <Chip active={useGroup === null} onClick={() => setUseGroup(null)}>
          전체
        </Chip>
        {orderedGroups.map((g) => {
          const count = buildings.filter((b) => categoryOfUse(b.use) === g).length;
          return (
            <Chip key={g} active={useGroup === g} onClick={() => setUseGroup(g)}>
              {g} ({count})
            </Chip>
          );
        })}
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="건물명 또는 주소 검색…"
          className="flex-1 rounded-xl border border-border bg-muted px-3 py-1.5 text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-border bg-muted px-3 py-1.5 text-caption text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {(Object.entries(SORT_LABEL) as [SortKey, string][]).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 text-micro font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-1.5 py-0 text-[10px] font-medium leading-[18px] transition-colors duration-150',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
