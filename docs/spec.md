# 1단계 명세서 (docs/spec.md)

> 작성 2026-05-09. `plan.md` / `checklist.md` / `context-notes.md` 의 9개 확정 결정을 코드 작업 직전의 명세로 굳힌다.
> 이 문서가 사용자 승인을 받으면 바로 `pnpm create vite` 부터 코드 작성 시작.
> 본 명세는 "결정의 확인" 이지 "결정의 추가" 가 아니다. 새 결정이 필요하면 `plan.md` 로 돌아가 박는다.

---

## 0. 1단계 확정 결정 9건

| # | 항목 | 확정 |
|---|---|---|
| 1 | 프론트엔드 | Vite 5 + React 18 + TypeScript 5 + Tailwind + Radix UI + Pretendard + DM Mono + 다크모드 기본 + Recharts + Zustand + TanStack Query |
| 2 | 백엔드 | Node.js 20 + Fastify 4 + Prisma 5 + zod |
| 3 | DB | SQLite (1단계) → PostgreSQL 15+ (운영 전환 시) |
| 4 | 저장소 | 로컬 디스크 (Railway 볼륨) + `StorageAdapter` 추상화 |
| 5 | 인증 | 자체 ID/PW + bcrypt + httpOnly 세션 + 4역할 |
| 6 | 호스팅 (1단계) | Railway (GitHub push 자동 배포) |
| 6' | 호스팅 (운영) | 사내 서버 (의사결정 후 Docker 이미지 그대로 이전) |
| 7 | Kakao Maps | 사용자 보유 키 환경변수 주입 |
| 8 | 디자인 시스템 | DESIGN.md 토큰·컴포넌트·레이아웃 전면 적용 |
| 9 | UI/UX | V16 1:1 이식 폐기, DESIGN.md 기준 전면 개편 |

---

## 1. 도메인 모델 (TypeScript)

`packages/shared/src/types.ts` 에 모은다. 프론트·백엔드 양쪽이 import.

### 1.1 Role

```ts
export type Role = 'admin' | 'editor' | 'viewer' | 'auditor';
export type SiteType = '본사' | '매장' | '물류';
export type Period = string; // 'YYYY-MM' 형식 — 2026-03 등
```

### 1.2 Building (V16 보존 + 메타 추가)

```ts
export type Building = {
  id: string;                       // UUID v7
  legacyId: string;                 // bd_001 ~ bd_015 (V16 호환)
  name: string;                     // "속초본점 건물"
  address: string;
  use: string;                      // 용도 (다중 분류 가능, raw 문자열 보존)
  area: { sqm: number; pyeong: number };
  floors: string;                   // "지하1층-지상5층"
  approvalDate: string | null;      // ISO date — '2018-04-01'
  acquisitionDate: string;
  acquisitionPrice: bigint;         // ₩ 정수 — Prisma BigInt
  rental: { area: number; rate: number; vacancy: number }; // 0~100
  tenant: string;                   // 단일 문자열 (1단계). 2단계에 lease_contracts 분리
  lat: number;
  lng: number;
  photoUrl: string | null;          // /files/buildings/{legacyId}.png
  detailPhotoUrl: string | null;    // /files/buildings/{legacyId}_detail.png
  updatedBy: string | null;         // user.id
  updatedAt: string;                // ISO datetime
};
```

### 1.3 EquipmentItem + EquipmentSnapshot

```ts
export type EquipmentItem = {
  id: string;                       // UUID v7
  legacyId: string;                 // eq_001 ~ eq_041
  name: string;                     // "POS(계산대)" 등
  isActive: boolean;
  createdAt: string;
};

export type EquipmentSnapshot = {
  id: string;
  equipmentId: string;
  period: Period;                   // '2026-03'
  locationType: 'hq' | 'store' | 'logistics';
  purchaseAmount: bigint;
  transferAmount: bigint;
  disposalAmount: bigint;
  inventoryAmount: bigint;
};
```

### 1.4 Store

```ts
export type Store = {
  id: string;                       // UUID v7
  name: string;                     // 조직명 / 사업장명
  siteType: SiteType | null;
  period: Period;
  assetValue: bigint;               // 장부가 합계
  assetCount: number;               // 항목 수
  supplyValue: bigint;              // 비품 재고액
  assetByType: Record<string, number>;          // 자산유형 → 금액
  supplyByCategory: Record<string, number>;     // 중분류 → 금액
  supplyByCategoryCount: Record<string, number>;// 중분류 → 수량
};
```

