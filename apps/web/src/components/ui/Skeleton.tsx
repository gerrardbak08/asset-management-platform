// Skeleton — DESIGN.md §6 의 animate-pulse + bg-muted + rounded 패턴
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-muted', className)}
      aria-hidden="true"
      {...rest}
    />
  );
}

// 대시보드 개요 탭의 1프레임 골격 — Hero 3카드 + KPI 3카드 + 인사이트 + 차트 2개
export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-[180px]" />
        <Skeleton className="h-[180px]" />
        <Skeleton className="h-[180px]" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-[140px]" />
        <Skeleton className="h-[140px]" />
        <Skeleton className="h-[140px]" />
      </div>
      <Skeleton className="h-[72px]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}
