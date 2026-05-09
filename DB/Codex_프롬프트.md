# 통합 자산 관리 대시보드 — Codex 작업 프롬프트

---

## 역할 및 목표

너는 **통합 자산 관리 대시보드 v5** 의 프론트엔드 개발자다.
단일 HTML 파일(`SJ_대시보드_v5.html`)을 작업한다.
외부 프레임워크 없이 **Vanilla JS + Chart.js 4 + Pretendard 폰트**만 사용한다.
작업 단위마다 JS 파싱 검증(`node -e "new Function(...)"`)을 반드시 실행하고, 통과하지 못하면 수정 후 재검증한다.

---

## 프로젝트 현황

### 파일
- `SJ_대시보드_v5.html` — 단일 파일 157KB / 3,295줄

### 기술 스택
- **폰트**: Pretendard Variable (CDN)
- **차트**: Chart.js 4.4.1 (CDN)
- **지도**: 카카오맵 JavaScript SDK (미연동, 이번에 추가)
- **저장소**: localStorage (키: `dash_eq_v4`, `dash_bd_v4`, `dash_imgs`, `dash_monthly`, `dash_summary`)
- **공유**: 데이터 내장 HTML 생성 (`__EMBEDDED__` 패턴)

### 디자인 토큰 (CSS 변수)
```css
--canvas: #FFFFFF        /* 최상위 배경 */
--subtle: #F6F6F8        /* 음각 패널 배경 */
--subtle-2: #EEEEF1
--border: #E6E6E9
--text-1: #18181B        /* 주 텍스트 */
--text-2: #52525B
--text-3: #A1A1AA        /* 보조 텍스트 */
--ink: #1E2761           /* 브랜드 네이비 */
--ink-soft: rgba(30,39,97,.07)
--success: #0F766E
--warning: #B45309
--danger: #991B1B
--accent: #A16207
--font: 'Pretendard Variable', sans-serif
--r-md: 10px  --r-lg: 14px
--shadow-1: 0 1px 2px rgba(20,20,26,.04)
--inset-soft: inset 0 1px 1px rgba(20,20,26,.03)
--inset-strong: inset 0 1px 2px rgba(20,20,26,.06)
```

### 탭 구조
```
메인 탭 3개
├── 자산현황 (#asset)
│   └── 서브탭 5개: 개요 | 자산분포 | 비품흐름 | 취득연혁 | 임대현황
├── 건물상세 (#building)
└── 데이터조정 (#dataEdit)
    └── 서브탭 3개: 월별실적 | 비품현황조정 | 건물정보조정
```

### 핵심 전역 상태
```js
let S = {
  eq: [],          // 비품 41개 — {id, name, purchase{hq,store,logistics}, transfer, disposal, inventory}
  bd: [],          // 건물 15개 — {id, name, address, use, area{sqm,pyeong}, floors,
                   //              approvalDate, acquisitionDate, acquisitionPrice,
                   //              rental{area,rate,vacancy}, tenant}
                   //   ← lat, lng 필드 없음 (이번 작업에서 추가)
  imgs: {},        // {bdIndex: base64string}
  monthly: {},     // {항목명: [12개월 배열]}
  summary: {totalAsset, tangible, intangible, equipment, hq, store, logistics}
};
```

### 핵심 함수 목록 (수정 금지)
| 함수 | 역할 |
|------|------|
| `defEq()` | 비품 기본값 (41개) |
| `defBd()` | 건물 기본값 (15개) |
| `migrateEq/Bd()` | 구버전 localStorage 호환 |
| `renderHero()` | 히어로 KPI 렌더 |
| `renderKPIs()` | 카드 3개 렌더 |
| `renderBuildings()` | 건물 카드 그리드 |
| `openBldDetail(event, idx)` | 건물 드로어 열기 |
| `switchBddTab(id, btn)` | 드로어 탭 전환 |
| `applyFilters()` | 필터 5종 적용 |
| `saveAll()` | 전체 저장 |
| `exportJSON() / importJSON()` | 데이터 내보내기/가져오기 |
| `generateHTML()` | 공유용 HTML 생성 |
| `fmtKR(n)` | 억 단위 약식 포맷 |
| `fmtKRfull(n)` | 전체 단위 포맷 |
| `compressImg(file)` | 이미지 압축 (800×600/150KB) |

