// 건물 지도 — Kakao Maps SDK (지도 탭 + 로드뷰 탭)
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin, Map, Camera } from 'lucide-react';
import {
  loadKakaoMaps,
  KAKAO_CATEGORIES,
  type KakaoInfoWindow,
  type KakaoMap,
  type KakaoMarker,
  type KakaoPlace,
  type KakaoRoadview,
} from '@/lib/kakaoMaps';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Props = { name: string; address: string; lat: number; lng: number };
type ViewTab = 'map' | 'roadview';

export function BuildingMap({ name, address, lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const rvRef = useRef<HTMLDivElement | null>(null);
  const kakaoMapRef = useRef<KakaoMap | null>(null);
  const kakaoRvRef = useRef<KakaoRoadview | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const iwRef = useRef<KakaoInfoWindow | null>(null);
  const nearbyRef = useRef<Array<{ marker: KakaoMarker; iw: KakaoInfoWindow }>>([]);

  const [tab, setTab] = useState<ViewTab>('map');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rvError, setRvError] = useState<string | null>(null);
  const [rvReady, setRvReady] = useState(false);

  // 지도 초기화
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !kakao || !mapRef.current) return;
        const center = new kakao.maps.LatLng(lat, lng);
        if (!kakaoMapRef.current) {
          kakaoMapRef.current = new kakao.maps.Map(mapRef.current, { center, level: 4 });
          markerRef.current = new kakao.maps.Marker({ position: center, map: kakaoMapRef.current });
          iwRef.current = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;font-weight:600;color:#18181B;white-space:nowrap;">${name}<br><span style="font-weight:400;color:#71717A;font-size:11px">${address}</span></div>`,
          });
          iwRef.current.open(kakaoMapRef.current, markerRef.current);
        } else {
          const pos = new kakao.maps.LatLng(lat, lng);
          kakaoMapRef.current.setCenter(pos);
          markerRef.current?.setPosition(pos);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Kakao 지도 로드 실패');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [lat, lng, name, address]);

  // 로드뷰 초기화 (탭 전환 시)
  useEffect(() => {
    if (tab !== 'roadview' || !rvRef.current) return;
    let cancelled = false;
    setRvError(null);
    setRvReady(false);
    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !kakao || !rvRef.current) return;
        const rv = new kakao.maps.Roadview(rvRef.current);
        kakaoRvRef.current = rv;
        const client = new kakao.maps.RoadviewClient();
        const pos = new kakao.maps.LatLng(lat, lng);
        client.getNearestPanoId(pos, 100, (panoId) => {
          if (cancelled) return;
          if (panoId === null) {
            setRvError('이 위치 주변 100m 내에 로드뷰 파노라마가 없습니다.');
            return;
          }
          rv.setPanoId(panoId, pos);
          setRvReady(true);
        });
      })
      .catch(() => { if (!cancelled) setRvError('로드뷰 로드 실패'); });
    return () => { cancelled = true; };
  }, [tab, lat, lng]);

  const clearNearby = () => {
    for (const { marker, iw } of nearbyRef.current) {
      iw.close();
      marker.setMap(null);
    }
    nearbyRef.current = [];
  };

  const searchCategory = async (code: string) => {
    if (activeCat === code) { clearNearby(); setActiveCat(null); return; }
    clearNearby(); setActiveCat(code);
    const kakao = await loadKakaoMaps();
    if (!kakao || !kakaoMapRef.current) return;
    const services = kakao.maps.services;
    if (!services) return;
    const ps = new services.Places();
    ps.categorySearch(code, (data: KakaoPlace[], status: string) => {
      if (status !== services.Status.OK) return;
      for (const p of data) {
        const pos = new kakao.maps.LatLng(parseFloat(p.y), parseFloat(p.x));
        const marker = new kakao.maps.Marker({ position: pos, map: kakaoMapRef.current! });
        const iw = new kakao.maps.InfoWindow({
          content: `<div style="padding:4px 8px;font-size:11px;font-weight:600">${p.place_name}</div>`,
        });
        kakao.maps.event.addListener(marker, 'click', () => iw.open(kakaoMapRef.current!, marker));
        nearbyRef.current.push({ marker, iw });
      }
    }, { location: new kakao.maps.LatLng(lat, lng), radius: 500, sort: services.SortBy.DISTANCE });
  };

  const kakaoLink = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
  const rvLink = `https://map.kakao.com/link/roadview/${lat},${lng}`;

  return (
    <div className="space-y-3">
      {/* 탭 */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('map')}
          className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption font-medium transition-colors',
            tab === 'map' ? 'bg-card text-foreground shadow-elev-1' : 'text-muted-foreground hover:text-foreground')}
        >
          <Map className="h-3.5 w-3.5" aria-hidden="true" />지도
        </button>
        <button
          type="button"
          onClick={() => setTab('roadview')}
          className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption font-medium transition-colors',
            tab === 'roadview' ? 'bg-card text-foreground shadow-elev-1' : 'text-muted-foreground hover:text-foreground')}
        >
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />로드뷰
        </button>
      </div>

      {/* 카테고리 버튼 (지도 탭만) */}
      {tab === 'map' && (
        <div className="flex flex-wrap gap-2">
          {KAKAO_CATEGORIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => searchCategory(c.code)}
              disabled={!!error}
              className={cn(
                'rounded-full border px-3 py-1 text-caption font-medium transition-colors',
                activeCat === c.code
                  ? 'border-success bg-success text-success-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                error ? 'cursor-not-allowed opacity-50' : '',
              )}
            >
              {c.label}
            </button>
          ))}
          {activeCat && (
            <button type="button" onClick={() => { clearNearby(); setActiveCat(null); }}
              className="rounded-full border border-border bg-card px-3 py-1 text-caption text-muted-foreground hover:bg-muted">
              초기화
            </button>
          )}
        </div>
      )}

      {/* 에러 배너 */}
      {(tab === 'map' ? error : rvError) && (
        <Card className="border-warning-border bg-warning-subtle p-4">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <div className="text-caption">
              <div className="font-semibold text-warning">{tab === 'map' ? '지도 로드 안 됨' : '로드뷰 없음'}</div>
              <div className="mt-0.5 text-muted-foreground">{tab === 'map' ? error : rvError}</div>
              {tab === 'map' && (
                <div className="mt-1 text-muted-foreground">좌표 — {lat.toFixed(4)}, {lng.toFixed(4)}</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 지도 컨테이너 */}
      <div
        ref={mapRef}
        className={cn('h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-muted', tab !== 'map' && 'hidden')}
        aria-label={`${name} 위치 지도`}
      >
        {loading && !error && (
          <div className="flex h-full w-full items-center justify-center text-caption text-muted-foreground">
            지도 로드 중…
          </div>
        )}
      </div>

      {/* 로드뷰 컨테이너 — 로딩 오버레이는 Kakao div 밖 별도 래퍼로 분리 */}
      <div className={cn('relative h-[360px] w-full', tab !== 'roadview' && 'hidden')}>
        {tab === 'roadview' && !rvReady && !rvError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-border bg-muted text-caption text-muted-foreground pointer-events-none">
            로드뷰 로드 중…
          </div>
        )}
        <div
          ref={rvRef}
          className="h-full w-full overflow-hidden rounded-2xl border border-border"
          aria-label={`${name} 로드뷰`}
        />
      </div>

      {/* 외부 링크 */}
      <div className="flex flex-wrap gap-3">
        <a href={kakaoLink} target="_blank" rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
          <ExternalLink className="h-3 w-3" aria-hidden="true" />카카오맵으로 열기
        </a>
        <a href={rvLink} target="_blank" rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-caption font-semibold text-muted-foreground hover:text-foreground hover:underline">
          <ExternalLink className="h-3 w-3" aria-hidden="true" />로드뷰로 열기
        </a>
      </div>
    </div>
  );
}
