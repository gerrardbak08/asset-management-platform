# DESIGN.md — Work Platform
## 전사 안전보건통합관리 플랫폼 디자인 시스템

> AI 코딩 에이전트 전용 디자인 기준서.
> **모든 UI 작업 전 이 파일을 반드시 완독한다. 이 파일에 없는 값은 사용하지 않는다.**

---

## 1. Visual Theme & Atmosphere

### 한 문장 철학
> Work Platform은 현장의 복잡함을 수치로 요약해 관리자에게 "판단의 여유"를 준다.
> 수많은 숫자 사이에서 중요한 것이 먼저 보이고, 나머지는 배경으로 물러난다.

### 무드 키워드
정돈된 · 기업적 · 신뢰감 있는 · 데이터 중심 · 정제된 · 명료한 · 효율적 · 절제된

### 레퍼런스 포지셔닝

| 플랫폼 | 빌려올 것 | 버릴 것 |
|--------|----------|---------|
| 카카오 Corp | 따뜻함, 둥근 모서리, 여백, 신뢰 | 홍보성 히어로 |
| 네이버 Corp | 정보밀도, 정돈, 명료, 그리드 | 뉴스 카드 밀집 |
| Linear | 키보드 속도감, 깔끔한 목록 | 커맨드 팔레트 중심 |
| AWS Console | gray 배경 + 카드 부각, 그림자 최소 | 구식 폼 UI |

### 금지 형용사
귀여운, 장난스러운, 화려한, 혁신적, 예술적, 감성적. 이 단어가 떠오르면 즉시 반려.

---

## 2. Color Palette & Roles

### 기반 서피스

| 토큰 | Light | Dark | 역할 |
|------|-------|------|------|
| `background` | `hsl(210 17% 96%)` | `hsl(222 47% 8%)` | 페이지 배경. 카드가 위로 부각된다 |
| `card` | `hsl(0 0% 100%)` | `hsl(222 47% 11%)` | 카드·패널·모달 서피스 |
| `foreground` | `hsl(222 47% 11%)` | `hsl(210 40% 98%)` | 주요 텍스트 |
| `muted-foreground` | `hsl(215 16% 47%)` | `hsl(215 20% 65%)` | 보조 텍스트·레이블 |
| `border` | `hsl(214 32% 91%)` | `hsl(217 33% 20%)` | 카드·입력란·구분선 |
| `muted` | `hsl(210 17% 93%)` | `hsl(222 47% 12%)` | 헤더 구분·비활성 배경 |

### 브랜드 프라이머리

| 토큰 | 값 | 역할 |
|------|-----|------|
| `primary` | `hsl(221 83% 53%)` — blue-600 | 버튼 CTA, 링크, 포커스 링 |
| `primary-foreground` | `hsl(210 40% 98%)` | primary 위 텍스트. `text-white` 금지 |

### 시맨틱 4색 시스템 (의미 기반, 순서/장식 목적 사용 금지)

| 토큰 | 값 | 안전보건 역할 |
|------|-----|-------------|
| `danger` | `hsl(0 72% 51%)` — red-600 | 위험도 70+, 사고, 지연, 실패 |
| `warning` | `hsl(25 95% 53%)` — orange-500 | 위험도 40-69, 주의, 임박 |
| `info` | `hsl(217 91% 60%)` — blue-500 | 진행중, 중립 집계, AI 결과 |
| `success` | `hsl(142 71% 36%)` — green-600 | 위험도 0-39, 완료, 정상 |

각 색상은 `DEFAULT / foreground / subtle / border` 4개 변형:
```
bg-danger-subtle text-danger          ← 배지·칩 배경
border-warning-border text-warning    ← 테두리 강조
bg-success-subtle text-success        ← 완료 상태
```

### 사이드바 (라이트/다크 동일 — 항상 어두운 chrome)

| 토큰 | 값 | 역할 |
|------|-----|------|
| `sidebar` | `hsl(222 47% 8%)` | 사이드바 배경 |
| `sidebar-foreground` | `hsl(210 40% 96%)` | 메뉴 텍스트 |
| `sidebar-muted-foreground` | `hsl(215 20% 65%)` | 그룹 라벨 |
| `sidebar-accent` | `hsl(221 60% 15%)` | 활성 메뉴 배경 |
| `sidebar-accent-foreground` | `hsl(221 83% 70%)` | 활성 메뉴 텍스트 |

