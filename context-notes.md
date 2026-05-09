# 컨텍스트 노트

> 작성일 2026-05-09. 분석 과정에서 알게 된 사실, 결정의 이유, 보류한 쟁점, 사용자 결정이 필요한 항목을 모두 적는다.
> 다음 세션이 이 메모만 보고 같은 결정을 재현할 수 있도록 의도적으로 길게 적는다.

---

## 1. 확인한 사실 (분석 결과)

### 1.1 저장소 / 파일 구조
- 작업 디렉토리는 `e:\자산관리 플랫폼 개발`. 단일 HTML 대시보드 자체는 여기에 없다. `OneDrive\바탕 화면\SJ_대시보드_V16.html` 에 있다 (기획안 13장 명시 그대로).
- 작업 디렉토리에는 (a) `전사_자산관리_대시보드_기획안.md`, (b) `DB/자산관리 대시보드 아키텍처.html`, (c) `DB/AIMS_아키텍처_전체설계.html`, (d) `DB/Codex_프롬프트.md`, (e) `DB/대시보드 데이터_26년{2,3}월마감.xlsb`, (f) `DB/자산관리_대시보드_건물현황.xlsx`, (g) `DB/건물사진/*.png` 15장, (h) `DB/건물상세/*.png` 4장, (i) `CLAUDE.md` 가 있다.
- 즉 새 시스템에 필요한 모든 외부 입력은 이 폴더에 모여 있다 — V16 HTML 만 빼고.

### 1.2 V16 의 실제 구조 (코드 직접 확인)
- 전역 상태 — `let S = { eq, bd, imgs, monthly, summary }` (line 4777-4788).
- 합계 시드값 — `summary.totalAsset = 1185916820759` (V16 첫 진입 시), 이후 26-03 xlsb 적용 후엔 `M0_DATA.current.asset_kpi.total = 1191529992612`.
- localStorage 키 — `STORAGE_KEYS = { EQ:'dash_eq_v4', BD:'dash_bd_v4', IMGS:'dash_imgs', M:'dash_monthly', SUM:'dash_summary' }` (line 4612). 추가로 `aspd_schema_ver`, `dash_bld_memos` 가 있다.
- **중요** — 기획안 3.3 항은 `aspd_bd / aspd_eq / aspd_imgs / aspd_m / aspd_sum` 으로 적혀 있다. **실제 코드와 다르다.** 이는 기획안이 한 단계 앞서 작성된 흔적이거나 리브랜딩 미반영이다. 마이그레이션 시 실제 키를 사용해야 한다.
- 데이터 정의 — `defEq()` 41행 (line 4797), `defBd()` 15행 (line 4851), `BUILDING_COORDS` 좌표 15쌍.
- 사진 — `EMBEDDED_BUILDING_PHOTOS` 정면 15장 (line 4728), `EMBEDDED_BUILDING_DETAILS` 디테일 4장 (line 4763, 강릉·세종·속초·창원). 모두 base64 인라인.
- 사업장 — `EMBEDDED_M0_STORES_DATA.stores` 2,015건 인라인 (line 7763 부근).
- 역할 정책 — `ROLE_POLICY = { exec, ops, store }` 3개. `admin` 은 별도 분기 (sessionStorage `adminAuth = 'ok'`).
- 관리자 인증 — `sessionStorage.adminAuth` 값으로만 판정. 비밀번호는 코드 내 함수 어딘가에 하드코딩되어 있을 가능성이 높다 (확인 필요).
- xlsb 업로드 — `handleMonthlyXlsbUpload` (line 8137) 가 SheetJS 로 `자산현황 / 비품(프로세스별) / 원장_비품_재고 / 원장_자산` 4시트를 파싱한다. 자산현황은 행 5 cell B/D/F/H (총자산/유형/무형/비품), 비품은 행 5 (재고/구매/이동/폐기) 매핑.
- MoM 모델 — `applyM0Data` (line 8294 부근) 가 `M0_DATA.mom.{total, tangible, intangible, supplies, location, supplies_kpi}` 를 화면에 반영. 7895 행에 26-03 vs 26-02 의 사례 JSON이 통째로 박혀 있다 — 이걸 검증 데이터셋으로 그대로 쓸 수 있다.
- 공유 HTML — `generateHTML` 이 `var __EMBEDDED__ = {eq, bd, imgs, monthly, summary}` 를 `<head>` 에 주입하고 `document.documentElement.outerHTML` 로 통째 다운로드한다.
- 사진 업로드 — `compressImg` 가 800x600 / 150KB 로 줄여 base64 로 변환 후 `S.imgs[idx]` 에 저장. 그래서 한 장 당 약 100~200KB, 15장이면 2~3MB → 5MB localStorage 한계에 가깝다.

