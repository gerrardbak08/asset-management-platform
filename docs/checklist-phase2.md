# 2단계 체크리스트 (Lease + Maintenance + Equipment Ledger + Depreciation)

> 작성일 2026-05-10. [docs/system-design-2026-05-10.md](system-design-2026-05-10.md) §2 의 4개 출시 단위 (2.1~2.4) 를 실행 체크박스로 분해.
> 출시 단위는 독립적으로 PR 가능. 권고 순서는 2.1 → 2.2 → 2.3 → 2.4. 사용자가 우선순위 변경 가능.
> 각 항목은 "끝났음을 증명할 산출물 또는 검증 명령" 을 함께 적었다.

---

## 0. 사전 조건 (1.5단계 — 진입 전)

- [ ] 1단계 잔존 4건 (Kakao 키 / admin pw / 배포 결정 / .env 보관소) 완료 — `system-design §1.1`
- [ ] ESLint flat config 양 워크스페이스 통과 — `pnpm -r lint` 0 오류
- [ ] 라우트 단위 코드 스플리팅 적용 후 초기 청크 < 400KB — `pnpm --filter web build` 출력 확인
- [ ] DB 경로 정합 — `apps/api/prisma/dev.db` 단일 위치, 빈 dev.db 잔존 없음
- [ ] `MotionConfig reducedMotion="user"` `main.tsx` 적용
- [ ] 사용자 결정: 2.1~2.4 중 어느 단위부터 착수할지

---

## 2.1 임대 계약 관리 (lease_contracts)

### 데이터 모델
- [ ] `prisma/schema.prisma` 에 `LeaseContract` model + `LeaseStatus` enum 추가
- [ ] `prisma migrate dev --name add_lease_contracts`
- [ ] `Building` 에 `leases LeaseContract[]` relation 추가

### 마이그레이션
- [ ] `scripts/seed-leases-from-rental.ts` — 기존 `Building.rental.tenant`/`area`/`rate` 가 있는 건물에 대해 초기 active LeaseContract 1건 생성. tenantName 비어있으면 "미입력" placeholder
- [ ] 마이그 실행 후 검증: `SELECT COUNT(*) FROM LeaseContract WHERE status='active'` ≥ 임대 운영 건물 수

### API (`apps/api/src/routes/leases.ts`)
- [ ] `GET /api/leases` — query: buildingId, status, endingBefore. zod 검증
- [ ] `GET /api/leases/:id` — chain (renewedFromId 따라간 이전 계약들) 포함
- [ ] `POST /api/leases` — editor+
- [ ] `PUT /api/leases/:id` — editor+. 활성 계약 종료일 단축 시 confirm
- [ ] `POST /api/leases/:id/renew` — old → expired, new active. tx
- [ ] `POST /api/leases/:id/terminate` — `{ reason }`. status=terminated
- [ ] `GET /api/leases/expiring?withinDays=30` — `{ critical: [≤7d], warning: [≤30d] }`
- [ ] vitest: 6개 라우트 + viewer 403 + editor PUT 성공

### Shared types
- [ ] `packages/shared/src/types.ts` 에 `LeaseContract`, `LeaseStatus` 추가 + zod schema 동기

### UI
- [ ] `apps/web/src/lib/api/leases.ts` — fetch wrapper 6개
- [ ] `apps/web/src/components/buildings/LeaseTab.tsx` — 활성 계약 + chain 타임라인 + 갱신/해지 버튼
- [ ] `BuildingDrawer.tsx` 의 임대현황 탭에 LeaseTab 마운트
- [ ] `apps/web/src/pages/Leases.tsx` — Gantt (X=월, Y=건물). lightweight (CSS grid 기반) 또는 `gantt-task-react`
- [ ] 사이드바에 "/leases" 메뉴 추가 ("운영" 그룹)
- [ ] Buildings 페이지에 "만료 ≤30일" 필터 칩 + 리스트 정렬 옵션
- [ ] 사이드바 "건물" 메뉴에 만료 임박 N개 빨간 닷 (`useExpiringLeases` 훅)

### 자동화
- [ ] `apps/api/src/lib/cron.ts` — 매일 0시(KST) `checkExpiringLeases` 실행 → notifications 테이블 INSERT (3.3 알림 도메인 필요. 임시로 console.log 가능)
- [ ] cron health check 라우트 `GET /api/admin/cron-status` 노출

### 검증
- [ ] typecheck/lint/build 0 오류
- [ ] vitest 통과
- [ ] 수동 흐름: 임대 등록 → 갱신 → 해지 → expiring 알림 표시
- [ ] DESIGN.md §16 11개 점검

---

