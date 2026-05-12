# DESIGN.md 감사 리포트

> 감사일: 2026-05-13
> 대상: `apps/web/src/` 전체 (페이지 10개 + 컴포넌트 다수)
> 기준: `DESIGN.md v2.0` (2026-04-14)

---

## 요약 (Executive Summary)

| 항목 | 상태 | 위반 건수 |
|------|------|----------|
| PageShell 구조 | ✅ 우수 | 0 |
| 시맨틱 토큰 사용 | ✅ 대부분 준수 | - |
| 하드코딩 폰트 크기 (`text-[Npx]`) | ❌ **즉시 수정** | **9건** |
| 하드코딩 HEX 색상 | ❌ **즉시 수정** | **5건** |
| `text-white` / `bg-white` | ❌ 수정 필요 | **10+건** |
| 카드 외곽 `rounded-xl` 사용 (카드는 `2xl` 강제) | ⚠️ 수정 필요 | **6건** |
| 카드 패딩 불일치 (p-3/p-4/p-5 혼재) | ⚠️ 규칙화 필요 | 페이지 전체 |
| `calc(100vh - N)` 고정 | ⚠️ 구조 개선 | **2건** |
| 차트 컨테이너 `h-[Npx]` | ⚠️ 토큰화 권장 | **9건** |
| KPI 폰트 클래스 충돌 | ❌ 수정 필요 | **1건** |

**Severity 등급**
- ❌ 즉시 수정: DESIGN.md에 명시적으로 "금지"라 적힌 사항
- ⚠️ 수정 필요: 일관성 원칙을 깨뜨려 UI 불균형을 유발
- ℹ️ 권장: 유지보수성·확장성 향상

---

## 1. 하드코딩된 폰트 크기 (❌ 즉시 수정)

DESIGN.md §3: `text-[9px]`~`text-[12px]` 하드코딩 금지. 스케일 토큰 사용 강제.

| 파일 | 라인 | 현재 | 교체 |
|------|------|------|------|
| `pages/Stores.tsx` | 170 | `text-[10px] font-medium` | `text-micro` |
| `pages/Stores.tsx` | 322 | `text-[10px] uppercase tracking-wider` | `text-micro uppercase tracking-wider` |
| `components/layout/Header.tsx` | 21 | `text-[17px]` | `text-heading-md` (16px) 또는 스케일 확장 |
| `components/layout/Sidebar.tsx` | 35 | `text-[18px]` | `text-heading-lg` (18px) — 값 동일, 토큰화 |
| `components/layout/Sidebar.tsx` | 47 | `text-[10px]` | `text-micro` |
| `components/layout/MobileHeader.tsx` | 9 | `text-[17px]` | Header와 동일 처리 |
| `components/stores/StoreTimeline.tsx` | 99 | `text-[11px]` | `text-caption` |
| `components/stores/StoreTimeline.tsx` | 112 | `text-[10px]` | `text-micro` |
| `components/stores/StoreTimeline.tsx` | 115 | `text-[9px]` | **WCAG 위반 즉시 삭제** → `text-micro` |
| `components/dashboard/HeroKPI.tsx` | 80 | `text-[23px]` | `text-heading-lg` (21px) 또는 스케일 확장 |

**영향:** 브라우저 기본 폰트 설정을 덮어씀. 화면 크기·다크모드에 따라 시각적 불균형.

---

## 2. 하드코딩된 HEX 색상 (❌ 즉시 수정)

DESIGN.md §2.7: 하드코딩 hex 금지 (`#13245A`, `text-[#...]`, `bg-[#...]`).

| 파일 | 라인 | 현재 | 교체 |
|------|------|------|------|
| `components/layout/Header.tsx` | 21 | `text-[#1B3A7A]` | `text-primary` |
| `components/layout/Sidebar.tsx` | 35 | `text-[#1B3A7A]` | `text-primary` |
| `components/layout/MobileHeader.tsx` | 9 | `text-[#1B3A7A]` | `text-primary` |
| `components/buildings/BuildingMap.tsx` | 48 | `color:#18181B`, `color:#71717A`, `font-size:11px`, `font-size:12px` | 인라인 스타일 → CSS 변수 `var(--foreground)`, `var(--muted-foreground)` 사용 |

**영향:** 다크모드 지원 불가. 브랜드 컬러 변경 시 전체 코드 검색 필요.