### 1.3 기획안과 실제 구현의 미세 차이 4가지
1. localStorage 키 이름 — `aspd_*` (기획안) vs `dash_*` (실제).
2. 역할 4종 — 기획안엔 `exec/ops/store/admin`, 실제 `ROLE_POLICY` 는 `exec/ops/store` 만. admin 은 별도 분기.
3. CSS 토큰 — 기획안에는 다이소 다크네이비 `#1E3A5F` 라고 쓰여 있고 V16 도 동일. 다만 AIMS 문서는 `#1E2761` 을 쓴다. 새 시스템은 V16 기준으로 `#1E3A5F` 가 정답.
4. ledger 구조 — 기획안 / AIMS 문서는 모두 `equipment_ledger` 도입을 적었지만 V16 은 여전히 월별 스냅샷. 1단계는 V16 그대로 가고 ledger 는 2단계.

### 1.4 두 설계 문서 (DB / AIMS) 의 공통 요구사항
- 자산 현황 — Hero KPI / 도넛 / MoM / 주의사항 / 임대 위험 건물 / 건물용도별 현황. 1단계 필수.
- 건물 상세 — 카드 그리드 + 5탭 드로어 + 인라인 편집. 1단계 필수.
- 사업장 관리자 뷰 — 검색 / KPI 4종 / 비품 카테고리 TOP 10 / 자산 유형 도넛. 1단계 필수.
- 데이터 조정 — CSV 양식 / xlsb 업로드 / 5종 핸들러. 1단계 필수.
- 관리자 패널 — 로그인 / 5종 데이터 카드 + 업로드 버튼. 1단계 필수.
- MoM — 항상 "현재 화면값 vs 업로드값" 으로 산정 (V16 14장 결정 로그). 새 시스템도 동일.
- 사진 fallback 체인 4단계 — 사용자 업로드 → 이름 매칭 임베드 → 인덱스 매칭 임베드 → 빈 상태. 1단계도 동일.
- PDF 보고서 — `window.print()` 모달로 1단계 시작 후 2단계에 서버 PDF.

### 1.5 AIMS Stage 3 목표 (Supabase / Vercel 제거 후 재해석)
원래 AIMS Stage 3 는 다음과 같이 명시되어 있다.
- **Next.js 14 + shadcn/ui + Recharts + TanStack Table + Zustand + Kakao Maps**.
- **Supabase PostgreSQL + Auth + Storage + Realtime + Edge Functions**.
- **Vercel 배포 (`aims.vercel.app`)**.
- **13개 페이지, 4역할 RBAC, 모바일 반응형**.

이번 프로젝트의 제약(Supabase / Vercel 미사용)에 맞춘 재해석은 다음과 같다.

| Stage 3 원안 | 제약 적용 후 1단계 적용 | 2단계+ 적용 |
|---|---|---|
| Next.js 14 App Router | **Vite + React** (SPA, 정적 dist) | 추후 SEO / SSR 필요 시 Next.js 자체 호스팅 검토 |
| Supabase PostgreSQL | **자체 백엔드 + SQLite (dev) / PostgreSQL (prod)** | 동일 |
| Supabase Auth | **자체 백엔드 세션 + bcrypt** | OIDC (Keycloak / Authelia) |
| Row Level Security | **백엔드 미들웨어 + role 가드** | DB 레벨 정책 추가 검토 |
| Storage | **로컬 디스크 + StorageAdapter 추상화** | MinIO / S3 호환 어댑터 |
| Realtime | **1차 제외**, 폴링 또는 새로고침 | WebSocket / SSE |
| Edge Functions (cron) | **백엔드 node-cron + 동기 라우트** | 별도 워커 + 큐 |
| Vercel 배포 | **사내 서버 또는 1대 VPS + Docker Compose** | 동일 |
| 13개 페이지 | **5개 페이지 (V16 동등)** | 임대차 / 유지보수 / 비품원장 / 보고서 추가 |

### 1.6 자체 구현 4개 옵션 비교 (요약)
- **A 단일 HTML 유지** — 협업·이력 문제 미해결. 임시방편으로만.
- **B Vite + React + 로컬 SQLite (백엔드 없음)** — Tauri / Electron 데스크톱 앱이 아니면 다중 사용자 불가. 부적합.
- **C Vite + React + Node Fastify 또는 FastAPI + SQLite→Postgres** — **권장**. 단계 확장 용이, 사내 호스팅 친화적.
- **D Next.js 자체 호스팅** — 1단계엔 과스펙. Stage 3 도달 시 다시 검토.

