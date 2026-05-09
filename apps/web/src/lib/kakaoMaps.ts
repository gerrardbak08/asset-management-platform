// Kakao Maps SDK 동적 로더 — 한 번만 로드, libraries=services 포함, 키는 /api/config 에서 받음
declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

type KakaoNamespace = {
  maps: {
    load: (cb: () => void) => void;
    LatLng: new (lat: number, lng: number) => unknown;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => KakaoMap;
    Marker: new (options: { position: unknown; map?: KakaoMap }) => KakaoMarker;
    InfoWindow: new (options: { content: string }) => KakaoInfoWindow;
    Roadview: new (container: HTMLElement) => KakaoRoadview;
    RoadviewClient: new () => {
      getNearestPanoId: (pos: unknown, radius: number, cb: (panoId: number | null) => void) => void;
    };
    MapTypeId: { ROADMAP: unknown; HYBRID: unknown };
    services?: {
      Places: new () => {
        categorySearch: (
          code: string,
          cb: (data: KakaoPlace[], status: string) => void,
          options: { location: unknown; radius: number; sort?: unknown },
        ) => void;
      };
      Status: { OK: string };
      SortBy: { DISTANCE: unknown };
    };
    event: {
      addListener: (target: unknown, type: string, fn: () => void) => void;
      trigger: (target: unknown, type: string) => void;
    };
  };
};

export type KakaoMap = {
  setCenter: (pos: unknown) => void;
  setMapTypeId: (id: unknown) => void;
};
export type KakaoMarker = {
  setPosition: (pos: unknown) => void;
  setMap: (map: KakaoMap | null) => void;
};
export type KakaoInfoWindow = { open: (map: KakaoMap, marker: KakaoMarker) => void; close: () => void };
export type KakaoRoadview = { setPanoId: (panoId: number, pos: unknown) => void };
export type KakaoPlace = { x: string; y: string; place_name: string };

let loadingPromise: Promise<KakaoNamespace> | null = null;

async function fetchKey(): Promise<string | null> {
  const res = await fetch('/api/config', { credentials: 'include' });
  if (!res.ok) return null;
  const json = (await res.json()) as { ok: true; data: { kakaoJsKey: string | null } } | { ok: false };
  if (!json.ok) return null;
  return json.data.kakaoJsKey;
}

export async function loadKakaoMaps(): Promise<KakaoNamespace | null> {
  if (typeof window === 'undefined') return null;
  if (window.kakao?.maps) return window.kakao;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const key = await fetchKey();
    if (!key) {
      throw new Error('KAKAO_JS_KEY 가 .env 에 설정되어 있지 않습니다');
    }
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Kakao SDK 로드 실패')));
        return;
      }
      const s = document.createElement('script');
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`;
      s.async = true;
      s.dataset.kakaoSdk = 'true';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Kakao SDK 로드 실패'));
      document.head.appendChild(s);
    });
    if (!window.kakao?.maps) throw new Error('Kakao SDK 초기화 실패');
    await new Promise<void>((resolve) => window.kakao!.maps.load(resolve));
    return window.kakao;
  })().catch((err) => {
    loadingPromise = null;
    throw err;
  });

  return loadingPromise;
}

export const KAKAO_CATEGORIES = [
  { code: 'CS2', label: '편의점' },
  { code: 'CE7', label: '카페' },
  { code: 'PK6', label: '주차장' },
  { code: 'BK9', label: '은행' },
] as const;