### 외부 서비스 CSS 변수 (변경 불가)

```css
--kakao-bg: #FEE500;
--kakao-fg: #3C1E1E;
```

### 컬러 강제 규칙

1. 순위·임의 구분에 색 사용 금지 — 1위/2위/3위는 순서 번호로
2. 한 카드에 의미색 2개 이상 동시 사용 금지. 충돌 시 더 심각한 쪽 우선
3. `primary`와 `info`는 다르다 — 브랜드 버튼/링크=primary, 정보 배지/진행=info
4. 4색 외 purple/pink/cyan/amber 추가 금지
5. `text-white` / `bg-white` 하드코딩 금지
6. 하드코딩 hex 금지 (`#13245A`, `text-[#...]`, `bg-[#...]`)
7. 색만으로 정보 전달 금지 → 색+아이콘+텍스트 3중 필수

### 안전보건 위험도 색상 매핑 (불변 규칙)

```
위험도 70 이상 → danger  (red)
위험도 40~69   → warning (orange)
위험도 0~39    → success (green)
```

---

## 3. Typography

### 폰트 패밀리

| 역할 | 폰트 | 사용처 |
|------|------|--------|
| Sans | **Pretendard** | 모든 UI 텍스트 |
| Mono | **DM Mono** | KPI 숫자, 직원번호, 코드 |

`body` 기본: `letter-spacing: -0.015em` (Pretendard 자간 최적화, 전역 적용)

### UI 텍스트 스케일

| 클래스 | px | line-height | weight | 용도 |
|--------|----|-------------|--------|------|
| `text-display-lg` | 30px | 1.1 | 700 | 페이지 최상단 h1 |
| `text-display-md` | 22px | 1.15 | 700 | 섹션 타이틀 |
| `text-heading-lg` | 18px | 1.3 | 600 | 카드 내 소제목 |
| `text-heading-md` | 16px | 1.35 | 600 | 카드 타이틀 |
| `text-heading-sm` | 14px | 1.4 | 600 | 컴팩트 카드 타이틀 |
| `text-body` | 13px | 1.55 | 400 | 본문 |
| `text-body-strong` | 13px | 1.55 | 600 | 강조 본문 |
| `text-sm` | 14px | — | — | Tailwind 기본 (일반 UI) |
| `text-caption` | 11px | 1.4 | 500 | 메타·보조정보·배지 |
| `text-micro` | 10px | 1.35 | 500 | 최소 라벨·범례 |

### KPI 숫자 스케일 (DM Mono, tabular-nums 필수)

| 클래스 | px | 용도 |
|--------|-----|------|
| `font-kpi-huge` | 40px | 대시보드 최상단 핵심 지표 1개 |
| `font-kpi-display` | 32px | 카드 내 주요 수치 |
| `font-kpi-metric` | 24px | 서브 수치·테이블 총합 |
| `font-kpi-inline` | 16px | 본문 안 수치 |

### 올바른 패턴

```tsx
// KPI 숫자
<span className="font-kpi-display font-mono tabular-nums text-danger">87</span>

// 카드 제목
<h3 className="text-heading-sm font-semibold text-foreground tracking-tight">전국 사고 현황</h3>

// 보조 정보
<span className="text-caption text-muted-foreground">2026.04.14 06:00 업데이트</span>
```

### 금지

```
text-[9px]              → WCAG 2.1 AA 위반, 즉시 삭제
text-[10px]             → text-micro
text-[11px], [12px]     → text-caption
text-[13px]             → text-body / text-sm
font-bold (카드 h2)      → font-semibold
```

---

## 4. Spacing

### 기본 원칙: 8px 그리드

