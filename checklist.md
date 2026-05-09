# 1단계 체크리스트 (v1.1)

> 작성일 2026-05-09. `plan.md` 의 1단계 범위 + DESIGN.md 표준에 맞춘 실행 체크리스트.
> 스택은 Vite + React + TS (분리 백엔드) 베이스 위에 DESIGN.md 의 디자인 시스템 (Tailwind + Radix UI + Pretendard + DM Mono + 다크모드 기본 + Recharts) 을 도입한다.
> UI/UX 는 V16 1:1 이식이 아니라 DESIGN.md 기준 전면 개편 (사용자 지시).
> 각 항목은 "끝났음을 증명할 수 있는 산출물 또는 검증 명령" 을 함께 적었다. 위에서부터 작업한다.

---

## A. 코드 조사 (V16 동작 원리 확정)

- [ ] `SJ_대시보드_V16.html` (OneDrive 바탕 화면) 의 함수 62개 목록을 `docs/v16-funcs.md` 에 정리. 검증 — `init / saveAll / exportJSON / importJSON / generateHTML / handleMonthlyXlsbUpload / applyM0Data / generateM0StoresFromLedger / setRole / openBldDetail / switchBddTab / compressImg / fmtKR / fmtKRfull / migrateEq / migrateBd` 16개 핵심 함수가 모두 적혀 있어야 한다.
- [ ] `STORAGE_KEYS` 와 V16 실제 키 (`dash_eq_v4 / dash_bd_v4 / dash_imgs / dash_monthly / dash_summary` + `aspd_schema_ver` + `dash_bld_memos`) 매핑 표 작성. 기획안 (`aspd_*`) 과 실제 코드가 다르다는 점 명시.
- [ ] `EMBEDDED_BUILDING_PHOTOS` (15장 정면) 와 `EMBEDDED_BUILDING_DETAILS` (4장 디테일) 의 키와 base64 길이를 표로 정리.
- [ ] `EMBEDDED_M0_STORES_DATA.stores` 의 사업장 수 2,015건과 데이터 모양 확정.
- [ ] `defBd()` 의 15동 좌표 (`BUILDING_COORDS`) 를 `docs/buildings-seed.json` 으로 분리.
- [ ] `ROLE_POLICY` (`exec / ops / store / admin`) 와 새 시스템 4역할 (`admin / editor / viewer / auditor`) 매핑 표 작성.
- [ ] `handleMonthlyXlsbUpload` 의 시트 매핑 (자산현황 행5 cell B/D/F/H, 비품(프로세스별), 원장_비품_재고, 원장_자산) 을 `docs/xlsb-mapping.md` 로 추출.

## B. 데이터 모델 정리 (V16 → 새 시스템)

- [ ] V16 `Building` 타입을 그대로 옮긴 TS 타입 정의.
- [ ] V16 `Equipment` 타입 정의.
- [ ] V16 `Store` 타입 정의.
- [ ] V16 `MonthlyData` (6 키 × 12 배열) 정의.
- [ ] V16 `M0Data` (`meta / current / previous / mom / movers`) 정의.
- [ ] 위 5 타입을 `packages/shared/src/types.ts` 로 모아 프론트·백엔드 양쪽이 import. 검증 — `tsc --noEmit` 통과.
- [ ] V16 `migrateEq / migrateBd / fmtKR / fmtKRfull` 도메인 함수를 `lib/legacy/migrate.ts` 와 `lib/format.ts` 로 이식 (이름·시그니처 보존).

## C. API 설계 (Fastify Route — 1단계)