### 건물 드로어 현재 구조
```
드로어 (#bdDrawer) — 오른쪽에서 슬라이드 (580px)
├── 헤더: 건물 사진 or 플레이스홀더 + 이름/주소 오버레이
├── 탭: 기본정보 | 임대현황 | 관리이력 | 메모   ← 여기에 '지도' 탭 추가
└── 각 패널: #bdd-info | #bdd-lease | #bdd-history | #bdd-memo
                                                    ← #bdd-map 추가
```

---

## 이번 작업: 카카오맵 연동

### 목표
건물 드로어에 **지도** 탭을 추가한다.
탭을 클릭하면 해당 건물 위치가 카카오맵에 표시된다.

### 요구 기능 (우선순위 순)
1. **건물 위치 마커** — 해당 건물 위치에 커스텀 마커, 클릭 시 인포윈도우(건물명·주소)
2. **지도/스카이뷰 전환** — 우측 상단 토글 버튼
3. **로드뷰** — 지도 위 로드뷰 토글 버튼, 해당 좌표 로드뷰 표시
4. **주변 탐색** — 카테고리 버튼(편의점·카페·주차장·은행) 클릭 시 반경 500m 핀 표시
5. **카카오맵 앱으로 열기** — 하단 버튼, 카카오맵 딥링크 호출

### API 키 처리
```js
// 파일 최상단(또는 <head>)에 아래 두 줄 추가
// JavaScript API 키 — 지도 렌더링
const KAKAO_JS_KEY = 'YOUR_KAKAO_JS_KEY';  // ← 사용자가 입력

// 카카오맵 SDK 로드 (head 태그 내)
// <script type="text/javascript"
//   src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KEY&libraries=services">
// </script>
```
키가 없는 경우 지도 패널에 "API 키를 입력해주세요" 안내 화면을 표시한다.

### 좌표 데이터 — defBd() 수정
`defBd()` 함수의 각 건물 객체에 `lat`, `lng` 필드를 추가한다.

```js
// 수정 전
{ id:'bd_001', name:'속초본점 건물', address:'강원도 속초시 동해대로 4038 (조양동)', ... }

// 수정 후
{ id:'bd_001', name:'속초본점 건물', address:'강원도 속초시 동해대로 4038 (조양동)',
  lat: 37.7189, lng: 128.8891, ... }
```

**15개 건물 좌표 (defBd에 삽입)**
```
속초본점 건물         lat: 37.7189,  lng: 128.8891
창원상남본점 건물      lat: 35.2274,  lng: 128.6811
구로디지털단지역점     lat: 37.4853,  lng: 126.9011
강릉입암점 건물       lat: 37.7519,  lng: 128.8761
세종본점 건물         lat: 36.5040,  lng: 127.2494
포항시외버스터미널점   lat: 36.0320,  lng: 129.3651
경기광주본점          lat: 37.4298,  lng: 127.2559
원주무실점            lat: 37.3441,  lng: 127.9461
수원화서점            lat: 37.2883,  lng: 126.9917
성남모란역점          lat: 37.4385,  lng: 127.1261
영주본점              lat: 36.8057,  lng: 128.6235
남사물류센터          lat: 37.1598,  lng: 127.1649
부산허브센터          lat: 35.1731,  lng: 128.9647
동탄하이페리온 511호  lat: 37.2063,  lng: 127.0742
동탄하이페리온 526호  lat: 37.2063,  lng: 127.0742
```
> ⚠ 좌표는 대략적 추정값. API 키 있으면 Geocoder로 정확한 좌표 자동 변환 권장.

### HTML 추가 — 드로어 탭에 '지도' 버튼 삽입
```html
<!-- 기존 탭 버튼들 뒤에 추가 -->
<button class="bdd-tab" onclick="switchBddTab('map',this)">지도</button>
```

