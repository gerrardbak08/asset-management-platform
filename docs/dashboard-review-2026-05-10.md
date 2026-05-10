# 대시보드 코드/디자인 검토 — 2026-05-10

> 범위: `apps/web` (자산현황 대시보드 5개 서브탭 + 공용 셸/UI 프리미티브) + `apps/api` 부팅
> 환경: Node 25.9 / pnpm 9.15.9 / Vite 5.4 / React 18.3 / motion 11.18.2 / Tailwind 3.4

---

## 0. 요약

- **전체 코드 품질**: 양호. typecheck 클린, Korean 헤더 100% 준수, Card+SectionHeader 패턴 일관, 디자인 토큰 체계 잘 정의됨.
- **이번 세션에서 해결한 차단 이슈 1건**: dev 환경에서 로그인 후 401 루프(원인: 시스템 `NODE_ENV=production` 누출).
- **DESIGN.md 위반 1건 수정**: `AssetDrilldownSubtab`이 hex 컬러 인라인 사용.
- **모션 시스템 도입**: `motion` 패키지 설치돼 있으나 미사용 → 공용 헬퍼(`lib/motion.ts`)로 표준화하고 핵심 동선(탭 전환·KPI 카드 등장·차트 그리기)에 적용.
- **잔존 권고**: ESLint v9 flat config 마이그레이션, 번들 코드 스플리팅, 데이터 시드 부재(`/api/mom` 404).

---

## 1. 환경/부팅 이슈 (해결됨)

### 1-1. dev 서버 진입 실패 — “500 응답 본문 파싱 실패”
**증상**: `/api/auth/me`, `/api/auth/login`이 ECONNREFUSED. 이후 쿠키가 설정돼도 후속 요청이 401.

**근본 원인 2가지**:
1. `apps/api/.env` 부재 → `config.ts`의 zod 검증이 SESSION_SECRET/AUTH_PEPPER 빈 값으로 throw하며 부팅 실패.
2. **시스템 셸 환경에 `NODE_ENV=production`이 export 돼 있음** → `setSessionCookie`의 `secure: process.env.NODE_ENV === 'production'`가 `true`가 되어 dev HTTP localhost에서 브라우저가 쿠키를 후속 요청에 포함하지 않음.

**해결**:
- `apps/api/.env` 생성 (랜덤 32hex SESSION_SECRET, 24hex AUTH_PEPPER, sqlite, dev admin 비밀번호 `admin1234!`).
- `apps/api/package.json`, `apps/web/package.json`의 `dev` 스크립트에 `NODE_ENV=development` 명시 → 시스템 환경 누출 차단.
- Prisma `migrate dev` + `db:seed` + `apps/api/uploads/` 폴더 생성.

**검증**: `curl` 로그인 → `/api/auth/me` 200 OK 확인. 응답 헤더에서 `Secure` 플래그 사라짐.

### 1-2. ESLint v9 flat config 누락 (잔존 — 별도 작업)
- `pnpm -r lint` 실패: `eslint.config.js` 없음. `.eslintrc.*`도 없음.
- 영향: 자동 lint 게이트 동작 안 함. typecheck는 모두 통과.
- 권고: `eslint.config.js` 생성 (typescript-eslint v8 + react-hooks v5 + react-refresh v0.4 — package.json에 이미 의존성 존재).

### 1-3. 번들 사이즈 경고 (잔존)
- `vite build` 결과 단일 청크 928 KB (gzip 277 KB). Recharts/motion/radix가 주범.
- 권고: 라우트 단위 dynamic import (`React.lazy(() => import('@/pages/Buildings'))` 등) 또는 `manualChunks`로 vendor 분리.

### 1-4. 데이터 시드 부재 (잔존 — 운영 워크플로 영역)
- `/api/mom?period=2026-03` → `NOT_FOUND` (스냅샷 없음). admin 시드만 있음.
- 대시보드는 EmptyState로 “`pnpm --filter api etl:migrate` 실행하라”고 안내하므로 UX는 정상.
- V16 데이터를 보유한 환경에서 `etl:extract` → `etl:migrate` → `etl:verify` 순서로 적재 필요.

---

## 2. 코드 품질 — 발견 및 처리

