// 카드 — DESIGN.md §6 의 rounded-2xl border bg-card 패턴
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('rounded-2xl border border-border bg-card shadow-elev-1', className)}
        {...rest}
      />
    );
  },
);
