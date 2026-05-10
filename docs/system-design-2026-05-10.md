# AIMS 자산관리 플랫폼 — 전체 시스템 설계 (2단계 이후)

> 작성일 2026-05-10. 1단계 구현이 거의 완료된 시점에서, 2~5단계 전체 로드맵과 각 단계별 상세 설계 + cross-cutting concerns를 한 문서로 통합한다.
> 1단계 계획서는 [plan.md](../plan.md), 1단계 체크리스트는 [checklist.md](../checklist.md), 1단계 결정 배경은 [context-notes.md](../context-notes.md), 디자인 토큰은 [DESIGN.md](../DESIGN.md), API/스키마 명세는 [docs/spec.md](spec.md)를 참조.
> 본 문서는 사용자 승인 후 **2단계 구현 착수 가이드**가 된다.

---

## 0. Executive Summary

### 0.1 현재 위치
- **1단계 (Foundation)** — 완료. 5개 페이지(Dashboard / Buildings / Stores / Data / Admin) + 4역할 RBAC + V16 데이터 패리티 + 사진/메모/xlsb 업로드 모두 검증 통과.
- 잔존: ESLint flat config / 코드 스플리팅 / Reduced Motion / DB 경로 정합 / Kakao Maps 키 / 첫 admin 비밀번호 변경 / 배포 결정.

### 0.2 단계별 한눈
| 단계 | 핵심 가치 | 신규 테이블 | 신규 페이지/탭 | 의존 | 우선도 |
|---|---|---|---|---|---|
| 1.5 (마무리) | 운영 진입 가능 상태 | — | — | — | **즉시** |
| **2단계** | 임대 만료 알림 / 유지보수 가시화 / 비품 거래 단위 / 감가상각 자동화 | `lease_contracts`, `maintenance_logs`, `equipment_ledger`, `depreciation_schedules` | 건물 드로어 임대탭 강화 + 유지보수 칸반 + 비품 드릴다운 거래 뷰 + 감가상각 표 | 1단계 완료 | **높음** |
| 3단계 | 보고서 자동화 / 감사 컴플라이언스 / 비동기 작업 | `audit_logs`, `report_jobs`, `notifications` | 감사 로그 페이지 + 보고서 스케줄러 + 알림 센터 | 2단계 데이터 모델 | 중상 |
| 4단계 | 실시간 협업 / 멀티 환경 / 보안 강화 | (RLS 정책) | (실시간 표시기) | 3단계 안정화 | 중 |
| 5단계 | 이상 감지 / BI 임베드 / 자동 조치 | `anomaly_detections`, `auto_actions` | 분석 대시보드 | 운영 6개월+ 데이터 누적 | 낮음 |

### 0.3 본 문서 사용법
- §1 — 1단계 잔존 정리 (운영 진입 직전)
- §2~5 — 단계별 상세 설계 (데이터 모델 + API + UI + 검증)
- §6 — Cross-cutting (보안 / 성능 / 접근성 / DR / 관측)
- §7 — 마이그레이션 / 의존성 / 일정 단위

---

## 1. 1단계 마무리 (1.5단계)

운영 진입 전 반드시 처리할 항목. 코드 변경 작거나 인프라 결정 사안.

### 1.1 운영 잔존 4건 (사용자 결정 필요)
| # | 항목 | 행동 | 위험 |
|---|---|---|---|
| A | Kakao Maps REST + JS 키 발급 | 사내 도메인 등록한 키로 교체 (`apps/api/.env`의 `KAKAO_*_KEY`) | 현재 키는 데모. 도메인 미등록 시 지도 안 보임 |
| B | admin 첫 비밀번호 변경 | 화면 → 시스템 관리 → 비밀번호 변경. dev 기본 `admin1234!` 폐기 | 운영 진입 시 사고 직결 |
| C | GitHub push + 배포 환경 결정 | Railway / 사내 VPS / Docker compose 중 택 | 백업/복구 정책에 영향 |
| D | `.env` 비밀값 보관소 | 1Password / Vault / .env.production 분리 | 코드 저장소에 노출 절대 금지 |

