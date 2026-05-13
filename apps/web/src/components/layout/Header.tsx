// 페이지 상단 헤더 — h-14 + 좌측 제목 + 우측 검색(Cmd+K) / action / 보고서 / ThemeToggle 항상 노출
import { useState, type ReactNode } from 'react';
import { Printer, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ReportPreviewDialog } from '@/components/report/ReportPreviewDialog';
import { AsungSymbol } from './AsungLogo';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

function openSearch() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
}

export function Header({ title, description, action }: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  return (
    <header style={{ minHeight: 56 }} className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-5">
      {/* 모바일 전용 CI (사이드바 숨김 < md) */}
      <div className="flex min-w-0 items-center gap-2.5 md:hidden">
        <AsungSymbol />
        <div className="min-w-0">
          <div className="truncate text-micro font-semibold text-muted-foreground">전사 자산관리</div>
          <div className="truncate text-body-strong font-bold leading-tight text-foreground">{title}</div>
        </div>
      </div>
      {/* 데스크탑 전용 페이지 제목 */}
      <div className="hidden min-w-0 md:block">
        <h1 className="truncate text-heading-md font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="truncate text-caption text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {action}
        {action ? <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" /> : null}
        {/* 전역 검색 트리거 */}
        <button
          type="button"
          onClick={openSearch}
          className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-caption text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground md:flex"
          title="전역 검색 (⌘K)"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span>검색</span>
          <kbd className="rounded border border-border bg-card px-1 py-0.5 text-micro">⌘K</kbd>
        </button>
        <button
          type="button"
          onClick={openSearch}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground md:hidden"
          aria-label="검색"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          aria-label="보고서 미리보기"
          title="보고서 미리보기 / 인쇄"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
        </button>
        <ThemeToggle />
      </div>
      <ReportPreviewDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </header>
  );
}
