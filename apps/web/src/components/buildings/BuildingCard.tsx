// 건물 카드 — 좌측 brand strip + 사진 + KPI + 임대율 progress bar (V16 다이소 풍 감각 + DESIGN.md 토큰)
import { MapPin, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Building } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { regionOf } from '@/lib/buildingHelpers';
import { PhotoFallback } from './PhotoFallback';
import { cn } from '@/lib/utils';

function fmtKR(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8) return (n / 1e8).toFixed(0) + '억';
  if (n >= 1e4) return (n / 1e4).toFixed(0) + '만';
  return n.toLocaleString('ko-KR');
}

function getRiskTone(b: Building) {
  const photoMissing = !b.photoUrl && !b.detailPhotoUrl;
  if (photoMissing) {
    return { tone: 'danger' as const, label: '사진 미등록', Icon: AlertTriangle };
  }
  if (b.rental.rate === 0 && b.tenant !== '-') {
    return { tone: 'danger' as const, label: '임대 점검', Icon: AlertTriangle };
  }
  if (b.rental.rate > 0 && b.rental.rate < 50) {
    return { tone: 'warning' as const, label: '임대율 낮음', Icon: AlertCircle };
  }
  if (b.rental.rate === 100) {
    return { tone: 'success' as const, label: '안정', Icon: CheckCircle2 };
  }
  return null;
}

type Props = { building: Building; onClick: () => void };

export function BuildingCard({ building: b, onClick }: Props) {
  const risk = getRiskTone(b);
  const stripeColor =
    risk?.tone === 'danger'
      ? 'bg-danger'
      : risk?.tone === 'warning'
        ? 'bg-warning'
        : risk?.tone === 'success'
          ? 'bg-success'
          : 'bg-primary';

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative cursor-pointer overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elev-2"
    >
      <span aria-hidden="true" className={cn('absolute left-0 top-0 h-full w-1', stripeColor)} />
      <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-md bg-foreground/80 px-2 py-0.5 text-micro font-bold text-background backdrop-blur">
        {regionOf(b.address)}
      </span>
      <PhotoFallback
        primary={b.photoUrl}
        fallback={b.detailPhotoUrl}
        alt={b.name}
        className="h-40 w-full"
      />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-heading-sm font-semibold text-foreground">{b.name}</h3>
          {risk ? (
            <Badge tone={risk.tone} icon={<risk.Icon className="h-3 w-3" aria-hidden="true" />}>
              {risk.label}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-caption text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          <span className="truncate">{b.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <KpiCell label="취득가" value={fmtKR(Number(b.acquisitionPrice)) + '원'} />
          <KpiCell label="연면적" value={Math.round(b.area.pyeong).toLocaleString('ko-KR') + '평'} />
        </div>

        <div className="pt-1">
          <div className="mb-1 flex items-center justify-between text-caption">
            <span className="text-muted-foreground">임대율</span>
            <span className="font-mono tabular-nums text-foreground">
              {b.rental.rate.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-150',
                b.rental.rate === 100
                  ? 'bg-success'
                  : b.rental.rate >= 50
                    ? 'bg-primary'
                    : b.rental.rate > 0
                      ? 'bg-warning'
                      : 'bg-danger',
              )}
              style={{ width: `${Math.min(100, Math.max(0, b.rental.rate))}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function KpiCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
      <div className="text-micro font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-caption font-mono tabular-nums text-foreground">{value}</div>
    </div>
  );
}