### 1.2 인프라 정리 (즉시 가능)
| # | 항목 | 변경 위치 | 효과 |
|---|---|---|---|
| 1 | ESLint v9 flat config | `apps/api/eslint.config.js` (이미 추가), `apps/web/eslint.config.js` (이미 존재 — 검증 필요) | lint 게이트 복원, V16 안티패턴 (text-white, hex 인라인) 자동 차단 |
| 2 | `MotionConfig reducedMotion="user"` | `apps/web/src/main.tsx` 1줄 | OS의 모션 감소 설정 존중 (접근성) |
| 3 | 라우트 단위 코드 스플리팅 | `apps/web/src/App.tsx` — `React.lazy(() => import('@/pages/...'))` | 초기 청크 928KB → ~300KB 추정. FCP 가속 |
| 4 | DB 경로 정합 | `apps/api/.env`의 `DATABASE_URL=file:./dev.db`로 변경 + `apps/api/prisma/prisma/dev.db` → `apps/api/prisma/dev.db` 이동 | prisma migrate가 잘못된 경로에 빈 DB 만드는 문제 종결 |
| 5 | DESIGN.md 컴플라이언스 ESLint 룰 | `eslint-plugin-tailwindcss` 또는 자체 룰: `text-white`, `bg-white`, `text-[#`, `bg-[#`, `transition-all` 금지 | checklist §K 자동화 |
| 6 | 차트 ResponsiveContainer 첫 측정 layout shift | 모든 차트 `<div className="h-[Npx]">` 부모에 `min-w-0` + 명시적 width 점검 | 흔들림 잔존 시 추가 디버깅 |
| 7 | 사진 ETL fallback (mac/Linux 경로) | `scripts/migrate-from-v16.ts`에 V16 HTML 없을 때 `DB/건물사진/` `DB/건물상세/` 폴더 직접 import 분기 추가 | mac/Linux 환경에서도 ETL 재현 가능 |

### 1.3 1단계 완료 정의 (Definition of Done)
- 위 1.1 + 1.2 모두 처리
- `pnpm -r typecheck && pnpm -r lint && pnpm -r build` 0 오류
- 운영 환경에서 admin 로그인 → 대시보드 → 건물 드로어 → 라이트박스 → 메모 저장 → 사진 업로드 전 흐름 1회 통과
- 백업 1회 수행 + 복원 검증 1회

---

## 2. 2단계 — 임대 + 유지보수 + 비품 원장 + 감가상각

> 핵심 가치: 1단계가 "월 마감 결과를 보여주는 대시보드"라면 2단계는 "**자산 라이프사이클 운영 도구**"로 진화.
>
> 2단계는 4개 도메인을 병렬로 추가하지만, 각각이 독립적으로 가치를 만들 수 있도록 출시 단위를 쪼갠다 (2.1 → 2.2 → 2.3 → 2.4). 사용자가 우선순위를 재배치할 수 있다.

### 2.1 임대 계약 관리 (lease_contracts)

#### 문제
1단계의 `Building.rental.{rate, vacancy, area, tenant}`는 **현재 시점 단일 스냅샷**이다. 다음을 답할 수 없다:
- "다음 6개월 안에 만료되는 계약은?"
- "재계약률은? 평균 임대 기간은?"
- "이 건물의 임차인 변경 이력은?"

#### 데이터 모델
```prisma
model LeaseContract {
  id             String        @id @default(uuid())
  buildingId     String
  building       Building      @relation(fields: [buildingId], references: [id])
  tenantName     String        // 임차인 (법인명)
  tenantContact  String?       // 담당자 연락처
  contractStart  DateTime      // 계약 시작
  contractEnd    DateTime      // 계약 종료
  rentArea       Float         // 임대 면적 (㎡)
  monthlyRent    BigInt        // 월 임대료 (원)
  deposit        BigInt        // 보증금
  renewalOption  Boolean       @default(false)  // 갱신 옵션 보유
  renewedFromId  String?       // 갱신 전 계약 (chain)
  status         LeaseStatus   @default(active) // active / expired / terminated / pending
  notes          String?       @db.Text
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  updatedBy      String?

  @@index([buildingId, status])
  @@index([contractEnd])  // 만료 알림 쿼리
}

enum LeaseStatus { active expired terminated pending }
```

#### API
| Method | Path | Body / Query | Returns | Role |
|---|---|---|---|---|
| GET | `/api/leases?buildingId=&status=&endingBefore=` | filter | `LeaseContract[]` | viewer+ |
| GET | `/api/leases/:id` | — | `LeaseContract` + chain | viewer+ |
| POST | `/api/leases` | `LeaseContract` (zod) | created | editor+ |
| PUT | `/api/leases/:id` | partial | updated | editor+ |
| POST | `/api/leases/:id/renew` | new contract body | new active + old expired | editor+ |
| POST | `/api/leases/:id/terminate` | `{ reason }` | status=terminated | editor+ |
| GET | `/api/leases/expiring?withinDays=30` | — | `{ critical: [], warning: [] }` 7일/30일 분류 | viewer+ |