---

## 2. 결정한 사항과 그 이유

### 2.1 1단계는 "최소 플랫폼화"
- Stage 1 의 "함수 4개만 교체" 모델은 Supabase JS SDK 가 백엔드 없이도 풀스택 역할을 해주기 때문에 가능했다. 자체 백엔드를 세우는 본 프로젝트에선 그 모델이 그대로 적용되지 않는다.
- 대신 V16 의 도메인 함수 (defBd / defEq / migrateEq / migrateBd / fmtKR / handleMonthlyXlsbUpload / applyM0Data) 와 데이터 모양 (S 객체) 을 그대로 보존하면 화면 코드 재작성 비용을 80% 이상 줄일 수 있다.

### 2.2 프론트는 Vite + React + TypeScript
- AIMS 가 Stage 3 에 정한 라이브러리 (shadcn/ui · Recharts · TanStack Table · Zustand · Kakao Maps) 를 그대로 재사용해야 2단계 진입 시 화면 재작성이 없다.
- Next.js 는 SSR / SEO 가 필요할 때 도입한다. 본 시스템은 사내 인증 뒤에 있는 운영 도구이므로 SSR 이익이 작다.
- 차트는 1단계 Chart.js (V16 코드 그대로) → 2단계 Recharts 점진 전환. 이중 의존을 잠시 허용한다.

### 2.3 백엔드는 Node.js Fastify 우선 권장
- xlsb 파싱은 V16 이 SheetJS (`xlsx@0.18`) 로 이미 구현했다. 백엔드도 같은 라이브러리를 쓰면 코드 재이식이 거의 없다.
- 프론트와 동일 언어 → 타입 공유 (`packages/shared`) 가 가능하다.
- 다만 회사가 이미 Python 인프라를 쓰고 있다면 FastAPI 도 동등 후보. 사용자 결정.

### 2.4 DB 는 SQLite 시작 → PostgreSQL 운영
- 1단계 검증 (시드, 마이그레이션, ETL, MoM 비교) 은 SQLite 가 압도적으로 빠르다.
- Prisma 의 provider 만 변경하면 PostgreSQL 로 전환 가능. 단, `BigInt` / `DateTime` 동작 차이는 전환 시 검증 필요.

### 2.5 파일 저장은 로컬 디스크 + 추상화
- 1단계에 MinIO / S3 까지 가는 것은 과하다.
- StorageAdapter 인터페이스만 미리 만들어두면 2단계 전환 비용이 작다.

### 2.6 1단계 권한은 자체 ID/PW + 4역할
- V16 의 `exec/ops/store/admin` 은 화면 가시성 정책일 뿐 진짜 권한이 아니다.
- 새 시스템은 백엔드 미들웨어로 `admin / editor / viewer / auditor` 를 강제. RLS 가 없으므로 미들웨어 누락이 곧 보안 구멍 — 통합 테스트로 모든 쓰기 라우트를 커버한다.

### 2.7 1단계 제외 범위 7가지
임대차 Gantt / 유지보수 칸반 / 비품 원장 거래 단위 전환 / 감가상각 / 자동 PDF·이메일 / 실시간 동기화 / 감사 로그 — 모두 2단계 이후. 1단계는 "V16 의 5개 화면 + 다중 사용자 + 사진 영속" 에 집중한다.

---

## 3. 보류한 쟁점

### 3.1 차트 라이브러리 전환 시점
- V16 Chart.js 코드를 그대로 옮기면 1단계 빠르다. 그러나 React 친화도가 낮아 컴포넌트화가 거칠다.
- 만약 사용자가 "1단계부터 Recharts 로 가자" 면 화면 코드 재작성 비용이 +30% 정도 늘어난다. 일단 1단계는 Chart.js 유지로 메모.

### 3.2 PDF 보고서
- 1단계 `window.print()` 면 충분하지만, 페이지 잘림 방지 (`break-inside: avoid`) 와 헤더 / 푸터 처리 등 인쇄 CSS 가 V16 에 이미 있다 — 이식 비용 작다.
- 2단계에 Puppeteer / Playwright 서버 사이드 렌더링 도입 여부는 그때 다시 결정.

