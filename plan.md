# 전사 자산관리 플랫폼 — 1단계 구현 계획

> 작성일 2026-05-09. 기준 구현은 `SJ_대시보드_V16.html` (라이브 https://gerrardbak08.github.io/asset-dashboard/).
> 본 계획은 Supabase 와 Vercel 을 사용하지 않는 자체 호스팅 전제하의 1단계 설계서.
> 코드는 사용자가 승인한 뒤에만 추가한다.
>
> **2026-05-10 업데이트** — 1단계 거의 완료. 2단계 이후 전체 설계는 [docs/system-design-2026-05-10.md](docs/system-design-2026-05-10.md), 2단계 실행 체크리스트는 [docs/checklist-phase2.md](docs/checklist-phase2.md), 1단계 잔존(1.5단계) 정리는 system-design §1 참조.

---

## 1. 프로젝트 요약

### 1.1 무엇을 만드는가
- 현재 단일 HTML 대시보드(자산 현황·건물 상세·데이터 조정·사업장 검색·관리자 패널 5개 화면)를 **다중 사용자가 동시에 사용 가능한 서버 기반 플랫폼**으로 전환한다.
- 장기 목표는 `AIMS_아키텍처_전체설계.html` 의 Stage 3 (임대차·유지보수·비품 원장·자동 보고서가 결합된 통합 자산관리 플랫폼) 이지만, 1단계는 그 토대를 만드는 데 집중한다.

### 1.2 왜 만드는가
- 현재 시스템의 **5개 한계**(단일 사용자, 5MB localStorage, 이력 부재, 임대차/유지보수 데이터 부재, 보고서 자동화 불가) 중 1단계는 **단일 사용자·5MB·이력 부재** 세 가지를 우선 해소한다.
- 사진 base64 인라인 한계, 사업장 2,015건 코드 내장으로 인한 3.4MB 단일 HTML 비대화 문제도 같이 해결한다.

### 1.3 기준 데이터 (반드시 보존)
- 건물 15동 (속초·창원·구로·강릉·세종·포항·경기광주·원주·수원·성남·영주·남사·부산·동탄511·동탄526).
- 비품 41종 (POS·소화기·노트북 등).
- 사업장 2,015개 (조직명/사업장 검색).
- 자산 합계 ₩1,191,529,992,612 (26-03 기준), 전월 ₩1,187,005,713,251.
- 검증 기준값: 소화기 재고 합계 ₩765,902,874 — 마이그레이션 후에도 일치해야 한다.

---

## 2. Supabase / Vercel 제외에 따른 아키텍처 판단

기존 두 설계 문서(`자산관리 대시보드 아키텍처.html` Phase A~E, `AIMS_아키텍처_전체설계.html` Stage 0~3)는 모두 **Supabase + Vercel** 을 전제로 한다. 이번 프로젝트에서는 두 서비스를 사용하지 않으므로 다음과 같이 자체 구현 대안으로 치환한다.

| 원래 의존 | 원래 역할 | 자체 구현 대안 (1단계) | 자체 구현 대안 (2단계 이후) |
|---|---|---|---|
| Supabase Auth | 이메일/소셜 로그인, JWT 발급 | 백엔드 자체 세션 또는 JWT (`/api/auth/*`) | OIDC (Keycloak / Authelia) 또는 사내 SSO 연동 |
| Row Level Security | DB 레벨 권한 | **백엔드 미들웨어 + 역할 기반 가드 (admin/editor/viewer/auditor)** | DB 정책은 그대로 두고 추가로 PostgreSQL `policy` 도입 검토 |
| Supabase Realtime | postgres_changes 구독 | **1차 제외**, 클라이언트 폴링 또는 수동 새로고침 | WebSocket / SSE 게이트웨이 자체 구축 |
| Supabase Storage | S3 호환 객체 저장 + 공개 URL | **로컬 `uploads/` 폴더 + 정적 라우트** | MinIO 또는 S3/R2 호환 스토리지로 전환 (저장소 어댑터 추상화 유지) |
| Supabase Edge Function | 월말 스냅샷 cron, PDF 생성 | **백엔드 cron 작업 + 동기 PDF 라우트** | 별도 워커 프로세스 + 큐 (BullMQ 등) |
| Vercel 배포 | Next.js SSR 서버리스 | **사내 서버 또는 Docker 단일 호스트 (Nginx + Node)** | 동일 (필요 시 GitHub Actions CI/CD 추가) |

### 핵심 판단
- **1단계는 Supabase 드롭인이 아니라, 서버·API·DB 기반의 최소 플랫폼화**다. 함수 4개만 교체하는 Stage 1 모델은 그대로 적용할 수 없으며, "자체 백엔드를 새로 세우되 화면 코드는 V16 의 도메인 로직을 최대한 재활용한다" 가 올바른 방향이다.
- 단, **빅뱅 재작성은 피한다.** V16 의 `defBd / defEq / fmtKR / migrateEq / migrateBd / handleMonthlyXlsbUpload / applyM0Data` 같은 도메인 함수와 `S` 전역 객체 모양은 그대로 보존해 `lib/domain/*` 으로 이식한다. 차트·드로어·MoM 계산 로직은 React 컴포넌트로 1:1 변환만 한다.

---

## 3. 자체 구현 옵션 비교

| # | 옵션 | 화면 재사용 | 백엔드 필요성 | 운영 난이도 | 1단계 적합도 |
|---|---|---|---|---|---|
| A | 단일 HTML 유지 + 보조 동기화 서버 | 100% | 사진/JSON 동기화만 | 낮음 | 임시방편. 다중 사용자·이력 문제 해결 못함 |
| B | Vite + React + SQLite (백엔드 없이 로컬 better-sqlite3) | 80% | 없음 (Tauri/Electron 시) | 낮음 | 다중 사용자 협업 불가. 데스크톱 앱 시나리오 한정 |
| C | **Vite + React + Node(Fastify) 또는 Python(FastAPI) + SQLite→PostgreSQL** | 80% | 필수 | 중 | **권장**. 단계적 확장 가능, 사내 호스팅 용이 |
| D | Next.js 자체 호스팅 (App Router + 서버 액션) | 60% | 통합형 | 중상 | Stage 3 후보. 1단계엔 과함 |

### 옵션 C 가 1단계 권장인 이유
- AIMS Stage 3 의 **Zustand·TanStack Table·Recharts·shadcn/ui** 라이브러리 선택을 그대로 가져갈 수 있어 **2단계 (임대차·유지보수·비품 원장) 도입 시 화면 코드 재작성이 거의 없다.**
- 백엔드를 분리하면 사진·xlsb·PDF 같은 무거운 처리를 클라이언트에서 떼어낼 수 있고, 추후 워커/큐 도입도 쉽다.
- SQLite 로 시작하면 1단계 검증·시드 데이터 작업이 수 초 단위로 빨라진다. 운영 전환 시 PostgreSQL 로 마이그레이션은 스키마가 거의 동일해 비용이 작다.

---

## 4. 추천 기술 스택 (1단계)

### 4.1 프론트엔드
- **Vite 5 + React 18 + TypeScript 5** (라이브러리 선택은 AIMS 문서와 일치).
- 차트는 V16 동일하게 **Chart.js** 로 시작 (화면 코드 재사용 우선) → 2단계에 Recharts 점진 전환 검토.
- 폰트 Pretendard Variable 그대로.
- 상태 관리는 React Query + Zustand. `S` 객체는 `useDashboardStore` (Zustand) 로 이식.
- 표 편집은 1단계엔 V16 의 inline `<input>` 패턴 그대로, 2단계에 TanStack Table 도입.

### 4.2 백엔드 (사용자 결정 필요 — 1순위 후보)
| 후보 | 장점 | 단점 |
|---|---|---|
| **Node.js + Fastify + Prisma** | xlsb 파싱 라이브러리 SheetJS 가 V16 과 동일하게 사용 가능. 프론트엔드와 동일 언어. | 메모리 사용이 Python 대비 약간 높음. |
| Python + FastAPI + SQLAlchemy | 데이터 분석 도구·KIS API·pandas 와 친화적. 회사에서 데이터팀이 Python 을 쓰는 경우 유리. | xlsb 파싱은 `pyxlsb` + `pandas` 조합 필요. 프론트와 언어 분리. |

→ **Node.js + Fastify 우선 권장.** 이유는 V16 의 xlsb 파싱 시트별 행/열 매핑(`A[4][1] = 총자산` 등)을 SheetJS 로 이미 구현했기 때문에 그대로 서버로 옮길 수 있다.

### 4.3 DB
- 1단계 개발용은 **SQLite (better-sqlite3)** — 단일 파일, 시드/리셋 5초.
- 운영 전환 시 **PostgreSQL 15+** — Prisma 의 `provider` 만 바꾸면 스키마 그대로 사용 가능 (정수형/날짜형만 검증).
- 자산 합계가 `BIGINT` 범위(약 1.19조원) 이므로 모든 금액 컬럼은 `BIGINT`.

### 4.4 파일 저장소
- 1단계 **로컬 디스크 `uploads/buildings/{id}.jpg` 등** + 백엔드 정적 라우트 `/files/*`.
- `lib/storage/StorageAdapter` 인터페이스(`save`, `read`, `url`, `delete`)로 추상화해 2단계에 MinIO / S3 / R2 어댑터로 교체 가능하게 만든다.
- 사진은 V16 처럼 서버에서 800x600 / 150KB 로 압축한다 (sharp 라이브러리).

### 4.5 인증·권한
- 1단계 **자체 ID/PW + 백엔드 세션 (httpOnly cookie) 또는 단기 JWT**.
- 4역할 (`admin / editor / viewer / auditor`) — V16 의 `exec/ops/store/admin` 정책을 그대로 매핑.
- 모든 쓰기 라우트는 `requireRole('editor' | 'admin')` 미들웨어로 보호한다.
- 2단계 OIDC / SSO 연동은 인증 모듈을 인터페이스화해 둠.

### 4.6 자동화 / 스케줄러
- 1단계 **백엔드 프로세스 안의 node-cron** 으로 월말 스냅샷 적재 (V16 의 `applyM0Data` 결과를 `monthly_snapshots` 테이블에 INSERT).
- PDF 생성은 1단계엔 V16 처럼 **클라이언트 `window.print()`** 로 시작.
- 2단계에 별도 워커 프로세스 + Puppeteer 또는 Playwright 로 서버 사이드 PDF 전환.

### 4.7 배포
- 1단계 사내 서버 또는 1대 VPS 에 **Docker Compose** 1식 (frontend dist 정적 + backend node + sqlite volume).
- HTTPS 는 Caddy 또는 Nginx + certbot. 도메인은 사용자가 결정.

---

## 5. 1단계 구현 범위

### 5.1 화면 (V16 과 1:1)
1. **자산 현황 — 개요 / 자산 상세현황 / 자산 드릴다운 / 비품 운영 / 비품 흐름 / 취득 연혁 / 임대 현황** (서브탭 7종).
2. **건물 상세 — 카드 그리드 + 드로어 5탭 (기본정보·임대현황·관리이력·메모·지도)**.
3. **데이터 조정 — 양식 다운로드(CSV) + 업로드 5종 (자산/원장_자산/원장_비품/비품운영/건물현황)**.
4. **사업장 관리자 뷰 — 사업장 검색 + KPI 4종 + 비품 카테고리 TOP 10 + 자산 유형별 도넛**.
5. **관리자 패널 — 로그인 모달 + 5종 데이터 카드 + 업로드 버튼**.
6. **PDF 보고서 모달** — 역할별 인쇄 미리보기.

### 5.2 백엔드 API (초안)
- `GET /api/buildings` / `POST /api/buildings/:id` / `POST /api/buildings/:id/photo`
- `GET /api/equipments` / `POST /api/equipments/:id`
- `GET /api/stores` (검색 + 페이지네이션, 2,015건 대응)
- `GET /api/monthly` / `POST /api/monthly`
- `POST /api/upload/asset` / `ledger_asset` / `ledger_eq` / `eq_ops` / `buildings` (xlsb / xlsx / csv 지원)
- `GET /api/mom?month=2026-03` (MoM 계산을 서버에서 수행)
- `GET /api/snapshots` (월별 시계열)
- `POST /api/auth/login` / `GET /api/auth/me` / `POST /api/auth/logout`

### 5.3 DB 스키마 (초안 — 1단계 6개 테이블)
- `users (id, email, password_hash, role, created_at)`
- `buildings (id, legacy_id, name, address, use, area_sqm, area_pyeong, floors, approval_date, acquisition_date, acquisition_price, rental_area, rental_rate, vacancy, tenant, lat, lng, photo_url, updated_by, updated_at)`
- `equipment_items (id, legacy_id, name, created_at, is_active)`
- `equipment_snapshots (id, equipment_id, period, location_type, purchase_amount, transfer_amount, disposal_amount, inventory_amount)` — 1단계는 V16 과 동일한 월별 스냅샷 구조 유지 (원장 전환은 2단계).
- `stores (id, name, site_type, asset_value, asset_count, supply_value, asset_by_type_json, supply_by_category_json, supply_by_category_count_json, period)`
- `monthly_snapshots (id, period, total_asset, tangible, intangible, equipment, hq, store, logistics, kpi_json, raw_json)`

### 5.4 마이그레이션
- V16 의 `exportJSON()` 출력 (`dashboard_YYYY-MM-DD.json`) 을 받아 1회성 ETL 스크립트로 `buildings / equipment_snapshots / stores / monthly_snapshots / users(seed)` 에 적재한다.
- `EMBEDDED_BUILDING_PHOTOS` (15장 base64) 와 `EMBEDDED_BUILDING_DETAILS` (4장 디테일) 는 ETL 스크립트가 디코딩 후 `uploads/buildings/{legacy_id}.png` 로 저장하고 `buildings.photo_url` 만 DB 에 적는다.

### 5.5 검증
- 26-03 기준 자산 합계 ₩1,191,529,992,612 일치.
- 26-02 → 26-03 MoM 비율 V16 과 동일 (예: tangible 0.351% 등).
- 소화기 재고 합계 ₩765,902,874 일치.
- 사업장 검색 — "구로" / "남사" / "스타벅스" 등 검색 결과 V16 과 동일.

---

## 6. 1단계 제외 범위

다음 항목은 **1단계에서 절대 손대지 않는다**. 2단계 이후로 미룬다.

- 임대차 계약 Gantt / 만료 경보 (`lease_contracts` 테이블).
- 유지보수 칸반 / 원가 분석 (`maintenance_logs` 테이블).
- 비품 원장 거래 단위 전환 (`equipment_ledger`) — 1단계는 월별 스냅샷 그대로.
- 감가상각 자동 계산 (`depreciation_schedules`).
- 자동 PDF 생성 / SMTP 이메일 발송.
- 실시간 다중 편집자 동기화 (Realtime 대체 WebSocket/SSE).
- 감사 로그 (`audit_logs`) — 1단계는 `updated_by / updated_at` 컬럼만.
- 다국어 / 다크모드 / 모바일 전용 UI 재작성.
- Kakao Maps SDK 의 자체 키 발급 (V16 의 `KAKAO_JS_KEY` 기본값 그대로 사용 — 사용자 결정).

---

## 7. 성공 기준

1. **재현성** — V16 의 5개 화면이 새 플랫폼에서 모두 동작한다.
2. **데이터 동등성** — 4.7 의 4가지 검증값이 V16 과 일치한다.
3. **다중 사용자** — 두 명이 동시에 로그인해 한쪽이 데이터를 수정하면 다른 쪽이 새로고침으로 변경된 값을 본다.
4. **권한** — `viewer` 역할은 PUT/POST 요청 시 401/403 을 받는다.
5. **사진 영속성** — 업로드한 사진이 브라우저를 바꿔도 보인다.
6. **xlsb 업로드** — 기존 xlsb 두 개(`대시보드 데이터_26년2월마감.xlsb`, `26년3월마감.xlsb`) 를 업로드해 V16 과 동일한 MoM 결과를 만든다.
7. **빌드/타입 검증** — `npm run build` 와 `npm run typecheck` 가 0 오류로 통과한다.
8. **API 통합 테스트** — `vitest` 또는 `pytest` 로 핵심 라우트 5개 이상 테스트 통과.

---

## 8. 1단계 확정 결정 9건 (2026-05-09)

| # | 항목 | 확정 결정 | 비고 |
|---|---|---|---|
| 1 | 백엔드 언어 | **Node.js 20+ + Fastify 4 + Prisma 5** | V16 SheetJS 재사용. TS 모노레포로 타입 공유 |
| 2 | 호스팅 환경 (1단계) | **Railway** — GitHub push 자동 배포, SQLite 볼륨, 무료 도메인+HTTPS | 사내 서버 의사결정 후 Docker 이미지 그대로 이전 |
| 3 | 도메인 / HTTPS | **1단계 — Railway 서브도메인 자동**. 운영 — 회사 도메인 + Caddy/Nginx | — |
| 4 | DB 시작점 | **SQLite (1단계) → PostgreSQL 15+ (운영 전환 시)** | Prisma `provider` 만 변경 |
| 5 | 인증 방식 | **자체 ID/PW + bcrypt + httpOnly 세션 + 4역할** (admin/editor/viewer/auditor) | OIDC 어댑터 인터페이스 미리 작성 |
| 6 | 저장소 시작점 | **로컬 디스크 (Railway 볼륨) + StorageAdapter 추상화** | 2단계 MinIO/S3 어댑터 교체 |
| 7 | Kakao Maps 키 | REST + JavaScript API 키 보유. **환경변수 (`KAKAO_JS_KEY` / `KAKAO_REST_KEY`) 로 주입** | 키 값 — REST `515812b0dc02478bdc15561b67712fe9`, JS `790bcd3cb7e52eab060568aa47a1fe8e`. 운영 진입 전 `.env` 분리 + 평문 마스킹 권장 |
| 8 | 디자인 시스템 | **DESIGN.md (Work Platform 기준서) 토큰·컴포넌트·레이아웃 전면 적용** | §10 참조 |
| 9 | UI/UX | **V16 1:1 이식 폐기, DESIGN.md 기준 전면 개편** | 폐기 — 다이소 다크네이비 / topbar+탭 / 라이트모드 / Chart.js / 모바일 우선. 보존 — 데이터 모델 / 도메인 함수 / xlsb 시트 매핑 / MoM 산정 / 사업장 2,015건 |
| + | 공유 HTML 기능 | **1차적으로 화면 보기 형태로 유지** (인쇄 미리보기 `window.print()`). V16 `generateHTML` 다운로드 폐기 | 사용자 직접 결정 |

---

## 9. 다음 단계

1. 위 7개 결정 항목 확정.
2. `checklist.md` 항목별 착수.
3. 도메인 모델·API 명세·DB 스키마 초안 (`docs/spec.md`) 작성 후 사용자 리뷰.
4. 사용자 승인 후 코드 작성 시작 (vite scaffold + fastify scaffold + prisma init).

---

## 10. UI/UX 전면 개편 — DESIGN.md 적용 범위

V16 의 UI/UX 는 그대로 옮기지 않는다. 같은 디렉토리의 `DESIGN.md` (Work Platform 안전보건 플랫폼 디자인 기준서 v2.0) 가 양 플랫폼의 단일 진실원이며, 자산관리 플랫폼도 이를 따른다.

### 10.1 적용 원칙
- **데이터·도메인·API 는 V16 보존** — `defBd / defEq / migrateEq / migrateBd / fmtKR / fmtKRfull / handleMonthlyXlsbUpload / applyM0Data / generateM0StoresFromLedger` 함수 시그니처와 결과 형태는 1:1 그대로.
- **화면 외형·레이아웃·인터랙션 은 DESIGN.md 로 전면 재설계** — V16 의 다이소 다크네이비 / topbar+탭 / 라이트모드 / Chart.js / 모바일 우선 디테일은 폐기.
- 스택은 v1 (`§4`) 의 Vite + React + TS + 분리 백엔드 베이스 위에 DESIGN.md 가 강제하는 라이브러리들을 도입한다 — Tailwind CSS + Radix UI + lucide-react + motion/react + Recharts. Next.js 강제는 보류 (사용자가 옵션 D 를 명시 선택할 때 전환).

### 10.2 DESIGN.md 차용 항목 (강제)
- **시맨틱 토큰 13종** (`bg-card / text-foreground / border-border / muted-foreground / muted / sidebar* / primary / danger / warning / info / success` + 4색 변형 4종 `*-DEFAULT / *-foreground / *-subtle / *-border`) — `src/styles/globals.css` 의 CSS 변수로 등록. 인라인 hex 금지.
- **타이포 스케일** — `text-display-lg / md`, `text-heading-lg / md / sm`, `text-body / body-strong`, `text-sm`, `text-caption`, `text-micro` 9단계. KPI 숫자는 `font-kpi-huge / display / metric / inline` 4단계 + DM Mono + tabular-nums.
- **8px 그리드 spacing** — `p-3 / 4 / 5`, `gap-3 / 4 / 5`, `space-y-3 / 5` 만 허용.
- **PageShell 패턴** — 모든 라우트 최외곽 `<div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-background">`. Fragment 페이지 루트 금지.
- **Header `h-14` + Sidebar (다크 chrome)** — V16 의 topbar+sticky tabs 폐기.
- **카드 `rounded-2xl border border-border bg-card`** — 14px 가 아니라 16px. 카드 내부는 `rounded-xl`.
- **버튼** — Primary `bg-primary text-primary-foreground rounded-xl`. `text-white` 하드코딩 금지.
- **상태 표현** — 색 + 아이콘 (lucide-react 2D) + 텍스트 3중 필수. 색만으로 정보 전달 금지.
- **빈 상태** — 아이콘 + 감정적 메시지. "데이터가 없습니다" 단일 텍스트 금지. V16 의 `bld-img-ph` 컴포넌트는 자산관리 도메인 변형으로 재작성.
- **Status Line** — `relative pl-4` + `absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-{color}` 패턴. `border-l-*` 금지.
- **다크모드 기본** — `<html class="dark">`. 라이트는 추후. 인쇄 (`@media print`) 만 라이트로 강제 분기.
- **모션** — 200ms 이하 + 구체 속성 (`transition-colors / transition-transform`). `transition-all / bounce / spring` 금지.
- **그림자 3단계** — `shadow-elev-1 / 2 / 3` 만. 4단계 이상 금지.
- **데스크톱 퍼스트** — V16 의 모바일 우선은 폐기. < md 1열 + 하단 MobileNav 만 보존.
- **DESIGN.md §16 에이전트 체크리스트 11개 항목** — 화면 작성 전 매번 점검.

### 10.3 차트 라이브러리
- **Recharts** 1단계부터 도입. V16 의 Chart.js 옵션 (Hero 도넛 / 자산구성 / 매장 카테고리 TOP10 / 임대 현황 / 취득 연혁 / MoM bar) 을 Recharts 의 `PieChart / BarChart / AreaChart / RadialBarChart` 로 1:1 변환.
- 색상은 DESIGN.md 시맨틱 토큰만 사용 — `--ink #1E3A5F` 같은 V16 의 brand 색은 직주입하지 않는다.

### 10.4 자산관리 도메인 → DESIGN.md 위험도 4색 매핑
DESIGN.md 의 안전보건 위험도 매핑을 자산관리 도메인 의미로 재정의.

| 의미 | 토큰 | 자산관리 적용 |
|---|---|---|
| 위험 | `danger` (red) | 임대 만료 7일 이내 / 임대율 0% / 사진 미등록 / 빌드값-마감값 불일치 |
| 주의 | `warning` (orange) | 임대 만료 30일 이내 / 임대율 50% 미만 / xlsb 업로드 미반영 |
| 진행중 | `info` (blue) | xlsb 분석 중 / AI 추천 (2단계) / 신규 자산 등록 진행 |
| 안정 | `success` (green) | 임대율 100% / 모든 사진 등록 완료 / MoM 변동 ±1% 이내 |

### 10.5 IA 재구성 (V16 7서브탭 → DESIGN.md 사이드바 5메뉴)
- V16 의 자산현황 7서브탭 (개요·자산상세·드릴다운·비품운영·비품흐름·취득연혁·임대현황) 은 `/dashboard` 단일 페이지의 내부 Tabs (Radix Tabs) 로 흡수.
- 사이드바 5메뉴 — `자산현황 (/dashboard)` / `건물 (/buildings)` / `사업장 (/stores)` / `데이터 (/data)` / `관리자 (/admin)`.
- 건물 드로어 5탭 (기본·임대·관리이력·메모·지도) 는 Radix Dialog + Tabs 로 그대로 유지. 외형은 DESIGN.md 카드/색/타이포로 재설계.

### 10.6 1단계 화면 작업 우선 순서
1. `globals.css` + Tailwind 설정 + 폰트 (Pretendard + DM Mono) — 토큰 토대.
2. 공통 컴포넌트 (`Header / Sidebar / SectionHeader / Card / KpiCard / StatusBadge / StatusLine / EmptyState / Skeleton / AiBlock`).
3. 자산현황 페이지 (Hero KPI + 차트 5종 + 위험도 알림).
4. 건물 목록 + 드로어.
5. 사업장 검색 페이지.
6. 데이터 조정 + 관리자 패널 + 로그인.
7. PDF 인쇄 CSS (다크 → 라이트 분기).

### 10.7 DESIGN.md 컴플라이언스 검증
- ESLint / Stylelint 룰로 자동화 — `text-white`, `bg-white`, `text-[\d+px]`, `bg-[#...]`, `text-[#...]`, `transition-all`, `font-bold` (h2) 금지.
- DESIGN.md §16 에이전트 체크리스트 11개를 매 PR 시 수동 검사.
- Lighthouse 접근성 90점 이상.
