// 건물 카드 — V16 레이아웃: 사진 오버레이 상세이미지 버튼 + 상세 KPI 그리드 + 임대율 바
import { useState } from 'react';
import { MapPin, AlertTriangle, AlertCircle, CheckCircle2, Image } from 'lucide-react';
import type { Building } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { regionOf } from '@/lib/buildingHelpers';
import { PhotoFallback } from './PhotoFallback';
import { PhotoLightbox, type LightboxPhoto } from './PhotoLightbox';
import { fmtKRprice } from '@/lib/format';

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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const lightboxPhotos: LightboxPhoto[] = [];
  if (b.photoUrl) lightboxPhotos.push({ url: b.photoUrl, label: '대표' });
  if (b.detailPhotoUrl) lightboxPhotos.push({ url: b.detailPhotoUrl, label: '상세' });

  const hasDetail = !!b.detailPhotoUrl;

  return (
    <>
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
        {/* 지역 태그 */}
        <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-md bg-foreground/80 px-2 py-0.5 text-micro font-bold text-background backdrop-blur">
          {regionOf(b.address)}
        </span>

        {/* 사진 영역 — 상세이미지 버튼 오버레이 */}
        <div className="relative">
          <PhotoFallback
            primary={b.photoUrl}
            fallback={b.detailPhotoUrl}
            alt={b.name}
            className="h-40 w-full"
          />
          {hasDetail && (
            <button
              type="button"
              aria-label="상세 이미지 보기"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-micro font-medium text-white opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100"
            >
              <Image className="h-3 w-3" aria-hidden="true" />
              상세 이미지
            </button>
          )}
        </div>

        <div className="space-y-2 p-4">
          {/* 건물명 + 위험도 뱃지 */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-heading-sm font-semibold text-foreground">{b.name}</h3>
            {risk ? (
              <Badge tone={risk.tone} icon={<risk.Icon className="h-3 w-3" aria-hidden="true" />}>
                {risk.label}
              </Badge>
            ) : null}
          </div>

          {/* 주소 */}
          <div className="flex items-center gap-1 text-caption text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{b.address}</span>
          </div>

          {/* KPI 그리드 */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0 pt-1">
            <KpiCell label="취득가" value={fmtKRprice(Number(b.acquisitionPrice)) + '원'} />
            <KpiCell label="연면적" value={Math.round(b.area.pyeong).toLocaleString('ko-KR') + '평'} />
            <KpiCell label="임차인" value={b.tenant} />
            <KpiCell label="용도" value={b.use.length > 8 ? b.use.slice(0, 8) + '…' : b.use} />
            <KpiCell label="임대율" value={b.rental.rate.toFixed(0) + '%'} />
          </div>
        </div>
      </Card>

      {/* 상세 이미지 라이트박스 — 카드 바깥에서 렌더 (z-index 충돌 방지) */}
      <PhotoLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={lightboxPhotos}
        initialIndex={b.photoUrl && b.detailPhotoUrl ? 1 : 0}
        alt={b.name}
      />
    </>
  );
}

function KpiCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <div className="text-micro text-muted-foreground">{label}</div>
      <div className="mt-0.5 h-4 truncate text-caption font-medium leading-4 text-foreground">{value}</div>
    </div>
  );
}