**브랜드 컬러 `#1B3A7A`는 `--primary` 토큰과 일치** — 토큰만 쓰면 됨.

---

## 3. `text-white` / `bg-white` 하드코딩 (❌ 금지)

DESIGN.md §14: `text-white` / `bg-white` 하드코딩 금지 → `text-primary-foreground` 등 사용.

| 파일 | 위치 | 위반 |
|------|------|------|
| `components/layout/Sidebar.tsx` | 32 | `bg-white px-4 dark:bg-sidebar` — 라이트 모드 하드코딩 |
| `components/layout/Sidebar.tsx` | 70~80 | 활성 메뉴 `bg-white/5 text-white` — 4곳 |
| `components/buildings/BuildingCard.tsx` | 77 | 오버레이 `bg-black/60 text-white` |
| `components/buildings/BuildingDrawer.tsx` | 123 | 오버레이 `bg-black/60 text-white` |
| `components/buildings/PhotoLightbox.tsx` | 52~97 | Dialog 오버레이 `text-white`, `bg-white/10` 다수 |
| `components/layout/MobileHeader.tsx` | 6 | `bg-white border-gray-200` |

**처방:**
- 사이드바 활성 메뉴: DESIGN.md §6 사이드바 토큰 사용 → `bg-sidebar-accent text-sidebar-accent-foreground`
- 포토 오버레이: 다크 테마 고정 UI는 예외로 허용 가능하나, 토큰으로 추출 (`--overlay-bg`, `--overlay-fg`)
- 모바일 헤더: `bg-card border-border`로 교체

---

## 4. 카드 외곽 `rounded-xl` 사용 (⚠️ 수정 필요)

DESIGN.md §6: 카드 외곽은 반드시 `rounded-2xl`. `rounded-xl`은 카드 내부 요소(버튼·배지·입력)에만 허용.

| 파일 | 라인 | 위반 |
|------|------|------|
| `components/dashboard/AssetDrilldownSubtab.tsx` | 107 | `rounded-xl border border-border bg-card` — 카드 외곽인데 xl |
| `components/dashboard/AssetDrilldownSubtab.tsx` | 137 | 동일 |
| `components/dashboard/SuppliesOpsSubtab.tsx` | 152 | `rounded-xl border border-border bg-card p-4 shadow-sm` — KPI 카드인데 xl |

**영향:** 같은 화면 안에서 어떤 카드는 16px, 어떤 카드는 12px 라운드 → 시각적으로 "왜 다르지?" 느낌.

---

## 5. 카드 패딩 불일치 (⚠️ 규칙화 필요)

DESIGN.md §4: 8px 그리드. 하지만 "카드 타입별 패딩 기준"이 명시되지 않아 페이지마다 제각각.

### 현재 사용 현황

| 패딩 | 사용처 |
|------|--------|
| `p-3` (12px) | `Stores.tsx` KPI 헤더, 차트 카드 / `StoreTimeline` / `Maintenance` 컬럼 |
| `p-4` (16px) | `Stores.tsx` 검색, `Leases`/`Depreciation` 요약카드, `BuildingMap` 에러 |
| `p-5` (20px) | Dashboard 전체 (`AcquisitionHistory`, `LeaseStatus`, `SuppliesOps`, `MomBarChart`, `AssetTrendChart`, `HeroKPI` 도넛 카드) / `Admin` 전체 |
| `p-6` (24px) | `HeroKPI` 메인 카드 |

### 문제
같은 수준의 카드인데 페이지마다 패딩이 다름:
- Stores의 차트 카드: `p-3`
- Dashboard의 차트 카드: `p-5`

### 제안 규칙 (DESIGN.md에 추가)

```
카드 타입                    패딩
────────────────────────────────
메인 대시보드 카드           p-5
서브 카드 (리스트·KPI)       p-4
콤팩트 카드 (타임라인 등)    p-3
Hero 카드 (특대)             p-6
```

---

## 6. 높이 하드코딩 (⚠️ 구조 개선)

### `calc(100vh - Npx)` 2건
| 파일 | 라인 | 현재 |
|------|------|------|
| `pages/Stores.tsx` | 77 | `lg:h-[calc(100vh-200px)]` |
| `pages/Stores.tsx` | 158 | `lg:h-[calc(100vh-200px)]` |

