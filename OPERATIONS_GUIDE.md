# 전사 자산관리 플랫폼 운영 및 유지보수 가이드 (Operations & Maintenance Guide)

본 문서는 자산관리 플랫폼의 지속 가능성을 보장하고, 차기 개발자 및 운영자가 시스템을 쉽게 이해하고 확장할 수 있도록 돕기 위해 작성되었습니다.

---

## 1. 시스템 개요 (System Overview)
- **목적**: 전사 자산(부동산, 비품, 임대)의 가시성을 확보하고 데이터를 통합 관리하여 경영 의사결정을 지원함.
- **주요 기능**: 대시보드(KPI), 월별 자산 현황 분석, 임대계약 관리, 원장 데이터 업로드 및 자동화.

## 2. 기술 스택 (Technical Stack)
- **Monorepo**: `pnpm` workspaces (apps/api, apps/web, packages/shared)
- **Backend**: Node.js, Fastify, Prisma (ORM), SQLite (or Postgres in Prod)
- **Frontend**: React (Vite), Tailwind CSS, TanStack Query, Recharts
- **Infrastructure**: Railway (CI/CD 자동 배포), Nixpacks 빌더

---

## 3. 데이터 업데이트 및 원장 관리 (Data Operations)

### 3.1 월별 데이터 업데이트 흐름
운영팀에서 매월 원장 데이터를 업로드하면 시스템은 다음과 같은 과정을 거칩니다:
1. **업로드**: 관리자 페이지(`Admin.tsx`)에서 `.xlsb` 또는 `.csv` 원장 파일을 업로드.
2. **전처리 (Preprocessing)**: `apps/api/src/services/dataProcessor.ts` (가칭) 에서 데이터를 파싱하고 정규화함.
3. **스키마 매칭**: Prisma 스키마에 정의된 `Building`, `Asset`, `Lease` 모델에 맞게 변환.
4. **화면 동기화**: 업로드 완료 시 대시보드 및 각 메뉴의 데이터가 실시간으로 갱신됨.

### 3.2 수동 마이그레이션 (CLI)
기존 V16(Excel 기반) 데이터를 마이그레이션할 때는 다음 스크립트를 사용합니다:
- `pnpm --filter api run etl:extract`: 원시 데이터 추출
- `pnpm --filter api run etl:migrate`: DB 마이그레이션 실행

---

## 4. 추가 개발 가이드 (Development Guide)

### 4.1 신규 메뉴 추가 단계
1. **Backend API**: `apps/api/src/routes/`에 새 라우트 파일 생성 및 `server.ts` 등록.
2. **Frontend Page**: `apps/web/src/pages/`에 컴포넌트 생성.
3. **Routing**: `apps/web/src/App.tsx`에 경로 추가.
4. **Navigation**: `Sidebar.tsx`에 메뉴 아이콘 및 링크 등록.

### 4.2 스타일링 원칙 (Design System)
- **Aesthetics First**: `RETROSPECTIVE.md`에 정의된 프리미엄 디자인 원칙 준수.
- **반응형 대응**: 모든 테이블은 `whitespace-nowrap`과 `overflow-x-auto`를 사용하여 모바일 가독성 확보.
- **다크모드**: `dark:` 접두사를 사용하여 테마별 색상 반전 처리 필수.

---

## 5. 유지보수 및 트러블슈팅 (Maintenance)

### 5.1 빌드 및 배포
- 모든 배포는 GitHub `main` 브랜치 푸시 시 Railway를 통해 자동 수행됩니다.
- 빌드 명령어는 `scripts/build.sh`에 정의되어 있으며, 정적 자산(사진 등)의 복사 로직이 포함되어 있습니다.

### 5.2 검증 프로세스
작업 완료 후에는 반드시 `VERIFICATION_GUIDELINE.md`에 명시된 자가 검증 체크리스트를 수행해야 합니다.

---

## 6. 향후 확장 계획 (Roadmap)
- **비품 관리 고도화**: 상세 비품 입출고 내역 및 수량 조정 기능.
- **이미지 자동 최적화**: 업로드된 고해상도 이미지를 WebP로 자동 변환.
- **권한 관리**: 부서별/조직별 접근 권한 세분화 (Role-Based Access Control).

---
*본 문서는 프로젝트의 발전에 따라 지속적으로 업데이트되어야 합니다.*
