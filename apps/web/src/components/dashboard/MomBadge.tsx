// MoM 배지 — V16 .ac-pill 동등. ratio 부호로 색 자동 (아이콘 없음)
import { cn } from '@/lib/utils';
import { fmtPct } from '@/lib/format';

type Props = { ratio: number; className?: string; positiveIsGood?: boolean; showLabel?: boolean };

export function MomBadge({ ratio, className, positiveIsGood = true, showLabel = false }: Props) {
  const sign = ratio > 0.0001 ? 1 : ratio < -0.0001 ? -1 : 0;
  const tone = sign === 0
    ? 'bg-muted text-muted-foreground'
    : (sign > 0) === positiveIsGood
      ? 'bg-success-subtle text-success'
      : 'bg-danger-subtle text-danger';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-sans tabular-nums',
        tone,
        className,
      )}
    >
      {fmtPct(ratio, 2)}
      {showLabel && <span className="ml-0.5 font-sans not-italic">MoM</span>}
    </span>
  );
}