| Tailwind | px | 용도 |
|----------|----|------|
| `p-3` / `gap-3` | 12px | 카드 내부 기본, 섹션 간 기본 |
| `p-4` / `gap-4` | 16px | 페이지 패딩 (모바일 기본) |
| `p-5` / `gap-5` | 20px | 대형 카드, 페이지 패딩 (md+) |
| `space-y-3` | 12px | 섹션 간 기본 간격 |
| `space-y-5` | 20px | 섹션 간 넉넉한 간격 |

이 8개 값 외의 숫자는 쓰지 않는다. 15px, 18px, 22px → 가장 가까운 기준값으로 교체.

---

## 5. Layout

### PageShell 패턴 (모든 platform 라우트 최외곽 필수)

```tsx
export default function SomePage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden bg-background">
      <Header title="페이지명" />
      <div className="flex-1 p-4 md:p-5 space-y-3 min-w-0">
        {/* 콘텐츠 */}
      </div>
    </div>
  );
}
// ✗ 금지: Fragment(<>)로 페이지 루트 대체
```

### 전체 구조

```
┌─────────────────────────────────────────┐
│  Header h-14 (56px)                     │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Content Area                │
│ (dark    │  p-4 (mobile) / p-5 (md+)   │
│  chrome) │  flex-1 overflow-y-auto      │
│          │                              │
└──────────┴──────────────────────────────┘
```

- Header: `h-14` (56px) — Sidebar logo와 수직 정렬
- Sidebar: 항상 어두운 chrome (`sidebar` 토큰), 고정 너비
- Content: `flex-1 min-w-0 overflow-hidden`

### 그리드 패턴

```tsx
// KPI 4열
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

// 대시보드 2열
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">

// 2:1 분할
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  <div className="lg:col-span-2">...</div>
  <div>...</div>
</div>

// 섹션 리스트
<div className="space-y-3">
```

### 이중 스크롤 금지

```tsx
// ✗ 금지
<div className="overflow-y-auto">
  <div className="overflow-y-auto">...</div>
</div>

// ✓ 올바름
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto">...</div>
</div>
```

---

## 6. Components

### 카드 시스템

```
section-card = "rounded-2xl border border-border bg-card"
kpi-card     = "rounded-2xl p-5 bg-card border border-border"

// 위험도별 강조 카드
danger:  "rounded-2xl border border-danger/40 bg-danger/5 p-5"
warning: "rounded-2xl border border-warning/40 bg-warning/5 p-5"
success: "rounded-2xl border border-success/40 bg-success/5 p-5"
```

**규칙:**
- 외곽: 반드시 `rounded-2xl`. `rounded-xl`은 카드 내부 요소에만
- 배경: `bg-card`. `bg-background`는 카드 서피스 금지
- 헤더 구분선: `px-4 py-3 border-b border-border bg-muted/30`

**카드 내부 표준 구조:**

```tsx
<div className="rounded-2xl border border-border bg-card p-5">
  {/* 헤더 */}
  <div className="flex items-center justify-between mb-3">
    <span className="text-caption font-medium text-muted-foreground">레이블</span>
    <Icon className="w-4 h-4 text-muted-foreground" />
  </div>
  {/* 주요 값 */}
  <div className="font-kpi-display font-mono tabular-nums text-foreground">87</div>
  {/* 트렌드 */}
  <div className="mt-1 text-caption text-danger flex items-center gap-1">
    <ArrowUp className="w-3 h-3" />
    <span>12 어제보다</span>
  </div>
</div>
```

### 버튼

| 변형 | 클래스 |
|------|--------|
| Primary | `bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl` |
| Secondary | `bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl` |
| Danger | `bg-danger text-danger-foreground hover:bg-danger/90 rounded-xl` |
| Ghost | `hover:bg-muted text-foreground rounded-xl` |
| Link | `text-primary hover:underline` |

**크기 표준:**
```
Small:  px-3 py-1.5 rounded-xl text-sm font-medium
Medium: px-4 py-2   rounded-xl text-sm font-medium  (기본)
Large:  px-5 py-2.5 rounded-xl text-base font-medium
```

**Transition 필수:** `transition-colors duration-150`
**금지:** `text-white` → 반드시 `text-primary-foreground`

### 배지·칩