### 1.5 MonthlyEntry / MonthlySnapshot

```ts
export const M_KEYS = [
  '총자산규모', '건물자산금액', '비품재고액',
  '비품구매금액', '비품이동금액', '비품폐기금액',
] as const;
export type MetricKey = typeof M_KEYS[number];

export type MonthlyEntry = {
  metric: MetricKey;
  values: Array<number | null>;     // 12개 (1~12월), null = 미입력
};

export type MonthlySnapshot = {
  id: string;
  period: Period;
  totalAsset: bigint;
  tangible: bigint;
  intangible: bigint;
  equipment: bigint;
  hq: bigint;
  store: bigint;
  logistics: bigint;
  kpiJson: AssetKPI;                // 6번 참조
  rawJson: M0Data;                  // V16 M0_DATA 원형
  createdAt: string;
};
```

### 1.6 M0Data (V16 그대로)

```ts
export type AssetKPI = {
  total: number;
  tangible: { value: number; ratio: number };
  intangible: { value: number; ratio: number };
  supplies: { value: number; ratio: number };
};

export type M0Data = {
  meta: { current_period: string; previous_period: string; currency: 'KRW'; schema_version: '1.0' };
  current: {
    asset_kpi: AssetKPI;
    asset_matrix: Array<{ category: string; subcategory: string; hq: number; store: number; logistics: number; total: number }>;
    supplies_kpi?: { stock: number; purchase: number; transfer: number; disposal: number };
    supplies_category_detail?: Record<string, { amount: number; count: number }>;
    stores?: Array<Pick<Store, 'name'|'siteType'|'assetValue'|'assetCount'|'supplyValue'|'assetByType'|'supplyByCategory'|'supplyByCategoryCount'>>;
    location?: { hq: number; store: number; logistics: number };
  };
  previous: M0Data['current'];
  mom: {
    total: { value: number; ratio: number };
    tangible: { value: number; ratio: number };
    intangible: { value: number; ratio: number };
    supplies: { value: number; ratio: number };
    location: { hq: { value: number; ratio: number }; store: { value: number; ratio: number }; logistics: { value: number; ratio: number } };
    supplies_kpi: { stock: { value: number; ratio: number }; purchase: { value: number; ratio: number }; transfer: { value: number; ratio: number }; disposal: { value: number; ratio: number } };
  };
  movers?: {
    top_up: Array<{ category: string; subcategory: string; current: number; previous: number; delta: number; ratio: number }>;
    top_down: Array<{ category: string; subcategory: string; current: number; previous: number; delta: number; ratio: number }>;
  };
};
```

### 1.7 BuildingMemo

```ts
export type BuildingMemo = {
  buildingId: string;
  body: string;                     // markdown 또는 plain
  updatedBy: string;
  updatedAt: string;
};
```

---

## 2. Prisma 스키마 (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = env("DATABASE_PROVIDER") // "sqlite" | "postgresql"
  url      = env("DATABASE_URL")
}

// ── 사용자
model User {
  id           String   @id @default(uuid()) @db.Uuid  // PG; SQLite 는 @db.Uuid 제거
  email        String   @unique
  passwordHash String
  role         String   // 'admin' | 'editor' | 'viewer' | 'auditor'
  createdAt    DateTime @default(now())

  buildingsUpdated  Building[]   @relation("BuildingUpdater")
  memosUpdated      BuildingMemo[]
  snapshotsCreated  EquipmentSnapshot[]
}

// ── 건물 마스터
model Building {
  id                String   @id @default(uuid())
  legacyId          String   @unique
  name              String
  address           String
  use               String
  areaSqm           Float
  areaPyeong        Float
  floors            String
  approvalDate      DateTime?
  acquisitionDate   DateTime
  acquisitionPrice  BigInt
  rentalArea        Float    @default(0)
  rentalRate        Float    @default(0)   // 0~100
  vacancy           Float    @default(0)   // 0~100
  tenant            String   @default("-")
  lat               Float
  lng               Float
  photoUrl          String?
  detailPhotoUrl    String?
  updatedById       String?
  updatedBy         User?    @relation("BuildingUpdater", fields: [updatedById], references: [id])
  updatedAt         DateTime @updatedAt
  createdAt         DateTime @default(now())

  memo              BuildingMemo?
}