### 2-1. DESIGN.md §2 시맨틱 토큰 위반 — `AssetDrilldownSubtab.tsx` (수정 완료)

원본은 hex 컬러를 인라인 사용해 light/dark 토글이 깨졌고, brand 색이 토큰과 분리됨.

| 위치 | Before | After |
|---|---|---|
| 브레드크럼 chip | `bg-[rgba(30,58,95,0.06)] text-[#1E3A5F]` | `bg-primary/10 text-primary` |
| `DrillBtn` active | `border-[#1E3A5F] bg-[#1E3A5F] text-white` | `border-primary bg-primary text-primary-foreground` |
| `LocationTable` 본사 row | `style={{ color: '#1E3A5F' }}` | `text-primary` |
| 〃 매장 row | `'#059669'` | `text-success` |
| 〃 물류 row | `'#7C3AED'` | `text-info` |
| 〃 합계 row | `bg-[rgba(30,58,95,0.06)] text-[#1E3A5F]` | `bg-primary/10 text-primary` |

다크 모드에서 자동으로 적절한 톤이 적용됩니다.

### 2-2. 데드 코드 제거 — `AssetDrilldownSubtab.EquipmentTable` (수정 완료)
`const inv = r.hq + r.store + r.logistics; ... void inv;` — 사용처 없음. 제거.

### 2-3. ExecInsight 가독성 (수정 완료)
- 3개 인사이트 문장이 한 `<p>` 태그에 공백으로 join돼 한 단락으로 흐름 → bullet `<ul>`로 분리, 각 항목 앞에 info 색 dot.
- 결과: 인사이트가 시각적으로 분절되어 임원이 한눈에 스캔 가능.

### 2-4. `AssetKpiCards` 드릴다운 요약 (수정 완료)
- `space-y-0.5`(2px)는 한국어 본문에 너무 빠듯 → `space-y-1`(4px) + `leading-relaxed`.
- 라벨(`규모`/`구성`/`변동`)을 고정폭 `w-9` + uppercase tracking으로 시각 정렬 → 문장 시작 좌측이 정렬됨.

### 2-5. `AssetKpiCards` 카드 내부 호흡 (수정 완료)
- 라벨→KPI 숫자: `mt-2` → `mt-3`
- KPI 숫자→전월비: `mt-1` → `mt-1.5`
- 전월비→세부버튼: `mt-3` → `mt-4`

3분할 KPI 카드의 위계가 더 분명해집니다 (라벨/주값/보조값/액션).

---

## 3. 모션 시스템 — 신규 도입

### 3-1. `apps/web/src/lib/motion.ts` 생성
공용 variants/transition 상수 모음. 페이지 전반에서 모션 톤 일관 유지.

```ts
fadeTransition       // duration 0.18s, ease-out
cardItemVariants     // opacity 0→1, y 6→0, 0.28s
staggerContainerVariants  // 자식 60ms 간격, 첫 자식 40ms 지연
tabFadeVariants      // opacity 0→1, y 4→0
CHART_ANIM_MS = 800  // Recharts 통일 곡선/막대 그리기 시간
```

### 3-2. 적용 지점

| 컴포넌트 | 적용 모션 | 파일 |
|---|---|---|
| `Dashboard` 5개 탭 콘텐츠 | tab fade-in (탭 전환 시 매번 재생) | `pages/Dashboard.tsx` |
| `HeroKPI` 3카드 grid | stagger entrance (총자산 → 도넛 → 이슈 순) | `dashboard/HeroKPI.tsx` |
| `HeroKPI` 도넛 Pie | `animationDuration={800}` ease-out | 〃 |
| `AssetKpiCards` 3카드 grid | stagger entrance + `whileHover y:-2` | `dashboard/AssetKpiCards.tsx` |
| `AssetKpiCards` 드릴다운 패널 | `AnimatePresence` height + opacity 토글 | 〃 |
| `AssetTrendChart` 3 라인 | `animationDuration={800}` | `dashboard/AssetTrendChart.tsx` |
| `MomBarChart` Bar | `animationDuration={800}` | `dashboard/MomBarChart.tsx` |
| `AcquisitionHistorySubtab` Bar+Line | `animationDuration={800}` | `dashboard/AcquisitionHistorySubtab.tsx` |
| `LeaseStatusSubtab` 3개 차트 (Bar/Bar/Scatter) | `animationDuration={800}` | `dashboard/LeaseStatusSubtab.tsx` |
| `SuppliesOpsSubtab` Bar | `animationDuration={800}` | `dashboard/SuppliesOpsSubtab.tsx` |

