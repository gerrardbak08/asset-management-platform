# SJ 프로젝트 — 서비스 확장 로드맵

> 작성 2026-05-14.
> 2026년 집중 개발 영역(ERP 연동, 자산 처분 워크플로우)과 중장기 로드맵(예방적 유지보수, 임대수익 최적화, 공간·시설 관리, ESG·에너지 관리)을 설계한다.

---

## 전체 로드맵 개요

```
2026 H1 (현재 완료)
  ✅ 자산 현황 조회 대시보드
  ✅ 임대계약·유지보수·감가상각·비품 원장 관리
  ✅ 역할 기반 접근 제어 + 감사 로그
  ✅ 모바일 반응형

2026 H2 (올해 집중)
  🔵 ERP 연동 — QR 채번·데이터 자동 동기화
  🔵 자산 처분 승인 워크플로우 + 회계 반영

2027 (중기)
  ⚪ 예방적 유지보수 스케줄링
  ⚪ 임대수익 최적화 (시장 임대료 비교, IFRS 16)

2028 (장기)
  ⚪ 공간·시설 관리 (층별 도면·구역 매핑)
  ⚪ ESG·에너지 관리 (탄소 발자국·보고서)
```

---

## 1. ERP 연동 설계 (2026 H2)

### 1.1 연동 개요

자체 개발 ERP와 SJ 시스템이 **양방향**으로 데이터를 주고받는다.

```
ERP → SJ시스템:  자산 채번, 자산 마스터, 거래 발생 시 동기화
SJ시스템 → ERP:  처분 승인 완료 시 분개 전표 자동 생성 요청
```

### 1.2 연동 방식 — Webhook 기반

자체 개발 ERP이므로 **Webhook**을 채택한다.
ERP에서 이벤트가 발생할 때 SJ시스템의 수신 엔드포인트를 호출하는 방식이다.

```
ERP에서 자산 등록/변경 발생
  → POST https://sj-system.com/api/erp/webhook
  → SJ시스템이 수신 → DB upsert → 감사 로그 기록

SJ시스템에서 처분 승인 완료
  → POST https://erp.internal/api/journal/create
  → ERP가 분개 전표 자동 생성
```

**Webhook 수신 엔드포인트 명세:**

```
POST /api/erp/webhook
Authorization: Bearer {WEBHOOK_SECRET}  ← 공유 시크릿으로 위변조 방지

Body:
{
  "event": "asset.created" | "asset.updated" | "asset.disposed",
  "assetType": "building" | "equipment",
  "legacyId": "A-2026-00123",   ← ERP 자산번호 (QR에 인코딩된 값)
  "data": { ... }               ← 자산 상세 데이터
}
```

**SJ시스템 → ERP 전표 생성 요청 명세:**

```
POST https://erp.internal/api/journal/create
Body:
{
  "type": "asset_disposal",
  "referenceId": "SJ_DISPOSAL_UUID",   ← SJ 처분 ID (역추적용)
  "entries": [
    { "account": "감가상각누계액", "debit": 30000000, "credit": 0 },
    { "account": "현금",          "debit": 15000000, "credit": 0 },
    { "account": "유형자산처분손실","debit":  5000000, "credit": 0 },
    { "account": "건물",          "debit": 0, "credit": 50000000 }
  ]
}
```

### 1.3 QR 코드 연동

ERP에서 자산 채번 시 QR코드를 발급한다. SJ시스템은 QR값(legacyId)으로 자산을 조회한다.

```
현재 스키마에 이미 legacyId 컬럼 존재:
  Building.legacyId   (UNIQUE)
  EquipmentItem.legacyId (UNIQUE)

현장 흐름:
  현장 직원이 QR 스캔
  → GET /api/assets/by-qr?id=A-2026-00123
  → SJ시스템이 legacyId로 Building 또는 EquipmentItem 조회
  → 자산 상세 화면 표시 (모바일)
```

### 1.4 데이터 동기화 전략

| 상황 | 처리 방식 |
|---|---|
| ERP 자산 신규 등록 | Webhook → SJ DB upsert (legacyId 기준) |
| ERP 자산 정보 변경 | Webhook → SJ DB upsert + AuditLog 기록 |
| Webhook 실패 (네트워크 오류) | ERP에서 재시도 (최대 3회, 지수 백오프) |
| 수동 재동기화 필요 시 | GET /api/erp/sync/full → 전체 자산 재동기화 (관리자 전용) |

### 1.5 인프라팀과 협의할 항목

ERP 연동 착수 전에 아래를 합의한다.

```
1. Webhook 시크릿 키 공유 방식 (환경변수로 관리)
2. 자산 데이터 페이로드 스키마 확정 (어떤 필드를 전달하는가)
3. ERP의 자산번호(legacyId) 형식 (예: "A-2026-00123")
4. 전표 생성 API 엔드포인트 및 계정과목 코드 체계
5. 연동 테스트 환경 구축 (ERP 스테이징 서버)
```

---