## 2.2 유지보수 로그 (maintenance_logs)

### 데이터 모델
- [ ] `MaintenanceLog` model + 3개 enum 추가
- [ ] migrate
- [ ] `User` 에 `assignedMaintenance MaintenanceLog[]` relation

### API (`apps/api/src/routes/maintenance.ts`)
- [ ] `GET /api/maintenance` — query: buildingId, status, from, to, category, assigneeId
- [ ] `GET /api/maintenance/:id` — attachments 포함
- [ ] `POST /api/maintenance` — editor+
- [ ] `PUT /api/maintenance/:id` — status 전환 검증 (open → in_progress → closed 정상, 역전환 confirm)
- [ ] `POST /api/maintenance/:id/attachments` — multipart, StorageAdapter 재사용
- [ ] `DELETE /api/maintenance/:id/attachments/:attachmentId` — editor+
- [ ] `GET /api/maintenance/cost-summary?period=` — by building / category / total
- [ ] vitest 통합 테스트

### UI
- [ ] `apps/web/src/lib/api/maintenance.ts`
- [ ] `apps/web/src/pages/Maintenance.tsx` — Kanban 4컬럼. `@dnd-kit/core` 사용 (라이선스 MIT 확인)
- [ ] `MaintenanceCard.tsx` — priority 배지 + 카테고리 색 + cost + assignee 아바타
- [ ] `MaintenanceDetailDialog.tsx` — Radix Dialog. attachments 그리드 + 라이트박스 (1단계 PhotoLightbox 재사용)
- [ ] `BuildingDrawer` 관리이력 탭에 해당 건물 로그 + 신규 등록 버튼
- [ ] 대시보드 → 신규 KPI 카드 3종 (open count / 이번달 cost / critical priority count)
- [ ] `pages/MaintenanceAnalytics.tsx` — 12개월 stacked bar (건물별 / 카테고리별)
- [ ] 사이드바 "/maintenance" 메뉴 추가

### 검증
- [ ] viewer 가 status 전환 시 403
- [ ] 첨부 업로드/삭제 동작
- [ ] cost-summary 합계가 개별 합과 일치

---

## 2.3 비품 원장 (equipment_ledger)

### 데이터 모델
- [ ] `EquipmentLedger` model + `LedgerTxType` enum
- [ ] `EquipmentItem` 에 `ledger EquipmentLedger[]` relation
- [ ] `Store` 에 `ledger EquipmentLedger[]` relation
- [ ] migrate

### 마이그레이션
- [ ] `scripts/snapshot-to-ledger.ts` — 모든 기존 EquipmentSnapshot 의 잔액을 초기 `EquipmentLedger` (txType=adjustment, period=마이그 기준월) 로 변환
- [ ] 멱등성: 두 번 실행해도 중복 INSERT 없음 (period+itemId+txType=adjustment 조합 unique 처리)
- [ ] 검증 스크립트: `EquipmentLedger` 적재 후 합계 = `EquipmentSnapshot` 합계 (BigInt 1원 단위)

### Snapshot 재계산 함수
- [ ] `apps/api/src/lib/ledger/recompute-snapshot.ts` — 특정 period 의 모든 ledger row → EquipmentSnapshot upsert
- [ ] 단위 테스트: ledger 1건 추가 → recompute → snapshot 일치
- [ ] `EquipmentSnapshot` 직접 mutation 라우트 deprecated 처리 (헤더 추가)

### API
- [ ] `GET /api/equipments/:id/ledger?from=&to=&txType=`
- [ ] `POST /api/equipments/:id/ledger` — tx 생성 + recomputeSnapshot 자동 호출
- [ ] `GET /api/ledger?period=&txType=&storeId=`
- [ ] `POST /api/ledger/recompute-snapshot` — admin
- [ ] CSV 업로드 라우트 (`POST /api/upload/csv/eq_ops`) 가 ledger row 생성으로 변경 + 자동 recompute
- [ ] vitest

### UI
- [ ] `apps/web/src/lib/api/ledger.ts`
- [ ] 자산 드릴다운 (AssetDrilldownSubtab) → 비품 row 클릭 시 우측 슬라이드 패널에 `LedgerTimeline.tsx`
- [ ] `apps/web/src/pages/Ledger.tsx` — TanStack Table v8 DataTable
  - 필터: 기간 / txType / location / store / equipment
  - 정렬·페이지네이션·컬럼 가시성
  - Excel 내보내기 (xlsx client-side)
- [ ] 사이드바 "/ledger" 메뉴 추가