// ── 비품 마스터
model EquipmentItem {
  id        String   @id @default(uuid())
  legacyId  String   @unique
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  snapshots EquipmentSnapshot[]
}

// ── 비품 월별 스냅샷 (1단계 — V16 동일 구조 보존, ledger 전환은 2단계)
model EquipmentSnapshot {
  id              String   @id @default(uuid())
  equipmentId     String
  equipment       EquipmentItem @relation(fields: [equipmentId], references: [id])
  period          String   // 'YYYY-MM'
  locationType    String   // 'hq' | 'store' | 'logistics'
  purchaseAmount  BigInt   @default(0)
  transferAmount  BigInt   @default(0)
  disposalAmount  BigInt   @default(0)
  inventoryAmount BigInt   @default(0)
  createdById     String?
  createdBy       User?    @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())

  @@unique([equipmentId, period, locationType])
  @@index([period])
}

// ── 사업장
model Store {
  id                       String   @id @default(uuid())
  name                     String
  siteType                 String?  // '본사' | '매장' | '물류'
  period                   String
  assetValue               BigInt
  assetCount               Int
  supplyValue              BigInt
  assetByTypeJson          Json
  supplyByCategoryJson     Json
  supplyByCategoryCountJson Json
  createdAt                DateTime @default(now())

  @@unique([name, period])
  @@index([period])
  @@index([name])
}

// ── 월별 종합 스냅샷
model MonthlySnapshot {
  id          String   @id @default(uuid())
  period      String   @unique
  totalAsset  BigInt
  tangible    BigInt
  intangible  BigInt
  equipment   BigInt
  hq          BigInt
  store       BigInt
  logistics   BigInt
  kpiJson     Json
  rawJson     Json
  createdAt   DateTime @default(now())
}

// ── 건물 메모 (V16 dash_bld_memos 대체)
model BuildingMemo {
  buildingId  String   @id
  building    Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  body        String
  updatedById String?
  updatedBy   User?    @relation(fields: [updatedById], references: [id])
  updatedAt   DateTime @updatedAt
}
```

> SQLite 는 `Json` 을 직접 지원 안 하므로 String 으로 저장하고 애플리케이션 단에서 parse. PostgreSQL 전환 시 `Json` 으로 ALTER. Prisma 의 `Json` 컬럼은 양쪽 호환되지만, SQLite 에서는 String 으로 저장되는 점 주의.

---

## 3. API 명세

전 라우트 prefix `/api`. 모든 mutation 은 zod 검증. 응답 표준 — 성공 `{ ok:true, data }`, 실패 `{ ok:false, code, message }`.

### 3.1 인증

| 메서드 | 경로 | 요청 | 응답 | 역할 |
|---|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ user: { id, email, role } }` + Set-Cookie | 익명 |
| POST | `/api/auth/logout` | — | `{}` | 로그인됨 |
| GET | `/api/auth/me` | — | `{ user }` | 로그인됨 |

### 3.2 건물

| 메서드 | 경로 | 요청 | 응답 | 역할 |
|---|---|---|---|---|
| GET | `/api/buildings` | `?region=&use=&sort=acq_desc` | `Building[]` | viewer+ |
| GET | `/api/buildings/:id` | — | `Building` | viewer+ |
| PUT | `/api/buildings/:id` | `Partial<Building>` (zod 검증) | `Building` | editor+ |
| POST | `/api/buildings/:id/photo` | multipart `file` | `{ photoUrl }` | editor+ |
| GET | `/api/buildings/:id/memo` | — | `BuildingMemo \| null` | viewer+ |
| PUT | `/api/buildings/:id/memo` | `{ body }` | `BuildingMemo` | editor+ |

### 3.3 비품

| 메서드 | 경로 | 요청 | 응답 | 역할 |
|---|---|---|---|---|
| GET | `/api/equipments` | — | `EquipmentItem[]` | viewer+ |
| PUT | `/api/equipments/:id` | `{ name?, isActive? }` | `EquipmentItem` | editor+ |
| GET | `/api/equipments/snapshots` | `?period=2026-03` | `EquipmentSnapshot[]` | viewer+ |
| PUT | `/api/equipments/snapshots` | `{ period, items: EquipmentSnapshot[] }` | `{ count }` | editor+ |

### 3.4 사업장

| 메서드 | 경로 | 요청 | 응답 | 역할 |
|---|---|---|---|---|
| GET | `/api/stores` | `?q=&period=&page=1&limit=40` | `{ items, total, page }` | viewer+ |
| GET | `/api/stores/:id` | — | `Store` | viewer+ |