### 3-3. 의도적으로 적용하지 않은 곳
- 사이드바/헤더/모달: 이미 Radix가 모션을 제공하거나, 자주 깜빡이면 피로도 ↑.
- 테이블 행: 행 단위 stagger는 데이터 다수 행에서 산만 (특히 LocationTable 같은 정적 표).
- Recharts `Tooltip`/`Legend`/축: 기본값 사용 (인터랙션 응답성이 중요).

### 3-4. `prefers-reduced-motion` 대응 (잔존)
- 현재 motion 11에 `MotionConfig reducedMotion="user"` 미적용. 사용자가 OS에서 모션 감소를 선택해도 fade가 재생됨.
- 권고: `main.tsx`에서 `<MotionConfig reducedMotion="user">`로 전체 래핑. (1줄 변경, 추후 별도 PR로)

---

## 4. 변경 파일 목록

```
apps/api/.env                                                  (신규)
apps/api/package.json                                          (dev 스크립트)
apps/api/uploads/                                              (신규 폴더)
apps/web/package.json                                          (dev 스크립트)
apps/web/src/lib/motion.ts                                     (신규)
apps/web/src/pages/Dashboard.tsx                               (탭 fade)
apps/web/src/components/dashboard/HeroKPI.tsx                  (stagger + Pie 모션)
apps/web/src/components/dashboard/AssetKpiCards.tsx            (stagger + AnimatePresence + 호흡)
apps/web/src/components/dashboard/AssetTrendChart.tsx          (Line 모션)
apps/web/src/components/dashboard/MomBarChart.tsx              (Bar 모션)
apps/web/src/components/dashboard/AcquisitionHistorySubtab.tsx (Bar+Line 모션)
apps/web/src/components/dashboard/LeaseStatusSubtab.tsx        (3 차트 모션)
apps/web/src/components/dashboard/SuppliesOpsSubtab.tsx        (Bar 모션)
apps/web/src/components/dashboard/AssetDrilldownSubtab.tsx     (hex → 토큰 + 데드코드 제거)
apps/web/src/components/dashboard/ExecInsight.tsx              (단락 → bullet)
docs/dashboard-review-2026-05-10.md                            (이 문서)
```

---

## 5. 검증

| 항목 | 결과 |
|---|---|
| `pnpm -r typecheck` | ✅ 3개 워크스페이스 모두 통과 |
| `pnpm --filter web build` | ✅ 1.96s, 928 KB 청크 (경고는 코드 스플리팅 권고) |
| `pnpm -r lint` | ⚠️ ESLint v9 flat config 누락 (코드 변경 무관, 별도 작업 필요) |
| API `POST /api/auth/login` | ✅ 200, Secure 플래그 없음 |
| API `GET /api/auth/me` (쿠키) | ✅ 200, admin 반환 |
| Vite HMR | ✅ 모든 변경에 대해 에러 없이 갱신 (모니터로 확인) |

---

## 6. 후속 권고 (이번 세션 범위 밖)

1. **ESLint v9 flat config 마이그레이션** — `eslint.config.js` 작성. typescript-eslint v8/react-hooks v5는 이미 의존성에 있음.
2. **라우트 단위 코드 스플리팅** — `React.lazy()` + `Suspense` (대시보드 첫 페인트 가속).
3. **`MotionConfig reducedMotion="user"`** — 접근성. main.tsx 1줄 변경.
4. **V16 데이터 ETL** — `pnpm --filter api etl:extract && etl:migrate && etl:verify`로 실데이터 적재 후 시각 검증.
5. **`SECURITY` 검토** — `.env`의 dev 비밀번호(`admin1234!`)는 prod 배포 시 반드시 교체. `.env`는 `.gitignore`에 포함됐는지 확인 필요.
