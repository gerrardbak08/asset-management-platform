# SJ 프로젝트 — 전사 자산관리 시스템 아키텍처

> 작성 2026-05-14. 현재 시스템 구조·DB 설계 의도·ERP 연동 전략·서비스 확장 로드맵을 기록한다.
> 독자: 개발팀(코드 인수인계), 인프라팀(ERP 연동 협의), 경영진(시스템 발전 방향 검토).
> 상세 확장 설계: `docs/SJ프로젝트_서비스확장_로드맵.md` 참조.

---

## 1. 시스템 개요

이 시스템은 **전사 자산(건물·비품·임대계약·감가상각)을 한 화면에서 조회·관리하는 내부 플랫폼**이다.

### 현재 범위 (2026 H1 완료)

```
✅ 자산 현황 대시보드 (건물·비품·임대·감가상각 통합 시각화)
✅ 임대계약·유지보수·비품 원장·감가상각 관리
✅ CSV 업로드 기반 데이터 갱신
✅ 4역할 권한 체계 + 감사 로그
✅ 모바일 반응형 웹
```

### 확장 로드맵

```
2026 H2 (올해 집중)
  🔵 ERP 연동 — Webhook 기반 자산 채번·데이터 자동 동기화, QR 스캔
  🔵 자산 처분 워크플로우 — 3단계 승인(팀장→재무→임원) + ERP 전표 생성

2027 (중기)
  ⚪ 예방적 유지보수 — 정기 점검 스케줄 자동화, 작업 지시 자동 생성
  ⚪ 임대수익 최적화 — 시장 임대료 비교, 갱신 협상 권고, IFRS 16
  ⚪ 인앱 알림 — 임대 만료·임대율 경고·감가상각 완료 실시간 알림

2028 (장기)
  ⚪ 공간·시설 관리 — 층별 구역 도면, 면적 활용률 분석
  ⚪ ESG·에너지 관리 — 탄소 발자국, GRI 기준 보고서 자동 생성
```

### 데이터 흐름 전환

```
현재(CSV):  담당자가 CSV 업로드 → DB 집계 갱신 → 대시보드 표시
향후(ERP):  ERP 트랜잭션 발생 → Webhook → DB 자동 동기화 → 실시간 반영
```

---

## 2. 기술 스택

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| 프론트엔드 | React 18 + TypeScript + Vite | SPA, 타입 안전성, 빠른 빌드 |
| UI 스타일 | Tailwind CSS + 자체 디자인 토큰 | 일관된 디자인 시스템, 다크모드 |
| 상태관리 | Zustand (전역) + TanStack Query (서버 상태) | 역할별 분리, 캐싱 자동화 |
| 차트 | Recharts | React 친화적, 커스터마이즈 용이 |
| 백엔드 | Node.js 20 + Fastify 4 | 경량, 높은 처리량 |
| ORM | Prisma 5 | 타입 안전한 쿼리, 마이그레이션 관리 |
| DB | PostgreSQL 15 (Railway) | 운영 안정성, 향후 사내 서버 이전 가능 |
| 인증 | 자체 ID/PW + bcrypt + httpOnly 세션 | 외부 의존 최소화 |
| 배포 | Railway (GitHub push 자동 배포) | 1단계 운영용, Docker 이미지로 사내 이전 가능 |

---

## 3. 레이어 구조

```
┌─────────────────────────────────────────────┐
│  브라우저 / 모바일 웹                          │
│  apps/web  (React + Vite)                   │
│  - pages/: 라우트별 페이지                    │
│  - components/: 재사용 컴포넌트               │
│  - lib/api/: API 호출 래퍼                   │
│  - store/: Zustand 전역 상태                 │
└───────────────┬─────────────────────────────┘
                │ HTTP (REST JSON)
┌───────────────▼─────────────────────────────┐
│  API 서버                                    │
│  apps/api  (Fastify + Prisma)               │
│  - routes/: 엔드포인트 정의                   │
│  - services/: 비즈니스 로직                   │
│  - prisma/: 스키마 + 마이그레이션             │
└───────────────┬─────────────────────────────┘
                │ Prisma Client
┌───────────────▼─────────────────────────────┐
│  PostgreSQL                                  │
│  (Railway 관리형 → 사내 서버 이전 예정)        │
└─────────────────────────────────────────────┘
```

**핵심 설계 원칙: 프론트엔드는 API 응답 형태만 본다.**
데이터가 CSV에서 왔는지, ERP에서 왔는지 프론트는 알지 못한다.
따라서 ERP 연동 시 프론트 코드는 변경 없이 API 내부만 교체하면 된다.

---

## 4. DB 스키마 설계 의도

### 4.1 현재 — 집계 중심 설계

1단계 스키마는 **"월별 집계값을 빠르게 읽는 것"** 에 최적화되어 있다.

