# 대시보드 개선 작업 로그 — 2026-05-10

> 브랜치 `claude/review-dashboard-improvements-mMcqS`. 다음 세션이 이 파일만 보고 같은 결정을 재현·이어가도록 작성.

---

## 1. 작업 목적

사용자 요청: "대시보드 개선 가능한 부분 스스로 검토해 → 화면 흔들거리는것까지 모두 찾고 1번 묶음(즉시 가능한 dead code + 사소한 정리)만 먼저 처리"
이후 "처리해" / "4개다" / "처리해" 로 단계적으로 보류했던 항목들을 모두 처리.

근본 목표 — `apps/web` 대시보드의 **레이아웃 시프트 / dead code / DESIGN.md 위반 / boilerplate / a11y / 모바일 / 거대 컴포넌트** 7가지 축을 정리.

---

## 2. 커밋 이력 (총 14커밋, 시간순)

| 해시 | 묶음 | 내용 |
|---|---|---|
| `aa2180c` | 1번 | 사용되지 않는 대시보드 컴포넌트 7개 삭제 (-401줄) |
| `7a344bc` | 1번 | void inv · non-null assertion 정리 |
| `eb3b31a` | A | tsc -b 가 src 안에 .js/.d.ts emit 하던 빌드 사이드이펙트 차단 |
| `c13f9bd` | A (S1) | 폰트 swap + Pretendard Fallback size-adjust → 첫 페인트 시프트 제거 |
| `0a35a38` | A (S5) | PageShell 본문 `scrollbar-gutter: stable` |
| `e6eeee3` | A (S4) | Radix Tabs `forceMount + data-[state=inactive]:hidden` 으로 탭 전환 깜빡임 제거 |
| `47e6dfb` | B (S2) | Skeleton 컴포넌트 + 대시보드 로딩 골격 (DashboardOverviewSkeleton) |
| `35d046b` | B (S2) | IssuePanel · ExecInsight 로딩 점프 제거 (`min-h` + isLoading inline 골격) |
| `a5fd891` | C | PERIOD `'2026-03'` 6곳 하드코딩 → `lib/period.CURRENT_PERIOD` 단일 상수 |
| `396e818` | C | DESIGN.md 위반 hex/text-white 6곳 → 시맨틱 토큰 |
| `5424d53` | C | `fmtKR` / `fmtKRfull` 음수 지원 (sign + abs 분리) |
| `f4bbead` | C | 자산 위험도 임계값 5종 → `lib/thresholds` 중앙화 (`leaseRiskOf`, `LOCATION_CONCENTRATION` 등) |
| `32db4eb` | D | 데이터 페치 wrapper hook 4종 (`useBuildings`, `useEquipmentSnapshots`, `useMom`, `useAssetSnapshots`) — 10+ 파일 적용 |
| `7d55025` | (4-1) | expand 행 점프 제거 + 드릴다운 네비 독립 높이 (S3/S7) |
| `d7e4771` | (4-2) | a11y — `<tr>` role/tabIndex/aria-expanded/onKeyDown + aria-controls |
| `358e785` | (4-3) | AssetDrilldownSubtab 모바일 적응형 레이아웃 (F2) |
| `3191dcd` | (4-4) | LeaseStatusSubtab 594줄 → 3파일 분리 |
| `d11b42d` | (5) | ESLint rules-of-hooks 오진 5개 + exhaustive-deps 경고 6개 해소 |

---

## 3. 흔들림 (레이아웃 시프트) 7축 분류 — S1~S7

분석 후 분류한 모든 시프트 원인. 처리/보류 표시.

