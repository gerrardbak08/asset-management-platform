// PageShell — 모든 라우트 최외곽 래퍼 (DESIGN.md §5 강제). Header + 콘텐츠 영역. Fragment 페이지 루트 금지
import type { PropsWithChildren, ReactNode } from 'react';
import { Header } from '@/components/layout/Header';

type Props = PropsWithChildren<{
  title: string;
  description?: string;
  action?: ReactNode;
}>;

export function PageShell({ title, description, action, children }: Props) {
  return (
    <div
      className="flex h-full flex-col overflow-y-auto overflow-x-hidden bg-background"
      style={{ scrollbarGutter: 'stable' }}
    >
      <Header title={title} description={description} action={action} />
      <div className="min-w-0 flex-1 space-y-3 p-4 md:p-5">{children}</div>
    </div>
  );
}
