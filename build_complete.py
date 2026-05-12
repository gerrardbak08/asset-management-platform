#!/usr/bin/env python3
"""Build complete AIMS single-page HTML with all 8 pages."""
import os

BASE = '/Users/gerrard/Projects/asset-management-platform-1'

# Read data
with open(os.path.join(BASE, '_data_embed.js'), 'r', encoding='utf-8') as f:
    data_js = f.read()

OUTPUT = os.path.join(BASE, 'AIMS_완전판_v2.html')

CSS = r"""
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:240 9% 98%;--card:0 0% 100%;--fg:240 6% 10%;--muted-fg:240 5% 34%;--border:240 5% 90%;--muted:240 9% 96%;--primary:213 53% 25%;--primary-fg:0 0% 100%;--accent:38 92% 50%;--danger:0 70% 35%;--warning:30 90% 45%;--success:152 50% 32%;--info:213 90% 50%;--sidebar:213 53% 18%;--sidebar-fg:0 0% 96%;--sidebar-muted:213 15% 70%;--sidebar-border:213 40% 30%;--radius:16px}
html,body{height:100%;font-family:'Pretendard Variable',Pretendard,system-ui,sans-serif;font-size:14px;color:hsl(var(--fg));background:hsl(var(--bg));letter-spacing:-0.015em;word-break:keep-all}
button{font-family:inherit;cursor:pointer;border:none;background:none}
input,textarea,select{font-family:inherit;font-size:inherit}
#app{display:flex;height:100vh;overflow:hidden}
aside{width:240px;min-width:240px;background:hsl(var(--sidebar));color:hsl(var(--sidebar-fg));display:flex;flex-direction:column;height:100vh;flex-shrink:0}
.aside-header{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid hsl(var(--sidebar-border));background:#fff}
.aside-header .logo{width:28px;height:28px;background:linear-gradient(135deg,#e8302a 40%,#1B3A7A 60%);border-radius:50%}
.aside-header .title{font-size:14px;font-weight:700;color:#1B3A7A;line-height:1.2}
.aside-header .sub{font-size:9px;color:#6b7280;margin-top:1px}
nav{flex:1;padding:12px 0;overflow-y:auto}
.nav-group{padding:4px 16px;margin-top:14px;font-size:9px;font-weight:700;color:hsl(var(--sidebar-muted));text-transform:uppercase;letter-spacing:0.08em}
.nav-item{display:flex;align-items:center;gap:8px;padding:9px 16px;color:hsl(var(--sidebar-fg)/0.7);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s}
.nav-item:hover{background:hsl(0 0% 100%/0.05);color:hsl(var(--sidebar-fg))}
.nav-item.active{background:hsl(0 0% 100%/0.08);color:#fff;font-weight:700}
.aside-footer{padding:12px 16px;border-top:1px solid hsl(var(--sidebar-border));font-size:10px;color:hsl(var(--sidebar-muted))}
#main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
header{height:56px;min-height:56px;background:hsl(var(--card));border-bottom:1px solid hsl(var(--border));display:flex;align-items:center;padding:0 20px;gap:12px}
header h1{font-size:16px;font-weight:700}
header .desc{font-size:11px;color:hsl(var(--muted-fg))}
header .actions{margin-left:auto;display:flex;gap:8px}
.icon-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:hsl(var(--muted-fg));transition:0.15s}
.icon-btn:hover{background:hsl(var(--muted));color:hsl(var(--fg))}
#content{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px;scrollbar-gutter:stable;min-height:0}
.page{display:none;flex-direction:column;gap:12px}.page.active{display:flex;flex:1;min-height:0}
.card{background:hsl(var(--card));border-radius:var(--radius);border:1px solid hsl(var(--border));padding:16px}
.shadow-sm{box-shadow:0 1px 2px rgb(0 0 0/0.04)}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.kpi-card{padding:12px;border-radius:12px;border:1px solid hsl(var(--border));background:hsl(var(--muted)/0.3)}
.kpi-card .label{font-size:10px;font-weight:600;color:hsl(var(--muted-fg));text-transform:uppercase;letter-spacing:0.03em}
.kpi-card .value{font-size:15px;font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums}
.hero{padding:16px;background:linear-gradient(135deg,hsl(var(--card)),hsl(213 53% 95%));border:1px solid hsl(213 53% 85%);border-radius:var(--radius)}
.hero .label{font-size:10px;font-weight:700;color:hsl(var(--primary));text-transform:uppercase}
.hero .value{font-size:34px;font-weight:800;line-height:1.1;letter-spacing:-0.02em;margin-top:4px}
.hero .unit{font-size:16px;font-weight:600;color:hsl(var(--muted-fg))}
.mom{display:inline-flex;align-items:center;gap:2px;padding:2px 7px;border-radius:99px;font-size:10px;font-weight:700}
.mom-up{background:#dcfce7;color:#15803d}.mom-down{background:#fef2f2;color:#b91c1c}
.sec-title{font-size:14px;font-weight:700}.sec-desc{font-size:11px;color:hsl(var(--muted-fg));margin-top:1px}
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{padding:8px 12px;text-align:right;font-size:11px;font-weight:600;color:hsl(var(--muted-fg));background:hsl(var(--muted));border-bottom:1px solid hsl(var(--border));white-space:nowrap}
.tbl th.l{text-align:left}
.tbl td{padding:8px 12px;border-bottom:1px solid hsl(var(--border));text-align:right;font-variant-numeric:tabular-nums}
.tbl td.l{text-align:left;font-variant-numeric:normal}
.tbl tr:hover td{background:hsl(var(--muted)/0.5)}
.badge{display:inline-flex;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}
.badge-success{background:#dcfce7;color:#15803d}.badge-warning{background:#fef3cd;color:#92400e}.badge-danger{background:#fef2f2;color:#b91c1c}.badge-info{background:#dbeafe;color:#1d4ed8}.badge-muted{background:hsl(var(--muted));color:hsl(var(--muted-fg))}
.progress{height:6px;border-radius:99px;background:hsl(var(--muted));overflow:hidden}
.progress-bar{height:100%;border-radius:99px;transition:width 0.3s}
.search-box{width:100%;padding:8px 12px 8px 36px;border:1px solid hsl(var(--border));border-radius:12px;background:hsl(var(--muted));color:hsl(var(--fg));outline:none;font-size:13px}
.search-box:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 3px hsl(var(--primary)/0.1)}
.store-list{overflow-y:auto;flex:1;min-height:0}
.store-card{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;padding:0}
.store-card .card-header{padding:12px 16px;border-bottom:1px solid hsl(var(--border))}
.store-item{padding:8px 12px;border-bottom:1px solid hsl(var(--border));cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:0.1s;gap:6px}
.store-item:hover,.store-item.active{background:hsl(var(--muted))}
.store-item .name{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.store-item .type{font-size:10px;color:hsl(var(--muted-fg))}
.store-item .val{font-size:10px;color:hsl(var(--muted-fg));font-variant-numeric:tabular-nums;flex-shrink:0}
.timeline-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
.tl-item{display:flex;align-items:flex-start;gap:6px;padding:10px;border-radius:8px;border:1px solid hsl(var(--border)/0.5);background:hsl(var(--muted)/0.2);min-height:56px;overflow:hidden}
.tl-icon{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;margin-top:2px}
.tl-content{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.tl-title{font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-detail{font-size:9px;color:hsl(var(--muted-fg));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bld-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.bld-card{border-radius:var(--radius);border:1px solid hsl(var(--border));background:hsl(var(--card));overflow:hidden;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s}
.bld-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgb(0 0 0/0.08)}
.bld-photo{height:130px;background:hsl(var(--muted));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.bld-photo img{width:100%;height:100%;object-fit:cover}
.bld-photo .region{position:absolute;top:8px;right:8px;background:hsl(var(--fg)/0.8);color:hsl(var(--card));padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700}
.bld-info{padding:12px}
.bld-name{font-size:14px;font-weight:600;margin-bottom:4px}
.bld-addr{font-size:11px;color:hsl(var(--muted-fg));margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bld-kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
.bld-kpi{background:hsl(var(--muted)/0.4);border-radius:8px;padding:6px 8px;border:1px solid hsl(var(--border))}
.bld-kpi .lbl{font-size:9px;color:hsl(var(--muted-fg));text-transform:uppercase;font-weight:600}
.bld-kpi .val{font-size:11px;font-weight:600;margin-top:1px;font-variant-numeric:tabular-nums}
.filter-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.filter-btn{padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--muted-fg));transition:0.15s}
.filter-btn:hover{border-color:hsl(var(--primary));color:hsl(var(--primary))}
.filter-btn.active{background:hsl(var(--primary));color:#fff;border-color:hsl(var(--primary))}
.chart-box{position:relative;height:220px}
.tab-bar{display:flex;gap:0;border-bottom:2px solid hsl(var(--border));margin-bottom:12px}
.tab-btn{padding:8px 16px;font-size:12px;font-weight:600;color:hsl(var(--muted-fg));border-bottom:2px solid transparent;margin-bottom:-2px;transition:0.15s}
.tab-btn:hover{color:hsl(var(--fg))}
.tab-btn.active{color:hsl(var(--primary));border-bottom-color:hsl(var(--primary))}
.detail-panel{display:none;flex-direction:column;gap:12px}.detail-panel.active{display:flex}
.back-btn{font-size:12px;color:hsl(var(--primary));font-weight:600;cursor:pointer;margin-bottom:8px}
.stores-layout{display:grid;grid-template-columns:280px 1fr;gap:12px;flex:1;min-height:0}
.stores-sidebar{display:flex;flex-direction:column;min-height:0;border:1px solid hsl(var(--border));border-radius:var(--radius);background:hsl(var(--card));overflow:hidden}
.stores-main{display:flex;flex-direction:column;gap:12px;overflow-y:auto;min-height:0}
@media(max-width:1100px){.bld-grid{grid-template-columns:1fr 1fr}.grid-4{grid-template-columns:repeat(2,1fr)}.timeline-grid{grid-template-columns:repeat(3,1fr)}.stores-layout{grid-template-columns:1fr}}
@media(max-width:700px){.bld-grid,.grid-3,.grid-2{grid-template-columns:1fr}.timeline-grid{grid-template-columns:repeat(2,1fr)}}
"""