### 3.3 사진 임베드 vs URL
- V16 의 `EMBEDDED_BUILDING_PHOTOS` 15장은 base64 인라인이라 코드가 크다.
- 1단계에는 이 데이터를 ETL 로 디코딩해 `uploads/buildings/*.png` 로 풀고 DB 의 `photo_url` 만 참조하면 된다.
- 다만 V16 의 공유 HTML 기능 (`generateHTML`) 은 더 이상 필요 없다. 새 시스템은 URL 기반 공유라 단일 HTML 다운로드 자체가 의미를 잃는다 — 사용자 확인 필요.

### 3.4 Kakao Maps
- V16 `KAKAO_JS_KEY', 'KAKAO Rest KEY'는 다음과 같다.
REST API KEY = 515812b0dc02478bdc15561b67712fe9
JaveScript API KEY = 790bcd3cb7e52eab060568aa47a1fe8e
환경변수로 옮기고 프론트에 런타임 주입.
- 사내 도메인 등록이 안 된 키이면 새로 발급해야 한다 — 사용자 결정.


### 3.5 사업장 데이터 갱신 주기
- V16 의 사업장 2,015건은 인라인 정적 데이터다. 새 시스템에서는 DB 에 들어가는데, 매월 xlsb 업로드 시 갱신되도록 한다.

### 3.6 DESIGN.md (Work Platform) 발견
- 작업 디렉토리 루트에 `DESIGN.md` 가 있다. 같은 회사의 안전보건통합관리 플랫폼(Work Platform) 디자인 기준서 v2.0 (2026-04-14, 708행).
- 머리말에 "**모든 UI 작업 전 이 파일을 반드시 완독한다. 이 파일에 없는 값은 사용하지 않는다.**" 라고 강제. 자산관리 플랫폼도 이를 따른다 (사용자 확인 — "디자인 기준서를 참고해").
- 표준 스택 (§15) — Next.js 15 + React 19 + Tailwind + Radix UI + Pretendard + DM Mono + lucide-react + motion/react + class-based dark mode.
- 색 토큰 (§2) — `background / card / foreground / muted-foreground / border / muted` (서피스) + `primary` (blue-600) + `danger / warning / info / success` (시맨틱 4색) + 사이드바 다크 chrome.
- 타이포 (§3) — Pretendard (sans, `letter-spacing: -0.015em`) + DM Mono (KPI 숫자, `tabular-nums` 필수). 텍스트 9단계 + KPI 4단계.
- 레이아웃 (§5) — Header `h-14` + Sidebar 다크 chrome + Content `flex-1 overflow-y-auto`. PageShell 패턴 강제. Fragment 페이지 루트 금지.
- 카드 (§6) — `rounded-2xl border border-border bg-card`.
- 빈 상태 (§6) — 아이콘 + 감정적 메시지. 단일 텍스트 금지.
- 다크모드 기본 (§11). 인쇄는 라이트 강제 분기.
- 모션 (§8) — 200ms 이하, transition-all / bounce / spring 금지.
- 안전보건 위험도 매핑 (§12) — `>=70 → danger`, `40-69 → warning`, `0-39 → success`. 자산관리는 임대 만료 / 임대율 / 사진 미등록 등으로 매핑 재정의.
- DON'T 14개 (§14) + 에이전트 체크리스트 11개 (§16).

### 3.7 V16 UI/UX 전면 개편 결정 (사용자 지시)
- 사용자가 "Git에서 확인한 html파일로 구현된 대시보드의 UI/UX를 전면 개편하는 것도 당연히 검토해" 라고 명시.
- 즉 V16 의 화면 외형·레이아웃·인터랙션을 1:1 이식하지 않는다. DESIGN.md 기준으로 다시 설계한다.
- 폐기되는 V16 요소 — 다이소 다크네이비 (`#1E3A5F`) / topbar + sticky tabs / 라이트모드 / Chart.js / 모바일 우선 반응형 / `bld-img-ph` 빈 상태 등.
- 보존되는 V16 요소 — 데이터 모양 (`Building / Equipment / Store / MonthlyData / M0Data`) / 도메인 함수 (`defBd / defEq / migrateEq / migrateBd / fmtKR / fmtKRfull / handleMonthlyXlsbUpload / applyM0Data / generateM0StoresFromLedger`) / xlsb 시트 매핑 / MoM 산정 로직 / 사업장 2,015건 / 좌표 15쌍.
- IA 재구성 — V16 의 자산현황 7서브탭은 `/dashboard` 한 페이지의 Radix Tabs 로 흡수. 사이드바 5메뉴 (자산현황·건물·사업장·데이터·관리자) 로 단순화.
- 차트 — Recharts 1단계부터 (DESIGN.md 호환 + React 친화).
- 색상 매핑 — DESIGN.md 4색을 자산관리 도메인 의미로 재정의 (임대 만료 7일 → danger, 30일 → warning, 진행중 → info, 안정 → success).