## 2. 자산 처분 워크플로우 설계 (2026 H2)

### 2.1 처분 상태 머신

```
신청(DRAFT)
  ↓
팀장 검토 대기 (PENDING_TEAM_LEAD)
  ↓ 승인          ↓ 반려
재무 검토 대기    REJECTED
(PENDING_FINANCE)   ← 5천만원 미만 시 이 단계 생략 가능
  ↓ 승인          ↓ 반려
임원 검토 대기    REJECTED
(PENDING_EXEC)      ← 1억원 이상 시만 진행
  ↓ 승인          ↓ 반려
최종 승인(APPROVED)  REJECTED
  ↓
처분 완료(COMPLETED) → ERP 전표 자동 생성
```

**금액 기준 분기:**

| 처분 예상 가액 | 필요 승인 단계 |
|---|---|
| 1천만원 미만 | 팀장 1단계만 |
| 1천만원 ~ 1억원 | 팀장 → 재무 2단계 |
| 1억원 이상 | 팀장 → 재무 → 임원 3단계 |

### 2.2 처분 손익 자동 계산

```
처분 시점 장부가액 = 취득가액 − 누적 감가상각액
처분 손익 = 실제 처분가액 − 장부가액

처분 손익 > 0  →  처분이익 (영업외 수익으로 ERP 반영)
처분 손익 < 0  →  처분손실 (영업외 비용으로 ERP 반영)
처분 손익 = 0  →  등가 처분
```

DepreciationSchedule + DepEntry 테이블에서 누적 감가상각액을 계산할 수 있다.

### 2.3 DB 스키마 추가

```prisma
model AssetDisposal {
  id              String             @id @default(uuid())
  assetType       DisposalAssetType  // building | equipment
  buildingId      String?
  building        Building?          @relation(...)
  equipmentItemId String?
  equipmentItem   EquipmentItem?     @relation(...)
  requesterId     String
  requester       User               @relation("DisposalRequester", ...)
  reason          String             // 처분 사유
  disposalMethod  DisposalMethod     // sale | scrap | donation | transfer
  estimatedValue  BigInt             // 예상 처분가액
  actualValue     BigInt?            // 실제 처분가액 (완료 시 입력)
  bookValue       BigInt             // 신청 시점 장부가액 (스냅샷)
  accumulated     BigInt             // 신청 시점 누적 감가상각
  gainLoss        BigInt?            // 처분 손익 (완료 시 자동 계산)
  status          DisposalStatus     @default(draft)
  erpJournalId    String?            // ERP에서 반환한 전표 ID
  attachmentUrls  String[]           @default([])
  notes           String?
  approvals       DisposalApproval[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([status])
  @@index([buildingId])
  @@index([equipmentItemId])
}

model DisposalApproval {
  id         String          @id @default(uuid())
  disposalId String
  disposal   AssetDisposal   @relation(fields: [disposalId], references: [id], onDelete: Cascade)
  step       Int             // 1: 팀장, 2: 재무, 3: 임원
  role       String          // 해당 단계의 역할 레이블
  approverId String?
  approver   User?           @relation(...)
  status     ApprovalStatus  @default(pending)
  comment    String?
  actedAt    DateTime?
  createdAt  DateTime        @default(now())

  @@unique([disposalId, step])
  @@index([approverId, status])
}

enum DisposalStatus {
  draft
  pending_team_lead
  pending_finance
  pending_exec
  approved
  completed
  rejected
}

enum DisposalMethod {
  sale        // 매각
  scrap       // 폐기
  donation    // 기증
  transfer    // 사업 양도
}

enum ApprovalStatus {
  pending
  approved
  rejected
}

enum DisposalAssetType {
  building
  equipment
}
```

### 2.4 UI 흐름

```
[자산 상세 화면]
  → "처분 신청" 버튼 (editor 이상)
  → 처분 사유 / 방법 / 예상 가액 입력
  → 현재 장부가액 자동 표시 (감가상각 테이블에서 계산)
  → 신청 제출

[알림] 팀장에게 처분 승인 요청 알림 발송

[처분 관리 화면] (팀장·재무·임원 각자)
  → 대기 중인 처분 목록
  → 자산 정보 + 처분 사유 + 예상 손익 확인
  → 승인 / 반려 + 코멘트 입력

[처분 완료 처리]
  → 실제 처분가액 입력
  → 처분 손익 자동 계산 표시
  → ERP 전표 자동 생성 요청
  → AuditLog에 전체 이력 기록
```

### 2.5 API 엔드포인트 목록

| Method | Path | 설명 |
|---|---|---|
| POST | /api/disposals | 처분 신청 |
| GET | /api/disposals | 처분 목록 조회 (상태·권한 필터) |
| GET | /api/disposals/:id | 처분 상세 + 승인 이력 |
| POST | /api/disposals/:id/approve | 승인 처리 (현 단계 승인자만) |
| POST | /api/disposals/:id/reject | 반려 처리 |
| POST | /api/disposals/:id/complete | 처분 완료 + ERP 전표 생성 |