| ID | 원인 | 처리 | 커밋 |
|---|---|---|---|
| **S1** | 폰트 늦게 바뀌면서 줄높이 점프 | ✅ swap + size-adjust fallback | `c13f9bd` |
| **S2** | 비동기 로딩 → 콘텐츠 등장하면서 아래 요소 밀림 | ✅ Skeleton + min-h 골격 | `47e6dfb`, `35d046b` |
| **S3** | 인라인 expand (`isOpen && <tr>`) 페이지 점프 | ✅ DOM 항상 존재 + `hidden` 클래스 | `7d55025` |
| **S4** | Radix Tabs unmount/mount 시 깜빡임 | ✅ `forceMount` 패턴 | `e6eeee3` |
| **S5** | 스크롤바 출현 시 가로폭 변동 | ✅ `scrollbar-gutter: stable` | `0a35a38` |
| **S6** | 차트 ResponsiveContainer 초기 width=0 | ⏭ 보류 (Recharts 자체 워닝, 기능 영향 없음) | — |
| **S7** | AssetDrilldownSubtab 좌측 네비 가변 높이가 우측 테이블 늘림 | ✅ `items-start` | `7d55025` |

---

## 4. 신규 생성 파일

- `apps/web/src/components/ui/Skeleton.tsx` — `Skeleton`, `DashboardOverviewSkeleton`
- `apps/web/src/lib/period.ts` — `CURRENT_PERIOD = '2026-03'`
- `apps/web/src/lib/thresholds.ts` — `LEASE_RATE`, `VACANCY_RATE`, `SUPPLIES_MOM`, `LOCATION_CONCENTRATION`, `leaseRiskOf()`
- `apps/web/src/lib/queries.ts` — React Query wrapper hook 4종
- `apps/web/src/components/dashboard/LeaseGroupTable.tsx` — `GroupRow` 타입, `GroupTable`, `GroupRowFragment`, `RiskBadge`
- `apps/web/src/components/dashboard/LeaseKpiSection.tsx` — `KpiCard`, `RiskChip`

## 5. 삭제된 dead code (7개)

확인 결과 어디서도 import되지 않던 컴포넌트:

- `AssetMatrix.tsx`, `AssetTypeChart.tsx`, `LocationChart.tsx`
- `SuppliesKpi.tsx`, `MoversList.tsx`
- `ExecBldSummary.tsx`, `ExecEqSummary.tsx`

총 -401줄.

---

## 6. 주요 결정 사항 + 이유

### 6.1 빌드 산출물 분리 (`eb3b31a`)
**문제** — `tsc -b` 가 web 빌드 시 `src/` 안에 `.js` / `.d.ts` 떨굼 → git status 더러워짐.
**결정** — `tsconfig.json`에 `"noEmit": true` 추가, `package.json` build 스크립트를 `tsc --noEmit && vite build` 로 변경.
**대안 검토** — `outDir` 분리도 가능하지만 dist만 쓰는 SPA에선 `noEmit` 가 단순.

### 6.2 폰트 시프트 제거 (`c13f9bd`)
**문제** — Pretendard CDN stylesheet 블로킹 + fallback 시스템폰트와 메트릭 차이로 줄높이 점프.
**결정** — woff2 직접 `@font-face display: swap` + `Pretendard Fallback`을 `local('Apple SD Gothic Neo')` 등에 `size-adjust: 100.5%` / `ascent-override` / `descent-override` 로 메트릭 정렬.
**검증** — woff2 preload 추가, tailwind sans 스택에 `'Pretendard Fallback'` 삽입.

### 6.3 인라인 expand → hidden class (`7d55025`)
**문제** — `{isOpen && <tr>...</tr>}` 패턴은 행이 DOM에서 추가/제거되며 페이지 점프 발생.
**결정** — DOM에 항상 두고 `className={cn(..., !isOpen && 'hidden')}` 로 토글.
**대안 검토** — Drawer로 전환은 UX 변경이 너무 커서 보류 (S3 별도 항목으로 분리됐으나 hidden 패턴으로 우회 처리됨).

### 6.4 a11y `<tr role="button">` (`d7e4771`)
**문제** — `<tr onClick>` 만 있고 키보드 접근 불가, screen reader 가 expand 상태 모름.
**결정** — `role="button" tabIndex={0} aria-expanded={isOpen} onKeyDown={Enter|Space → onToggle}`.
**대안 검토** — 첫 셀에 `<button>` 넣는 방식도 있지만 행 전체 클릭 영역 유지 위해 `<tr>`에 직접.