#### UI
- **건물 드로어 → 임대현황 탭** 강화: 현재 활성 계약 + 과거 계약 chain 타임라인 + "갱신" / "해지" 버튼.
- **Buildings 페이지에 "만료 임박" 필터 칩** 추가 (≤7일 / ≤30일).
- **신규 페이지 `/leases`** — Gantt 형식의 전체 임대 타임라인:
  - X축 = 월 (-12 ~ +24개월), Y축 = 건물
  - 막대 = 계약 기간, 색 = 만료 임박도 (danger ≤7d / warning ≤30d / success >30d)
  - 막대 클릭 → 건물 드로어 + 임대 탭 자동 활성
- **알림 배지**: 사이드바 "건물" 메뉴에 만료 임박 N개 빨간 닷.

#### 자동화
- 매일 0시(KST) cron: `LeaseContract.contractEnd < NOW + 7d` 인 active 계약 → `notifications` 테이블에 INSERT (알림 도메인은 §3.3).
- 만료 30일 전 한 번, 7일 전 한 번, 만료일 당일 한 번 발송.

#### 검증
- V16에 임대 계약 이력이 없으므로 마이그레이션은 **현재 `Building.rental`을 active LeaseContract 1건으로 변환** + tenantName / contractEnd는 사용자 입력 단계 필요 (수동 보정 단계).

#### 출시 단위 (2.1)
1. 모델 + API + 단위 테스트 → PR
2. 건물 드로어 임대 탭 강화 → PR
3. `/leases` Gantt 페이지 → PR
4. cron 만료 알림 → PR (3단계 알림 도메인과 동시 출시 가능)

---

### 2.2 유지보수 로그 (maintenance_logs)

#### 문제
- "이 건물의 작년 시설 점검 비용 누적은?"
- "현재 진행 중인 작업은?"
- "유지보수 cost가 가장 큰 건물 TOP 5는?"

#### 데이터 모델
```prisma
model MaintenanceLog {
  id          String              @id @default(uuid())
  buildingId  String
  building    Building            @relation(fields: [buildingId], references: [id])
  category    MaintenanceCategory // 정기점검 / 긴급수리 / 시설개선 / 정밀안전진단
  title       String
  description String?             @db.Text
  status      MaintenanceStatus   @default(open) // open / in_progress / closed / cancelled
  priority    MaintenancePriority @default(normal) // low / normal / high / critical
  assigneeId  String?             // User
  vendorName  String?             // 외주업체명
  startedAt   DateTime?
  closedAt    DateTime?
  cost        BigInt?             // 발생 원가 (원)
  attachmentUrls String[]         // 사진/견적서/완료보고서 (1단계 StorageAdapter 재사용)
  createdAt   DateTime            @default(now())
  createdBy   String              // User.id
  updatedAt   DateTime            @updatedAt
  updatedBy   String?

  @@index([buildingId, status, startedAt])
  @@index([category])
}

enum MaintenanceCategory  { regular_inspection emergency_repair facility_upgrade safety_diagnosis }
enum MaintenanceStatus    { open in_progress closed cancelled }
enum MaintenancePriority  { low normal high critical }
```

#### API
| Method | Path | Body / Query | Returns | Role |
|---|---|---|---|---|
| GET | `/api/maintenance?buildingId=&status=&from=&to=` | filter | `MaintenanceLog[]` | viewer+ |
| GET | `/api/maintenance/:id` | — | log + attachments | viewer+ |
| POST | `/api/maintenance` | log fields | created | editor+ |
| PUT | `/api/maintenance/:id` | partial (status 전환은 별 enum 검증) | updated | editor+ |
| POST | `/api/maintenance/:id/attachments` | multipart | attachment urls | editor+ |
| GET | `/api/maintenance/cost-summary?period=2026-Q2` | — | `{ byBuilding: [], byCategory: [], total: BigInt }` | viewer+ |

#### UI
- **신규 페이지 `/maintenance`** — Kanban 4컬럼 (open / in_progress / closed / cancelled):
  - 카드 = `MaintenanceLog`. 우상단에 priority 배지, 좌상단에 카테고리 색.
  - 드래그앤드롭으로 status 전환 (`@dnd-kit/core` 또는 가벼운 `react-beautiful-dnd` 후보 — 라이선스 확인).