---

## 3. 예방적 유지보수 설계 (2027)

### 3.1 개념

현재 유지보수는 문제 발생 후 등록하는 **사후 처리** 방식이다.
예방적 유지보수는 **정기 점검을 미리 스케줄링**하고 자동으로 작업 지시를 생성한다.

### 3.2 핵심 구조

```
InspectionTemplate (점검 유형 마스터)
  - 소방설비 정기 점검 / 6개월 주기
  - 엘리베이터 정기 점검 / 3개월 주기
  - 에어컨 필터 교체 / 1개월 주기

InspectionSchedule (건물별·자산별 스케줄)
  - 강남 사옥 소방설비 → 다음 점검일: 2027-08-01
  - 강남 사옥 엘리베이터 → 다음 점검일: 2027-06-15

cron 잡 (매일 새벽)
  - 점검일 D-7 이내 → MaintenanceLog 자동 생성 (status: open)
  - 담당자 알림 발송
  - 완료 후 다음 주기 날짜 자동 계산
```

### 3.3 추가 가치

```
자산별 PM 비용 누계 → "강남 사옥은 연간 유지보수 비용이 평균보다 40% 높음"
사후 수리 vs 예방 점검 비용 비교 → ROI 분석
고장 패턴 분석 → 특정 설비의 반복 고장 탐지
```

---

## 4. 임대수익 최적화 설계 (2027)

### 4.1 핵심 기능

**시장 임대료 비교:**
```
MarketRent 테이블
  - 지역, 용도, 기준월, 시장 평균 임대료/㎡
  - 수동 입력 (분기별) 또는 외부 데이터 연동

LeaseContract.monthlyRent ÷ rentArea = 현재 임대료/㎡
→ 시장 평균 대비 갭 계산
→ "이 건물은 시장가 대비 12% 저렴, 갱신 시 인상 여력 있음" 권고
```

**계약 만료 예측:**
```
현재 LeaseContract.contractEnd 기준으로
  - D-90, D-60, D-30, D-7 알림 자동 발송
  - 만료 예정 계약 목록 + 예상 공실 기간 + 예상 손실 계산
```

**IFRS 16 리스 회계:**
```
리스 부채 = 미래 임대료의 현재가치 (할인율 적용)
사용권 자산 = 리스 부채 + 초기 직접비용
→ 분기별 자동 계산 → ERP 전표 생성
```

---

## 5. 공간·시설 관리 설계 (2028)

### 5.1 핵심 구조

```
BuildingFloor (층 마스터)
  - buildingId, floorNumber, totalAreaSqm

FloorZone (구역)
  - floorId, zoneName, usableAreaSqm, purpose
  - currentTenantId (LeaseContract FK)
  - status: available | leased | internal | renovation
```

### 5.2 시각화

```
건물 선택 → 층별 탭
→ 각 층의 구역을 색상 코드로 표시
  초록: 임대 중 / 노란: 공실 / 회색: 내부 사용 / 파란: 공사 중
→ 구역 클릭 → 임차인 정보·계약 링크·면적 상세
```

---

## 6. ESG·에너지 관리 설계 (2028)

### 6.1 핵심 구조

```
EnergyUsage 테이블
  - buildingId, period, type(electricity|gas|water), amount, unit, cost

탄소 배출 자동 계산
  - 전력(kWh) × 0.4567 kgCO₂/kWh (한국전력 배출계수)
  - 가스(MJ) × 0.0561 kgCO₂/MJ

ESG 리포트
  - 연간 에너지 소비 / 탄소 배출량 집계
  - 전년 대비 증감률
  - GRI 기준 보고서 PDF 자동 생성
```

---

## 7. 2026 H2 개발 착수 순서

ERP 연동과 처분 워크플로우는 **순서가 중요하다.** ERP의 자산번호(legacyId)가 SJ시스템에 정확히 매핑되어야 처분 시 ERP 전표 생성이 가능하기 때문이다.

```
Step 1 (2~3주)  ERP Webhook 수신 엔드포인트 구현
                + legacyId 기반 자산 동기화 검증

Step 2 (1주)    QR 스캔 → 자산 조회 모바일 화면

Step 3 (3~4주)  처분 신청 · 승인 워크플로우 구현
                (DB 스키마 마이그레이션 → API → UI)

Step 4 (1주)    처분 완료 시 ERP 전표 생성 연동
                (ERP API 스펙 확정 필요)

Step 5 (1주)    처분 승인 알림 연동 (인앱 알림 시스템 선행 필요)
```

**총 예상 기간: 8~10주**

### 인프라팀과 선결 협의 사항

처분 워크플로우 개발 착수 전 아래를 반드시 합의한다.

```
□ ERP Webhook 엔드포인트 구현 일정
□ Webhook 페이로드 스키마 확정
□ ERP 자산번호 형식 및 채번 규칙
□ ERP 전표 생성 API 엔드포인트 및 계정과목 코드
□ ERP 스테이징 환경 접근 권한
```
