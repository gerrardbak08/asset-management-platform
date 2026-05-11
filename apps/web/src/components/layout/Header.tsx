// 페이지 상단 헤더 — h-14 + 좌측 제목 + 우측 action / 보고서 / ThemeToggle 항상 노출
import { useState, type ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ReportPreviewDialog } from '@/components/report/ReportPreviewDialog';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function Header({ title, description, action }: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  return (
    <header style={{ minHeight: 56 }} className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-5">
      <div className="min-w-0">
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