- **건물 드로어 → 관리이력 탭** (이미 placeholder 존재): 해당 건물의 `MaintenanceLog` 목록 + 신규 등록 버튼.
- **대시보드 → 운영 KPI 추가**: 이번 달 진행 중 작업 수 / 누적 cost / 긴급 priority 건수.
- **cost 분석 차트**: `/maintenance/analytics` — 12개월 rolling stacked bar (건물별 / 카테고리별).

#### 출시 단위 (2.2)
1. 모델 + API + 통합 테스트 → PR
2. `/maintenance` Kanban → PR
3. 건물 드로어 관리이력 탭 강화 → PR
4. cost 분석 차트 → PR

---

### 2.3 비품 원장 거래 단위 (equipment_ledger)

#### 문제
1단계의 `EquipmentSnapshot`은 **월말 잔액만**. 다음을 답할 수 없다:
- "이 노트북이 5월 12일에 본사 → 매장으로 이동한 기록은?"
- "한 달 동안 발생한 폐기 건수와 사유는?"
- "특정 자산번호의 전체 라이프 트랜잭션은?"

#### 데이터 모델
```prisma
model EquipmentLedger {
  id              String           @id @default(uuid())
  equipmentItemId String
  equipmentItem   EquipmentItem    @relation(fields: [equipmentItemId], references: [id])
  legacyAssetNo   String?          // V16 자산번호 (예 'A-2024-0123')
  txType          LedgerTxType     // purchase / transfer / disposal / adjustment
  txDate          DateTime         // 발생일
  fromLocation    LocationType?    // hq / store / logistics (transfer 시 출발지)
  toLocation      LocationType?    // (transfer/purchase 시 도착지)
  storeId         String?          // 매장 단위 추적
  amount          BigInt           // 거래 금액 (구매가 / 폐기 잔존가)
  quantity        Int              @default(1)
  reason          String?          // 폐기 사유 등
  documentUrl     String?          // 영수증/증빙
  period          String           // YYYY-MM (월 마감 집계용)
  createdAt       DateTime         @default(now())
  createdBy       String

  @@index([equipmentItemId, txDate])
  @@index([period, txType])  // 월별 집계 가속
  @@index([storeId, period])
}

enum LedgerTxType  { purchase transfer disposal adjustment }
enum LocationType  { hq store logistics }
```

`EquipmentSnapshot`는 **유지하되 read-only**로 전환. 매월 마감 시 `EquipmentLedger` → `EquipmentSnapshot` 집계 로직(`recomputeSnapshot(period)`)을 추가하고 1단계의 직접 INSERT는 deprecated.

#### API
| Method | Path | Body / Query | Returns | Role |
|---|---|---|---|---|
| GET | `/api/equipments/:id/ledger?from=&to=` | filter | `EquipmentLedger[]` | viewer+ |
| POST | `/api/equipments/:id/ledger` | tx body | created + snapshot recomputed | editor+ |
| GET | `/api/ledger?period=2026-03&txType=disposal` | filter | `EquipmentLedger[]` | viewer+ |
| POST | `/api/ledger/recompute-snapshot` | `{ period }` | `{ rowsUpdated }` | admin |

#### UI
- **자산 드릴다운 → 비품 행 클릭** 시 우측 패널에 거래 타임라인 (`EquipmentLedger`) + 출처 매장.
- **신규 화면 `/ledger`** — DataTable (TanStack Table v8):
  - 필터: 기간 / 거래 유형 / 위치 / 매장 / 비품
  - 정렬·페이지네이션·컬럼 가시성 토글
  - Excel 내보내기 (`xlsx` 라이브러리 client-side)
- **데이터 업로드 → 비품 운영 CSV** 업로드 시 자동으로 `EquipmentLedger` row 생성 + 월말 snapshot 자동 재계산.

#### 마이그레이션
- 1단계 `EquipmentSnapshot`은 **시작 잔액 + 월별 합계**만 보유 → 2단계 시작 시점에 "초기 잔액" `EquipmentLedger`(txType=adjustment, period=마이그 시점)을 insert해서 무결성 유지.
- ETL 스크립트 `scripts/snapshot-to-ledger.ts` 작성.

