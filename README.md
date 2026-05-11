# 전사 자산관리 플랫폼

V16 단일 HTML 대시보드(`SJ_대시보드_V16.html`)를 다중 사용자 서버 기반 플랫폼으로 전환하는 1단계 구현.
디자인 시스템은 같은 회사의 안전보건 플랫폼(Work Platform)과 공유한다 — `DESIGN.md` 가 단일 진실원.

## 스택 (1단계 확정)

- 프론트 — Vite 5 + React 18 + TypeScript 5 + Tailwind CSS + Radix UI + Pretendard + DM Mono + Recharts
- 백엔드 — Node.js 20+ + Fastify 4 + Prisma 5 (PR #2 부터 추가)
- DB — PostgreSQL 15+ (운영 기준)
- 호스팅 — Railway (Vercel 대안 1순위) → 사내 서버 (장기 운영 후보)
- 디자인 시스템 — DESIGN.md 토큰·컴포넌트·다크모드 기본 전면 적용

## 구조 (모노레포 — pnpm workspaces)

```
.
├── apps/
│   ├── web/                # Vite + React 프론트 (PR #1 — 본 PR)
│   └── api/                # Fastify 백엔드 (PR #2 부터)
├── packages/
│   └── shared/             # 타입 + zod 스키마 (PR #2 부터)
├── docs/
│   ├── spec.md             # 1단계 명세서
│   ├── api.md
│   └── ...
├── plan.md                 # 1단계 구현 계획
├── checklist.md            # 실행 체크리스트
├── context-notes.md        # 분석·결정 메모
├── DESIGN.md               # 디자인 기준서 (Work Platform 공유)
└── CLAUDE.md               # AI 코딩 가이드라인
```

## 시작

### 사전 요구
- Node.js 20+ (`.nvmrc` 참조)
- pnpm 9+ (`corepack enable` 또는 `npm i -g pnpm`)

### 개발 서버

```bash
pnpm install
pnpm dev          # apps/web 만 띄움 (5173)
```

브라우저로 http://localhost:5173 접속. 다크 톤 화면이 뜨고 좌측 사이드바가 보이면 PR #1 검증 완료.

### 검증

```bash
pnpm typecheck    # 모든 패키지 0 오류
pnpm build        # 모든 패키지 빌드 성공
pnpm lint         # ESLint 0 경고
```

## 환경변수

`.env.example` 을 `.env` 로 복사 후 채운다 (`.env` 는 gitignore).

| 변수 | 1단계 기본값 | 용도 |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | DB 연결 |
| `HOST` | `::` | Railway/Fastify 공개 네트워크 바인딩 |
| `SESSION_SECRET` | (생성 필요) | 세션 쿠키 서명 |
| `AUTH_PEPPER` | (생성 필요) | bcrypt pepper |
| `STORAGE_DRIVER` | `local` | 저장소 어댑터 |
| `UPLOADS_DIR` | `./uploads` | 사진 저장 경로 |
| `KAKAO_JS_KEY` | — | Kakao Maps JS API |
| `KAKAO_REST_KEY` | — | Kakao Maps REST API |
| `CORS_ORIGIN` | `http://localhost:5173` | 백엔드 CORS |

상세 — [docs/spec.md §9](docs/spec.md).

## 문서

- [plan.md](plan.md) — 1단계 구현 계획 + 9건 확정 결정
- [checklist.md](checklist.md) — 실행 체크리스트 (A~K)
- [docs/spec.md](docs/spec.md) — 1단계 명세서 (도메인·API·DB·ETL·검증)
- [docs/deployment-railway.md](docs/deployment-railway.md) — Vercel 이외 Railway 배포 가이드
- [docs/system-design-2026-05-10.md](docs/system-design-2026-05-10.md) — 2단계 이후 시스템 설계
- [DESIGN.md](DESIGN.md) — Work Platform 디자인 기준서 (양 플랫폼 공유)
- [context-notes.md](context-notes.md) — 분석 / 결정 / 보류 / 사용자 결정 메모
- [CLAUDE.md](CLAUDE.md) — AI 코딩 가이드라인 (Karpathy 10조)

## PR 진행 현황 (docs/spec.md §11 기준)

- [x] PR #1 — 모노레포 스캐폴드 + Tailwind + DESIGN.md 토큰 + 기본 레이아웃
- [x] PR #2 — Prisma 스키마 + SQLite migrate + ETL 스크립트 (V16 → DB) — **8/8 검증 PASS**
- [x] PR #3 — 인증 (login/me/logout) + 4역할 가드 + 로그인 페이지 — **6/6 테스트 PASS**
- [x] PR #4 — 건물 목록 + 5탭 드로어 + 사진 업로드 — **4/4 테스트 PASS** (viewer 403)
- [x] PR #5 — 자산현황 페이지 + Recharts 차트 5종 + MoM API
- [x] PR #6 — 사업장 검색 + 매니저 뷰 + 데이터 조정 (xlsb 시트 매핑)
- [x] PR #7 — 관리자 패널 + 비밀번호 변경 + 인쇄 CSS (다크→라이트)
- [x] 2단계 기반 — 임대계약 / 유지보수 / 비품 원장 / 감가상각 모델·API·화면
- [x] Railway 배포 설정 — `railway.toml` + Fastify `HOST=::` + 배포 가이드

자세한 진척과 임시 admin 비밀번호는 [docs/wakeup-report.md](docs/wakeup-report.md) 참조.

## 라이선스

비공개 사내 도구.