```tsx
<span className="
  inline-flex items-center gap-1.5
  text-caption font-medium
  px-1.5 py-0.5 rounded-full
  bg-{color}-subtle text-{color}
">
  <span className="w-1.5 h-1.5 rounded-full bg-current" />
  {label}
</span>
```

### Status Line (좌측 색상 바 — 표준 패턴)

```tsx
// ✓ 표준 — 부모에 relative 필수
<div className="relative pl-4">
  <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-danger" />
  {/* 콘텐츠 */}
</div>

// ✗ 금지 패턴
// border-l-2, border-l-4, inline w-2 h-2 rounded-full
```

### 상태 표현 (색 + 아이콘 + 텍스트 3중 필수)

| 상태 | 색 | 아이콘 | 텍스트 |
|------|-----|--------|--------|
| 위험/초과 | `danger` | `AlertTriangle` / `XCircle` | "위험", "지연" |
| 경고/임박 | `warning` | `Clock` / `AlertCircle` | "주의", "임박" |
| 진행중 | `info` | `Loader2` / `ArrowRight` | "진행중" |
| 완료/안전 | `success` | `CheckCircle2` | "완료", "안전" |

### SectionHeader (전체에서 단 하나)

```
경로: src/components/features/dashboard/SectionHeader.tsx
다른 위치의 SectionHeader 금지 — 모두 이 경로에서 import
```

```tsx
export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-heading-sm font-semibold text-foreground tracking-tight">{title}</h2>
        {description && (
          <p className="text-caption text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
```

### 입력·셀렉트

```tsx
// Input
"w-full text-sm border border-border rounded-lg bg-card
 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary
 placeholder:text-muted-foreground transition-colors duration-150"

// Label
"text-caption font-medium text-muted-foreground mb-1.5 block"

// Error
"text-caption text-danger mt-1"
```

### 빈 상태 (Empty State)

```tsx
// ✗ 금지
<div>데이터가 없습니다.</div>

// ✓ 올바름 — 아이콘 + 감정적 메시지
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="text-4xl mb-3">{emoji}</div>
  <div className="text-heading-sm font-semibold text-foreground mb-1">{title}</div>
  <div className="text-caption text-muted-foreground">{description}</div>
</div>
```

**Work Platform 전용 문구:**
- 사고 없음: 🎉 "오늘은 사고 신고가 없습니다" / "안전한 하루를 보내고 있습니다"
- 서류 없음: 📋 "등록된 서류가 없습니다" / "서류를 업로드해 주세요"
- 교육 없음: 📚 "완료된 교육이 없습니다"

### 로딩 상태 (Skeleton)

```tsx
const skeleton = "animate-pulse bg-muted rounded-xl"

<div className="rounded-2xl border border-border bg-card p-5 space-y-3">
  <div className={`h-4 w-24 ${skeleton}`} />
  <div className={`h-8 w-16 ${skeleton}`} />
  <div className={`h-3 w-20 ${skeleton}`} />
</div>
```

### 사이드바 메뉴

```tsx
// 그룹 라벨
"text-micro uppercase tracking-wider text-sidebar-muted-foreground px-3 py-1.5"

// 메뉴 항목
"text-sm font-medium text-sidebar-foreground hover:bg-muted/10 rounded-lg px-3 py-2 transition-colors duration-150"

// 활성 항목
"bg-sidebar-accent text-sidebar-accent-foreground"
```

### AI 분석 결과 블록

```tsx
<div className="rounded-2xl border border-info/20 bg-info/5 p-4">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-info text-base">✦</span>
    <span className="text-caption font-semibold text-info">AI 분석</span>
  </div>
  <p className="text-body text-foreground leading-relaxed">{aiResult}</p>
</div>
```

### 위험 알림 Pulse

```tsx
<span className="relative flex h-2 w-2">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
</span>
```

---

## 7. Depth & Elevation

그림자는 최소화. **테두리 위주**로 서피스를 구분한다 (AWS Console 방식).

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `shadow-elev-1` | `0 1px 2px rgb(0 0 0 / 0.06)` | 기본 카드 |
| `shadow-elev-2` | `0 1px 3px rgb(0 0 0 / 0.08)` | hover·드롭다운 |
| `shadow-elev-3` | `0 2px 6px rgb(0 0 0 / 0.08)` | 모달·팝오버 |