#### 출시 단위 (2.3)
1. 모델 + recomputeSnapshot 함수 + 통합 테스트 → PR
2. ETL: snapshot → 초기 ledger → PR
3. `/ledger` DataTable → PR
4. 비품 드릴다운 거래 타임라인 → PR
5. CSV 업로드 ledger 생성 분기 → PR

---

### 2.4 감가상각 자동화 (depreciation_schedules)

#### 문제
- 자산별 잔존가, 감가상각비를 수기로 계산하는 부담 제거
- 회계와의 정합 (월별/연간 감가상각비 자동 산출)

#### 데이터 모델
```prisma
model DepreciationSchedule {
  id               String           @id @default(uuid())
  assetType        DepAssetType     // building / equipment
  buildingId       String?
  equipmentItemId  String?
  acquisitionDate  DateTime
  acquisitionPrice BigInt
  usefulLifeYears  Int              // 건물 30 / 비품 5 / 기계 10 등 카테고리별 기본값 + 수동 override
  method           DepMethod        @default(straight_line) // straight_line / declining_balance
  salvageRate      Float            @default(0)             // 잔존가율 (0~1)
  startedAt        DateTime         @default(now())
  notes            String?

  schedules        DepEntry[]       // 월별 감가비 행

  @@index([assetType, buildingId])
  @@index([assetType, equipmentItemId])
}

model DepEntry {
  id          String                 @id @default(uuid())
  scheduleId  String
  schedule    DepreciationSchedule   @relation(fields: [scheduleId], references: [id])
  period      String                 // YYYY-MM
  expense     BigInt                 // 해당 월 감가비
  accumulated BigInt                 // 누적 감가비
  bookValue   BigInt                 // 장부가
  computedAt  DateTime               @default(now())

  @@unique([scheduleId, period])
  @@index([period])
}

enum DepAssetType { building equipment }
enum DepMethod    { straight_line declining_balance }
```

#### 자동화
- 자산 등록 시 `DepreciationSchedule` 자동 생성 (카테고리별 기본 useful life — 건물 30년, POS 5년, 차량 5년, 기계 10년, 사무가구 8년).
- 매월 1일 cron `cron.schedule('0 1 1 * *', recomputeAllDepEntries)` → 모든 active schedule에 대해 그 달 `DepEntry` 생성.
- 자산 폐기 (`EquipmentLedger.txType=disposal`) 시 schedule status=ended.

#### API
| Method | Path | Body / Query | Returns | Role |
|---|---|---|---|---|
| GET | `/api/depreciation/buildings/:id` | — | schedule + entries (24개월 rolling) | viewer+ |
| GET | `/api/depreciation/equipments/:id` | — | 동일 | viewer+ |
| GET | `/api/depreciation/summary?period=2026-03` | — | `{ buildings: BigInt, equipments: BigInt, total: BigInt }` | viewer+ |
| PUT | `/api/depreciation/:id` | partial (`usefulLifeYears`, `salvageRate`, `notes`) → 재계산 트리거 | updated + entries recomputed | admin |

#### UI
- **건물 드로어 → 신규 탭 "감가상각"**: 잔존 useful life / 누적 감가비 / 장부가 + 12개월 라인차트.
- **자산현황 → 신규 KPI 카드 "당월 감가비"**: 건물/비품 합산.
- **신규 페이지 `/depreciation`**: 카테고리별 감가비 분포 + 5년치 forecast.

#### 검증
- 회계가 보유한 감가상각 표(엑셀)와 1년치 비교 (오차 ≤1원).

#### 출시 단위 (2.4)
1. 모델 + 계산 함수 + 단위 테스트 → PR
2. cron + 자산 등록 hook → PR
3. 건물 드로어 감가상각 탭 + 페이지 → PR

---

### 2.5 2단계 통합 검증 기준
- 모든 신규 API에 vitest 통합 테스트 (login → 권한 → CRUD → 권한 거부)
- 마이그레이션 스크립트(snapshot → ledger) 멱등성 검증 (2회 실행해도 결과 동일)
- 신규 cron 작업이 `node-cron` health check 라우트에서 노출되는지 확인
- DESIGN.md 컴플라이언스 (lint 자동 + 수동 §16 11개 점검)
- Lighthouse 80+ 유지 (코드 스플리팅과 함께)

---

## 3. 3단계 — 보고서 / 감사 / 비동기 인프라

> 핵심 가치: 회사 외부(이사회/감사) 또는 비동기 시점에 활용 가능한 정형 산출물 + 모든 변경의 추적성.