**문제:** 헤더 높이·필터 높이 변경 시 전부 깨짐. DESIGN.md §5 "이중 스크롤 금지" 원칙과 충돌 우려.

**처방:** PageShell → `flex-1 min-h-0` 체인으로 교체:
```tsx
<PageShell>
  <div className="flex h-full flex-col gap-3">
    <SearchCard />              {/* shrink-0 */}
    <div className="grid flex-1 min-h-0 grid-cols-[280px,1fr] gap-3">
      <StoreList />             {/* min-h-0 overflow-y-auto */}
      <SelectedPanel />         {/* min-h-0 overflow-y-auto */}
    </div>
  </div>
</PageShell>
```

### 차트 컨테이너 `h-[Npx]` 9건
| 파일 | 값 | 용도 |
|------|-----|------|
| `MomBarChart.tsx` | `h-[240px]` | 막대 차트 |
| `AssetTrendChart.tsx` | `h-[240px]` | 라인 차트 |
| `AcquisitionHistorySubtab.tsx` | `h-[360px]` | 복합 차트 |
| `LeaseStatusSubtab.tsx` (×3) | `h-[360px]` | 막대/산점도 |
| `SuppliesOpsSubtab.tsx` | `min-h-[280px]` | 막대 차트 |
| `BuildingMap.tsx` (×2) | `h-[360px]` | 지도/로드뷰 |

**처방:** 차트 전용 토큰 도입:
```ts
// tailwind.config.ts
extend.height: {
  'chart-sm': '240px',
  'chart-md': '320px',
  'chart-lg': '360px',
}
```

### 기타 고정 높이
| 파일 | 라인 | 현재 |
|------|------|------|
| `AssetDrilldownSubtab.tsx` | 157 | `max-h-[560px]` 테이블 |
| `Maintenance.tsx` | 54 | `min-h-[320px]` 칸반 컬럼 |
| `Stores.tsx` | 258 | `h-[150px] w-[150px]` 도넛 |
| `HeroKPI.tsx` | 103 | `h-[160px] w-[160px]` 도넛 |
| `Leases.tsx` · `Depreciation.tsx` | - | `min-h-[92px]` 요약 카드 (일관됨, OK) |

---

## 7. KPI 폰트 클래스 충돌 (❌ 수정 필요)

`pages/Stores.tsx:324`:
```tsx
<div className="mt-0.5 truncate font-kpi-inline text-body tabular-nums text-foreground">
```

- `font-kpi-inline`: **18px / weight 600**
- `text-body`: **15px / weight 400**

→ Tailwind는 나중에 선언된 클래스가 우선이지만 폰트 크기 하나에 두 토큰이 동시 지정됨. 둘 중 하나만:
- KPI 값이면 → `font-kpi-inline` 단독
- 본문이면 → `text-body` 단독

---

## 8. KPI 카드 중복 구현 (ℹ️ 권장)

같은 개념("레이블 + 값")의 KPI 카드가 최소 5곳에서 다르게 구현됨:

| 파일 | 구현 |
|------|------|
| `Stores.tsx:321` | `<Kpi label value />` — 로컬 함수 |
| `Leases.tsx:131` | `<SummaryCard label value />` — 아이콘 포함 로컬 함수 |
| `Depreciation.tsx:65` | `<SummaryCard label value />` — `Leases`와 거의 동일 |
| `SuppliesOpsSubtab.tsx:152` | 인라인 `<div>` |
| `Dashboard` `AssetKpiCards` | 전용 컴포넌트 |

**처방:** `components/ui/KpiCard.tsx` 하나로 통합:
```tsx
type Variant = 'compact' | 'default' | 'hero';
<KpiCard label="자산 장부가" value={...} variant="compact" icon={Landmark} trend={...} />
```

---

## 9. 텍스트 대문자·자간 불일치 (⚠️ 수정 필요)

KPI 라벨이 어떤 곳은 대문자(`uppercase tracking-wider`), 어떤 곳은 일반 대문자.

| 파일 | 라벨 스타일 |
|------|-----------|
| `Stores.tsx` Kpi | `uppercase tracking-wider` |
| `Leases.tsx` SummaryCard | 일반 — `text-caption text-muted-foreground` |
| `Dashboard AssetKpiCards` | 확인 필요 |