```
MonthlySnapshot (period: "2026-03")
  - totalAsset, tangible, intangible, equipment
  - kpiJson: 프론트가 원하는 KPI 구조를 미리 직렬화한 JSON
  - rawJson:  차트용 원형 데이터 JSON

Store (name + period)
  - assetByTypeJson:      자산 유형 분포 JSON
  - supplyByCategoryJson: 비품 카테고리별 집계 JSON

EquipmentSnapshot (equipmentId + period + locationType)
  - 비품 하나씩 월별 재고 상태
```

CSV를 업로드하면 이 집계 값들이 통째로 갱신된다.
**장점:** 조회 속도 빠름, 구현 단순.
**한계:** "이 값이 어떤 개별 거래에서 만들어졌는지" 역추적 불가.

### 4.2 정규화된 테이블은 이미 준비되어 있다

ERP 연동을 대비해 트랜잭션 수준의 테이블도 이미 스키마에 존재한다.

```
EquipmentLedger — 비품 개별 거래 (구매·이동·폐기·조정)
LeaseContract   — 임대계약 개별 레코드
MaintenanceLog  — 유지보수 작업 개별 레코드
DepreciationSchedule + DepEntry — 자산별 감가상각 스케줄
AuditLog        — 시스템 조작 이력 (append-only 권장)
```

이 테이블들은 ERP에서 오는 원자 데이터를 그대로 수용할 수 있는 구조다.

### 4.3 JSON 컬럼의 위치

`kpiJson`, `rawJson`, `assetByTypeJson` 등은 **프론트 편의를 위한 캐시** 성격이다.
ERP 연동 이후에는 이 값들을 API 서버가 실시간으로 계산해서 응답하게 되고,
해당 컬럼들은 단계적으로 제거된다.

---

## 5. ERP 연동 마이그레이션 전략

### 원칙: 프론트 무변경 — API 내부만 교체

```
API 응답 스펙을 그대로 유지한 채로, 데이터 소스를 교체한다.
프론트는 JSON 응답만 받으므로 소스가 바뀌어도 코드 수정 없음.
```

### 3단계 전환 계획

**1단계 (현재 유지)**
- CSV 업로드 → 집계 저장 그대로 운용
- 인프라팀과 ERP API 스펙 협의 시작
- 합의 포인트: "어떤 포맷으로 데이터를 넘겨줄 수 있는가"

**2단계 (ERP 파일럿 연동)**
- ERP 데이터 → 새 정규화 테이블에 저장 (기존 집계 테이블 건드리지 않음)
- API에 feature flag 추가: 소스를 CSV 집계 / ERP 실시간 중 선택 가능
- 프론트는 변경 없음
- 데이터 정합성 검증 기간 운영 (두 소스 결과 비교)

**3단계 (전환 완료)**
- 기존 JSON 컬럼, 집계 중심 테이블 제거
- API가 ERP 원자 데이터를 집계 계산해서 응답
- CSV 업로드는 수동 보정 수단으로 유지 (또는 제거)

### 스키마 마이그레이션 실행 방법 (Prisma)

```bash
# 1. schema.prisma 수정
# 2. 마이그레이션 파일 생성
prisma migrate dev --name erp_integration_phase2

# 3. 운영 서버 적용
prisma migrate deploy
```

Prisma가 변경 내역을 SQL 파일로 자동 생성하고 버전 관리한다.
마이그레이션 이력은 `apps/api/prisma/migrations/` 에 누적된다.

---

## 6. 서비스 확장 로드맵

> 상세 설계(DB 스키마·API·UI 흐름)는 `docs/SJ프로젝트_서비스확장_로드맵.md` 참조.

### 6.1 2026 H2 — ERP 연동

자체 개발 ERP와 **Webhook 기반 양방향 연동**.

```
ERP → SJ시스템:  자산 채번·마스터 변경 시 Webhook → DB upsert (legacyId 기준)
SJ시스템 → ERP:  처분 승인 완료 시 분개 전표 자동 생성 요청

QR 코드:  ERP가 채번 → QR에 자산번호 인코딩
          현장 스캔 → GET /api/assets/by-qr?id=A-2026-00123 → 자산 상세
          (Building.legacyId / EquipmentItem.legacyId 컬럼 이미 준비됨)
```

**인프라팀 선결 협의 항목:**

```
□ Webhook 페이로드 스키마 확정
□ ERP 자산번호 형식 및 채번 규칙
□ ERP 전표 생성 API 엔드포인트 + 계정과목 코드 체계
□ ERP 스테이징 환경 접근 권한
```

### 6.2 2026 H2 — 자산 처분 워크플로우

**3단계 승인 체계 (금액 기준 분기):**

| 처분 예상 가액 | 승인 단계 |
|---|---|
| 1천만원 미만 | 팀장 1단계 |
| 1천만원 ~ 1억원 | 팀장 → 재무 2단계 |
| 1억원 이상 | 팀장 → 재무 → 임원 3단계 |