### 3.1 서버 사이드 PDF / Excel 리포트
- **워커 프로세스 분리**: 메인 fastify와 별도 process. BullMQ + Redis 또는 in-memory queue (1단계 규모면 후자로 충분).
- **PDF 엔진**: Playwright (Puppeteer 대비 유지보수 활발). 헤드리스 Chromium 메모리 ~200MB → Docker 별 컨테이너 권장.
- **템플릿**:
  - 월간 임원 요약 (Hero KPI + MoM + 임대 위험 + 유지보수 cost) — A4 4매
  - 연간 자산 결산 — 감가상각 + 폐기 ledger + 감사 추적 — A4 20~30매
- **Excel**: `xlsx` 라이브러리 server-side. V16 양식 동등 + 추가 시트.
- **저장**: `report_jobs` 테이블에 작업 상태 추적, 결과 파일은 StorageAdapter (LocalDisk → MinIO/S3)
- **배포**: 매월 1일 자동 생성 + 다운로드 링크를 알림으로 발송.

#### 데이터 모델
```prisma
model ReportJob {
  id          String         @id @default(uuid())
  type        ReportType     // monthly_exec / annual_settlement / lease_renewal / audit
  period      String         // YYYY-MM 또는 YYYY
  status      JobStatus      // pending / running / done / failed
  resultUrl   String?
  errorMsg    String?
  requestedBy String
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime       @default(now())
  @@index([status, type])
}
enum ReportType { monthly_exec annual_settlement lease_renewal audit }
enum JobStatus  { pending running done failed }
```

### 3.2 감사 로그 (audit_logs)
1단계의 `updatedBy / updatedAt` 컬럼을 보강해 **모든 mutation을 별도 테이블에 기록**.

```prisma
model AuditLog {
  id          String     @id @default(uuid())
  actorId     String     // User.id
  actorEmail  String     // denormalized for FK 제거 시에도 추적 가능
  action      String     // 'building.update' / 'lease.create' / 'auth.login' / ...
  resourceType String    // 'Building' / 'LeaseContract' / 'EquipmentLedger' / ...
  resourceId  String?
  before      Json?      // 변경 전 (생성은 null)
  after       Json?      // 변경 후 (삭제는 null)
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime   @default(now())
  @@index([actorId, createdAt])
  @@index([resourceType, resourceId])
  @@index([createdAt])
}
```

- **구현 방식**: Fastify 글로벌 hook `onResponse` + 라우트 메타데이터로 자동 기록 (모든 mutation 라우트 한 줄 데코레이터로 활성).
- **UI `/audit-logs`** (auditor+admin 전용): 검색 필터 (actor / action / resource / date range), JSON diff 뷰어, CSV 내보내기.
- **보존 정책**: 12개월 hot, 5년 archive (S3 cold storage).

### 3.3 알림 도메인 (notifications)
- 이메일 (SMTP) + 인앱 알림 + (선택) Slack webhook.
- 트리거: 임대 만료 (2.1), 유지보수 critical priority (2.2), 보고서 완료 (3.1), 감사 알림 (3.2).
- 사용자별 알림 설정 (`UserNotificationPref`): 채널별 on/off, 기간별 무음.

```prisma
model Notification {
  id          String              @id @default(uuid())
  userId      String
  channel     NotificationChannel // email / inapp / slack
  category    NotificationCategory
  title       String
  body        String              @db.Text
  link        String?             // /buildings/:id 등 deep link
  readAt      DateTime?
  sentAt      DateTime?
  createdAt   DateTime            @default(now())
  @@index([userId, readAt, createdAt])
}
```

### 3.4 출시 단위
1. AuditLog hook + UI → PR
2. ReportJob 인프라 + 월간 임원 PDF → PR
3. SMTP + 알림 도메인 + 임대 만료 트리거 → PR
4. 추가 보고서 템플릿 (연간 결산) → PR

---

## 4. 4단계 — 실시간 / RLS / 멀티 환경

### 4.1 실시간 협업 (WebSocket / SSE)
- **목적**: 두 명 이상의 editor가 같은 건물을 동시에 편집할 때 충돌 방지 + 실시간 반영.
- **선택**: SSE (단방향 push) 우선 — 인증 cookie 그대로 사용 가능, 프록시 친화적. 양방향 필요 시 WebSocket(`@fastify/websocket`).
- **단위**: 건물별 채널 (`/api/stream/buildings/:id`) — 같은 건물을 보는 사용자에게 변경 이벤트 push.
- **충돌 해결**: optimistic concurrency (`updatedAt` 비교). 충돌 시 사용자에게 diff 표시 후 재시도.