**처방:** DESIGN.md §3에 "KPI 레이블은 `text-caption text-muted-foreground` (대문자 변환 안 함)"로 명시.

---

## 10. 탭 트리거 폰트 (ℹ️ 권장)

`pages/Dashboard.tsx:58`:
```tsx
'... px-3 py-2 text-body font-medium ...'
```

- `text-body`: 15px (본문용)
- 일반적인 탭 UI는 `text-sm` (14px) 또는 `text-caption` (11px)이 적절

본문과 동일한 15px 탭은 시각적으로 무겁게 보임.

---

## 11. 그림자 (ℹ️ 확인)

DESIGN.md §7: shadow 4단계 이상 금지, `shadow-elev-1/2/3` 만 사용.

- `shadow-sm` 사용: `SuppliesOpsSubtab.tsx:152` (Tailwind 기본, DESIGN.md 토큰 아님)
- `shadow-elev-1` 사용: `Stores.tsx:201, 222` / `Buildings.tsx` 탭

**처방:** `shadow-sm` → `shadow-elev-1`로 통일.

---

## 12. 검색바 구조 (ℹ️ 권장)

DESIGN.md에 "검색바" 표준 패턴 없음. 현재 구현 제각각:

- `Stores.tsx`: `<Card className="p-4"><label className="rounded-xl border bg-muted">...</label></Card>`
- `Ledger.tsx`: `<div className="rounded-xl border bg-card">...</div>` — Card 안 씀
- `Buildings.tsx`: `BuildingFilters` 컴포넌트 내부

**처방:** `components/ui/SearchBar.tsx` 단일 컴포넌트.

---

## 우선순위별 수정 계획

### Phase 1 — 하드코딩 제거 (0.5일)
- [ ] 하드코딩 폰트 9건 → 토큰 교체
- [ ] 하드코딩 HEX 5건 → `text-primary` 교체
- [ ] `text-[9px]` WCAG 위반 삭제
- [ ] `text-white` → `text-primary-foreground` / 토큰화

### Phase 2 — 카드·패딩 규칙화 (0.5일)
- [ ] 카드 외곽 `rounded-xl` → `rounded-2xl` (6건)
- [ ] DESIGN.md에 "카드 타입별 패딩 기준" 섹션 추가
- [ ] `shadow-sm` → `shadow-elev-1` 통일

### Phase 3 — 구조 개선 (1일)
- [ ] `calc(100vh - 200px)` → flex-1/min-h-0 리팩토링
- [ ] 차트 높이 토큰 `h-chart-sm/md/lg` 도입
- [ ] KPI 폰트 클래스 충돌 해결

### Phase 4 — 컴포넌트 통합 (1일)
- [ ] `KpiCard.tsx` 통합 컴포넌트 작성
- [ ] `SearchBar.tsx` 통합
- [ ] `Leases`/`Depreciation` `SummaryCard` 중복 제거

### Phase 5 — 자동화 (0.5일)
- [ ] ESLint 커스텀 룰: `text-\[\d+px\]` 금지
- [ ] ESLint 커스텀 룰: `text-white` / `bg-white` 금지
- [ ] `DESIGN_AUDIT.sh` 정기 검사 스크립트

### 총 예상 공수: **3.5일**

---

## 체크리스트 (DESIGN.md §16)

| 항목 | 상태 |
|------|------|
| ☑ 컴포넌트가 DESIGN.md §6에 정의되어 있는가 | ✅ 대부분 |
| ☑ 색상이 시맨틱 토큰으로 표현 가능한가 | ⚠️ HEX 5건 위반 |
| ☑ 폰트 크기가 스케일 내에 있는가 | ❌ 9건 위반 |
| ☑ 카드 외곽이 `rounded-2xl`인가 | ⚠️ 6건 위반 |
| ☑ 버튼 텍스트가 `text-primary-foreground`인가 | ✅ |
| ☑ 상태 표현이 색+아이콘+텍스트 3중인가 | ✅ |
| ☑ PageShell div인가 | ✅ |
| ☑ 이중 스크롤 없는가 | ✅ |
| ☑ 하드코딩 hex 없는가 | ❌ 5건 |
| ☑ 3D 아이콘 없는가 | ✅ (lucide-react) |
| ☑ 아이콘 겹침 없는가 | ✅ |

---

*DESIGN_AUDIT.md v1.0 | 2026-05-13*