- [ ] `docs/api.md` 에 다음 라우트 명세 작성 — 메서드, 경로, zod 스키마, 응답 스키마, 필요한 역할.
  - 인증 — `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
  - 건물 — `GET /api/buildings`, `GET /api/buildings/:id`, `PUT /api/buildings/:id`, `POST /api/buildings/:id/photo`.
  - 비품 — `GET /api/equipments`, `PUT /api/equipments/:id`, `GET /api/equipments/snapshots?period=2026-03`.
  - 사업장 — `GET /api/stores?q=&page=`, `GET /api/stores/:id`.
  - 월별 실적 — `GET /api/monthly`, `PUT /api/monthly`.
  - 월마감 업로드 — `POST /api/upload/xlsb`, `POST /api/upload/csv/:type`.
  - MoM — `GET /api/mom?period=2026-03`.
  - 메모 — `GET /api/buildings/:id/memo`, `PUT /api/buildings/:id/memo`.
- [ ] `zod` 스키마를 `packages/shared/src/schema.ts` 로 분리.
- [ ] 401 / 403 / 409 / 422 응답 형태 통일 (`{ ok:false, code, message }`).
- [ ] 권한 가드 (admin/editor/viewer/auditor) 를 라우트 별로 표시.

## D. DB 스키마 초안

- [ ] `prisma/schema.prisma` 에 1단계 6개 테이블 정의 (`plan.md` §5.3 참조).
- [ ] 모든 금액 컬럼은 Prisma `BigInt` (1.19조 단위 대응).
- [ ] `legacy_id` 컬럼을 `buildings`, `equipment_items` 두 테이블에 둬 V16 데이터(`bd_001`~`bd_015`, `eq_001`~`eq_041`) 검증.
- [ ] `stores` 의 카테고리 데이터는 `Json` 컬럼으로 시작.
- [ ] `monthly_snapshots.raw_json` 에 V16 `M0_DATA` 원형 저장.
- [ ] `created_at / updated_at / updated_by` 3개 컬럼을 모든 mutable 테이블에 둔다.
- [ ] SQLite + PostgreSQL 양쪽에서 `prisma migrate dev` 통과.

## E. 마이그레이션 전략 (V16 → 새 DB)

- [ ] V16 `exportJSON()` 으로 `dashboard_2026-05-09.json` 1회 추출.
- [ ] `scripts/migrate-from-v16.ts` 작성 — 위 JSON 을 6 테이블로 적재.
- [ ] `EMBEDDED_BUILDING_PHOTOS / DETAILS` base64 → `uploads/buildings/{legacy_id}{,_detail}.png` 로 저장하고 `buildings.photo_url` 에 상대 경로 저장.
- [ ] `EMBEDDED_M0_STORES_DATA.stores` 2,015건 삽입. "구로 / 남사 / 스타벅스 / 올리브영" 검색 결과 V16 동등.
- [ ] `npm run verify:migration` 검증 — 자산 합계 ₩1,191,529,992,612 (26-03), ₩1,187,005,713,251 (26-02), 소화기 재고 ₩765,902,874, 건물 15 / 비품 41 / 사업장 2,015.

## F. 인증 / 권한

- [ ] `POST /api/auth/login` — bcrypt 해시 비교, httpOnly 세션 쿠키.
- [ ] Fastify 미들웨어 `requireRole('admin'|'editor'|'viewer'|'auditor')`.
- [ ] V16 `setRole` UI 매핑 — exec=viewer, ops=editor, store=viewer(scope=stores), admin=admin. auditor 는 admin 이 부여.
- [ ] 모든 쓰기 라우트가 권한 가드 없이 통과되지 않는지 통합 테스트.
- [ ] 비밀번호 8자 이상 + 환경변수 솔트 (`AUTH_PEPPER`).

## G. 파일 저장 추상화

- [ ] `lib/storage/StorageAdapter` 인터페이스 (`save / read / publicUrl / delete`).
- [ ] 1단계 구현체 `LocalDiskAdapter` — `uploads/{key}` 저장, `/files/*` 정적 응답.
- [ ] 사진 업로드 시 `sharp` 로 800x600 / 150KB 압축 (V16 `compressImg` 동등).
- [ ] 2단계 대비 `S3Adapter` 시그니처만 미리 적어두고 `// TODO(2단계)` 주석.

## H. 화면 UI/UX 전면 개편 (DESIGN.md 기준)

> V16 1:1 이식이 아니다. 사용자 지시에 따라 DESIGN.md 의 토큰·컴포넌트·레이아웃을 그대로 도입해 화면을 다시 설계한다.

### H.1 토대 (Vite + Tailwind + Radix UI)
- [ ] Vite 5 + React 18 + TypeScript 5 스캐폴드. `pnpm` 사용.
- [ ] 폴더 구조 — `src/pages/` `src/components/ui/` `src/components/features/dashboard/` `src/components/layout/` `src/lib/api/` `src/store/` `src/styles/globals.css`.
- [ ] Tailwind CSS (JIT) 설치 + `tailwind.config.ts` 에 DESIGN.md §3 의 typography 스케일 (`text-display-lg / md / text-heading-lg / md / sm / text-body / body-strong / text-caption / text-micro`) 과 KPI 폰트 (`font-kpi-huge / display / metric / inline`) 등록.
- [ ] `src/styles/globals.css` 에 DESIGN.md §2 의 시맨틱 토큰 13종 + 4색 변형 + 사이드바 토큰 등록. 인라인 hex 금지.
- [ ] Radix UI 프리미티브 설치 (`@radix-ui/react-dialog / tabs / dropdown-menu / select / tooltip / toast`).
- [ ] lucide-react 아이콘 + motion/react (framer-motion v11+) 설치.
- [ ] Pretendard Variable + DM Mono 폰트 로딩 (CDN 또는 self-host).
- [ ] `<html class="dark">` 기본 + 라이트 토글 비활성 (DESIGN.md §11).
- [ ] 인쇄 CSS — `@media print` 에서 라이트 모드 강제 분기.

### H.2 공통 컴포넌트 (DESIGN.md 강제)
- [ ] `components/layout/Header.tsx` — `h-14` 56px + 사이드바 로고 정렬.
- [ ] `components/layout/Sidebar.tsx` — DESIGN.md §6 의 사이드바 토큰 + 5메뉴 (자산현황 / 건물 / 사업장 / 데이터 / 관리자) + 그룹 라벨.
- [ ] `components/layout/MobileNav.tsx` — < md 1열 + 하단 5탭.
- [ ] `components/features/dashboard/SectionHeader.tsx` — 전체에서 유일한 SectionHeader.
- [ ] `components/ui/Card.tsx` — `rounded-2xl border border-border bg-card`.
- [ ] `components/ui/KpiCard.tsx` — `font-kpi-display font-mono tabular-nums` + 위·아래 트렌드 + 4색 매핑. 한글은 Pretendard, 숫자는 DM Mono 분리.
- [ ] `components/ui/StatusBadge.tsx` — 색 + 아이콘 + 텍스트 3중.
- [ ] `components/ui/StatusLine.tsx` — `relative pl-4` + `absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-{color}`.
- [ ] `components/ui/EmptyState.tsx` — 아이콘 + 감정적 메시지. V16 `bld-img-ph` 의 자산관리용 변형.
- [ ] `components/ui/Skeleton.tsx` — `animate-pulse bg-muted rounded-xl`.
- [ ] `components/ui/AiBlock.tsx` — `border-info/20 bg-info/5` (1단계엔 미사용 가능, 2단계 대비).
- [ ] `components/ui/PageShell.tsx` — `flex flex-col h-full overflow-y-auto overflow-x-hidden bg-background` 래퍼.

### H.3 자산관리 도메인 화면 (V16 IA 재구성 → DESIGN.md 5메뉴)
- [ ] `pages/Dashboard.tsx` — V16 의 자산현황 7서브탭을 Radix Tabs 로 흡수 (개요·자산상세·드릴다운·비품운영·비품흐름·취득연혁·임대현황). Hero KPI (1.19조) `font-kpi-huge`, 카드 `rounded-2xl`.
- [ ] 차트 5종 (Hero 도넛 / 자산구성 / 매장 카테고리 TOP10 / 임대 현황 / 취득 연혁 / MoM bar) — Recharts 로 변환. 색상은 DESIGN.md 시맨틱 토큰만 사용.
- [ ] `pages/Buildings.tsx` — 카드 그리드. 사진 fallback 4단계 (DB photo_url → EMBEDDED_DETAIL → EMBEDDED_PHOTO → EmptyState) 유지하되 외형은 DESIGN.md 카드/색.
- [ ] `pages/BuildingDetail.tsx` 또는 모달 — 5탭 드로어 (Radix Dialog + Tabs). 기본·임대·관리이력·메모·지도. Kakao Maps 는 동적 import + 환경변수 키.
- [ ] `pages/Stores.tsx` — 사업장 검색 + KPI 4종 + 비품 카테고리 TOP 10 + 자산 도넛.
- [ ] `pages/Data.tsx` — 양식 다운로드 + 업로드 5종.
- [ ] `pages/Admin.tsx` — 관리자 패널. 로그인은 `pages/auth/Login.tsx` 로 분리 (`bg-primary` 인증 페이지 패턴).

### H.4 자산관리 위험도 → DESIGN.md 4색 매핑
- [ ] 임대 만료 7일 이내 → `danger` (red).
- [ ] 임대 만료 30일 이내 → `warning` (orange).
- [ ] xlsb 분석 중 / 신규 자산 등록 진행 → `info` (blue).
- [ ] 임대율 100% / 사진 등록 완료 / MoM ±1% 이내 → `success` (green).
- [ ] 위험도 헬퍼 함수 `getAssetRiskStyle(building) / getEquipmentRiskStyle(item)` 작성.

### H.5 상태 / API
- [ ] `useDashboardStore` (Zustand) — V16 `S = { eq, bd, imgs, monthly, summary }` 와 동일 모양.
- [ ] React Query (TanStack Query) — `useBuildings()` `useBuilding(id)` `useStores(q)` `useMoM(period)` 훅.
- [ ] `lib/api/*.ts` — fetch wrapper 5종.

### H.6 V16 동작 1:1 보존 (외형은 새, 결과는 같음)
- [ ] MoM 계산은 서버 (`GET /api/mom`) 가 V16 `applyM0Data` 와 동일한 결과.
- [ ] 사진 등록 시 800x600 / 150KB 압축. 클라이언트 미리보기 그대로.
- [ ] xlsb 업로드 시 V16 의 시트 매핑 그대로.
- [ ] 공유 HTML 은 1차적으로 화면을 볼 수 있는 형태로만 (사용자 결정 §4.7) — 정적 export 또는 인쇄 미리보기.

## I. 검증 항목 (성공 기준)

- [ ] `pnpm typecheck` — 0 오류.
- [ ] `pnpm build` — 0 오류.
- [ ] `vitest` — login / GET /buildings / PUT /buildings/:id / POST /upload/xlsb / GET /mom + 도메인 함수 4종 (migrateEq / migrateBd / fmtKR / applyM0Data) 통합 테스트.
- [ ] V16 와의 데이터 동등성 4종 (자산 합계 26-02 / 26-03, 소화기 재고, 사업장 검색).
- [ ] xlsb 두 개 업로드 후 MoM 비율이 `M0_DATA.mom` 와 일치.
- [ ] 사진 업로드·삭제·재업로드 후에도 정상 표시.
- [ ] viewer 계정으로 PUT/POST 요청 시 모두 401 또는 403.
- [ ] 두 브라우저 동시 접속 후 한쪽이 수정한 결과를 다른 쪽이 새로고침으로 본다.
- [ ] Lighthouse 데스크톱 점수 80점 이상 (성능·접근성·SEO 평균).

## J. 문서화·핸드오프

- [ ] `README.md` — `pnpm install` `pnpm dev` `pnpm db:migrate` `pnpm db:seed` 정리.
- [ ] `docs/operations.md` — 백엔드 로그 위치, 백업 명령, 환경변수 (`DATABASE_URL`, `SESSION_SECRET`, `KAKAO_JS_KEY`, `KAKAO_REST_KEY`, `AUTH_PEPPER`) 표.
- [ ] `docs/migration-from-v16.md` — V16 운영자가 새 시스템으로 옮길 때 따라야 할 절차.
- [ ] 사용자 결정 7개 (`plan.md` §8) 가 모두 채워져 있어야 본 체크리스트 H 이후 시작.

## K. DESIGN.md 컴플라이언스 검증 (감사)

DESIGN.md §16 의 "에이전트 작업 전 체크리스트" 11개 항목을 자산관리 플랫폼 화면 5개 모두에 대해 통과시킨다.

- [ ] 이 컴포넌트가 이미 DESIGN.md §6 에 정의되어 있는가 (재발명 금지).
- [ ] 이 색상이 시맨틱 토큰으로 표현 가능한가 (`bg-card / text-foreground / danger / warning / info / success`).
- [ ] 이 폰트 크기가 스케일 내에 있는가.
- [ ] 카드 외곽이 `rounded-2xl` 인가 (`rounded-xl` 은 카드 내부에만).
- [ ] 버튼 텍스트가 `text-primary-foreground` 인가 (`text-white` 금지).
- [ ] 상태 표현이 색+아이콘+텍스트 3중인가.
- [ ] 페이지 루트가 PageShell `<div>` 인가 (Fragment `<>` 금지).
- [ ] 이중 스크롤 없는가.
- [ ] 하드코딩 hex 없는가 (`#1E3A5F` 같은 V16 색 직주입 금지).
- [ ] 3D 아이콘 없는가 (lucide-react 2D 만).
- [ ] shadow 4단계 이상 / 400ms 초과 transition / bounce / spring 애니메이션 없는가.

DESIGN.md §14 의 DON'T 리스트를 ESLint / Stylelint 룰로 자동화.
- [ ] `text-white` / `bg-white` 하드코딩 금지 (regex eslint).
- [ ] `text-[9-12]px` 하드코딩 금지.
- [ ] `font-bold` 카드 h2 금지 (`font-semibold` 강제).
- [ ] `transition-all` 금지.
- [ ] 임의 hex 인라인 금지 (`bg-[#...]`, `text-[#...]`).
