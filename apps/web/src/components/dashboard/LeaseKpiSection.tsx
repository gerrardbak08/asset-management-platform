// 임대 현황 탭 — KPI 카드 4종 + 위험도 칩 (LeaseStatusSubtab 전용 서브컴포넌트)
import { cn } from '@/lib/utils';
import { type RiskLevel } from '@/lib/thresholds';

const RISK_CLASS = {
  danger: 'text-danger bg-danger-subtle border-danger/30',
  warning: 'text-warning bg-warning-subtle border-warning/30',
  success: 'text-success bg-success-subtle border-success/30',
} as const;

const RISK_DOT = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
} as const;

export function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-heading-sm font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-micro text-muted-foreground">{sub}</div>
    </div>
  );
}

export function RiskChip({ risk, text }: { risk: RiskLevel; text: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-medium',
        RISK_CLASS[risk],
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', RISK_DOT[risk])} />
      {text}
    </span>
  );
}