print('CSS ready')

BODY_HTML = r"""
<div id="app">
<aside>
  <div class="aside-header">
    <div class="logo"></div>
    <div><div class="title">AIMS</div><div class="sub">전사 자산관리 시스템</div></div>
  </div>
  <nav>
    <div class="nav-group">운영</div>
    <div class="nav-item active" data-page="dashboard" onclick="go('dashboard')">📊 자산현황</div>
    <div class="nav-item" data-page="buildings" onclick="go('buildings')">🏢 건물</div>
    <div class="nav-item" data-page="stores" onclick="go('stores')">🏪 사업장</div>
    <div class="nav-item" data-page="leases" onclick="go('leases')">�� 임대계약</div>
    <div class="nav-item" data-page="maintenance" onclick="go('maintenance')">🔧 유지보수</div>
    <div class="nav-item" data-page="ledger" onclick="go('ledger')">📦 비품 원장</div>
    <div class="nav-item" data-page="depreciation" onclick="go('depreciation')">📉 감가상각</div>
    <div class="nav-group">관리</div>
    <div class="nav-item" data-page="admin" onclick="go('admin')">⚙️ 관리</div>
  </nav>
  <div class="aside-footer">AIMS v2.0 · 2026-03 마감</div>
</aside>
<div id="main">
  <header>
    <h1 id="page-title">자산현황 대시보드</h1>
    <span class="desc" id="page-desc">26-03 마감 기준</span>
    <div class="actions">
      <button class="icon-btn" onclick="location.reload()" title="새로고침">🔄</button>
    </div>
  </header>
  <div id="content">
    <!-- PAGE: Dashboard -->
    <div class="page active" id="pg-dashboard"></div>
    <!-- PAGE: Buildings -->
    <div class="page" id="pg-buildings"></div>
    <!-- PAGE: Stores -->
    <div class="page" id="pg-stores"></div>
    <!-- PAGE: Leases -->
    <div class="page" id="pg-leases"></div>
    <!-- PAGE: Maintenance -->
    <div class="page" id="pg-maintenance"></div>
    <!-- PAGE: Ledger -->
    <div class="page" id="pg-ledger"></div>
    <!-- PAGE: Depreciation -->
    <div class="page" id="pg-depreciation"></div>
    <!-- PAGE: Admin -->
    <div class="page" id="pg-admin"></div>
  </div>
</div>
</div>
"""

