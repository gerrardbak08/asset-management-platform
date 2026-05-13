// 모바일 상단 헤더 — < md 전용. CI 로고 + 시스템명 표시
import { AsungSymbol } from './AsungLogo';

export function MobileHeader() {
  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 md:hidden">
      <AsungSymbol />
      <div className="min-w-0">
        <div className="text-heading-md font-bold leading-snug tracking-tight text-primary">
          전사 자산관리 시스템
        </div>
        <div className="mt-0.5 text-micro text-muted-foreground">2026년 3월 · 전사 자산 현황</div>
      </div>
    </header>
  );
}