### 4.2 PostgreSQL RLS 도입
- 1단계 미들웨어 의존 → DB 레벨 정책 추가로 방어막 이중화.
- 핵심 테이블 (Building, LeaseContract, EquipmentLedger, AuditLog)에 row-level policy:
  - `viewer/editor`: 모든 row 읽기, editor만 mutation
  - `auditor`: AuditLog 읽기 전용
- Prisma의 `$queryRaw` 또는 `pg_session_user` 변수를 통해 application user 컨텍스트 주입.

### 4.3 멀티 환경 (dev / staging / prod)
- 환경별 DB / Storage / SMTP 분리.
- `NODE_ENV` + `APP_ENV`(dev/staging/prod) 이중화. 1단계 잔존 `NODE_ENV=production` 누출 사례 재발 방지.
- CI/CD: GitHub Actions — push to main → staging 자동 배포 + smoke test → 수동 prod 승격.

### 4.4 멀티 테넌트 (회사 단위 분리, 선택)
- 4단계 후반에 검토. 단일 테넌트로 충분하면 5단계로 미룸.
- `Organization` 테이블 + 모든 도메인 테이블에 `orgId` + RLS 정책.

---

## 5. 5단계 — 분석 / ML / BI

### 5.1 이상 감지 (anomaly_detections)
- 임대율 급락, 비품 폐기 spike, 감가상각 예상치 대비 편차 등 통계적 이상 자동 감지.
- 1단계: 단순 통계 (전월 대비 ±2σ 초과)로 시작.
- 2단계: 시계열 모델 (Prophet / lightweight ARIMA). Python 워커 분리.

### 5.2 BI 임베드
- Metabase 또는 Apache Superset 컨테이너 + 읽기 전용 DB 사용자 + iframe 임베드.
- 자유 분석은 BI에 위임, 운영 대시보드는 자체 화면 유지 (역할 분리).

### 5.3 자동 조치 (auto_actions)
- 임대 만료 X일 전 자동 갱신 안내 발송, 소화기 폐기 임박 시 발주 제안 등.
- 사용자 승인 워크플로 + dry-run 모드 필수.

---

## 6. Cross-cutting Concerns

### 6.1 보안
| 영역 | 1단계 | 2단계+ |
|---|---|---|
| 세션 | httpOnly + Secure(prod) + SameSite=Lax + 12h | 동일 + refresh token + idle timeout |
| 비밀번호 | bcrypt cost 12 + AUTH_PEPPER | + password rotation 정책 + brute force throttle |
| 파일 업로드 | sharp 검증 + size limit 15MB + magic byte | + virus scan (clamav) + signed URLs |
| RBAC | 미들웨어 가드 | + DB RLS (4단계) |
| 감사 | updatedBy/At | + AuditLog 전수 (3단계) |
| 비밀값 | .env (1Password 권장) | + Vault / Doppler |
| HTTPS | Caddy/Nginx + Let's Encrypt | 동일 |
| 의존성 취약점 | `pnpm audit` 수동 | + Dependabot + SBOM |

### 6.2 성능
- **번들**: 1단계 928KB → 라우트 분할 후 ~300KB 초기. 2단계 추가 페이지도 lazy loaded. 3단계에 차트 라이브러리(Recharts)도 dynamic import 검토.
- **DB 쿼리**: PostgreSQL 전환 시 인덱스 점검 — 위 모델에 표시한 `@@index` 외에 `EXPLAIN ANALYZE`로 hot path 검증.
- **이미지**: sharp로 800×600/150KB. 3단계 CDN 도입 시 변환 캐시.
- **차트 첫 렌더 layout shift**: ResponsiveContainer 부모 height 명시 (이미 적용) + width skeleton.
- **N+1 방지**: Prisma `include` / `select` 명시.

### 6.3 접근성 / i18n
- WCAG 2.1 AA: 4.5:1 대비, 44px 터치, 키보드 전체 조작.
- `MotionConfig reducedMotion="user"` 적용.
- i18n 미적용 (한국어 전용). 5단계+에 검토.