### 3.5 월별 / MoM

| 메서드 | 경로 | 요청 | 응답 | 역할 |
|---|---|---|---|---|
| GET | `/api/monthly` | `?year=2026` | `MonthlyEntry[]` (6 metric × 12 month) | viewer+ |
| PUT | `/api/monthly` | `{ entries: MonthlyEntry[] }` | `{ ok }` | editor+ |
| GET | `/api/snapshots` | `?fromPeriod=2025-04&toPeriod=2026-03` | `MonthlySnapshot[]` | viewer+ |
| GET | `/api/mom` | `?period=2026-03` | `M0Data` | viewer+ |

### 3.6 업로드

| 메서드 | 경로 | 요청 | 응답 | 역할 |
|---|---|---|---|---|
| POST | `/api/upload/xlsb` | multipart `file` (xlsb/xlsx) | `{ period, mom, applied: { matrix, supplies, stores } }` | editor+ |
| POST | `/api/upload/csv/:type` | `:type ∈ {asset, ledger_asset, ledger_eq, eq_ops, buildings}` + multipart `file` | `{ rowsApplied }` | editor+ |
| GET | `/api/upload/templates/:type` | — | CSV 다운로드 | editor+ |

### 3.7 zod 스키마 (예시)

```ts
// packages/shared/src/schema.ts
import { z } from 'zod';

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const BuildingUpdate = z.object({
  name: z.string().min(1).max(80).optional(),
  address: z.string().max(200).optional(),
  use: z.string().max(200).optional(),
  area: z.object({ sqm: z.number().min(0), pyeong: z.number().min(0) }).optional(),
  floors: z.string().max(50).optional(),
  approvalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  acquisitionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  acquisitionPrice: z.bigint().optional(),
  rental: z.object({
    area: z.number().min(0),
    rate: z.number().min(0).max(100),
    vacancy: z.number().min(0).max(100),
  }).optional(),
  tenant: z.string().max(200).optional(),
  lat: z.number().min(33).max(39).optional(),
  lng: z.number().min(124).max(132).optional(),
});

export const Period = z.string().regex(/^\d{4}-\d{2}$/);
```

### 3.8 에러 코드 표