### HTML 추가 — 지도 패널 (#bdd-map)
```html
<div id="bdd-map" class="bdd-panel">
  <!-- 지도 컨트롤 바 -->
  <div class="bdd-map-controls">
    <div class="bdd-map-btns" id="bddMapTypeBtns">
      <button class="bdd-map-btn active" onclick="setMapType('roadmap',this)">지도</button>
      <button class="bdd-map-btn" onclick="setMapType('skyview',this)">스카이뷰</button>
      <button class="bdd-map-btn" onclick="toggleRoadview()">로드뷰</button>
    </div>
    <div class="bdd-map-cat-btns" id="bddCatBtns">
      <button class="bdd-cat-btn" onclick="searchNearby('CS2')">편의점</button>
      <button class="bdd-cat-btn" onclick="searchNearby('CE7')">카페</button>
      <button class="bdd-cat-btn" onclick="searchNearby('PK6')">주차장</button>
      <button class="bdd-cat-btn" onclick="searchNearby('BK9')">은행</button>
      <button class="bdd-cat-btn" onclick="clearNearby()">초기화</button>
    </div>
  </div>
  <!-- 지도 컨테이너 -->
  <div id="bddMapContainer" style="width:100%;height:340px;border-radius:var(--r-md);overflow:hidden;"></div>
  <!-- 로드뷰 컨테이너 (토글) -->
  <div id="bddRoadviewContainer" style="width:100%;height:340px;border-radius:var(--r-md);overflow:hidden;display:none;"></div>
  <!-- 카카오맵 앱으로 열기 -->
  <div style="margin-top:10px;text-align:right;">
    <a id="bddKakaoMapLink" href="#" target="_blank" class="bdd-save-btn"
       style="text-decoration:none;display:inline-block;">카카오맵으로 열기 →</a>
  </div>
  <!-- API 키 미설정 안내 -->
  <div id="bddMapNoKey" class="bdd-empty" style="display:none;">
    <div class="bdd-empty-title">카카오맵 API 키 필요</div>
    HTML 파일 상단의 <code>KAKAO_JS_KEY</code> 값을 입력해주세요.<br>
    카카오 Developers(developers.kakao.com)에서 무료 발급 가능합니다.
    <div class="bdd-empty-badge">JavaScript API 키 1개 필요</div>
  </div>
</div>
```

### CSS 추가
```css
/* 지도 컨트롤 */
.bdd-map-controls {
  display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 10px;
}
.bdd-map-btns, .bdd-map-cat-btns {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.bdd-map-btn {
  padding: 6px 14px; border-radius: var(--r-sm);
  background: var(--subtle); border: 1px solid var(--border);
  font-size: 12px; font-weight: 600; color: var(--text-2);
  cursor: pointer; transition: all .15s;
}
.bdd-map-btn:hover, .bdd-map-btn.active {
  background: var(--ink); color: #fff; border-color: var(--ink);
}
.bdd-cat-btn {
  padding: 5px 12px; border-radius: 100px;
  background: var(--subtle-2); border: 1px solid var(--border);
  font-size: 11.5px; font-weight: 600; color: var(--text-2);
  cursor: pointer; transition: all .15s;
}
.bdd-cat-btn:hover { background: var(--success-soft, rgba(15,118,110,.08)); color: var(--success); border-color: var(--success); }
.bdd-cat-btn.active { background: var(--success); color: #fff; border-color: var(--success); }
```