### 6.4 백업 / DR
- **1단계**: SQLite — `prisma/prisma/dev.db` 단일 파일 nightly snapshot. uploads 폴더 동시 백업.
- **PostgreSQL 전환 후**: WAL 아카이빙 + 7일 PITR. uploads → S3/MinIO bucket versioning.
- **복원 검증**: 분기 1회 staging에 복원 후 smoke test 실시.
- **RTO 4시간 / RPO 1시간** 목표 (운영 SLA 따라 조정).

### 6.5 관측 (monitoring)
- **로그**: Fastify pino logger → 파일 + 구조화 JSON. 3단계에 Loki/CloudWatch 등 집계.
- **에러 추적**: Sentry (web + api). 무료 티어로 시작.
- **메트릭**: Prometheus 엔드포인트 (`/metrics`) — request latency, DB query time, queue depth.
- **uptime**: 외부 모니터 (UptimeRobot 등) — `/api/health` 1분 간격.

### 6.6 데이터 라이프사이클
- AuditLog 12개월 hot + 5년 cold (3단계).
- 비활성 사용자 90일 시 비활성화 (auditor 알림).
- 자산 폐기 후에도 ledger 영구 보관 (회계 요구).

### 6.7 운영 자동화
- 매월 1일 0시: 마감 처리 (스냅샷 갱신 + 보고서 생성 + 알림).
- 매일 0시: 임대 만료 체크 + 백업.
- 매시간: cron health check.

---

## 7. 마이그레이션 / 의존성 / 일정

### 7.1 단계 의존성 그래프
```
1.5 (마무리)
  └── 2.1 임대 ──────────┐
  └── 2.2 유지보수 ──────┤
  └── 2.3 비품 원장 ─────┤
  └── 2.4 감가상각 ──────┤
                          ├── 3.1 보고서 (모든 도메인 데이터 필요)
                          ├── 3.2 감사 (모든 mutation 라우트)
                          └── 3.3 알림 (2.1/2.2 트리거 활용)
                                  └── 4.1 실시간
                                  └── 4.2 RLS
                                  └── 4.3 멀티환경
                                          └── 5.x 분석/BI/자동조치
```

### 7.2 권고 출시 순서 (사용자 우선순위에 따라 조정)
1. **1.5 마무리** (2~3일) — ESLint/스플리팅/DB경로 + 운영 결정 4건
2. **2.1 임대** (1~2주) — 가장 가시적 가치 (만료 알림 + Gantt)
3. **2.2 유지보수** (1~2주) — 운영 부서 채택률 높음
4. **2.3 비품 원장** (2~3주) — 마이그레이션 + DataTable + CSV 자동화
5. **2.4 감가상각** (1~2주) — 회계 정합 검증 시간 포함
6. **3.2 감사 로그** (3~5일) — 2단계 데이터 보호 + 컴플라이언스
7. **3.1 보고서** (1~2주) — 워커/Playwright/PDF 인프라 + 템플릿 1종
8. **3.3 알림** (3~5일) — SMTP + 트리거 통합
9. **4.x 실시간/RLS/멀티환경** (3~5주, 운영 필요 시)
10. **5.x 분석/BI** (운영 6개월+ 데이터 누적 후)

### 7.3 데이터 마이그레이션 체크
| 단계 | 마이그 작업 | 검증 |
|---|---|---|
| 2.1 | `Building.rental` → 초기 `LeaseContract` 1건 (수동 보정) | 15동 모두 active 1건씩 |
| 2.3 | `EquipmentSnapshot` → 초기 잔액 `EquipmentLedger` (adjustment) | 합계 = snapshot 합계 (1원 단위) |
| 2.4 | 자산 등록 hook 활성화 + 과거 자산 backfill | 회계 1년치 대조 ≤1원 오차 |
| PG | SQLite dump → pg_dump 호환 변환 + Prisma migrate | 8개 검증값 (1단계 verify-migration) 모두 PASS |

### 7.4 본 문서의 다음 사용
1. 사용자 검토 → 2단계 우선순위 재배치 / 범위 조정
2. 결정된 우선순위에 따라 `docs/checklist-phase2.md` 작성 (각 출시 단위 체크박스)
3. 첫 출시 단위 (2.1 권장) 착수 시 plan-phase2.md에 좀 더 구체적인 4주 일정 작성
4. 3단계 진입 전 본 문서 §3 재검토 + 보완

---

## 8. 변경 로그

| 날짜 | 변경 |
|---|---|
| 2026-05-10 | 최초 작성. 1단계 마무리 + 2~5단계 + cross-cutting 통합 설계. |