- 카드 기본: 그림자 없음 + `border border-border`
- hover 시: `shadow-elev-2` 선택적 추가
- 모달/오버레이: `shadow-elev-3`
- shadow 종류 4개 이상 금지

---

## 8. Motion & Interaction

```
모션은 3가지 상황에만: 상태 변화, 등장, 피드백
지속 시간: 200ms 이하 (업무용)
transition-all 금지 → transition-colors / transition-transform
```

| 상황 | 값 |
|------|-----|
| 버튼·인터랙티브 | `transition-colors duration-150` |
| 카드 hover | `transition-transform duration-150 hover:-translate-y-0.5` |
| 모달 등장 | opacity 0→1 + translateY 8px→0, 200ms |
| 페이지 전환 | 없음 또는 100ms 이하 페이드 |
| KPI 카운트업 | 마운트 시 0→목표값, 800ms ease-out |

**금지:** bounce, spring 애니메이션, 400ms 초과 transition

---

## 9. Responsive Behavior

**데스크톱 퍼스트.** 모바일은 기능 보존이 목표.

| 브레이크포인트 | 전략 |
|--------------|------|
| `< md` (768px) | 1열, 사이드바 숨김 → 하단 MobileNav |
| `md` (768px+) | 2열, 사이드바 표시 |
| `lg` (1024px+) | 여백 확장 (`p-5`) |
| `xl` (1280px+) | 최대 너비 없음 |

```tsx
"grid grid-cols-2 sm:grid-cols-4 gap-3"            // KPI
"grid-cols-1 md:grid-cols-2"                        // 대시보드
<span className="hidden sm:inline">새 회의록</span>  // 반응형 라벨
```

터치 타깃 최소 44×44px 필수.

---

## 10. Accessibility

- 최소 폰트: `text-micro` (10px) — 9px 미만 즉시 삭제 (WCAG 2.1 AA)
- 색만으로 정보 전달 금지 → 색+아이콘+텍스트 3중 필수
- 모든 인터랙티브 요소: `focus-visible:ring-2 focus-visible:ring-primary`
- 버튼 최소 터치 영역: 44×44px
- 아이콘: `aria-label` 또는 `aria-hidden="true"`

---

## 11. Dark Mode

Work Platform은 **다크모드 기본**. 라이트모드 추후 지원.
**예외:** 지도 화면은 사용자 토글로 다크/라이트 전환 — 의도적 설계, 건드리지 않음.

---

## 12. 안전보건 도메인 전용 패턴

### 위험도 함수

```tsx
function getRiskStyle(score: number) {
  if (score >= 70) return { token: 'danger',  label: '위험', icon: AlertTriangle }
  if (score >= 40) return { token: 'warning', label: '주의', icon: AlertCircle }
  return              { token: 'success', label: '안전', icon: CheckCircle2 }
}
```

### 사고 심각도

```
사망·중상:  Status Line danger + 목록 상단
경상:       Status Line warning
아차사고:   Status Line info
```

### 법정 서류 상태

```
유효:      success 배지
만료 7일 전: warning 배지 + pulse
만료:      danger 배지
검토중:    info 배지
```

### 교육 이수율

```
90% 이상 → success
70~89%   → warning
70% 미만 → danger
```

### 인증 페이지

```tsx
// ✗ 금지
"bg-[#13245A]" / "text-amber-400"
// ✓ 올바름
"bg-primary" / "text-warning"
// 카카오 버튼 (CSS 변수 — 변경 불가)
style={{ backgroundColor: 'var(--kakao-bg)', color: 'var(--kakao-fg)' }}
```

---

## 13. File Structure

```
src/
├── app/
│   ├── (auth)/      → 인증 페이지 (bg-primary 배경)
│   └── (platform)/  → 메인 앱 (PageShell 필수)
├── components/
│   ├── ui/          → 기본 컴포넌트 (Button, Badge, Input…)
│   ├── features/
│   │   └── dashboard/
│   │       └── SectionHeader.tsx  ← 전체에서 유일한 SectionHeader
│   └── layout/      → Header, Sidebar
├── lib/
│   └── api/         → API 함수 전용
└── styles/
    └── globals.css  → CSS 변수 전용 (인라인 hex 금지)
```

