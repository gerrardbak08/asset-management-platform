// 임원용 건물 요약 — 전체 임대율 평균 + 위험 건물 카운트 (V16 renderExecBldSummary 동등)
import { useQuery } from '@tanstack/react-query';
import { Building, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { buildingsApi, type Building as B } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { Badge } from '@/components/ui/Badge';

export function ExecBldSummary() {
  const q = useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list });
  const items: B[] = q.data ?? [];
  const total = items.length;
  const avgRate = total === 0 ? 0 : items.reduce((s, b) => s + b.rental.rate, 0) / total;
  const danger = items.filter((b) => b.rental.rate === 0 && b.tenant !== '-').length;
  const stable = items.filter((b) => b.rental.rate === 100).length;
  const photoMissing = items.filter((b) => !b.photoUrl && !b.detailPhotoUrl).length;

  return (
    <Card className="p-5">
      <SectionHeader title="건물 요약" description={`총 ${total}동 · 평균 임대율 ${avgRate.toFixed(0)}%`} />
      <div className="grid grid-cols-3 gap-2">
        <Mini icon={Building} label="안정" value={stable} tone="success" />
        <Mini icon={AlertTriangle} label="위험" value={danger} tone="danger" />
        <Mini icon={CheckCircle2} label="사진 누락" value={photoMissing} tone="warning" />
      </div>
    </Card>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Building;
  label: string;
  value: number;
  tone: 'success' | 'danger' | 'warning';
}) {
  const subtle = {
    success: 'bg-success-subtle',
    danger: 'bg-danger-subtle',
    warning: 'bg-warning-subtle',
  }[tone];
  const text = { success: 'text-success', danger: 'text-danger', warning: 'text-warning' }[tone];

  return (
    <div className={`rounded-xl p-3 ${subtle}`}>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${text}`} aria-hidden="true" />
        <span className={`text-caption font-medium ${text}`}>{label}</span>
      </div>
      <div className="font-kpi-metric font-mono tabular-nums text-foreground">{value}</div>
      <Badge tone="default" className="mt-1">동</Badge>
    </div>
  );
}
