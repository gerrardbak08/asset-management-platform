// 모바일 상단 헤더 — < md 전용. CI 로고 + 시스템명 표시
import { AsungSymbol } from './AsungLogo';

export function MobileHeader() {
  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-2.5 border-b border-gray-200 bg-white px-4 md:hidden">
      <AsungSymbol />
      <div className="min-w-0">
        <div className="text-[15px] font-bold leading-snug tracking-tight text-[#1B3A7A]">
          전사 자산관리 시스템
        </div>
        <div className="mt-0.5 text-micro text-gray-400">2026년 3월 · 전사 자산 현황</div>
      </div>
    </header>
  );
}
