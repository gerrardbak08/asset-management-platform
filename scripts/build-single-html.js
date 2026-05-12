#!/usr/bin/env node
// AIMS 전체 서비스를 단일 HTML로 생성
// 실행: node scripts/build-single-html.js
// 출력: AIMS_서비스_완전판.html
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const headHtml = fs.readFileSync(path.join(__dirname, 'html-parts', '01-head.html'), 'utf-8');

// 데이터 로드
const existingHtml = fs.readFileSync(path.join(ROOT, 'AIMS_전체구현.html'), 'utf-8');
const dbMatch = existingHtml.match(/const DB = (\{[\s\S]*?\});\s*\n/);
const dbJson = dbMatch[1];

const extracted = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/api/data/v16-extracted.json'), 'utf-8'));
const storesJson = JSON.stringify(extracted.stores);

// 사진 base64
const photosFile = path.join(ROOT, '_photos_b64.json');
let photosJs = '{}', detailsJs = '{}';
if (fs.existsSync(photosFile)) {
  const p = JSON.parse(fs.readFileSync(photosFile, 'utf-8'));
  photosJs = JSON.stringify(p.photos);
  detailsJs = JSON.stringify(p.details);
  console.log(`사진 로드: ${Object.keys(p.photos).length}장`);
}

// JavaScript 로직
const appJs = `
const DB = ${dbJson};
const STORES = ${storesJson};
const PHOTOS = ${photosJs};
const DETAILS = ${detailsJs};

// === 유틸 ===
function fmtKR(n){if(!n||n===0)return'-';if(n>=1e12)return(n/1e12).toFixed(2)+'조';if(n>=1e8)return(n/1e8).toFixed(0)+'억';if(n>=1e4)return(n/1e4).toFixed(0)+'만';return n.toLocaleString('ko-KR')}
function fmtKRfull(n){if(!n||n===0)return'-';if(n>=1e12)return(n/1e12).toFixed(2)+'조원';if(n>=1e8)return(n/1e8).toFixed(1)+'억원';if(n>=1e4)return(n/1e4).toFixed(0)+'만원';return n.toLocaleString('ko-KR')+'원'}
function fmtPrice(n){if(!n||n===0)return'-';if(n>=1e8)return(n/1e8).toFixed(1)+'억';if(n>=1e4)return(n/1e4).toFixed(0)+'만';return n.toLocaleString('ko-KR')}
function momBadge(ratio){const pct=(ratio*100).toFixed(2);if(ratio>0)return'<span class="mom-badge mom-up">▲ +'+pct+'%</span>';if(ratio<0)return'<span class="mom-badge mom-down">▼ '+pct+'%</span>';return'<span class="mom-badge mom-flat">— 0%</span>'}
function regionOf(addr){if(addr.startsWith('서울'))return'서울';if(addr.startsWith('경기'))return'경기';if(addr.startsWith('강원'))return'강원';if(addr.startsWith('경남')||addr.startsWith('경상남'))return'경남';if(addr.startsWith('경북')||addr.startsWith('경상북'))return'경북';if(addr.startsWith('세종'))return'세종';if(addr.startsWith('부산'))return'부산';return'지방'}
function getPhoto(b){for(const k of Object.keys(PHOTOS)){if(b.name.includes(k))return PHOTOS[k]}return null}
function getDetail(b){for(const k of Object.keys(DETAILS)){if(b.name.includes(k))return DETAILS[k]}return null}

// === 네비게이션 ===
let currentPage='dashboard';
function go(page){
  currentPage=page;
  document.querySelectorAll('.nav-item').forEach(el=>{el.classList.toggle('active',el.dataset.page===page)});
  const titles={dashboard:'자산현황',buildings:'건물',stores:'사업장',leases:'임대계약',maintenance:'유지보수',ledger:'비품 원장',depreciation:'감가상각',admin:'관리'};
  document.getElementById('page-title').textContent=titles[page]||page;
  render();
}
function render(){
  const c=document.getElementById('content');
  switch(currentPage){
    case'dashboard':c.innerHTML=renderDashboard();break;
    case'buildings':c.innerHTML=renderBuildings();break;
    case'stores':c.innerHTML=renderStores();initStores();break;
    case'leases':c.innerHTML=renderLeases();break;
    case'maintenance':c.innerHTML=renderMaintenance();break;
    case'ledger':c.innerHTML=renderLedger();break;
    case'depreciation':c.innerHTML=renderDepreciation();break;
    case'admin':c.innerHTML=renderAdmin();break;
  }
}

// === 대시보드 ===
function renderDashboard(){
  const m=DB.m0;const cur=m.current.asset_kpi;const mom=m.mom;
  return \`
  <div class="hero-card">
    <div class="hero-label">전사 자산 총액</div>
    <div style="display:flex;align-items:baseline;gap:8px;margin-top:8px">
      <span class="hero-value">\${(cur.total/1e12).toFixed(2)}</span>
      <span class="hero-unit">조원</span>
      \${momBadge(mom.total.ratio)}
    </div>
    <div class="hero-sub">전월 대비 \${fmtKRfull(mom.total.value)} 증감 · \${m.meta.current_period} 마감</div>
  </div>
  <div class="g4">
    <div class="kpi-box"><div class="kpi-label">유형자산</div><div class="kpi-val">\${fmtKRfull(cur.tangible.value)}</div><div style="margin-top:4px">\${momBadge(mom.tangible.ratio)}</div></div>
    <div class="kpi-box"><div class="kpi-label">무형자산</div><div class="kpi-val">\${fmtKRfull(cur.intangible.value)}</div><div style="margin-top:4px">\${momBadge(mom.intangible.ratio)}</div></div>
    <div class="kpi-box"><div class="kpi-label">비품</div><div class="kpi-val">\${fmtKRfull(cur.supplies.value)}</div><div style="margin-top:4px">\${momBadge(mom.supplies.ratio)}</div></div>
    <div class="kpi-box"><div class="kpi-label">건물 수</div><div class="kpi-val">\${DB.buildings.length}동</div></div>
  </div>
  <div class="g2">
    <div class="card p4">
      <div class="sec-title">자산 추이 (6개월)</div>
      <canvas id="trend-chart" height="160"></canvas>
    </div>
    <div class="card p4">
      <div class="sec-title">전월 대비 증감</div>
      <canvas id="mom-chart" height="160"></canvas>
    </div>
  </div>
  <div class="card p4">
    <div class="sec-title">자산 매트릭스</div><div class="sec-desc">유형·무형·비품 × 본사·매장·물류</div>
    <div style="overflow-x:auto;margin-top:8px">
      <table class="tbl"><thead><tr><th class="l">구분</th><th>본사</th><th>매장</th><th>물류</th><th>합계</th></tr></thead><tbody>
      \${m.current.asset_matrix.filter(r=>r.subcategory!=='소계'&&r.category!=='합계').map(r=>\`<tr><td class="l">\${r.subcategory}</td><td>\${fmtKR(r.hq)}</td><td>\${fmtKR(r.store)}</td><td>\${fmtKR(r.logistics)}</td><td><b>\${fmtKR(r.total)}</b></td></tr>\`).join('')}
      </tbody></table>
    </div>
  </div>\`;
}

// === 건물 ===
function renderBuildings(){
  return \`<div class="search-box"><span>🔍</span><input id="bld-search" placeholder="건물명 또는 주소 검색…" oninput="filterBuildings()"></div>
  <div class="sec-title">건물 목록 <span style="font-weight:400;color:var(--muted);font-size:11px">\${DB.buildings.length}동</span></div>
  <div class="bld-grid" id="bld-grid">\${DB.buildings.map(b=>buildingCard(b)).join('')}</div>\`;
}
function buildingCard(b){
  const photo=getPhoto(b);
  const region=regionOf(b.address);
  const rate=b.rentalRate||0;
  const barColor=rate===100?'var(--success)':rate>=50?'var(--primary)':rate>0?'var(--warning)':'var(--danger)';
  let risk='';
  if(!photo)risk='<span class="risk-badge risk-d">사진 미등록</span>';
  else if(rate===100)risk='<span class="risk-badge risk-s">안정</span>';
  else if(rate>0&&rate<50)risk='<span class="risk-badge risk-w">임대율 낮음</span>';
  return \`<div class="bld-card" onclick="openBuilding('\${b.id}')" style="position:relative">
    <span class="region-tag">\${region}</span>
    \${photo?\`<img class="bld-photo" src="\${photo}" alt="\${b.name}">\`:\`<div class="bld-photo-empty">📷 사진 미등록</div>\`}
    <div class="bld-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px"><div class="bld-name">\${b.name}</div>\${risk}</div>
      <div class="bld-addr">📍 \${b.address}</div>
      <div class="bld-kpi">
        <div class="bld-kpi-item"><div class="label">취득가</div><div class="val">\${fmtPrice(b.acquisitionPrice)}원</div></div>
        <div class="bld-kpi-item"><div class="label">연면적</div><div class="val">\${Math.round(b.areaPyeong).toLocaleString()}평</div></div>
        <div class="bld-kpi-item"><div class="label">임차인</div><div class="val">\${b.tenant}</div></div>
        <div class="bld-kpi-item"><div class="label">용도</div><div class="val">\${b.use.length>8?b.use.slice(0,8)+'…':b.use}</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11px"><span style="color:var(--muted)">임대율</span><span style="font-weight:700">\${rate}%</span></div>
      <div class="rental-bar"><div class="rental-fill" style="width:\${rate}%;background:\${barColor}"></div></div>
    </div>
  </div>\`;
}
function filterBuildings(){
  const q=document.getElementById('bld-search').value.toLowerCase();
  const filtered=DB.buildings.filter(b=>b.name.toLowerCase().includes(q)||b.address.includes(q)||b.tenant.includes(q));
  document.getElementById('bld-grid').innerHTML=filtered.map(b=>buildingCard(b)).join('');
}
function openBuilding(id){
  const b=DB.buildings.find(x=>x.id===id);if(!b)return;
  document.getElementById('drawer-title').textContent=b.name;
  document.getElementById('drawer-addr').textContent=b.address;
  const photo=getPhoto(b);const detail=getDetail(b);
  document.getElementById('drawer-body').innerHTML=\`
    \${photo?\`<img src="\${photo}" style="width:100%;height:180px;object-fit:cover;border-radius:10px;margin-bottom:12px">\`:''}
    \${detail?\`<img src="\${detail}" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:12px;opacity:0.9">\`:''}
    <div class="g2" style="margin-bottom:12px">
      <div class="kpi-box"><div class="kpi-label">용도</div><div class="kpi-val">\${b.use}</div></div>
      <div class="kpi-box"><div class="kpi-label">층수</div><div class="kpi-val">\${b.floors}</div></div>
      <div class="kpi-box"><div class="kpi-label">연면적</div><div class="kpi-val">\${b.areaSqm.toLocaleString()}㎡ (\${Math.round(b.areaPyeong).toLocaleString()}평)</div></div>
      <div class="kpi-box"><div class="kpi-label">취득가</div><div class="kpi-val">\${fmtKRfull(b.acquisitionPrice)}</div></div>
      <div class="kpi-box"><div class="kpi-label">취득일</div><div class="kpi-val">\${b.acquisitionDate?new Date(b.acquisitionDate).toISOString().slice(0,10):'-'}</div></div>
      <div class="kpi-box"><div class="kpi-label">임차인</div><div class="kpi-val">\${b.tenant}</div></div>
      <div class="kpi-box"><div class="kpi-label">임대율</div><div class="kpi-val">\${b.rentalRate}%</div></div>
      <div class="kpi-box"><div class="kpi-label">공실률</div><div class="kpi-val">\${b.vacancy}%</div></div>
    </div>\`;
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('building-drawer').classList.add('open');
}
function closeDrawer(){
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('building-drawer').classList.remove('open');
}

// === 사업장 ===
let storeSelected=null;
function renderStores(){
  return \`<div class="store-layout">
    <div class="store-list" id="store-list">
      <div style="padding:8px 12px;border-bottom:1px solid var(--border)"><div class="search-box"><span>🔍</span><input id="store-search" placeholder="사업장 검색…" oninput="filterStores()"></div></div>
      <div id="store-items"></div>
    </div>
    <div class="store-detail" id="store-detail"><div class="card p4" style="text-align:center;color:var(--muted)">좌측에서 사업장을 선택하세요</div></div>
  </div>\`;
}
function initStores(){filterStores()}
function filterStores(){
  const q=(document.getElementById('store-search')?.value||'').toLowerCase();
  const filtered=STORES.filter(s=>s.name.toLowerCase().includes(q)).slice(0,50);
  document.getElementById('store-items').innerHTML=filtered.map((s,i)=>\`<div class="store-item\${storeSelected===s.name?' active':''}" onclick="selectStore(\${i},'\${s.name.replace(/'/g,"\\\\'")}')"><div style="min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${s.name}</div><div style="font-size:10px;color:var(--muted)">\${s.site_type||''}</div></div><span style="font-weight:700;white-space:nowrap">\${fmtKR(s.asset_value||0)}</span></div>\`).join('');
  if(filtered.length>0&&!storeSelected)selectStore(0,filtered[0].name);
}
function selectStore(idx,name){
  storeSelected=name;
  const s=STORES.find(x=>x.name===name);if(!s)return;
  document.querySelectorAll('.store-item').forEach((el,i)=>el.classList.toggle('active',el.textContent.includes(name)));
  const types=Object.entries(s.asset_by_type||{}).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);
  const cats=Object.entries(s.supply_by_category||{}).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value).slice(0,5);
  document.getElementById('store-detail').innerHTML=\`
    <div class="card p3"><div style="display:flex;justify-content:space-between"><div><span style="font-size:15px;font-weight:700">\${s.name}</span> <span style="font-size:11px;color:var(--muted)">\${s.site_type||''}</span></div><span style="font-size:10px;color:var(--muted)">2026-03 기준</span></div>
      <div class="g4" style="margin-top:8px">
        <div class="kpi-box"><div class="kpi-label">자산 장부가</div><div class="kpi-val">\${fmtKRfull(s.asset_value||0)}</div></div>
        <div class="kpi-box"><div class="kpi-label">자산 항목</div><div class="kpi-val">\${(s.asset_count||0).toLocaleString()}건</div></div>
        <div class="kpi-box"><div class="kpi-label">비품 재고액</div><div class="kpi-val">\${fmtKRfull(s.supply_value||0)}</div></div>
        <div class="kpi-box"><div class="kpi-label">비품 카테고리</div><div class="kpi-val">\${Object.keys(s.supply_by_category||{}).length}종</div></div>
      </div>
    </div>
    <div class="g2">
      <div class="card p3"><div class="sec-title">비품 카테고리 TOP 5</div>
        \${cats.map(c=>\`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:11px"><span>\${c.name}</span><span style="font-weight:700">\${fmtKR(c.value)}</span></div>\`).join('')}
      </div>
      <div class="card p3"><div class="sec-title">자산 유형별</div>
        \${types.map(t=>\`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:11px"><span>\${t.name}</span><span style="font-weight:700">\${fmtKRfull(t.value)}</span></div>\`).join('')}
      </div>
    </div>
    <div class="card p3"><div class="sec-title" style="margin-bottom:6px">활동 타임라인</div>
      <div class="tl-row">
        <div class="tl-card"><div class="tl-icon" style="background:#e8edf7;color:var(--primary)">🏢</div><div><div class="tl-title">사업장 등록</div><div class="tl-desc">\${fmtKR(s.asset_value||0)}원 · \${s.asset_count||0}건</div></div></div>
        \${cats[0]?\`<div class="tl-card"><div class="tl-icon" style="background:#fef3c7;color:var(--warning)">📦</div><div><div class="tl-title">최대 — \${cats[0].name}</div><div class="tl-desc">\${fmtKR(cats[0].value)}원</div></div></div>\`:''}
        \${types[0]?\`<div class="tl-card"><div class="tl-icon" style="background:var(--info-bg);color:var(--info)">📈</div><div><div class="tl-title">유형 1위 — \${types[0].name}</div><div class="tl-desc">\${fmtKRfull(types[0].value)}</div></div></div>\`:''}
        <div class="tl-card"><div class="tl-icon" style="background:var(--muted-bg);color:var(--muted)">🕐</div><div><div class="tl-title">데이터 기준</div><div class="tl-desc">2026-03 마감</div></div></div>
      </div>
    </div>\`;
}

// === 임대계약 ===
function renderLeases(){
  const leases=DB.buildings.filter(b=>b.tenant&&b.tenant!=='-').map(b=>({name:b.name,tenant:b.tenant,area:b.rentalArea,rate:b.rentalRate}));
  return \`<div class="sec-title">임대 현황 <span style="font-weight:400;color:var(--muted);font-size:11px">\${leases.length}건</span></div>
  <div class="card" style="overflow:auto"><table class="tbl"><thead><tr><th class="l">건물</th><th class="l">임차인</th><th>임대면적(㎡)</th><th>임대율</th></tr></thead><tbody>
  \${leases.map(l=>\`<tr><td class="l">\${l.name}</td><td class="l">\${l.tenant}</td><td>\${l.area.toLocaleString()}</td><td>\${l.rate}%</td></tr>\`).join('')}
  </tbody></table></div>\`;
}

// === 유지보수 ===
function renderMaintenance(){
  return \`<div class="card p4" style="text-align:center;color:var(--muted);padding:40px"><div style="font-size:24px;margin-bottom:8px">🔧</div><div class="sec-title">유지보수 이력</div><div class="sec-desc">등록된 유지보수 이력이 표시됩니다.<br>현재 V16 데이터에는 유지보수 이력이 포함되어 있지 않습니다.</div></div>\`;
}

// === 비품 원장 ===
function renderLedger(){
  const snaps=DB.eqSnaps||[];
  const byName={};snaps.forEach(s=>{if(!byName[s.equipmentName])byName[s.equipmentName]={name:s.equipmentName,hq:0,store:0,logistics:0};byName[s.equipmentName][s.locationType]+=s.inventoryAmount});
  const items=Object.values(byName).sort((a,b)=>(b.hq+b.store+b.logistics)-(a.hq+a.store+a.logistics));
  return \`<div class="sec-title">비품 재고 현황 <span style="font-weight:400;color:var(--muted);font-size:11px">\${items.length}종</span></div>
  <div class="card" style="overflow:auto"><table class="tbl"><thead><tr><th class="l">품목</th><th>본사</th><th>매장</th><th>물류</th><th>합계</th></tr></thead><tbody>
  \${items.slice(0,30).map(i=>\`<tr><td class="l">\${i.name}</td><td>\${fmtKR(i.hq)}</td><td>\${fmtKR(i.store)}</td><td>\${fmtKR(i.logistics)}</td><td><b>\${fmtKR(i.hq+i.store+i.logistics)}</b></td></tr>\`).join('')}
  </tbody></table></div>\`;
}

// === 감가상각 ===
function renderDepreciation(){
  const blds=DB.buildings.map(b=>({name:b.name,price:b.acquisitionPrice,date:b.acquisitionDate?new Date(b.acquisitionDate).toISOString().slice(0,10):'-',life:30}));
  return \`<div class="sec-title">감가상각 스케줄</div><div class="sec-desc">건물 정액법 30년 기준</div>
  <div class="card" style="overflow:auto;margin-top:8px"><table class="tbl"><thead><tr><th class="l">건물</th><th>취득가</th><th>취득일</th><th>내용연수</th><th>연간 상각비</th></tr></thead><tbody>
  \${blds.map(b=>\`<tr><td class="l">\${b.name}</td><td>\${fmtKRfull(b.price)}</td><td>\${b.date}</td><td>\${b.life}년</td><td>\${fmtKRfull(Math.round(b.price/b.life))}</td></tr>\`).join('')}
  </tbody></table></div>\`;
}

// === 관리 ===
function renderAdmin(){
  return \`<div class="card p4"><div class="sec-title">시스템 정보</div>
    <div class="g2" style="margin-top:12px">
      <div class="kpi-box"><div class="kpi-label">데이터 기준</div><div class="kpi-val">2026-03</div></div>
      <div class="kpi-box"><div class="kpi-label">건물</div><div class="kpi-val">\${DB.buildings.length}동</div></div>
      <div class="kpi-box"><div class="kpi-label">사업장</div><div class="kpi-val">\${STORES.length.toLocaleString()}개</div></div>
      <div class="kpi-box"><div class="kpi-label">비품 종류</div><div class="kpi-val">\${new Set((DB.eqSnaps||[]).map(s=>s.equipmentName)).size}종</div></div>
    </div>
  </div>\`;
}

// === 차트 초기화 ===
function initCharts(){
  if(currentPage!=='dashboard')return;
  const trendEl=document.getElementById('trend-chart');
  const momEl=document.getElementById('mom-chart');
  if(!trendEl||!momEl)return;
  const snaps=[...DB.snapshots].reverse();
  new Chart(trendEl,{type:'line',data:{labels:snaps.map(s=>s.period),datasets:[{label:'총자산',data:snaps.map(s=>s.totalAsset/1e8),borderColor:'#1B3A7A',backgroundColor:'rgba(27,58,122,0.1)',fill:true,tension:0.3}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>fmtKR(v*1e8)}}}}});
  const mom=DB.m0.mom;
  new Chart(momEl,{type:'bar',data:{labels:['유형','무형','비품'],datasets:[{data:[mom.tangible.value/1e8,mom.intangible.value/1e8,mom.supplies.value/1e8],backgroundColor:['#1B3A7A','#1d4ed8','#15803d']}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>fmtKR(v*1e8)}}}}});
}

// === 초기화 ===
document.addEventListener('DOMContentLoaded',()=>{render();setTimeout(initCharts,100)});
`;

// 최종 HTML 조립
const finalHtml = headHtml + '\n<script>\n' + appJs + '\n<\/script>\n</body>\n</html>';

const outPath = path.join(ROOT, 'AIMS_서비스_완전판.html');
fs.writeFileSync(outPath, finalHtml);
const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
console.log(`\n✅ 생성 완료: ${outPath}`);
console.log(`   크기: ${sizeMB}MB`);
