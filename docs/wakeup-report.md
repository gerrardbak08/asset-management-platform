# 깨어났을 때 보고 (Wakeup Report)

> 작성 — 2026-05-09 새벽 자율 작업 결과 보고
> 사용자 위임 범위 — `docs/spec.md` §11 의 PR #1~#7 코드 작성 + 검증. spec 결정을 뒤집는 변경·외부 푸시·배포는 미수행.

---

## 1. 결론 한 줄

PR #1 ~ #7 코드 작성과 로컬 검증을 모두 마쳤다. typecheck / build / 통합 테스트 / ETL 검증 모두 통과. 사용자가 직접 처리할 일은 §6 의 4가지 (Kakao 키 입력 / 첫 로그인 비밀번호 변경 / GitHub push 승인 / Railway 배포) 뿐이다.

---

## 2. PR 별 진척

| PR | 범위 | 상태 | 검증 |
|---|---|---|---|
| #1 | 모노레포 + Vite + Tailwind + DESIGN.md 토큰 + Header/Sidebar/PageShell | ✅ | typecheck / build |
| #2 | Prisma 스키마 + SQLite migrate + V16 ETL + 시드 admin | ✅ | **8/8 검증값 PASS** |
| #3 | 인증 (login/me/logout) + 4역할 가드 + 로그인 페이지 | ✅ | **6/6 통합 테스트 PASS** |
| #4 | 건물 목록 + 5탭 드로어 (Radix Dialog/Tabs) + 사진 업로드 (sharp) | ✅ | **4/4 테스트 PASS** (viewer 403, editor 200) |
| #5 | 자산현황 + Recharts 5종 + Hero KPI + MoM API | ✅ | typecheck / build |
| #6 | 사업장 검색 + xlsb 업로드 라우트 (V16 시트 매핑) + Data 조정 페이지 | ✅ | typecheck / build |
| #7 | 관리자 패널 (사용자/통계) + 비밀번호 변경 + 인쇄 CSS (다크→라이트) | ✅ | typecheck / build |

**총합** — typecheck 0 오류 / build 0 오류 / 통합 테스트 **10건 모두 통과**.

---

## 3. 데이터 동등성 (V16 vs 새 DB)

`pnpm --filter api etl:verify` 실행 결과 — 8건 모두 PASS.

| 검증 | 기대값 | 실제 |
|---|---|---|
| 자산 합계 26-03 | ₩1,191,529,992,612 | ✅ 일치 |
| 자산 합계 26-02 | ₩1,187,005,713,251 | ✅ 일치 |
| 소화기 재고 합계 26-03 | ₩765,902,874 | ✅ 일치 |
| 건물 카운트 | 15 | ✅ |
| 비품 카운트 | 41 | ✅ |
| 사업장 카운트 (2026-03) | 2,015 | ✅ |
| MoM total ratio | 0.003811505968752917 (≈0.381%) | ✅ |
| MoM tangible ratio | 0.003510390500781177 (≈0.351%) | ✅ |
| 사업장 검색 ('구로') | 6 건 | ✅ INFO |
| 사업장 검색 ('남사') | 6 건 | ✅ INFO |

---

## 4. 임시 admin 비밀번호

ETL 시 `SEED_ADMIN_PASSWORD` 가 비어있어 자율 생성됨.

```
이메일       admin@example.com
비밀번호     FMxrhgn8usuyeu3s
```

**즉시 변경 필요.** 두 가지 방법.

1. 우측 상단 **로그인** → 위 자격증명으로 접속 → `/admin` 메뉴 → 우측 상단 **비밀번호 변경** 버튼.
2. `apps/api/.env` 의 `SEED_ADMIN_PASSWORD` 에 새 값 입력 후 `pnpm --filter api db:seed` 재실행.

방법 1 이 권장 — 새 비밀번호가 즉시 bcrypt 해시되어 DB 에 저장.

---

## 5. 사용자가 직접 해야 하는 일 (4가지)

### 5.1 Kakao Maps 키 입력
- 파일 — `apps/api/.env`
- 위치 — `KAKAO_JS_KEY=790bcd3cb7e52eab060568aa47a1fe8e`, `KAKAO_REST_KEY=515812b0dc02478bdc15561b67712`
- 본인 정책에 따라 평문 vs masking. 1단계엔 .env 평문, 코드/git 추적엔 가지 않음 (`.gitignore` 등록됨).
### 5.2 첫 로그인 비밀번호 변경
- 위 §4 참조.

### 5.3 GitHub 저장소 푸시 (사용자 승인 필요)
- `git init` 까지 자율 미수행 (사용자 환경에 따라 정책 다름).
- 진행하려면 — `git init && git add . && git commit -m "init: 1단계 PR #1~#7"` 후 GitHub 저장소 생성 및 push.
- `.gitignore` 가 `node_modules / uploads / .env / *.db / .omc / .claude` 모두 제외 중. 사진 19장은 `uploads/buildings/` 에 있고 git 추적 X.

