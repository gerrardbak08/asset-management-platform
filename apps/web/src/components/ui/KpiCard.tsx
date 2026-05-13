// KPI 지표 카드 — label + value + 선택적 icon/tone. Leases/Depreciation/기타 공통 사용
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'danger' | 'warning' | 'success' | 'info';

type Props = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: Tone;
  className?: string;
};

const ICON_CLASSES: Record<Tone, string> = {
  default: 'bg-muted text-primary',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
};

export function KpiCard({ label, value, icon: Icon, tone = 'default', className }: Props) {
  return (
    <div className={cn('flex min-h-[92px] items-center gap-3 rounded-2xl border border-border bg-card p-4', className)}>
      {Icon ? (
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', ICON_CLASSES[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="text-caption text-muted-foreground">{label}</div>
        <div className={cn('mt-1 text-heading-md font-bold', tone !== 'default' ? `text-${tone}` : 'text-foreground')}>
          {value}
        </div>
      </div>
    </div>
  );
}