### 3.8 스택 정합성 — Vite 베이스 + DESIGN.md 라이브러리 도입
- DESIGN.md 가 강제하는 라이브러리 (Tailwind / Radix UI / lucide-react / motion/react / Pretendard / DM Mono) 는 Vite 환경에서도 모두 동작한다.
- DESIGN.md 의 Next.js 15 명시는 Work Platform 의 SSR / SEO 요구에서 비롯된 것. 자산관리 플랫폼은 사내 인증 뒤 운영 도구라 SSR 이익이 작으므로 1단계엔 Vite + React 유지.
- 다만 두 플랫폼이 디자인 패키지 (`@company/design-system`) 를 공유한다면 그 패키지는 Next.js / Vite 양쪽에서 import 가능한 형태로 유지해야 함.
- 2단계에 SSR 가치가 생기면 Vite → Next.js 전환 검토. 그때도 DESIGN.md 컴포넌트는 그대로 재사용.

---

## 4. 사용자 결정이 필요한 7가지

1. **백엔드 언어** — Node.js Fastify (권장) vs Python FastAPI. 회사의 기존 인프라/팀 역량에 따라.
2. **호스팅 환경** — 사내 서버 / 회사 VPS / 클라우드 IaaS. 도메인과 HTTPS 발급 책임 주체.
3. **DB 시작점** — SQLite 시작 허용 여부. 처음부터 PostgreSQL 강제이면 docker-compose 추가.
4. **인증 방식** — 자체 ID/PW (단순), 사내 LDAP/AD (회사 표준), OIDC (Keycloak/Authelia). 1단계 자체 ID/PW + 인터페이스화 권장.
5. **저장소 시작점** — 로컬 디스크 (권장) vs 처음부터 MinIO/S3.
6. **Kakao Maps 키 처리** — REST API KEY = 515812b0dc02478bdc15561b67712fe9,JaveScript API KEY = 790bcd3cb7e52eab060568aa47a1fe8e
7. **공유 HTML 기능 폐기 여부** — 새 시스템은 URL 기반인데 V16 의 `generateHTML` 다운로드를 유지해야 하는 운영자가 있는가. 1차적으로 HTML화면을 볼수 있도록 해준다.

---

## 5. 분석에서 사용한 1차 근거

다음을 모두 직접 읽거나 검색으로 확인했다 — 추측 없음.

- 기획안 — `전사_자산관리_대시보드_기획안.md` 전부 (376행).
- DB 아키텍처 — `DB/자산관리 대시보드 아키텍처.html` 전부 (1147행).
- AIMS 아키텍처 — `DB/AIMS_아키텍처_전체설계.html` 핵심 8장 (1078행, 분할 읽기).
- Codex 프롬프트 — `DB/Codex_프롬프트.md` 전부 (459행).
- V16 단일 HTML — `OneDrive\바탕 화면\SJ_대시보드_V16.html` 의 다음 구간만 직접 확인.
  - `STORAGE_KEYS` 와 스키마 마이그레이션 (line 4609-5560).
  - `S` 객체 / `defEq` / `defBd` / `migrateEq` / `migrateBd` / `fmtKR` (line 4777-4986).
  - `saveAll` / `exportJSON` / `importJSON` / `generateHTML` / `_buildShareHTML` (line 6440-6620).
  - `ROLE_POLICY` / `setRole` / `handleMonthlyXlsbUpload` / `M0_DATA` (line 7895-8155).
- CLAUDE.md — 본 워크스페이스 전역 규칙 (10항목).
- 글로벌 규칙 — `~/.claude/CLAUDE.md` 와 그 안의 `rules/*.md` (date-calculation, golden-principles, verification, security 등).

---

## 6. 다음 행동 제안

1. 위 §4 의 7개 결정을 사용자에게 받는다.
2. 결정 결과를 바탕으로 `docs/spec.md` (도메인 모델 + API + DB 스키마) 작성. 이 문서까지가 코드 변경 없는 단계.
3. `docs/spec.md` 사용자 승인 후 코드 작성 착수 (vite scaffold + fastify scaffold + prisma init).
4. 첫 코드는 ETL 스크립트 (`scripts/migrate-from-v16.ts`) — 이게 동작하면 시드 데이터가 확보돼 이후 화면 작업이 빨라진다.