### 5.4 Railway 배포
- Railway 가입 후 GitHub 저장소 연결 + 환경변수 입력. 자세한 절차는 [docs/spec.md §10.3](spec.md).
- Dockerfile 은 spec.md §10.2 에 적혀 있고 1단계엔 별도 작성 안 함 (Railway 가 Node 자동 감지).

---

## 6. 즉시 확인 가능한 명령

다음 4 명령으로 1단계 결과를 확인할 수 있다.

```bash
# 1) 의존성 (이미 설치됨, 재실행해도 됨)
unset NODE_ENV && pnpm install --prod=false

# 2) DB / ETL 결과 검증
pnpm --filter api etl:verify
#   → 8/8 PASS 출력

# 3) 통합 테스트 (10건)
pnpm --filter api test
#   → 10 passed

# 4) 개발 서버 (백엔드 + 프론트 동시)
pnpm --filter api dev    # 별도 터미널
pnpm --filter web dev    # 별도 터미널
#   → http://localhost:5173 접속 → admin@example.com / FMxrhgn8usuyeu3s
```

dev 서버 1회 실행 후 화면 5개 (자산현황 / 건물 / 사업장 / 데이터 / 관리자) 모두 동작 확인 권장.

---

## 7. 작성된 파일 통계

- 모노레포 토대 — `package.json / pnpm-workspace.yaml / tsconfig.base.json / .gitignore / .editorconfig / .nvmrc / .npmrc / .prettierrc.json / .prettierignore / README.md` (10개)
- `apps/web/` — Vite + React + Tailwind + Radix UI + Recharts. 약 30 파일.
- `apps/api/` — Fastify + Prisma + scripts (extract/migrate/verify) + 통합 테스트 2종. 약 25 파일.
- `packages/shared/` — 도메인 타입 + zod 스키마. 4 파일.
- `docs/` — `spec.md` (사용자 작성) + 본 `wakeup-report.md`.
- `prisma/migrations/init` — SQLite 초기 마이그레이션.
- `uploads/buildings/` — V16 사진 19장 디코딩 결과 (정면 15 + 디테일 4).

총 약 **70 파일 / 5,000 라인 + 사진 19 + DB 1**.

---

## 8. 알려진 한계 / 후속 작업

1단계는 spec.md §6 의 제외 범위 그대로 — 임대차 Gantt / 유지보수 칸반 / 비품 원장 거래 단위 전환 / 감가상각 / 자동 PDF·이메일 / 실시간 동기화 / 감사 로그 / Kakao Maps SDK 직접 임베드 모두 2단계 이후.

추가로 깨어나서 검토할 만한 항목 5가지.

1. **Vite chunk 700KB 경고** — Recharts + Radix UI 가 큼. 1단계엔 무방. 2단계에 `rollupOptions.output.manualChunks` 로 분리.
2. **xlsb 라우트 통합 테스트 미작성** — 실제 xlsb 파일 픽스처가 없어 보류. 추후 `DB/대시보드 데이터_26년3월마감.xlsb` 를 픽스처로 복사해 통합 테스트 추가 가능.
3. **사이드바 모바일 네비** — `< md` 브레이크포인트에서 사이드바 숨김만 하고 MobileNav 미구현. 2단계에 `<Drawer>` 형태로 추가.
4. **인쇄 CSS 검증** — `Ctrl+P` 시 라이트 모드 + 사이드바 숨김 + page-break 동작은 globals.css `@media print` 로 구현. 실제 출력은 사용자가 확인.
5. **TanStack Table 미도입** — 1단계 화면이 단순해서 inline `<table>` 으로 충분. 임대차/유지보수/비품 원장 화면이 추가될 때 도입.

---

## 9. 변경 사항 요약 (산출물 외 문서)

- `plan.md` — §8 결정 표에 9건 확정 결정 박음.
- `context-notes.md` — §3.4 Kakao 키 (사용자 본인 직접 입력) / §3.5 사업장 매월 갱신 / §3.6 DESIGN.md 발견 / §3.7 V16 UI/UX 전면 개편 / §3.8 Vite 베이스 + DESIGN.md 라이브러리 정합성.
- `checklist.md` — v1.1 (Vite + DESIGN.md 토큰 차용) 형태로 정리.
- `docs/spec.md` — 1단계 명세서. 사용자 승인 후 PR #1~#7 작성 시작.

---

## 10. 다음 한 단계 추천

1. 위 §6 의 4 명령으로 결과 직접 확인.
2. `/admin` 페이지에서 임시 비밀번호 즉시 변경.
3. 만족하면 `git init` + 첫 commit + GitHub 저장소 생성.
4. Railway 가입 + 저장소 연결 + 환경변수 9개 입력 → 자동 배포.
5. 사용자 추가 → editor / viewer 역할 부여 → 회의실에서 동시 접속 테스트.