**처분 손익 자동 계산:**

```text
장부가액 = 취득가액 − 누적 감가상각액   (DepEntry 테이블에서 계산)
처분 손익 = 실제 처분가액 − 장부가액
승인 완료 → ERP 분개 전표 자동 생성 → AuditLog 전 이력 기록
```

### 6.3 의사결정 지원 — 알림 시스템 (2027)

```
인앱 알림 (1단계):
  notifications 테이블 + node-cron 백그라운드 잡
  - 임대계약 만료 D-60 / D-30 / D-7
  - 임대율 85% 이하 건물
  - 비품 감가상각 완료 예정
  → 헤더 알림 벨 + 카운트 뱃지

브라우저 Push (2단계, 인앱 검증 후):
  Web Push API + 서비스 워커 → 앱 미사용 중에도 알림 수신
```

### 6.4 예방적 유지보수 (2027)

정기 점검 주기를 등록하면 작업 지시를 자동 생성하고 담당자에게 알린다.

```
InspectionTemplate (점검 유형 마스터) + InspectionSchedule (건물·자산별 스케줄)
→ cron이 D-7 이내 점검일 감지 → MaintenanceLog 자동 생성 → 담당자 알림
→ 자산별 PM 비용 누계 → "이 건물은 연간 유지보수 비용이 평균 대비 40% 높음" 분석
```

### 6.5 임대수익 최적화 (2027)

```
시장 임대료 비교:  MarketRent 테이블 (지역·용도·기준월·시장 평균)
                  현재 임대료/㎡ vs 시장 평균 → 갱신 협상 권고

IFRS 16:          리스 부채 = 미래 임대료 현재가치 → 분기 자동 계산 → ERP 전표
```

### 6.6 감사·컴플라이언스 강화

```sql
-- ① 감사 로그 불변성 (DB 레벨, 즉시 적용 가능)
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY no_delete ON "AuditLog" AS RESTRICTIVE FOR DELETE USING (false);
CREATE POLICY no_update ON "AuditLog" AS RESTRICTIVE FOR UPDATE USING (false);
```

```
-- ② 자산 스냅샷 자동 저장
매월 말 / 업로드 시 → 전체 자산 상태 타임스탬프 저장
→ "2026년 1월 시점 장부가액" 소급 조회 + 두 시점 diff 비교 UI

-- ③ 감사 보고서 Export
기간 선택 → audit_logs → PDF 다운로드 + SHA-256 해시 첨부
외부 감사·규제 대응 자료로 직접 제출 가능
```

### 6.7 공간·시설 관리 / ESG·에너지 관리 (2028)

```text
공간·시설:  BuildingFloor + FloorZone 테이블 → 층별 구역·임차인 매핑 시각화
ESG·에너지:  EnergyUsage 테이블 → 탄소 배출 자동 계산 → GRI 기준 보고서 PDF
```

---

## 7. 사내 서버 이전 시 체크리스트

Railway에서 사내 인프라로 이전할 때 변경할 항목이다.
코드 자체는 수정 없이 환경변수와 인프라 설정만 바꾼다.

| 항목 | 현재 | 이전 후 |
|---|---|---|
| DB | Railway PostgreSQL | 사내 PostgreSQL 서버 |
| 파일 저장 | Railway 볼륨 | 사내 NAS / S3 호환 스토리지 |
| 배포 방식 | Railway 자동배포 | Docker 이미지 → 사내 CI/CD |
| 도메인 | Railway 제공 URL | 사내 도메인 |
| 환경변수 | Railway 대시보드 | 사내 시크릿 관리 도구 |
| SSL | Railway 자동 | 사내 인증서 |

Docker 이미지는 `apps/api/Dockerfile` 기준으로 빌드한다.
환경변수 목록은 `apps/api/.env.example` 참조.

---

## 8. 핵심 설계 결정 요약

| 결정 | 내용 | 이유 |
|---|---|---|
| 프론트·API 완전 분리 | REST JSON으로만 통신 | ERP 연동 시 프론트 무변경 보장 |
| Prisma ORM | 타입 안전 + 마이그레이션 관리 | 스키마 변경 이력 추적, 안전한 단계적 전환 |
| 집계 중심 1단계 스키마 | JSON 컬럼으로 집계 캐시 | CSV 업로드 구조에서 최대 성능 |
| 정규화 테이블 병행 준비 | Ledger/Contract/Log 테이블 | ERP 연동 시 소스 교체 지점 확보 |
| 4역할 권한 체계 | admin / editor / viewer / auditor | 데이터 접근 범위 제어, 감사 분리 |
| httpOnly 세션 쿠키 | XSS로 토큰 탈취 불가 | 내부 시스템 보안 기준 충족 |
