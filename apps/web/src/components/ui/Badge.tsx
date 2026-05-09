// 배지 — DESIGN.md §6 의 색+아이콘+텍스트 3중 패턴 (4색 + default)
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'danger' | 'warning' | 'info' | 'success';

const TONE: Record<Tone, string> = {
  default: 'bg-muted text-muted-foreground',
  danger: 'bg-danger-subtle text-danger',
  warning: 'bg-warning-subtle text-warning',
  info: 'bg-info-subtle text-info',
  success: 'bg-success-subtle text-success',
};

type Props = {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Badge({ tone = 'default', icon, children, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-medium',
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