### 검증
- [ ] 마이그 후 `pnpm --filter api etl:verify` 의 비품 검증값(소화기 ₩765,902,874) 동일
- [ ] CSV 업로드 후 ledger row + snapshot 동시 갱신 확인
- [ ] DataTable 1만 행 페이지네이션 < 200ms

---

## 2.4 감가상각 (depreciation_schedules)

### 데이터 모델
- [ ] `DepreciationSchedule` + `DepEntry` model + 2 enum
- [ ] `Building` / `EquipmentItem` 에 nullable relation
- [ ] migrate

### 계산 함수
- [ ] `apps/api/src/lib/depreciation/compute.ts`
  - `computeStraightLineEntry(schedule, period)` → `{ expense, accumulated, bookValue }`
  - `computeDecliningBalanceEntry(schedule, period)` → 동일
  - 잔존가율 적용. 폐기 시점 이후 0 처리
- [ ] 단위 테스트: 회계 표 기준 1년치 비교 ≤1원 오차

### 자산 등록 hook
- [ ] 건물 생성 시 useful life 30년 default 로 schedule 자동 생성
- [ ] 비품(EquipmentItem) 생성 시 카테고리별 default (POS 5년, 소화기 5년, 노트북 4년, 사무가구 8년...) — `apps/api/src/lib/depreciation/defaults.ts` 매핑 표
- [ ] 폐기 ledger (txType=disposal) 생성 시 schedule status=ended

### Backfill
- [ ] `scripts/backfill-depreciation.ts` — 기존 15개 건물 + 41종 비품에 대해 schedule + 과거 entries 생성

### Cron
- [ ] 매월 1일 0시(KST) `recomputeAllDepEntries` — 모든 active schedule 의 그달 DepEntry 생성/갱신
- [ ] `node-cron` 등록 + health check 노출

### API
- [ ] `GET /api/depreciation/buildings/:id` — schedule + entries 24개월
- [ ] `GET /api/depreciation/equipments/:id` — 동일
- [ ] `GET /api/depreciation/summary?period=` — buildings/equipments/total BigInt
- [ ] `PUT /api/depreciation/:id` — admin only. usefulLifeYears / salvageRate / notes 변경 시 entries 재계산

### UI
- [ ] `apps/web/src/lib/api/depreciation.ts`
- [ ] `BuildingDrawer` 신규 탭 "감가상각" — 잔존 useful life / 누적 / 장부가 + 12개월 라인차트
- [ ] 자산현황 → KPI 카드 "당월 감가비" (건물+비품 합산)
- [ ] `apps/web/src/pages/Depreciation.tsx` — 카테고리별 분포 + 5년 forecast
- [ ] 사이드바 "/depreciation" 메뉴 추가

### 검증
- [ ] 회계가 보유한 1년치 표와 대조 ≤1원
- [ ] schedule PUT 후 entries 재계산 검증
- [ ] cron 1회 dry-run 후 entry 생성 확인

---

## 통합 검증 (2단계 종료 시)

- [ ] `pnpm -r typecheck` / `pnpm -r lint` / `pnpm -r build` 0 오류
- [ ] `pnpm --filter api test` 통합 테스트 통과 (신규 라우트 모두)
- [ ] V16 데이터 패리티 검증값 (자산 합계 / 소화기 / 건물·비품·사업장 카운트) 1단계 동일 유지
- [ ] DESIGN.md §16 11개 점검 — 신규 6 페이지 (Leases / Maintenance / MaintenanceAnalytics / Ledger / Depreciation + BuildingDrawer 신규 탭 2종) 모두
- [ ] Lighthouse 80+ 유지 (코드 스플리팅 + lazy charts)
- [ ] 백업 1회 + 복원 검증 1회 (PostgreSQL 전환 시 추가)
- [ ] `docs/spec.md` 갱신 — 2단계 신규 모델/API 추가
- [ ] `README.md` 갱신 — 새 화면 / cron / 마이그레이션 명령

---

## 출시 단위 PR 권고

각 출시 단위는 독립 PR로 머지. 의존성:

```
2.1 임대          → 독립 (가장 빠른 가치)
2.2 유지보수      → 독립
2.3 비품 원장     → snapshot → ledger 마이그 필요. 1단계 EquipmentSnapshot 와 호환
2.4 감가상각      → 자산 등록 hook이 1단계 Building/EquipmentItem 변경 후행. 마지막 권고

3.2 감사 로그     → 2단계 데이터 보호 시급도 따라 2.1과 병렬 가능
3.3 알림 도메인   → 2.1 cron 알림 출력 채널 필요 시 동시 진행
```

각 PR template 준수:
- 변경 파일 목록 + 검증 명령 + 영향 페이지 스크린샷 + DESIGN.md 점검 결과 + 데이터 마이그레이션 영향