### JS 추가 — 지도 관련 함수
```js
/* 전역 지도 인스턴스 */
let bddMap = null;
let bddRoadview = null;
let bddMarker = null;
let bddInfoWindow = null;
let bddNearbyMarkers = [];
let bddActiveCat = null;

/* switchBddTab 내에서 'map' 탭 선택 시 initBddMap(idx) 호출 */
// openBldDetail() 함수 안에서 bldDetailIdx를 저장하므로
// switchBddTab('map', btn) 시 initBddMap(bldDetailIdx) 호출

function initBddMap(idx) {
  const b = S.bd[idx];
  if (!b) return;

  // API 키 체크
  if (!KAKAO_JS_KEY || KAKAO_JS_KEY === 'YOUR_KAKAO_JS_KEY'
      || typeof kakao === 'undefined') {
    document.getElementById('bddMapNoKey').style.display = 'block';
    document.getElementById('bddMapContainer').style.display = 'none';
    return;
  }
  document.getElementById('bddMapNoKey').style.display = 'none';
  document.getElementById('bddMapContainer').style.display = 'block';

  const lat = b.lat || 37.5665;  // 좌표 없으면 서울 시청 기본값
  const lng = b.lng || 126.9780;

  const container = document.getElementById('bddMapContainer');
  const options = {
    center: new kakao.maps.LatLng(lat, lng),
    level: 4
  };

  // 이미 지도가 있으면 중심 이동만
  if (bddMap) {
    bddMap.setCenter(new kakao.maps.LatLng(lat, lng));
    if (bddMarker) bddMarker.setPosition(new kakao.maps.LatLng(lat, lng));
  } else {
    bddMap = new kakao.maps.Map(container, options);

    // 커스텀 마커
    bddMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(lat, lng),
      map: bddMap
    });

    // 인포윈도우
    bddInfoWindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:8px 12px;font-size:12px;font-weight:600;color:#18181B;
                             font-family:'Pretendard Variable',sans-serif;white-space:nowrap;">
                  ${b.name}<br>
                  <span style="font-weight:400;color:#71717A;font-size:11px">${b.address}</span>
                </div>`
    });
    bddInfoWindow.open(bddMap, bddMarker);

    kakao.maps.event.addListener(bddMarker, 'click', () => {
      bddInfoWindow.open(bddMap, bddMarker);
    });
  }

  // 카카오맵 앱 링크
  const link = document.getElementById('bddKakaoMapLink');
  if (link) link.href = `https://map.kakao.com/link/map/${encodeURIComponent(b.name)},${lat},${lng}`;

  // 로드뷰 초기화
  const rvContainer = document.getElementById('bddRoadviewContainer');
  if (!bddRoadview && rvContainer) {
    bddRoadview = new kakao.maps.Roadview(rvContainer);
    const rvClient = new kakao.maps.RoadviewClient();
    rvClient.getNearestPanoId(
      new kakao.maps.LatLng(lat, lng), 50,
      panoId => { if (panoId) bddRoadview.setPanoId(panoId, new kakao.maps.LatLng(lat, lng)); }
    );
  }
}

function setMapType(type, btn) {
  if (!bddMap) return;
  document.querySelectorAll('.bdd-map-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  bddMap.setMapTypeId(type === 'skyview'
    ? kakao.maps.MapTypeId.HYBRID
    : kakao.maps.MapTypeId.ROADMAP);
  // 로드뷰 숨기기
  document.getElementById('bddRoadviewContainer').style.display = 'none';
  document.getElementById('bddMapContainer').style.display = 'block';
}

function toggleRoadview() {
  const mapEl = document.getElementById('bddMapContainer');
  const rvEl  = document.getElementById('bddRoadviewContainer');
  const isRv  = rvEl.style.display !== 'none';
  mapEl.style.display = isRv ? 'block' : 'none';
  rvEl.style.display  = isRv ? 'none'  : 'block';
  if (!isRv && bddRoadview) {
    // 로드뷰 크기 재조정
    kakao.maps.event.trigger(bddRoadview, 'resize');
  }
}