print('BODY_HTML ready')

APP_JS = r"""
// ===== Utility Functions =====
const fmt = v => {
  if(v>=1e12) return (v/1e12).toFixed(2)+'조';
  if(v>=1e8) return (v/1e8).toFixed(0)+'억';
  if(v>=1e4) return (v/1e4).toFixed(0)+'만';
  return v.toLocaleString();
};
const fmtFull = v => v.toLocaleString('ko-KR');
const pct = v => (v*100).toFixed(2)+'%';
const momBadge = (ratio) => {
  if(ratio>0) return `<span class="mom mom-up">▲ ${pct(ratio)}</span>`;
  if(ratio<0) return `<span class="mom mom-down">▼ ${pct(Math.abs(ratio))}</span>`;
  return `<span class="mom">- 0%</span>`;
};

// ===== Navigation =====
const titles = {dashboard:'자산현황 대시보드',buildings:'건물 관리',stores:'사업장 현황',leases:'임대계약 관리',maintenance:'유지보수 현황',ledger:'비품 원장',depreciation:'감가상각 현황',admin:'시스템 관리'};
const descs = {dashboard:'26-03 마감 기준',buildings:'보유 건물 15개동',stores:'전국 2,015개 사업장',leases:'임대 현황 및 계약 관리',maintenance:'설비 유지보수 이력',ledger:'비품 재고 및 이동 현황',depreciation:'자산별 감가상각 현황',admin:'사용자 및 시스템 설정'};

function go(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('pg-'+page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('page-title').textContent=titles[page]||page;
  document.getElementById('page-desc').textContent=descs[page]||'';
  if(!rendered[page]){rendered[page]=true;renderers[page]();}
}
const rendered={dashboard:false,buildings:false,stores:false,leases:false,maintenance:false,ledger:false,depreciation:false,admin:false};
const renderers={};

// ===== PAGE: Dashboard =====
renderers.dashboard=function(){
  const el=document.getElementById('pg-dashboard');
  const c=M0.current.asset_kpi, m=M0.mom;
  el.innerHTML=`
  <div class="hero">
    <div class="label">총 자산가치 (26-03 마감)</div>
    <div class="value">${fmt(c.total)} <span class="unit">원</span></div>
    <div style="margin-top:6px">${momBadge(m.total.ratio)} 전월 대비 ${fmt(Math.abs(m.total.value))} ${m.total.value>=0?'증가':'감소'}</div>
  </div>
  <div class="grid-4">
    <div class="kpi-card"><div class="label">유형자산</div><div class="value">${fmt(c.tangible.value)}</div><div style="margin-top:2px">${momBadge(m.tangible.ratio)}</div></div>
    <div class="kpi-card"><div class="label">무형자산</div><div class="value">${fmt(c.intangible.value)}</div><div style="margin-top:2px">${momBadge(m.intangible.ratio)}</div></div>
    <div class="kpi-card"><div class="label">비품</div><div class="value">${fmt(c.supplies.value)}</div><div style="margin-top:2px">${momBadge(m.supplies.ratio)}</div></div>
    <div class="kpi-card"><div class="label">사업장 수</div><div class="value">${STORES.length.toLocaleString()}개</div></div>
  </div>
  <div class="grid-3">
    <div class="kpi-card"><div class="label">본사</div><div class="value">${fmt(m.location.hq.value)}</div><div style="margin-top:2px">${momBadge(m.location.hq.ratio)}</div></div>
    <div class="kpi-card"><div class="label">매장</div><div class="value">${fmt(m.location.store.value)}</div><div style="margin-top:2px">${momBadge(m.location.store.ratio)}</div></div>
    <div class="kpi-card"><div class="label">물류</div><div class="value">${fmt(m.location.logistics.value)}</div><div style="margin-top:2px">${momBadge(m.location.logistics.ratio)}</div></div>
  </div>
  <div class="card" style="padding:16px">
    <div class="sec-title">자산 구성 매트릭스</div>
    <div class="sec-desc">유형별·거점별 자산 현황</div>
    <div style="overflow-x:auto;margin-top:12px">
      <table class="tbl">
        <thead><tr><th class="l">구분</th><th class="l">세부</th><th>본사</th><th>매장</th><th>물류</th><th>합계</th></tr></thead>
        <tbody>${M0.current.asset_matrix.map(r=>`<tr><td class="l">${r.category}</td><td class="l">${r.subcategory}</td><td>${fmt(r.hq)}</td><td>${fmt(r.store)}</td><td>${fmt(r.logistics)}</td><td><b>${fmt(r.total)}</b></td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
  <div class="card" style="padding:16px">
    <div class="sec-title">전월 대비 주요 변동</div>
    <div style="overflow-x:auto;margin-top:12px">
      <table class="tbl">
        <thead><tr><th class="l">구분</th><th class="l">세부</th><th>당월</th><th>전월</th><th>증감</th><th>증감률</th></tr></thead>
        <tbody>${M0.movers.top_up.map(r=>`<tr><td class="l">${r.category}</td><td class="l">${r.subcategory}</td><td>${fmt(r.current)}</td><td>${fmt(r.previous)}</td><td>${fmt(r.delta)}</td><td>${momBadge(r.ratio)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
  <div class="card" style="padding:16px">
    <div class="sec-title">비품 KPI</div>
    <div class="grid-4" style="margin-top:12px">
      <div class="kpi-card"><div class="label">재고 증감</div><div class="value">${fmt(m.supplies_kpi.stock.value)}</div><div style="margin-top:2px">${momBadge(m.supplies_kpi.stock.ratio)}</div></div>
      <div class="kpi-card"><div class="label">구매</div><div class="value">${fmt(m.supplies_kpi.purchase.value)}</div><div style="margin-top:2px">${momBadge(m.supplies_kpi.purchase.ratio)}</div></div>
      <div class="kpi-card"><div class="label">이관</div><div class="value">${fmt(m.supplies_kpi.transfer.value)}</div><div style="margin-top:2px">${momBadge(m.supplies_kpi.transfer.ratio)}</div></div>
      <div class="kpi-card"><div class="label">폐기</div><div class="value">${fmt(m.supplies_kpi.disposal.value)}</div><div style="margin-top:2px">${momBadge(m.supplies_kpi.disposal.ratio)}</div></div>
    </div>
  </div>`;
};

// ===== PAGE: Buildings =====
renderers.buildings=function(){
  const el=document.getElementById('pg-buildings');
  let html='<div class="bld-grid">';
  BUILDINGS.forEach((b,i)=>{
    const photoSrc=b.photo&&PHOTOS_B64[b.photo]?'data:image/jpeg;base64,'+PHOTOS_B64[b.photo]:'';
    const region=b.address.split(' ')[0];
    html+=`<div class="bld-card" onclick="showBldDetail(${i})">
      <div class="bld-photo">${photoSrc?`<img src="${photoSrc}" alt="${b.name}">`:'🏢'}<div class="region">${region}</div></div>
      <div class="bld-info">
        <div class="bld-name">${b.name}</div>
        <div class="bld-addr">${b.address}</div>
        <div class="bld-kpis">
          <div class="bld-kpi"><div class="lbl">면적</div><div class="val">${b.areaPyeong.toLocaleString()}평</div></div>
          <div class="bld-kpi"><div class="lbl">취득가</div><div class="val">${fmt(b.acquisitionPrice)}</div></div>
          <div class="bld-kpi"><div class="lbl">임대율</div><div class="val">${b.rentalRate}%</div></div>
          <div class="bld-kpi"><div class="lbl">층수</div><div class="val">${b.floors}</div></div>
        </div>
      </div>
    </div>`;
  });
  html+='</div><div class="detail-panel" id="bld-detail"></div>';
  el.innerHTML=html;
};
window.showBldDetail=function(i){
  const b=BUILDINGS[i];
  const dp=document.getElementById('bld-detail');
  const photoSrc=b.detailPhoto&&PHOTOS_B64[b.detailPhoto]?'data:image/jpeg;base64,'+PHOTOS_B64[b.detailPhoto]:(b.photo&&PHOTOS_B64[b.photo]?'data:image/jpeg;base64,'+PHOTOS_B64[b.photo]:'');
  dp.classList.add('active');
  dp.innerHTML=`<div class="back-btn" onclick="this.parentElement.classList.remove('active')">← 목록으로</div>
    <div class="card" style="padding:16px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${photoSrc?`<img src="${photoSrc}" style="width:300px;height:200px;object-fit:cover;border-radius:12px">`:''}
        <div style="flex:1;min-width:200px">
          <h2 style="font-size:18px;font-weight:700;margin-bottom:8px">${b.name}</h2>
          <table class="tbl"><tbody>
            <tr><td class="l">주소</td><td class="l">${b.address}</td></tr>
            <tr><td class="l">용도</td><td class="l">${b.use}</td></tr>
            <tr><td class="l">면적</td><td class="l">${b.areaSqm.toLocaleString()}㎡ (${b.areaPyeong.toLocaleString()}평)</td></tr>
            <tr><td class="l">층수</td><td class="l">${b.floors}</td></tr>
            <tr><td class="l">사용승인일</td><td class="l">${b.approvalDate}</td></tr>
            <tr><td class="l">취득일</td><td class="l">${b.acquisitionDate}</td></tr>
            <tr><td class="l">취득가</td><td class="l">${fmtFull(b.acquisitionPrice)}원</td></tr>
            <tr><td class="l">임대면적</td><td class="l">${b.rentalArea.toLocaleString()}㎡</td></tr>
            <tr><td class="l">임대율</td><td class="l">${b.rentalRate}%</td></tr>
            <tr><td class="l">공실</td><td class="l">${b.vacancy}%</td></tr>
            <tr><td class="l">임차인</td><td class="l">${b.tenant||'-'}</td></tr>
          </tbody></table>
        </div>
      </div>
    </div>`;
  dp.scrollIntoView({behavior:'smooth'});
};
"""