---

## 14. Do's and Don'ts

### ✅ DO

- 카드 외곽: `rounded-2xl`
- 모든 상태 표현: 색+아이콘+텍스트 3중
- 숫자 KPI: `font-mono tabular-nums`
- 시맨틱 토큰: `bg-card`, `text-foreground`, `border-border`
- 버튼 텍스트: `text-primary-foreground`
- 인증 배경: `bg-primary`
- Empty State: 아이콘 + 감정적 메시지
- 로딩: Skeleton 사용
- AI 결과: info 색 전용 블록

### ❌ DON'T

- `text-white` / `bg-white` 하드코딩
- `bg-background`를 카드 서피스에
- `text-[9px]`~`text-[12px]` 하드코딩
- `rounded-xl` 카드 외곽
- 4색 외 purple/pink/cyan/amber
- `font-bold` 카드 h2
- `overflow-y-auto` 이중 적용
- Fragment(`<>`) 페이지 루트
- 임의 hex 인라인
- 3D 아이콘
- 아이콘 겹침
- shadow 4단계 이상
- 400ms 초과/bounce/spring

---

## 15. Tech Stack Context

```
Framework: Next.js 15 (App Router) + React 19
Styling:   Tailwind CSS (JIT) + CSS Variables
UI Lib:    Radix UI
Font:      Pretendard (sans) + DM Mono (mono)
Icons:     lucide-react (2D only)
Animation: motion/react (framer-motion v11+)
Theme:     class-based dark mode (.dark on <html>)
```

---

## 16. Agent Prompt Guide

### 빠른 색상 레퍼런스

```
배경:        bg-background
카드:        bg-card
주요 텍스트: text-foreground
보조 텍스트: text-muted-foreground
브랜드:      bg-primary / text-primary
위험:        text-danger / bg-danger-subtle
경고:        text-warning / bg-warning-subtle
진행중:      text-info / bg-info-subtle
완료:        text-success / bg-success-subtle
```

### 새 페이지 생성

```
"DESIGN.md를 따라 [페이지명] 페이지를 만들어줘.
- 루트: PageShell div (flex flex-col h-full overflow-y-auto bg-background)
- 카드: section-card (rounded-2xl border border-border bg-card)
- 숫자: font-kpi-metric font-mono tabular-nums
- 상태: 4색 (danger/warning/info/success)
- 텍스트: 시맨틱 토큰 (text-foreground, text-muted-foreground)"
```

### 새 카드 컴포넌트 생성

```
"DESIGN.md 기준으로 [목적] 카드를 만들어줘.
- 외곽: rounded-2xl border border-border bg-card
- 헤더: px-4 py-3 border-b border-border bg-muted/30
- 제목: text-heading-sm font-semibold text-foreground tracking-tight
- 수치: font-kpi-metric font-mono tabular-nums
- 배지: text-caption bg-{color}-subtle text-{color} rounded-full"
```

### UI 감사 요청

```
"DESIGN.md 기준으로 [파일 경로]를 감사해줘.
위반 항목을 파일명·줄번호·위반내용·수정방법 순서로.
수정은 내가 확인 후 진행할게."
```

### 에이전트 작업 전 체크리스트

```
□ 이 컴포넌트가 이미 섹션 6에 정의되어 있는가?
□ 이 색상이 시맨틱 토큰으로 표현 가능한가?
□ 이 폰트 크기가 스케일 내에 있는가?
□ 카드 외곽이 rounded-2xl인가?
□ 버튼 텍스트가 text-primary-foreground인가?
□ 상태 표현이 색+아이콘+텍스트 3중인가?
□ PageShell div인가?
□ 이중 스크롤 없는가?
□ 하드코딩 hex 없는가?
□ 3D 아이콘 없는가?
□ 아이콘 겹침 없는가?
```

---

*Work Platform DESIGN.md v2.0 — Final | 2026-04-14*