function searchNearby(catCode) {
  if (!bddMap || !bldDetailIdx === null) return;
  const b = S.bd[bldDetailIdx];
  if (!b) return;

  // 같은 카테고리 다시 클릭 시 초기화
  if (bddActiveCat === catCode) { clearNearby(); return; }
  clearNearby();
  bddActiveCat = catCode;

  // 버튼 활성화
  document.querySelectorAll('.bdd-cat-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const ps = new kakao.maps.services.Places();
  ps.categorySearch(catCode, (data, status) => {
    if (status !== kakao.maps.services.Status.OK) return;
    data.forEach(place => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(place.y, place.x),
        map: bddMap
      });
      const iw = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px 8px;font-size:11px;font-weight:600;
                              font-family:'Pretendard Variable',sans-serif">
                    ${place.place_name}</div>`
      });
      kakao.maps.event.addListener(marker, 'click', () => iw.open(bddMap, marker));
      bddNearbyMarkers.push({ marker, iw });
    });
  }, {
    location: new kakao.maps.LatLng(b.lat || 37.5665, b.lng || 126.9780),
    radius: 500,
    sort: kakao.maps.services.SortBy.DISTANCE
  });
}

function clearNearby() {
  bddNearbyMarkers.forEach(({ marker, iw }) => { iw.close(); marker.setMap(null); });
  bddNearbyMarkers = [];
  bddActiveCat = null;
  document.querySelectorAll('.bdd-cat-btn').forEach(btn => btn.classList.remove('active'));
}
```

### switchBddTab 수정
```js
// 기존 함수에 'map' 분기 추가
function switchBddTab(id, btn) {
  document.querySelectorAll('.bdd-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bdd-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('bdd-' + id).classList.add('active');
  if (id === 'map') initBddMap(bldDetailIdx);  // ← 추가
}
```

### closeBldDetail 수정
```js
// 드로어 닫을 때 지도 인스턴스 초기화
function closeBldDetail() {
  document.getElementById('bdDrawerBg').classList.remove('show');
  document.getElementById('bdDrawer').classList.remove('open');
  document.body.style.overflow = '';
  bldDetailIdx = null;
  bddMap = null; bddRoadview = null; bddMarker = null;  // ← 추가
  bddInfoWindow = null; bddNearbyMarkers = []; bddActiveCat = null;  // ← 추가
}
```

---

## 작업 순서

```
1. KAKAO_JS_KEY 상수 선언 (파일 상단)
2. 카카오맵 SDK <script> 태그 <head>에 추가 (appkey 파라미터로 KAKAO_JS_KEY 사용)
3. defBd() 15개 건물에 lat, lng 필드 추가
4. 드로어 탭 버튼에 '지도' 추가
5. #bdd-map 패널 HTML 추가
6. CSS 추가
7. JS 함수 추가 (initBddMap, setMapType, toggleRoadview, searchNearby, clearNearby)
8. switchBddTab 수정 (map 분기)
9. closeBldDetail 수정 (인스턴스 초기화)
10. JS 파싱 검증: node -e "const html=require('fs').readFileSync('SJ_대시보드_v5.html','utf8'); const m=html.match(/<script>([\s\S]*?)<\/script>/); new Function(m[1]); console.log('OK');"
```

---

## 검증 기준

- [ ] JS 파싱 오류 없음
- [ ] 드로어에 '지도' 탭이 5번째로 표시됨
- [ ] API 키 없을 때 안내 화면 표시
- [ ] API 키 있을 때 건물 위치 마커 표시
- [ ] 지도/스카이뷰 전환 동작
- [ ] 로드뷰 토글 동작
- [ ] 주변 탐색 카테고리 버튼 동작
- [ ] 드로어 닫기 시 지도 인스턴스 초기화 (메모리 누수 없음)
- [ ] 기존 탭 4개(기본정보/임대현황/관리이력/메모) 정상 동작

---

## 제약사항 (수정 금지)

- `defEq()`, `defBd()` 내 기존 데이터 값은 수정하지 않고 `lat`, `lng`만 추가
- `saveAll()`, `exportJSON()`, `importJSON()`, `generateHTML()` 함수 로직 수정 금지
- 기존 CSS 변수 이름 변경 금지
- Chart.js 차트 인스턴스(`charts` 객체) 수정 금지
- localStorage 키(`dash_eq_v4` 등) 변경 금지

---

## 참고: 카카오 Developers 앱 설정

```
1. https://developers.kakao.com 로그인
2. 내 애플리케이션 > 앱 추가
3. 플랫폼 > Web 플랫폼 등록 > 사이트 도메인 입력
4. 앱 키 > JavaScript 키 복사
5. KAKAO_JS_KEY = '복사한키' 로 설정
```