| code | HTTP | 의미 |
|---|---|---|
| `AUTH_REQUIRED` | 401 | 미로그인 |
| `FORBIDDEN` | 403 | 역할 부족 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION` | 422 | zod 검증 실패 |
| `CONFLICT` | 409 | unique 충돌 |
| `UPLOAD_PARSE` | 422 | xlsb / csv 파싱 실패 |
| `INTERNAL` | 500 | 그 외 |

---

## 4. 인증 / 권한

### 4.1 세션
- httpOnly + Secure + SameSite=Lax 쿠키 `sid` 에 세션 ID.
- 세션 저장은 1단계엔 메모리 (Fastify `@fastify/session`) 또는 SQLite. Railway 재시작 시 무효화 되어도 1단계엔 무방.
- 만료 12시간. 사용 시마다 갱신 (rolling).

### 4.2 비밀번호
- bcrypt cost 12. `AUTH_PEPPER` 환경변수를 비밀번호 끝에 붙여 해시.
- 길이 8자 이상, 영·숫·특 중 2종 이상 (zod refine).

### 4.3 V16 ROLE_POLICY 매핑

| V16 | 새 시스템 | 권한 |
|---|---|---|
| exec | viewer | 자산현황·건물·사업장 읽기, 데이터·관리자 차단 |
| ops | editor | 위 + 데이터 조정 + 건물 수정 |
| store | viewer (scope=stores) | 사업장 페이지 위주, 다른 페이지도 읽기 가능 |
| admin | admin | 모든 페이지·CRUD·사용자 관리 |
| (신규) | auditor | 보고서/감사 로그 읽기 (1단계는 viewer 와 동등 + auditor 표시만) |

### 4.4 라우트 가드
- 미들웨어 `requireRole('editor' | 'admin')` 등.
- 모든 mutation 라우트에 가드 누락이 없는지 통합 테스트로 강제.

---

## 5. ETL — V16 → 새 DB

### 5.1 입력
- `dashboard_2026-05-09.json` — V16 `exportJSON()` 결과.
- `EMBEDDED_BUILDING_PHOTOS` (15장 base64) — V16 코드에서 추출.
- `EMBEDDED_BUILDING_DETAILS` (4장 base64) — V16 코드에서 추출.
- `EMBEDDED_M0_STORES_DATA.stores` (2,015건) — V16 코드에서 추출.
- 두 xlsb (`대시보드 데이터_26년{2,3}월마감.xlsb`) — `M0_DATA` 검증용.

### 5.2 절차 (`scripts/migrate-from-v16.ts`)
1. `users` 시드 — admin 1명 (`AUTH_PEPPER` 적용 bcrypt).
2. `buildings` 적재 — V16 `bd[]` 15건. `legacyId` = `bd_001`~`bd_015`.
3. `equipment_items` 적재 — V16 `eq[]` 41건. `legacyId` = `eq_001`~`eq_041`.
4. `equipment_snapshots` 적재 — `period='2026-03'` × `locationType ∈ {hq,store,logistics}` × 41건 = 123행. V16 의 `purchase / transfer / disposal / inventory` 4 metric 을 한 행에 모두 저장.
5. `stores` 적재 — `EMBEDDED_M0_STORES_DATA.stores` 2,015건. `period='2026-03'`.
6. `monthly_snapshots` 적재 — `period='2026-03'` 1행. `kpiJson` = `M0_DATA.current.asset_kpi`. `rawJson` = `M0_DATA` 통째.
7. 사진 — `EMBEDDED_BUILDING_PHOTOS` 15장 디코딩 → `uploads/buildings/{legacyId}.png` 저장 → `buildings.photoUrl = '/files/buildings/{legacyId}.png'` 갱신.
8. 디테일 사진 — `EMBEDDED_BUILDING_DETAILS` 4장 동일. `detailPhotoUrl` 갱신.
9. 검증 — §8 참조.

### 5.3 xlsb 업로드 라우트 내부 절차 (`POST /api/upload/xlsb`)

V16 `handleMonthlyXlsbUpload` 와 동일 매핑.

1. `XLSX.read(buf, { type: 'array', cellDates: true })`.
2. **자산현황 시트** — 행 0 cell B 에서 period 라벨 (`'26-03'` 등). 행 4 의 cell B/D/F/H = 총자산/유형/무형/비품. 자산 매트릭스는 그 아래 행들 (V16 의 8294 행 부근 로직 그대로).
3. **비품(프로세스별) 시트** — 행 4 = 재고/구매/이동/폐기 합계.
4. **원장_비품_재고 시트** — 카테고리·사업장 집계.
5. **원장_자산 시트** — 사업장별 장부가 집계.
6. 화면값(이전 `monthly_snapshots`) = previous, 업로드값 = current 로 `M0Data` 구성.
7. `POST` 의 효과
   - `monthly_snapshots` 에 새 period INSERT (UPSERT — 같은 period 면 덮어쓰기).
   - `equipment_snapshots` 에 41 × 3 = 123행 UPSERT.
   - `stores` 에 사업장별 행 UPSERT.
8. 응답 `{ period, mom: M0Data, applied: { matrix, supplies, stores } }`.

---

## 6. DESIGN.md 토큰 매핑 (자산관리 도메인)

### 6.1 시맨틱 토큰 사용표

| 토큰 | 자산관리 적용 |
|---|---|
| `bg-background` | 페이지 외곽 배경 |
| `bg-card` | KPI 카드 / 건물 카드 / 사업장 검색 결과 카드 |
| `text-foreground` | 주요 수치·제목 |
| `text-muted-foreground` | 라벨·메타·"2026.03 기준" 같은 보조 정보 |
| `border-border` | 카드·표·입력란 테두리 |
| `bg-muted` | 표 헤더 / 비활성 셀 |
| `primary` | "공유", "업로드" 같은 주요 CTA 버튼 / 활성 사이드바 항목 |
| `sidebar` 토큰군 | 사이드바 다크 chrome (라이트모드와 무관, 항상 다크) |

### 6.2 위험도 4색 매핑 (자산관리 도메인 의미 재정의)

DESIGN.md §12 의 안전보건 매핑(점수 70+/40-69/0-39)을 자산관리 의미로 재정의.

| 토큰 | 자산관리 의미 |
|---|---|
| `danger` | 임대 만료 7일 이내 / 공실률 100% / 사진 미등록 / xlsb 합계와 화면값 불일치 |
| `warning` | 임대 만료 30일 이내 / 임대율 50% 미만 / xlsb 미반영 (전월보다 1주일 이상 지남) |
| `info` | xlsb 분석 진행중 / 신규 자산 등록 진행 / 데이터 동기화 중 |
| `success` | 임대율 100% / 모든 사진 등록 / MoM ±1% 이내 / 검증 통과 |

### 6.3 위험도 헬퍼 (TS)

```ts
// src/lib/risk.ts
import type { Building, EquipmentItem } from '@/shared/types';
import { AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function getBuildingRiskStyle(b: Building, today = new Date()) {
  const photo = !!b.photoUrl;
  const rate = b.rental.rate;
  // 1단계엔 임대 만료 데이터 없음 → rate / vacancy / photo 만으로 판정
  if (!photo || (rate === 0 && b.tenant !== '-')) return { token: 'danger', label: '주의 필요', icon: AlertTriangle };
  if (rate < 50) return { token: 'warning', label: '임대율 낮음', icon: AlertCircle };
  if (rate === 100) return { token: 'success', label: '안정', icon: CheckCircle2 };
  return { token: 'info', label: '진행중', icon: Loader2 };
}
```

### 6.4 KPI 컴포넌트 폰트 분리 (한글은 Pretendard, 숫자는 DM Mono)

```tsx
// components/ui/KpiValue.tsx
type Props = { value: bigint | number; unit?: string };
export function KpiValue({ value, unit = '원' }: Props) {
  return (
    <span className="font-kpi-display tabular-nums">
      <span className="font-mono">{value.toLocaleString('ko-KR')}</span>
      <span className="ml-1 font-sans text-muted-foreground text-caption">{unit}</span>
    </span>
  );
}
```

### 6.5 차트 색상

- Recharts 데이터 시리즈 색은 시맨틱 토큰만. 4색 외 색이 필요한 카테고리 시각화 (예: 자산 유형 7종) 는 `primary` + `muted` 변형 (`opacity` 단계) 으로 처리.
- V16 의 `--cat-1 #1E3A5F` 같은 brand 색은 직주입 금지.

---

## 7. 화면 구조 (라우트 + 페이지셸)

### 7.1 라우트

| 경로 | 페이지 | 역할 |
|---|---|---|
| `/login` | 로그인 (DESIGN.md §12 패턴, `bg-primary`) | 익명 |
| `/dashboard` | 자산현황 (V16 7서브탭을 Radix Tabs 로 흡수) | viewer+ |
| `/buildings` | 건물 목록 (카드 그리드) | viewer+ |
| `/buildings/:id` | 건물 드로어 모달 (Radix Dialog + 5탭) | viewer+ |
| `/stores` | 사업장 검색 + 매니저 뷰 | viewer+ |
| `/data` | 데이터 조정 (양식 다운 + 업로드 5종) | editor+ |
| `/admin` | 관리자 패널 (사용자·5종 데이터 카드) | admin |

### 7.2 PageShell

모든 라우트의 최외곽 `<div>`.

```tsx
// components/ui/PageShell.tsx
export function PageShell({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-background">
      <Header title={title} />
      <div className="flex-1 p-4 md:p-5 space-y-3 min-w-0">{children}</div>
    </div>
  );
}
```

### 7.3 Sidebar 5메뉴

```
LOGO            ← Header h-14 와 정렬
─────────────
운영
  자산현황 (Building2)
  건물    (Building)
  사업장  (Store)
─────────────
관리
  데이터  (Database)        editor+
  관리자  (Shield)          admin
```

---

## 8. 검증 플랜

### 8.1 데이터 동등성 (V16 와 일치)

| 검증 | 기대값 | 출처 |
|---|---|---|
| 자산 합계 26-03 | ₩1,191,529,992,612 | `M0_DATA.current.asset_kpi.total` |
| 자산 합계 26-02 | ₩1,187,005,713,251 | `M0_DATA.previous.asset_kpi.total` |
| MoM tangible 비율 | 0.003510390500781177 (≈0.351%) | `M0_DATA.mom.tangible.ratio` |
| MoM total 비율 | 0.003811505968752917 (≈0.381%) | `M0_DATA.mom.total.ratio` |
| 소화기 26-03 재고 합계 | ₩765,902,874 | V16 `defEq()` 행 1: 23,760+719,769,380+46,109,734+ledger 보정 |
| 건물 카운트 | 15 | `defBd()` |
| 비품 카운트 | 41 | `defEq()` |
| 사업장 카운트 | 2,015 | `EMBEDDED_M0_STORES_DATA.stores` |

### 8.2 API 통합 테스트 (vitest + supertest)

- `auth.test.ts` — 로그인 성공/실패, 만료 쿠키, /me 미인증 401.
- `buildings.test.ts` — viewer 가 PUT 시 403, editor PUT 성공.
- `equipments.test.ts` — 41건 GET, snapshots period 필터.
- `upload.test.ts` — `26년3월마감.xlsb` 업로드 후 응답의 `mom.total.value` 가 `4524279361` 인지.
- `mom.test.ts` — `GET /api/mom?period=2026-03` 가 V16 의 `M0_DATA` 와 동등한 모양.

### 8.3 화면 / DESIGN.md 컴플라이언스

- DESIGN.md §16 체크리스트 11개를 5페이지 모두 통과.
- ESLint / Stylelint 룰 — `text-white`, `bg-white`, `text-[\d+px]`, `bg-[#...]`, `transition-all` 금지.
- Lighthouse 데스크톱 점수 80+ (성능·접근성·SEO 평균).
- 키보드만으로 사이드바·대시보드·건물 드로어 사용 가능.

### 8.4 보안

- viewer 가 모든 mutation 라우트에 401/403 받는지.
- bcrypt 해시가 DB 에 저장되는지 (평문 비밀번호 절대 금지).
- 세션 쿠키 httpOnly + Secure + SameSite=Lax.
- 사진 업로드 — image/png · image/jpeg 만 허용. magic byte 검사 (`file-type` 라이브러리).
- xlsb 업로드 — 파일 크기 10MB 제한.

---

## 9. 환경변수

`.env.example` (Git 추적), `.env` (gitignore).

```bash
# 기본
NODE_ENV=development
PORT=3001
SESSION_SECRET=                 # openssl rand -hex 32
AUTH_PEPPER=                    # openssl rand -hex 16

# DB
DATABASE_PROVIDER=sqlite        # sqlite | postgresql
DATABASE_URL="file:./prisma/dev.db"
# 운영 전환 시
# DATABASE_PROVIDER=postgresql
# DATABASE_URL=postgresql://USER:PASS@HOST:5432/aims

# 저장소
STORAGE_DRIVER=local            # local | s3 (2단계)
UPLOADS_DIR=./uploads

# Kakao Maps (사용자가 plan.md / context-notes.md 에 평문으로 적었으나 코드에선 환경변수 사용)
KAKAO_JS_KEY=
KAKAO_REST_KEY=

# CORS / 프론트
CORS_ORIGIN=http://localhost:5173

# 관리자 시드 (1회용)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=             # 시드 후 즉시 변경 권장
```

---

## 10. 폴더 구조 / 배포

### 10.1 모노레포 (pnpm workspaces)

```
e:\자산관리 플랫폼 개발\
├── apps/
│   ├── web/                      # Vite + React 프론트
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   │   ├── ui/           # Card, KpiCard, StatusBadge, EmptyState ...
│   │   │   │   ├── layout/       # Header, Sidebar, MobileNav
│   │   │   │   └── features/dashboard/SectionHeader.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api/          # fetch wrappers
│   │   │   │   └── risk.ts
│   │   │   ├── store/            # Zustand stores
│   │   │   └── styles/globals.css
│   │   └── tailwind.config.ts
│   └── api/                      # Fastify 백엔드
│       ├── src/
│       │   ├── routes/           # auth, buildings, equipments, stores, upload, mom
│       │   ├── lib/
│       │   │   ├── storage/      # StorageAdapter, LocalDiskAdapter
│       │   │   ├── auth/
│       │   │   └── xlsb/         # SheetJS 시트 매핑 함수
│       │   └── server.ts
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
├── packages/
│   ├── shared/                   # 타입 + zod 스키마 (apps/web · apps/api 양쪽 import)
│   └── design-system/            # (선택) 안전보건 플랫폼과 공유. 1단계엔 web 안에 두고 2단계에 분리해도 됨
├── scripts/
│   ├── migrate-from-v16.ts
│   ├── extract-v16-embedded.ts   # OneDrive V16 HTML 의 EMBEDDED_* 추출
│   └── verify-migration.ts
├── docs/
│   ├── spec.md (본 파일)
│   ├── api.md
│   ├── v16-funcs.md
│   ├── xlsb-mapping.md
│   ├── operations.md
│   └── migration-from-v16.md
├── uploads/                      # gitignore. Railway 볼륨 마운트
│   └── buildings/
├── plan.md
├── checklist.md
├── context-notes.md
├── DESIGN.md
├── CLAUDE.md
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── Dockerfile
```

### 10.2 Dockerfile (Railway 배포)

```dockerfile
# 단일 컨테이너 (1단계). 2단계에 web/api 분리 가능.
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm -r build              # web: vite build, api: tsc

FROM node:20-alpine AS run
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
COPY --from=build /app /app
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
# api 가 web 의 dist 를 정적으로 서빙
CMD ["pnpm","--filter","api","start"]
```

### 10.3 Railway 설정
- `railway.json` 또는 Dashboard 에서 — Build Command `pnpm -r build`, Start Command `pnpm --filter api start`, Volume `/app/uploads` 마운트, 환경변수 §9 그대로.
- Custom domain — 1단계 미설정. Railway 서브도메인 (`*.up.railway.app`) 사용.

### 10.4 사내 서버 전환 절차 (참고)
1. Railway 의 Docker 이미지를 사내 레지스트리 또는 GHCR 에 푸시.
2. 사내 서버에 `docker compose up -d` 1식 (caddy + app + 볼륨).
3. 환경변수만 사내 값으로 교체.
4. DB 는 PostgreSQL 로 전환 — `DATABASE_PROVIDER=postgresql`, `DATABASE_URL=...`. `prisma migrate deploy` 1회.
5. 사진 디렉토리 `uploads/` 를 볼륨 째로 옮긴다.

---

## 11. 코드 작성 첫 PR 단위 (제안)

승인 후 다음 7개 PR 로 나눠 진행.

| PR | 범위 | 검증 |
|---|---|---|
| 1 | 모노레포 스캐폴드 + Tailwind + DESIGN.md 토큰 + 기본 레이아웃 (Header/Sidebar/PageShell) | `pnpm dev` 빈 화면이 다크모드로 뜸. ESLint / Stylelint 동작 |
| 2 | Prisma 스키마 + SQLite migrate + ETL 스크립트 | `pnpm verify:migration` 의 8.1 표 모두 통과 |
| 3 | 인증 (login/me/logout) + 4역할 가드 + 로그인 페이지 | viewer 가 PUT 시 403 통합 테스트 통과 |
| 4 | 건물 목록 + 드로어 + 사진 업로드 (StorageAdapter LocalDisk) | 건물 15동 표시, 사진 fallback 4단계 동작 |
| 5 | 자산현황 페이지 + Recharts 차트 5종 + MoM API | `M0_DATA` 와 동등 결과 |
| 6 | 사업장 검색 + 매니저 뷰 + 데이터 조정 (xlsb 업로드 라우트) | xlsb 업로드 후 MoM 응답이 V16 와 일치 |
| 7 | 관리자 패널 + 인쇄 CSS (다크 → 라이트 분기) + Railway 배포 + 도메인·환경변수 | Railway 무료 도메인에서 위 5페이지 정상 동작 |

각 PR 머지 전엔 `checklist.md` 의 해당 섹션 항목이 체크되어야 한다.

---

## 12. 합의 항목 (사용자 검토 필요)

위 명세에 동의하면 다음을 명시 확인.

- [ ] §1 도메인 모델 — V16 데이터 모양과 동일한지 (특히 `Building.rental.rate` `vacancy` 의 0~100 범위, `BigInt` 사용 동의).
- [ ] §2 Prisma 스키마 — 1단계 6개 테이블 외 추가 / 누락 없는지.
- [ ] §3 API 명세 — 18개 엔드포인트 외 1단계에 더 필요한 것이 있는지.
- [ ] §5 ETL — V16 `exportJSON()` 1회 추출 절차에 동의하는지.
- [ ] §7 IA — 사이드바 5메뉴 구성 (자산현황 / 건물 / 사업장 / 데이터 / 관리자) 에 동의하는지.
- [ ] §8 검증 — 4가지 데이터 동등성 기준값에 동의하는지.
- [ ] §9 환경변수 — 누락 없는지.
- [ ] §11 PR 7단위 — 묶음 단위에 동의하는지.

승인되면 `plan.md` 의 §8 결정 표에 9건을 박고, PR #1 (모노레포 스캐폴드) 부터 코드 작성에 들어간다.