### 6.5 LeaseStatusSubtab 분리 (`3191dcd`)
**문제** — 594줄 단일 파일. 메인 로직 + 서브컴포넌트 5개 + 상수 + 헬퍼가 한 파일에 섞임.
**결정** — `LeaseGroupTable.tsx` (187) + `LeaseKpiSection.tsx` (41) + `LeaseStatusSubtab.tsx` (381). 차트는 메인에 유지 (한 번만 쓰여서 분리 이점 작음).
**원칙** — CLAUDE.md "Simplicity First" 에 따라 추가 추상화 없이 파일만 쪼갬. 공유 가능성 있는 `RiskBadge` 도 lease 전용으로 두고 임의 export 안 함.

### 6.6 ESLint Hook 오진 해소 (`d11b42d`)
**문제** — `useGroupOf` / `useBucket` 같은 일반 함수가 `use` 접두사 때문에 React Hook으로 오인되어 `react-hooks/rules-of-hooks` 에러 5개.
**결정** — `useGroupOf` → `groupOf`, `useBucket` → `classifyUse`. 함수 자체가 React state에 접근 안 하므로 이름 변경이 정확한 fix.
**부수** — `LeaseStatusSubtab` 의 `items: Building[] = q.data ?? []` 를 `useMemo` 로 감싸 `exhaustive-deps` 경고 6개 동시 해소.

---

## 7. 검증

- `pnpm typecheck` — 통과 (web만, root에서 돌리면 api 의 xlsx 미설치로 실패)
- `pnpm build` — 7~9초 성공, dist 정상
- `pnpm lint` — 0 error / 0 warning (이번 작업으로 5 error + 6 warning 모두 해소)
- 화면 검증 — playwright 로 mock API 응답 후 캡처. 개요/드릴다운/임대현황/모바일 모두 정상.

---

## 8. 보류 항목 (다음 세션에서 처리 가능)

| 항목 | 이유 | 추천 시점 |
|---|---|---|
| **S6 차트 width=0 워닝** | Recharts 초기 마운트 시 ResponsiveContainer 가 부모 폭 못 잡음 | 차트 라이브러리 교체 시 |
| **AssetKpiCards 인라인 expand → Drawer** | 카드 클릭 시 패널이 카드 아래에 끼어 들어와 페이지 점프. 현재는 panelOpen 상태로 토글 | UX 개선 라운드 |
| **차트 키보드 접근** | Recharts SVG는 SVG 자체 a11y가 어려움. `<Bar onClick>` 만 있고 키보드 불가 | 별도 a11y 스프린트 |
| **S3 시각적 transition** | hidden 클래스로 점프는 없앴지만 갑작스럽게 펼쳐짐. Radix Accordion 도입 시 부드러워짐 | 디자인 폴리시 |

---

## 9. 다음 세션 시작 가이드

```bash
git checkout claude/review-dashboard-improvements-mMcqS
git log --oneline | head -20         # 14커밋 확인
cat docs/dashboard-review-2026-05-10.md  # 이 파일

# 로컬 실행
pnpm install
cd apps/api && cp .env.example .env  # SESSION_SECRET 32자, AUTH_PEPPER 16자 채움
pnpm prisma migrate dev && pnpm prisma:seed
pnpm dev                              # API :3001
# 다른 터미널
cd apps/web && pnpm dev               # web :5173
```

검증 순서:
1. `자산현황` 탭 → `자산 드릴다운` → 좌측 네비 클릭 시 우측 테이블 흔들림 없어야 함
2. `임대 현황` → 그룹 행 클릭 → 페이지 점프 없어야 함, Tab/Enter 로 접근 가능해야 함
3. 브라우저 폭 ≤768px → 드릴다운 1열로 전환되어야 함
4. 탭 전환 → 깜빡임 없어야 함

---

## 10. 환경 메모

- 이 세션은 컨테이너 환경. `xlsx@https://cdn.sheetjs.com/...` 가 403 반환해서 api 패키지 install 실패 → API 서버 띄우지 못함. 로컬에선 정상 작동 예상.
- playwright 로 mock API 응답해서 화면 검증. mock 데이터는 `apps/api/data/v16-extracted.json` 에서 추출.
- Vite dev server 는 `pnpm dev --port 5173` 로 띄움. 빌드 사이즈 811KB (gzip 240KB) — 차후 manualChunks 검토 여지.
