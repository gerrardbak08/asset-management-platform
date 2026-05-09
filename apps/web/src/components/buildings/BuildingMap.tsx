// 건물 지도 — Kakao Maps SDK 동적 로드 + 마커 + 카테고리 검색 (V16 BuildingDrawer 의 지도 탭 동등)
import { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '@/store/theme';
import { Card } from '@/components/ui/Card';
import { ExternalLink, MapPin } from 'lucide-react';
import {
  loadKakaoMaps,
  KAKAO_CATEGORIES,
  type KakaoInfoWindow,
  type KakaoMap,
  type KakaoMarker,
  type KakaoPlace,
} from '@/lib/kakaoMaps';
import { cn } from '@/lib/utils';

type Props = { name: string; address: string; lat: number; lng: number };

export function BuildingMap({ name, address, lat, lng }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const infoRef = useRef<KakaoInfoWindow | null>(null);
  const nearbyRef = useRef<Array<{ marker: KakaoMarker; iw: KakaoInfoWindow }>>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !kakao || !containerRef.current) return;
        const center = new kakao.maps.LatLng(lat, lng);
        if (!mapRef.current) {
          mapRef.current = new kakao.maps.Map(containerRef.current, { center, level: 4 });
          markerRef.current = new kakao.maps.Marker({ position: center, map: mapRef.current });
          infoRef.current = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;font-weight:600;color:#18181B;font-family:'Pretendard Variable',sans-serif;white-space:nowrap;">${name}<br><span style="font-weight:400;color:#71717A;font-size:11px">${address}</span></div>`,
          });
          if (markerRef.current && infoRef.current) {
            infoRef.current.open(mapRef.current, markerRef.current);
          }
        } else {
          mapRef.current.setCenter(center);
          markerRef.current?.setPosition(center);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Kakao 지도 로드 실패');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, name, address]);

  const clearNearby = () => {
    for (const { marker, iw } of nearbyRef.current) {
      iw.close();
      marker.setMap(null);
    }
    nearbyRef.current = [];
  };

  const searchCategory = async (code: string) => {
    if (activeCat === code) {
      clearNearby();
      setActiveCat(null);
      return;
    }
    clearNearby();
    setActiveCat(code);
    const kakao = await loadKakaoMaps();
    if (!kakao || !mapRef.current) return;
    const services = kakao.maps.services;
    if (!services) {
      setError('Places 라이브러리 미로드 — libraries=services 필요');
      return;
    }
    const ps = new services.Places();
    ps.categorySearch(
      code,
      (data: KakaoPlace[], status: string) => {
        if (status !== services.Status.OK) return;
        for (const p of data) {
          const pos = new kakao.maps.LatLng(parseFloat(p.y), parseFloat(p.x));
          const marker = new kakao.maps.Marker({ position: pos, map: mapRef.current! });
          const iw = new kakao.maps.InfoWindow({
            content: `<div style="padding:4px 8px;font-size:11px;font-weight:600;font-family:'Pretendard Variable',sans-serif">${p.place_name}</div>`,
          });
          kakao.maps.event.addListener(marker, 'click', () => iw.open(mapRef.current!, marker));
          nearbyRef.current.push({ marker, iw });
        }
      },
      {
        location: new kakao.maps.LatLng(lat, lng),
        radius: 500,
        sort: services.SortBy.DISTANCE,
      },
    );
  };

  const kakaoMapLink = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {KAKAO_CATEGORIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => searchCategory(c.code)}
            disabled={!!error}
            className={cn(
              'rounded-full border px-3 py-1 text-caption font-medium transition-colors duration-150',
              activeCat === c.code
                ? 'border-success bg-success text-success-foreground'
                : 'border-border bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              error ? 'cursor-not-allowed opacity-50' : '',
            )}
          >
            {c.label}
          </button>
        ))}
        {activeCat ? (
          <button
            type="button"
            onClick={() => {
              clearNearby();
              setActiveCat(null);
            }}
            className="rounded-full border border-border bg-card px-3 py-1 text-caption text-muted-foreground hover:bg-muted"
          >
            초기화
          </button>
        ) : null}
      </div>

      {error ? (
        <Card className="border-warning-border bg-warning-subtle p-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <div className="text-caption text-foreground">
              <div className="font-semibold text-warning">지도 로드 안 됨</div>
              <div className="mt-0.5 text-muted-foreground">{error}</div>
              <div className="mt-1 text-muted-foreground">
                좌표 — {lat.toFixed(4)}, {lng.toFixed(4)}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <div
        ref={containerRef}
        className={cn(
          'h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-muted',
          theme === 'dark' ? 'opacity-90' : '',
        )}
        aria-label={`${name} 위치 지도`}
      >
        {loading && !error ? (
          <div className="flex h-full w-full items-center justify-center text-caption text-muted-foreground">
            지도 로드 중…
          </div>
        ) : null}
      </div>

      <a
        href={kakaoMapLink}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
        카카오맵으로 열기
      </a>
    </div>
  );
}