print('APP_JS part 1 ready')

APP_JS += r"""
// ===== PAGE: Stores =====
renderers.stores=function(){
  const el=document.getElementById('pg-stores');
  const types=['전체','매장','물류','본사'];
  let currentFilter='전체', currentSearch='';
  
  function getFiltered(){
    return STORES.filter(s=>{
      const matchType=currentFilter==='전체'||s.siteType===currentFilter;
      const matchSearch=!currentSearch||s.name.includes(currentSearch);
      return matchType&&matchSearch;
    });
  }
  
  function renderStores(){
    const filtered=getFiltered();
    const listEl=el.querySelector('.store-list');
    const countEl=el.querySelector('.store-count');
    countEl.textContent=`${filtered.length}개 사업장`;
    
    // Show max 200 for performance
    const show=filtered.slice(0,200);
    listEl.innerHTML=show.map((s,i)=>`<div class="store-item" onclick="showStoreDetail(${STORES.indexOf(s)})">
      <div style="min-width:0"><div class="name">${s.name}</div><div class="type">${s.siteType}</div></div>
      <div class="val">${fmt(s.assetValue)}</div>
    </div>`).join('') + (filtered.length>200?`<div style="padding:8px 12px;font-size:11px;color:hsl(var(--muted-fg))">외 ${filtered.length-200}개...</div>`:'');
  }
  
  // Summary KPIs
  const totalAsset=STORES.reduce((a,s)=>a+s.assetValue,0);
  const totalSupply=STORES.reduce((a,s)=>a+s.supplyValue,0);
  const byType={};
  STORES.forEach(s=>{byType[s.siteType]=(byType[s.siteType]||0)+1;});
  
  el.innerHTML=`
  <div class="grid-4" style="flex-shrink:0">
    <div class="kpi-card"><div class="label">총 사업장</div><div class="value">${STORES.length.toLocaleString()}개</div></div>
    <div class="kpi-card"><div class="label">매장</div><div class="value">${(byType['매장']||0).toLocaleString()}개</div></div>
    <div class="kpi-card"><div class="label">물류</div><div class="value">${(byType['물류']||0).toLocaleString()}개</div></div>
    <div class="kpi-card"><div class="label">본사</div><div class="value">${(byType['본사']||0).toLocaleString()}개</div></div>
  </div>
  <div class="stores-layout">
    <div class="stores-sidebar">
      <div style="padding:10px 12px;border-bottom:1px solid hsl(var(--border))">
        <div style="position:relative"><span style="position:absolute;left:10px;top:8px;font-size:13px">🔍</span><input class="search-box" id="store-search" placeholder="사업장 검색..."></div>
        <div class="filter-bar" style="margin-top:8px">${types.map(t=>`<button class="filter-btn${t==='전체'?' active':''}" data-type="${t}">${t}</button>`).join('')}</div>
        <div class="store-count" style="font-size:10px;color:hsl(var(--muted-fg));margin-top:4px">${STORES.length}개 사업장</div>
      </div>
      <div class="store-list"></div>
    </div>
    <div class="stores-main" id="store-detail-area">
      <div class="card" style="padding:24px;text-align:center;color:hsl(var(--muted-fg))">
        <div style="font-size:32px;margin-bottom:8px">🏪</div>
        <div>좌측 목록에서 사업장을 선택하세요</div>
      </div>
    </div>
  </div>`;
  
  // Events
  el.querySelector('#store-search').addEventListener('input',e=>{currentSearch=e.target.value;renderStores();});
  el.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      el.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter=btn.dataset.type;
      renderStores();
    });
  });
  renderStores();
};

window.showStoreDetail=function(i){
  const s=STORES[i];
  const area=document.getElementById('store-detail-area');
  const assetTypes=Object.entries(s.assetByType||{}).sort((a,b)=>b[1]-a[1]);
  const supplyTypes=Object.entries(s.supplyByCategory||{}).sort((a,b)=>b[1]-a[1]);
  const supplyCounts=s.supplyByCategoryCount||{};
  
  area.innerHTML=`
    <div class="card" style="padding:16px">
      <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">${s.name}</h3>
      <span class="badge badge-info">${s.siteType}</span>
      <div class="grid-3" style="margin-top:12px">
        <div class="kpi-card"><div class="label">자산가치</div><div class="value">${fmt(s.assetValue)}</div></div>
        <div class="kpi-card"><div class="label">자산 건수</div><div class="value">${s.assetCount}건</div></div>
        <div class="kpi-card"><div class="label">비품가치</div><div class="value">${fmt(s.supplyValue)}</div></div>
      </div>
    </div>
    ${assetTypes.length?`<div class="card" style="padding:16px">
      <div class="sec-title">자산 유형별 구성</div>
      <table class="tbl" style="margin-top:8px"><thead><tr><th class="l">유형</th><th>금액</th><th>비율</th></tr></thead>
      <tbody>${assetTypes.map(([k,v])=>`<tr><td class="l">${k}</td><td>${fmt(v)}</td><td>${(v/s.assetValue*100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>
    </div>`:''}
    ${supplyTypes.length?`<div class="card" style="padding:16px">
      <div class="sec-title">비품 카테고리별</div>
      <table class="tbl" style="margin-top:8px"><thead><tr><th class="l">카테고리</th><th>금액</th><th>수량</th></tr></thead>
      <tbody>${supplyTypes.map(([k,v])=>`<tr><td class="l">${k}</td><td>${fmt(v)}</td><td>${(supplyCounts[k]||0).toLocaleString()}개</td></tr>`).join('')}</tbody></table>
    </div>`:''}`;
};

// ===== PAGE: Leases =====
renderers.leases=function(){
  const el=document.getElementById('pg-leases');
  const leased=BUILDINGS.filter(b=>b.rentalRate>0);
  const totalArea=leased.reduce((a,b)=>a+b.rentalArea,0);
  const avgRate=leased.length?(leased.reduce((a,b)=>a+b.rentalRate,0)/leased.length):0;
  const totalVacancy=leased.filter(b=>b.vacancy>0).length;
  
  el.innerHTML=`
  <div class="grid-4">
    <div class="kpi-card"><div class="label">임대 건물</div><div class="value">${leased.length}개동</div></div>
    <div class="kpi-card"><div class="label">총 임대면적</div><div class="value">${totalArea.toLocaleString()}㎡</div></div>
    <div class="kpi-card"><div class="label">평균 임대율</div><div class="value">${avgRate.toFixed(1)}%</div></div>
    <div class="kpi-card"><div class="label">공실 건물</div><div class="value">${totalVacancy}개동</div></div>
  </div>
  <div class="card" style="padding:16px">
    <div class="sec-title">임대계약 현황</div>
    <div style="overflow-x:auto;margin-top:12px">
      <table class="tbl">
        <thead><tr><th class="l">건물명</th><th class="l">임차인</th><th>임대면적(㎡)</th><th>임대율</th><th>공실률</th><th>상태</th></tr></thead>
        <tbody>${leased.map(b=>`<tr>
          <td class="l">${b.name}</td>
          <td class="l">${b.tenant||'-'}</td>
          <td>${b.rentalArea.toLocaleString()}</td>
          <td>${b.rentalRate}%</td>
          <td>${b.vacancy}%</td>
          <td>${b.vacancy===0?'<span class="badge badge-success">만실</span>':'<span class="badge badge-warning">공실있음</span>'}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
  <div class="card" style="padding:16px">
    <div class="sec-title">임대율 현황 차트</div>
    <div class="chart-box"><canvas id="chart-lease"></canvas></div>
  </div>`;
  
  // Chart
  setTimeout(()=>{
    const ctx=document.getElementById('chart-lease');
    if(ctx){new Chart(ctx,{type:'bar',data:{labels:leased.map(b=>b.name.replace(' 건물','')),datasets:[{label:'임대율(%)',data:leased.map(b=>b.rentalRate),backgroundColor:'hsl(213,53%,45%)',borderRadius:4},{label:'공실률(%)',data:leased.map(b=>b.vacancy),backgroundColor:'hsl(0,70%,60%)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:11}}}},scales:{y:{beginAtZero:true,max:100}}}});}
  },100);
};
"""

print('APP_JS part 2 ready (stores + leases)')
