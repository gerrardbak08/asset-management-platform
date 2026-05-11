import json, os

with open('data_embed.js', 'r', encoding='utf-8') as f:
    DATA_JS = f.read()

HTML_PARTS = []

HTML_PARTS.append("""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AIMS — 전사 자산관리 시스템</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=a0fdfbaaa5f08f4e27f7c3c30a843d95&libraries=services"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:#1B3A7A;
  --primary-dark:#1E3A5F;
  --accent:#F59E0B;
  --bg:#F5F6FA;
  --card:#fff;
  --fg:#1a1a2e;
  --muted:#6b7280;
  --border:#e5e7eb;
  --muted-bg:#f3f4f6;
  --danger:#b91c1c;
  --danger-bg:#fef2f2;
  --warning:#d97706;
  --warning-bg:#fffbeb;
  --success:#15803d;
  --success-bg:#f0fdf4;
  --info:#1d4ed8;
  --info-bg:#eff6ff;
  --sidebar-w:240px;
  --header-h:56px;
}
html,body{height:100%;font-family:'Pretendard Variable',Pretendard,system-ui,sans-serif;font-size:14px;color:var(--fg);background:var(--bg)}
.tabular-nums{font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1,'kern' 1,'zero' 0}
button{font-family:inherit;cursor:pointer;border:none;background:none}
input{font-family:inherit}
#app{display:flex;height:100vh;overflow:hidden}
#sidebar{
  width:var(--sidebar-w);min-width:var(--sidebar-w);
  background:var(--primary-dark);color:#fff;
  display:flex;flex-direction:column;height:100vh;overflow-y:auto;
  border-right:1px solid rgba(255,255,255,0.08);flex-shrink:0;
}
.sidebar-logo{padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.1)}
.logo-mark{width:36px;height:36px;border-radius:8px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#1a1a2e;flex-shrink:0}
.brand-wrap{display:flex;align-items:center;gap:10px}
.brand-name{font-size:15px;font-weight:700;color:#fff;line-height:1.2}
.brand-sub{font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px}
.sys-name{margin-top:12px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);letter-spacing:0.05em;text-transform:uppercase}
nav{flex:1;padding:12px 0}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;color:rgba(255,255,255,0.65);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;border-left:3px solid transparent}
.nav-item:hover{background:rgba(255,255,255,0.06);color:#fff}
.nav-item.active{background:rgba(255,255,255,0.08);color:#fff;font-weight:700;border-left-color:var(--accent)}
.nav-icon{font-size:16px;width:20px;text-align:center}
#main{flex:1;display:flex;flex-direction:column;overflow:hidden}
#header{height:var(--header-h);min-height:var(--header-h);background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:16px}
#header h1{font-size:17px;font-weight:700;color:var(--fg)}
.period-badge{font-size:11px;font-weight:600;background:var(--primary);color:#fff;padding:2px 8px;border-radius:99px}
#content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:16px}
.card{background:var(--card);border-radius:14px;border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.p4{padding:16px}.p5{padding:20px}.p6{padding:24px}
.tab-list{display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:16px;overflow-x:auto}
.tab-btn{padding:8px 14px;font-size:13px;font-weight:500;color:var(--muted);border-bottom:2px solid transparent;white-space:nowrap;transition:all 0.15s;margin-bottom:-1px;background:none;border-top:none;border-left:none;border-right:none}
.tab-btn:hover{color:var(--fg)}
.tab-btn.active{color:var(--primary);border-bottom-color:var(--primary);font-weight:700}
.g3{display:grid;gap:12px;grid-template-columns:repeat(3,1fr)}
.g4{display:grid;gap:12px;grid-template-columns:repeat(4,1fr)}
.g2{display:grid;gap:16px;grid-template-columns:1fr 1fr}
@media(max-width:1000px){.g3{grid-template-columns:1fr 1fr}.g4{grid-template-columns:1fr 1fr}.g2{grid-template-columns:1fr}}
@media(max-width:640px){.g3,.g4{grid-template-columns:1fr}}
.hero-card{background:linear-gradient(135deg,#fff,#eef2fc);border:1px solid rgba(27,58,122,0.15);border-radius:14px;padding:24px}
.hero-label{font-size:13px;font-weight:700;color:var(--primary)}
.hero-value{font-size:48px;font-weight:800;line-height:1;color:var(--fg);letter-spacing:-0.02em;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1,'kern' 1,'zero' 0}
.hero-unit{font-size:20px;font-weight:600;color:var(--muted)}
.hero-sub{margin-top:10px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:10px}
.mom-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;font-variant-numeric:tabular-nums}
.mom-up{background:#dcfce7;color:#15803d}
.mom-down{background:#fef2f2;color:#b91c1c}
.mom-flat{background:#f3f4f6;color:#6b7280}
.sec-title{font-size:14px;font-weight:700;color:var(--fg)}
.sec-desc{font-size:11px;color:var(--muted);margin-top:2px}
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{padding:8px 12px;text-align:right;font-size:11px;font-weight:600;color:var(--muted);background:var(--muted-bg);border-bottom:1px solid var(--border);white-space:nowrap}
.tbl th.l{text-align:left}
.tbl td{padding:8px 12px;border-bottom:1px solid var(--border);text-align:right;font-variant-numeric:tabular-nums}
.tbl td.l{text-align:left}
.tbl tr:hover td{background:#f9fafb}
.tbl tr:last-child td{border-bottom:none}
.tbl thead th{position:sticky;top:0;z-index:1}
.bar-track{flex:1;height:8px;background:var(--muted-bg);border-radius:99px;overflow:hidden}
.bar-fill{height:100%;border-radius:99px;background:var(--primary)}
.donut-wrap{display:flex;align-items:center;gap:16px}
.donut-legend{flex:1;list-style:none;font-size:11px}
.donut-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px;flex-shrink:0}
.search-wrap{display:flex;align-items:center;gap:8px;border-radius:10px;border:1px solid var(--border);background:var(--muted-bg);padding:8px 12px}
.search-wrap input{flex:1;background:none;border:none;outline:none;font-size:13px;color:var(--fg)}
.risk-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600}
.risk-d{background:var(--danger-bg);color:var(--danger)}
.risk-w{background:var(--warning-bg);color:var(--warning)}
.risk-s{background:var(--success-bg);color:var(--success)}
.bld-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:1100px){.bld-grid{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.bld-grid{grid-template-columns:1fr}}
.bld-card{border-radius:14px;border:1px solid var(--border);background:var(--card);padding:16px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.bld-card:hover{border-color:var(--primary);box-shadow:0 4px 12px rgba(27,58,122,0.12)}
.bld-ph{width:100%;height:80px;border-radius:8px;background:linear-gradient(135deg,#e8edf7,#dce4f5);display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:10px;color:rgba(27,58,122,0.3)}
.store-layout{display:grid;grid-template-columns:280px 1fr;gap:12px;height:calc(100vh - 160px)}
.store-list{overflow-y:auto;border-radius:14px;border:1px solid var(--border);background:var(--card)}
.store-item{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.1s;font-size:12px}
.store-item:hover{background:#f0f4ff}
.store-item.active{background:#e8edf7}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:100;display:none}
.overlay.open{display:block}
.drawer{position:fixed;right:0;top:0;bottom:0;width:480px;max-width:95vw;background:var(--card);z-index:101;box-shadow:-4px 0 24px rgba(0,0,0,0.15);overflow-y:auto;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.25s cubic-bezier(0.22,1,0.36,1)}
.drawer.open{transform:translateX(0)}
.drawer-hdr{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0}
.drawer-close{width:32px;height:32px;border-radius:8px;background:var(--muted-bg);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--muted)}
.drawer-close:hover{background:#e8edf7;color:var(--fg)}
.drawer-body{padding:20px 24px;flex:1}
.drill-nav{border-radius:12px;border:1px solid var(--border);background:var(--card);padding:16px}
.dstage{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:8px}
.dbtn{display:block;width:100%;text-align:left;padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-size:12px;font-weight:700;color:var(--muted);background:var(--muted-bg);margin-bottom:5px;transition:all 0.15s}
.dbtn:last-child{margin-bottom:0}
.dbtn.active{background:var(--primary);color:#fff;border-color:var(--primary)}
.dbtn:hover:not(.active){background:#e8edf7;color:var(--primary)}
.issue-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;margin-bottom:8px}
.ib-w{background:var(--warning-bg);color:var(--warning)}
.ib-i{background:var(--info-bg);color:var(--info)}
.issue-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px}
.issue-row:last-child{border-bottom:none}
.scroll-box{max-height:440px;overflow:auto;border-radius:10px;border:1px solid var(--border)}
.fl{display:flex}.aic{align-items:center}.jb{justify-content:space-between}.g8{gap:8px}.g12{gap:12px}
.fw7{font-weight:700}.fw6{font-weight:600}
.tc{color:var(--primary)}.tm{color:var(--muted)}.td{color:var(--danger)}.ts{color:var(--success)}.tw{color:var(--warning)}
.t11{font-size:11px}.t12{font-size:12px}.t13{font-size:13px}
.mt2{margin-top:8px}.mt3{margin-top:12px}.mt4{margin-top:16px}
.mb2{margin-bottom:8px}.mb3{margin-bottom:12px}.mb4{margin-bottom:16px}
.tnums{font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1,'kern' 1,'zero' 0}
</style>
</head>
<body>
<div id="app">
<aside id="sidebar">
  <div class="sidebar-logo">
    <div class="brand-wrap">
      <div class="logo-mark">A</div>
      <div>
        <div class="brand-name">ASUNG</div>
        <div class="brand-sub">Asset Management</div>
      </div>
    </div>
    <div class="sys-name">전사 자산관리 시스템</div>
  </div>
  <nav>
    <div class="nav-item active" data-page="dashboard" onclick="navigate('dashboard')"><span class="nav-icon">📊</span>자산현황</div>
    <div class="nav-item" data-page="buildings" onclick="navigate('buildings')"><span class="nav-icon">🏢</span>건물</div>
    <div class="nav-item" data-page="stores" onclick="navigate('stores')"><span class="nav-icon">🏪</span>사업장</div>
    <div class="nav-item" data-page="admin" onclick="navigate('admin')"><span class="nav-icon">⚙️</span>관리</div>
  </nav>
</aside>
<div id="main">
  <div id="header">
    <h1 id="page-title">자산현황</h1>
    <span class="period-badge">2026-03 기준</span>
  </div>
  <div id="content"></div>
</div>
</div>
<div class="overlay" id="drawer-overlay" onclick="closeDrawer()"></div>
<div class="drawer" id="building-drawer">
  <div class="drawer-hdr">
    <div><div class="sec-title" id="drawer-title"></div><div class="sec-desc tm mt2" id="drawer-addr"></div></div>
    <button class="drawer-close" onclick="closeDrawer()">✕</button>
  </div>
  <div class="drawer-body" id="drawer-body"></div>
</div>
<script>
""")

HTML_PARTS.append(DATA_JS)

HTML_PARTS.append("""
// ── GLOBALS ──
const m0 = DB.m0;
const buildings = DB.buildings;
const eqSnaps = DB.eqSnaps;
const stores = DB.stores;
const snapshots = DB.snapshots;

// ── FORMAT ──
function fmtKR(n){
  n=Number(n)||0;if(n===0)return'-';
  if(n>=1e12)return(n/1e12).toFixed(2)+'조';
  if(n>=1e8)return(n/1e8).toFixed(0)+'억';
  if(n>=1e4)return(n/1e4).toFixed(0)+'만';
  return n.toLocaleString('ko-KR');
}
function fmtKRf(n){
  n=Number(n)||0;if(n===0)return'-';
  if(n>=1e12)return(n/1e12).toFixed(2)+'조원';
  if(n>=1e8)return(n/1e8).toFixed(1)+'억원';
  if(n>=1e4)return(n/1e4).toFixed(0)+'만원';
  return n.toLocaleString('ko-KR')+'원';
}
function fmtDate(ts){
  if(!ts)return'-';
  const d=new Date(Number(ts));
  return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');
}
function momBadge(ratio,showLabel){
  const pct=(ratio*100).toFixed(1);
  const label=showLabel?'전월대비 ':'';
  if(ratio>0.001)return`<span class="mom-badge mom-up">▲ ${label}${pct}%</span>`;
  if(ratio<-0.001)return`<span class="mom-badge mom-down">▼ ${label}${Math.abs(pct)}%</span>`;
  return`<span class="mom-badge mom-flat">— ${label}${pct}%</span>`;
}
function donutColor(i){return['#1B3A7A','#3b82f6','#F59E0B','#15803d','#b91c1c','#6366f1','#9ca3af'][i%7]}
function riskClass(r){return r>=95?'risk-s':r>=85?'risk-w':'risk-d'}
function riskLabel(r){return r>=95?'안정':r>=85?'주의':'위험'}

// ── CHARTS ──
const charts={};
function destroyChart(id){if(charts[id]){charts[id].destroy();delete charts[id];}}
function destroyAll(){Object.keys(charts).forEach(k=>destroyChart(k));}

// ── NAVIGATION ──
let curPage='dashboard';
function navigate(page){
  curPage=page;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  document.getElementById('page-title').textContent={dashboard:'자산현황',buildings:'건물',stores:'사업장',admin:'관리'}[page]||page;
  destroyAll();
  renderPage(page);
}
function renderPage(page){
  const c=document.getElementById('content');
  if(page==='dashboard')renderDashboard(c);
  else if(page==='buildings')renderBuildings(c);
  else if(page==='stores')renderStores(c);
  else c.innerHTML='<div class="card p5"><p class="tm">준비 중입니다.</p></div>';
}

// ══════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════
let dashTab='overview';
function renderDashboard(container){
  const tabs=[['overview','개요'],['drill','자산 드릴다운'],['supplies','비품'],['acquisition','취득 연혁'],['lease','임대 현황']];
  container.innerHTML=`<div class="tab-list">${tabs.map(([v,l])=>`<button class="tab-btn${dashTab===v?' active':''}" onclick="switchDashTab('${v}')">${l}</button>`).join('')}</div><div id="dash-panel"></div>`;
  renderDashPanel();
}
function switchDashTab(tab){
  dashTab=tab;
  document.querySelectorAll('.tab-btn').forEach((b,i)=>b.classList.toggle('active',i===['overview','drill','supplies','acquisition','lease'].indexOf(tab)));
  destroyAll();
  renderDashPanel();
}
function renderDashPanel(){
  const p=document.getElementById('dash-panel');if(!p)return;
  if(dashTab==='overview')renderOverview(p);
  else if(dashTab==='drill')renderDrill(p);
  else if(dashTab==='supplies')renderSupplies(p);
  else if(dashTab==='acquisition')renderAcquisition(p);
  else if(dashTab==='lease')renderLease(p);
}

// ── OVERVIEW ──
let openKpiKey=null;
function renderOverview(el){
  const kpi=m0.current.asset_kpi;
  const mom=m0.mom;
  const matrix=m0.current.asset_matrix||[];
  const prev=m0.previous||{};
  const prevMatrix=prev.asset_matrix||[];

  // Donut
  const donutItems=matrix.filter(r=>r.subcategory!=='소계'&&r.subcategory!=='합계'&&r.total>0).sort((a,b)=>b.total-a.total);
  const top5=donutItems.slice(0,5);
  const othersTotal=donutItems.slice(5).reduce((s,d)=>s+d.total,0);
  const donutData=othersTotal>0?[...top5,{subcategory:'기타',total:othersTotal}]:top5;

  // Issues
  const vacantBlds=buildings.filter(b=>b.vacancy>5).sort((a,b)=>b.vacancy-a.vacancy);
  const dispMap={};
  eqSnaps.forEach(s=>{if(s.disposalAmount>0){dispMap[s.equipmentName]=(dispMap[s.equipmentName]||0)+s.disposalAmount;}});
  const topDisp=Object.entries(dispMap).sort((a,b)=>b[1]-a[1]).slice(0,3);

  // Trend
  const trendSnaps=[...snapshots].reverse();
  const base=trendSnaps[0];

  el.innerHTML=`
  <div class="g3 mb4">
    <!-- Hero KPI -->
    <div class="hero-card">
      <div class="fl jb aic"><span class="hero-label">총 자산 규모</span>${momBadge(mom.total.ratio,true)}</div>
      <div class="fl aic g8 mt3" style="align-items:flex-end">
        <span class="hero-value">${fmtKR(kpi.total)}</span>
        <span class="hero-unit" style="margin-bottom:4px">원</span>
      </div>
      <div class="hero-sub">${fmtKRf(kpi.total)}&nbsp;·&nbsp;기준월 <strong>2026-03</strong>&nbsp;·&nbsp;전월 2026-02 대비</div>
    </div>
    <!-- Donut -->
    <div class="card p5">
      <div class="sec-title mb3">자산 유형별 구성</div>
      <div class="donut-wrap">
        <div style="width:140px;height:140px;flex-shrink:0"><canvas id="c-donut" width="140" height="140"></canvas></div>
        <ul class="donut-legend">${donutData.map((d,i)=>`
          <li class="fl jb aic" style="padding:2px 0">
            <span><span class="donut-dot" style="background:${donutColor(i)}"></span><span class="t11 tm">${d.subcategory}</span></span>
            <span class="t11 tm tnums">${kpi.total>0?((d.total/kpi.total)*100).toFixed(1):0}%</span>
          </li>`).join('')}</ul>
      </div>
    </div>
    <!-- Issues -->
    <div class="card p5">
      <div class="fl aic g8 mb3"><span style="font-size:15px">⚠️</span><span class="sec-title">이슈 사항</span></div>
      <span class="issue-badge ib-w">공실률 5% 이상</span>
      ${vacantBlds.length===0?'<p class="t11 tm">해당 없음</p>':
        vacantBlds.slice(0,3).map(b=>`<div class="issue-row"><span class="t12">${b.name}</span><span class="tnums t12 tw">${b.vacancy}%</span></div>`).join('')+
        (vacantBlds.length>3?`<p class="t11 tm mt2">+${vacantBlds.length-3}곳 더 있음</p>`:'')}
      <div class="mt3">
        <span class="issue-badge ib-i">월 폐기액 상위</span>
        ${topDisp.length===0?'<p class="t11 tm">이번 달 폐기 없음</p>':
          topDisp.map(([name,amt])=>`<div class="issue-row"><span class="t12">${name}</span><span class="tnums t12 tm">${fmtKR(amt)}원</span></div>`).join('')}
      </div>
    </div>
  </div>

  <!-- 3분할 KPI -->
  <div class="g3 mb4" id="kpi-cards">
    ${[
      {key:'tangible',label:'유형자산',val:kpi.tangible.value,mom:mom.tangible.ratio,desc:'건물·토지·집기비품·기계장치'},
      {key:'intangible',label:'무형자산',val:kpi.intangible.value,mom:mom.intangible.ratio,desc:'소프트웨어·영업권·임차권리금'},
      {key:'supplies',label:'비품',val:kpi.supplies.value,mom:mom.supplies.ratio,desc:'비품 재고 총액'},
    ].map(c=>`
    <button class="card p5" style="text-align:left;transition:all 0.15s" onclick="toggleKpiPanel('${c.key}')" id="kpi-${c.key}">
      <div class="fl jb aic"><span class="t12 fw7 tm">● ${c.label}</span>${momBadge(c.mom)}</div>
      <div class="fl aic g8 mt3" style="align-items:flex-end">
        <span class="fw7 tnums" style="font-size:22px;letter-spacing:-0.02em">${fmtKR(c.val)}</span>
        <span class="t12 tm" style="margin-bottom:2px">원</span>
      </div>
      <div class="t11 tm mt2">${c.desc}</div>
      <div class="mt3" style="text-align:right"><span class="t11" style="border:1px solid var(--border);border-radius:99px;padding:2px 8px;color:var(--muted)">세부 현황 →</span></div>
    </button>`).join('')}
  </div>
  <div id="kpi-panel-box" class="mb4"></div>

  <!-- 추이 + MoM 차트 -->
  <div class="g2">
    <div class="card p5">
      <div class="sec-title">자산 유형별 추이</div>
      <div class="sec-desc mb3">기준월(${(trendSnaps[0]?.period||'').slice(2).replace('-','.')}) = 100 · 변화율 비교 · 툴팁에서 실제 금액 확인</div>
      <div style="height:220px"><canvas id="c-trend"></canvas></div>
    </div>
    <div class="card p5">
      <div class="sec-title">위치별 자산 현황</div>
      <div class="sec-desc mb3">본사 / 매장 / 물류센터 당월 구성</div>
      <div style="height:220px"><canvas id="c-loc"></canvas></div>
    </div>
  </div>`;

  // Donut chart
  setTimeout(()=>{
    const dc=document.getElementById('c-donut');
    if(dc){
      destroyChart('donut');
      charts['donut']=new Chart(dc.getContext('2d'),{
        type:'doughnut',
        data:{labels:donutData.map(d=>d.subcategory),datasets:[{data:donutData.map(d=>d.total),backgroundColor:donutData.map((_,i)=>donutColor(i)),borderWidth:2,borderColor:'#fff'}]},
        options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fmtKRf(ctx.raw)}`}}},cutout:'55%'}
      });
    }
    // Trend chart
    const tc=document.getElementById('c-trend');
    if(tc){
      destroyChart('trend');
      const tLabels=trendSnaps.map(s=>s.period.slice(2).replace('-','.'));
      charts['trend']=new Chart(tc.getContext('2d'),{
        type:'line',
        data:{labels:tLabels,datasets:[
          {label:'총자산',data:trendSnaps.map(s=>base.totalAsset>0?+((s.totalAsset/base.totalAsset)*100).toFixed(1):100),borderColor:'#1a1a2e',borderWidth:2.5,pointRadius:4,tension:0.3,fill:false},
          {label:'유형자산',data:trendSnaps.map(s=>base.tangible>0?+((s.tangible/base.tangible)*100).toFixed(1):100),borderColor:'#1B3A7A',borderWidth:2,pointRadius:3,tension:0.3,fill:false},
          {label:'무형자산',data:trendSnaps.map(s=>base.intangible>0?+((s.intangible/base.intangible)*100).toFixed(1):100),borderColor:'#F59E0B',borderWidth:1.5,borderDash:[6,3],pointRadius:3,tension:0.3,fill:false},
          {label:'비품',data:trendSnaps.map(s=>base.equipment>0?+((s.equipment/base.equipment)*100).toFixed(1):100),borderColor:'#b91c1c',borderWidth:1.5,borderDash:[3,3],pointRadius:3,tension:0.3,fill:false},
        ]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}}},scales:{y:{ticks:{font:{size:11}},grid:{color:'#f0f0f0'}},x:{ticks:{font:{size:11}},grid:{display:false}}}}
      });
    }
    // Location chart
    const lc=document.getElementById('c-loc');
    if(lc){
      destroyChart('loc');
      const cur0=snapshots[0]||{};
      charts['loc']=new Chart(lc.getContext('2d'),{
        type:'bar',
        data:{labels:['본사','매장','물류'],datasets:[
          {label:'당월',data:[cur0.hq||0,cur0.store||0,cur0.logistics||0].map(v=>+(v/1e8).toFixed(1)),backgroundColor:['rgba(27,58,122,0.75)','rgba(27,58,122,0.55)','rgba(27,58,122,0.35)'],borderRadius:6},
        ]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${fmtKR(ctx.raw*1e8)}원`}}},scales:{y:{ticks:{font:{size:11},callback:v=>`${v}억`},grid:{color:'#f0f0f0'}},x:{ticks:{font:{size:11}},grid:{display:false}}}}
      });
    }
  },0);
}

function toggleKpiPanel(key){
  const box=document.getElementById('kpi-panel-box');
  if(openKpiKey===key){openKpiKey=null;box.innerHTML='';return;}
  openKpiKey=key;
  const matrix=m0.current.asset_matrix||[];
  const prevMatrix=(m0.previous||{}).asset_matrix||[];
  const catLabel={tangible:'유형자산',intangible:'무형자산',supplies:'비품'}[key];
  const rows=matrix.filter(r=>r.category===catLabel&&r.subcategory!=='소계'&&r.subcategory!=='합계');
  const subtotal=matrix.find(r=>r.category===catLabel&&r.subcategory==='소계');
  const prevSub=prevMatrix.find(r=>r.category===catLabel&&r.subcategory==='소계');
  box.innerHTML=`<div class="card" style="overflow:hidden">
    <div class="p5 fl jb aic" style="border-bottom:1px solid var(--border)">
      <div><div class="sec-title">${catLabel} 세부 현황</div>${subtotal?`<div class="sec-desc mt2">합계 ${fmtKRf(subtotal.total)} · 전사 자산의 ${(subtotal.total/m0.current.asset_kpi.total*100).toFixed(1)}%</div>`:''}</div>
      <button onclick="document.getElementById('kpi-panel-box').innerHTML='';openKpiKey=null" style="font-size:12px;color:var(--muted);padding:4px 10px;border-radius:8px;background:var(--muted-bg)">닫기 ×</button>
    </div>
    <div style="overflow-x:auto"><table class="tbl">
      <thead><tr><th class="l">세부항목</th><th>본사</th><th>매장</th><th>물류</th><th>전월</th><th>당월</th><th>MoM</th></tr></thead>
      <tbody>
        ${rows.map(r=>{const prev=prevMatrix.find(p=>p.category===r.category&&p.subcategory===r.subcategory);const pv=prev?.total||0;const m=pv>0?(r.total-pv)/pv:0;
          return`<tr><td class="l fw6">${r.subcategory}</td><td>${fmtKR(r.hq)}</td><td>${fmtKR(r.store)}</td><td>${fmtKR(r.logistics)}</td><td class="tm">${pv>0?fmtKR(pv):'—'}</td><td class="fw6">${fmtKR(r.total)}</td><td>${pv>0?momBadge(m):'—'}</td></tr>`;}).join('')}
        ${subtotal?`<tr style="background:var(--muted-bg);font-weight:700"><td class="l">소 계</td><td>${fmtKR(subtotal.hq)}</td><td>${fmtKR(subtotal.store)}</td><td>${fmtKR(subtotal.logistics)}</td><td class="tm">${prevSub?fmtKR(prevSub.total):'—'}</td><td>${fmtKR(subtotal.total)}</td><td>${prevSub?momBadge((subtotal.total-prevSub.total)/prevSub.total):'—'}</td></tr>`:''}
      </tbody>
    </table></div>
  </div>`;
}

// ── DRILL ──
let drillType='tangible';
let drillItem=null;
function renderDrill(el){
  const matrix=m0.current.asset_matrix||[];
  const kpi=m0.current.asset_kpi;
  const groups={
    tangible:{label:'유형자산',total:kpi.tangible.value,items:matrix.filter(r=>r.category==='유형자산'&&r.subcategory!=='소계'&&r.subcategory!=='합계')},
    intangible:{label:'무형자산',total:kpi.intangible.value,items:matrix.filter(r=>r.category==='무형자산'&&r.subcategory!=='소계'&&r.subcategory!=='합계')},
    equipment:{label:'비품',total:kpi.supplies.value,items:matrix.filter(r=>r.category==='비품'&&r.subcategory!=='소계'&&r.subcategory!=='합계')},
  };
  if(!drillItem&&groups[drillType].items.length>0)drillItem=groups[drillType].items[0].subcategory;
  const ag=groups[drillType];
  const ai=ag.items.find(i=>i.subcategory===drillItem)||ag.items[0];

  const eqMap={};
  eqSnaps.forEach(s=>{
    if(!eqMap[s.equipmentName])eqMap[s.equipmentName]={name:s.equipmentName,legacyId:s.equipmentLegacyId,hq:0,store:0,logistics:0,purchase:0,disposal:0};
    if(s.locationType==='hq')eqMap[s.equipmentName].hq+=s.inventoryAmount;
    else if(s.locationType==='store')eqMap[s.equipmentName].store+=s.inventoryAmount;
    else if(s.locationType==='logistics')eqMap[s.equipmentName].logistics+=s.inventoryAmount;
    eqMap[s.equipmentName].purchase+=s.purchaseAmount;
    eqMap[s.equipmentName].disposal+=s.disposalAmount;
  });
  const eqRows=Object.values(eqMap).sort((a,b)=>(b.hq+b.store+b.logistics)-(a.hq+a.store+a.logistics));

  el.innerHTML=`<div style="display:grid;grid-template-columns:200px 1fr;gap:16px">
    <div class="drill-nav">
      <div class="dstage">1 DEPTH</div><div class="dbtn active">자산</div>
      <div class="dstage" style="margin-top:12px">2 DEPTH</div>
      ${Object.entries(groups).map(([k,g])=>`<div class="dbtn${drillType===k?' active':''}" onclick="drillType='${k}';drillItem=null;renderDashPanel()">${g.label} · ${fmtKR(g.total)}원</div>`).join('')}
      <div class="dstage" style="margin-top:12px">3 DEPTH</div>
      ${ag.items.map(item=>`<div class="dbtn${drillItem===item.subcategory?' active':''}" onclick="drillItem='${item.subcategory}';renderDashPanel()">${item.subcategory} · ${fmtKR(item.total)}원</div>`).join('')}
    </div>
    <div class="card p4">
      <div class="fl g8 mb3" style="flex-wrap:wrap">
        ${['자산',ag.label,drillType==='equipment'?'전체':(ai?.subcategory||'')].map(chip=>`<span style="background:rgba(27,58,122,0.08);color:var(--primary);border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700">${chip} ›</span>`).join('')}
      </div>
      <div class="scroll-box">
        ${drillType==='equipment'?`
        <table class="tbl"><thead><tr><th class="l">비품명</th><th>코드</th><th>본사</th><th>매장</th><th>물류</th><th>구매</th><th>폐기</th></tr></thead><tbody>
          ${eqRows.map(r=>`<tr><td class="l fw6">${r.name}</td><td style="text-align:center;font-size:10px;color:var(--muted)">${r.legacyId}</td><td>${fmtKRf(r.hq)}</td><td>${fmtKRf(r.store)}</td><td>${fmtKRf(r.logistics)}</td><td>${fmtKRf(r.purchase)}</td><td>${fmtKRf(r.disposal)}</td></tr>`).join('')}
        </tbody></table>`
        :ai?`<table class="tbl"><thead><tr><th class="l">구분</th><th>금액</th><th>비중</th></tr></thead><tbody>
          <tr><td class="l fw6 tc">본사</td><td>${fmtKRf(ai.hq)}</td><td>${ai.total>0?((ai.hq/ai.total)*100).toFixed(1)+'%':'—'}</td></tr>
          <tr><td class="l fw6 ts">매장</td><td>${fmtKRf(ai.store)}</td><td>${ai.total>0?((ai.store/ai.total)*100).toFixed(1)+'%':'—'}</td></tr>
          <tr><td class="l fw6" style="color:var(--info)">물류</td><td>${fmtKRf(ai.logistics)}</td><td>${ai.total>0?((ai.logistics/ai.total)*100).toFixed(1)+'%':'—'}</td></tr>
          <tr style="background:rgba(27,58,122,0.05);font-weight:700"><td class="l tc">합계</td><td class="tc">${fmtKRf(ai.total)}</td><td class="tc">100%</td></tr>
        </tbody></table>`:'<p class="t11 tm p4">데이터 없음</p>'}
      </div>
    </div>
  </div>`;
}

// ── SUPPLIES ──
let supFlowKind='inventory';
function renderSupplies(el){
  const invMap={};
  eqSnaps.forEach(s=>{invMap[s.equipmentName]=(invMap[s.equipmentName]||0)+s.inventoryAmount;});
  const grandTotal=Object.values(invMap).reduce((a,b)=>a+b,0);
  const top5=Object.entries(invMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,amt])=>({name,amount:amt,pct:grandTotal>0?(amt/grandTotal)*100:0}));

  const flowMap={};
  eqSnaps.forEach(s=>{
    if(!flowMap[s.equipmentName])flowMap[s.equipmentName]={name:s.equipmentName,inventory:0,purchase:0,transfer:0,disposal:0};
    flowMap[s.equipmentName].inventory+=s.inventoryAmount;
    flowMap[s.equipmentName].purchase+=s.purchaseAmount;
    flowMap[s.equipmentName].transfer+=s.transferAmount;
    flowMap[s.equipmentName].disposal+=s.disposalAmount;
  });
  const flowTop10=Object.values(flowMap).sort((a,b)=>b[supFlowKind]-a[supFlowKind]).slice(0,10);

  const supKpi=m0.current.asset_kpi.supplies;
  const momSup=m0.mom.supplies;
  const momSupKpi=m0.mom.supplies_kpi||{stock:{ratio:momSup.ratio},purchase:{ratio:0},transfer:{ratio:0},disposal:{ratio:0}};
  const supCur=m0.current.supplies_kpi||{stock:supKpi.value,purchase:0,transfer:0,disposal:0};

  const flowColor={inventory:'#1B3A7A',purchase:'#3b82f6',transfer:'#F59E0B',disposal:'#b91c1c'}[supFlowKind];
  const flowLabel={inventory:'재고',purchase:'구매',transfer:'이동',disposal:'폐기'}[supFlowKind];

  el.innerHTML=`
  <div class="card p5 mb3">
    <div class="sec-title mb2">비품 운영 현황</div>
    <p class="t12 tm">재고 ${fmtKRf(supCur.stock||supKpi.value)} · 전사 자산의 ${(supKpi.ratio*100).toFixed(1)}% · 등록 카테고리 ${Object.keys(invMap).length}종</p>
  </div>
  <div class="g4 mb3">
    ${[
      {label:'비품 재고',val:supCur.stock||supKpi.value,mom:(momSupKpi.stock||{}).ratio||momSup.ratio},
      {label:'비품 구매',val:supCur.purchase||0,mom:(momSupKpi.purchase||{}).ratio||0},
      {label:'비품 이동',val:Math.abs(supCur.transfer||0),mom:(momSupKpi.transfer||{}).ratio||0},
      {label:'비품 폐기',val:Math.abs(supCur.disposal||0),mom:(momSupKpi.disposal||{}).ratio||0},
    ].map(it=>`<div class="card p4"><div class="t11 tm">${it.label}</div><div class="fw7 tnums mt2" style="font-size:15px">${fmtKRf(it.val)}</div><div class="mt2">${momBadge(it.mom)}</div></div>`).join('')}
  </div>
  <div class="g2">
    <div class="card p5">
      <div class="sec-title mb3">재고 상위 카테고리 TOP 5</div>
      ${top5.map(cat=>`
      <div class="mb3">
        <div class="fl jb t12 mb2"><span class="fw6">${cat.name}</span><span class="tm tnums">${fmtKRf(cat.amount)} · ${cat.pct.toFixed(1)}%</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(cat.pct,2)}%"></div></div>
      </div>`).join('')}
    </div>
    <div class="card p5">
      <div class="fl jb aic mb3">
        <div><div class="sec-title">비품 흐름 TOP 10</div><div class="sec-desc">${flowLabel} 기준 · 2026-03</div></div>
        <div style="display:flex;gap:4px;background:var(--muted-bg);padding:4px;border-radius:8px">
          ${['inventory','purchase','transfer','disposal'].map(k=>`<button onclick="supFlowKind='${k}';renderDashPanel()" style="padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;${supFlowKind===k?'background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);color:var(--fg)':'color:var(--muted)'}">${{inventory:'재고',purchase:'구매',transfer:'이동',disposal:'폐기'}[k]}</button>`).join('')}
        </div>
      </div>
      <div style="height:280px"><canvas id="c-flow"></canvas></div>
    </div>
  </div>`;

  setTimeout(()=>{
    const fc=document.getElementById('c-flow');
    if(!fc)return;
    destroyChart('flow');
    charts['flow']=new Chart(fc.getContext('2d'),{
      type:'bar',
      data:{labels:flowTop10.map(r=>r.name.length>10?r.name.slice(0,10)+'…':r.name),datasets:[{label:flowLabel,data:flowTop10.map(r=>r[supFlowKind]),backgroundColor:flowColor,borderRadius:4}]},
      options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>fmtKRf(ctx.raw)}}},scales:{x:{ticks:{font:{size:10},callback:v=>fmtKR(v)},grid:{color:'#f0f0f0'}},y:{ticks:{font:{size:10}},grid:{display:false}}}}
    });
  },0);
}

// ── ACQUISITION ──
function renderAcquisition(el){
  const yearMap={};
  buildings.forEach(b=>{
    if(!b.acquisitionDate)return;
    const y=new Date(Number(b.acquisitionDate)).getFullYear();
    if(!yearMap[y])yearMap[y]={count:0,price:0};
    yearMap[y].count++;yearMap[y].price+=b.acquisitionPrice;
  });
  const years=Object.keys(yearMap).sort();
  let cum=0;
  const cd=years.map(y=>{cum+=yearMap[y].price;return{year:y,count:yearMap[y].count,price:yearMap[y].price,cum};});
  const tableRows=[...buildings].sort((a,b)=>Number(b.acquisitionDate)-Number(a.acquisitionDate));

  el.innerHTML=`<div style="display:grid;grid-template-columns:1fr 400px;gap:16px;align-items:start">
    <div class="card p5">
      <div class="sec-title">연도별 취득 건수 + 누적 취득가</div>
      <div class="sec-desc mb3">신규 취득 건수(막대) + 누적 취득가(선)</div>
      <div style="height:360px"><canvas id="c-acq"></canvas></div>
    </div>
    <div class="card p5" style="display:flex;flex-direction:column;max-height:520px">
      <div class="sec-title">건물 취득 내역 (전체)</div>
      <div class="sec-desc mb3">총 ${tableRows.length}동</div>
      <div style="flex:1;overflow-y:auto">
        <table class="tbl"><thead><tr>
          <th class="l">건물명</th><th class="l">취득일</th><th>취득가</th><th class="l" style="padding-left:8px">소재지</th>
        </tr></thead><tbody>
          ${tableRows.map(b=>{
            const isLarge=b.acquisitionPrice>=10000000000;
            const city=b.address.split(' ').slice(0,2).join(' ');
            return`<tr><td class="l fw6 t12">${b.name}</td><td class="l tm tnums" style="white-space:nowrap;font-size:11px">${fmtDate(b.acquisitionDate)}</td><td class="${isLarge?'td':'fw6'} tnums" style="white-space:nowrap">${fmtKR(b.acquisitionPrice)}원</td><td class="l tm" style="font-size:11px;padding-left:8px;white-space:nowrap">${city}</td></tr>`;
          }).join('')}
        </tbody></table>
      </div>
    </div>
  </div>`;

  setTimeout(()=>{
    const ac=document.getElementById('c-acq');
    if(!ac)return;
    destroyChart('acq');
    charts['acq']=new Chart(ac.getContext('2d'),{
      type:'bar',
      data:{labels:cd.map(d=>d.year),datasets:[
        {label:'신규 취득 건수',data:cd.map(d=>d.count),backgroundColor:'rgba(27,58,122,0.7)',borderRadius:[6,6,0,0],yAxisID:'y',order:2},
        {label:'누적 취득가',data:cd.map(d=>d.cum/1e8),borderColor:'#F59E0B',borderWidth:2.5,type:'line',yAxisID:'y2',pointRadius:5,pointBackgroundColor:'#F59E0B',tension:0.3,fill:false,order:1},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}},tooltip:{callbacks:{label:ctx=>ctx.datasetIndex===0?`${ctx.raw}건`:`${ctx.raw.toFixed(1)}억원`}}},
        scales:{y:{type:'linear',position:'left',ticks:{callback:v=>`${v}건`,font:{size:11}},grid:{color:'#f0f0f0'}},y2:{type:'linear',position:'right',ticks:{callback:v=>`${fmtKR(v*1e8)}`,font:{size:11}},grid:{display:false}},x:{ticks:{font:{size:11}},grid:{display:false}}}}
    });
  },0);
}

// ── LEASE ──
function renderLease(el){
  const rented=buildings.filter(b=>b.rentalRate>0).length;
  const noVac=buildings.filter(b=>b.vacancy===0&&b.rentalRate>0).length;
  const hasVac=buildings.filter(b=>b.vacancy>0).length;
  const totalRentArea=buildings.reduce((s,b)=>s+(b.rentalArea||0),0);
  const stable=buildings.filter(b=>b.rentalRate>=95).length;
  const caution=buildings.filter(b=>b.rentalRate>=85&&b.rentalRate<95).length;
  const danger=buildings.filter(b=>b.rentalRate<85).length;

  const rateData=buildings.filter(b=>b.rentalRate>0).map(b=>({name:b.name.length>12?b.name.slice(0,12)+'…':b.name,rate:b.rentalRate,vac:b.vacancy,id:b.id})).sort((a,b)=>b.rate-a.rate);
  const areaTop10=[...buildings].filter(b=>b.areaSqm>0).sort((a,b)=>b.areaSqm-a.areaSqm).slice(0,10).map(b=>({name:b.name.length>10?b.name.slice(0,10)+'…':b.name,total:Math.round(b.areaSqm),rent:Math.round(b.rentalArea||0)}));

  const regionMap={};
  buildings.forEach(b=>{
    const r=(b.address||'').match(/서울|경기|인천/)?'수도권':'지방';
    if(!regionMap[r])regionMap[r]={count:0,price:0,rateSum:0};
    regionMap[r].count++;regionMap[r].price+=b.acquisitionPrice/1e8;regionMap[r].rateSum+=b.rentalRate;
  });
  const useMap={};
  buildings.forEach(b=>{
    const u=b.use||'';let k='기타';
    if(u.includes('창고'))k='창고시설';
    else if(u.includes('판매시설'))k='판매시설';
    else if(u.includes('공동주택')||u.includes('업무시설'))k='공동주택·업무';
    else if(u.includes('근린생활'))k='근린생활시설';
    if(!useMap[k])useMap[k]={count:0,price:0,rateSum:0};
    useMap[k].count++;useMap[k].price+=b.acquisitionPrice/1e8;useMap[k].rateSum+=b.rentalRate;
  });

  el.innerHTML=`
  <div class="card p5 mb3">
    <div class="sec-title mb3">건물 임대 현황 · 총 ${buildings.length}동</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px" class="mb3">
      ${[
        {label:'임대 운영 건물',val:`${rented}개`,sub:`전체 ${buildings.length}개 중`},
        {label:'완전 임대 건물',val:`${noVac}개`,sub:'공실률 0%'},
        {label:'공실 발생 건물',val:`${hasVac}개`,sub:'관리 필요'},
        {label:'총 임대면적',val:`${Math.round(totalRentArea).toLocaleString('ko-KR')}㎡`,sub:'임차인 있는 건물'},
      ].map(k=>`<div style="border:1px solid var(--border);border-radius:10px;padding:12px;background:var(--muted-bg)"><div class="t11 tm">${k.label}</div><div class="fw7 tnums mt2" style="font-size:15px">${k.val}</div><div class="t11 tm mt2">${k.sub}</div></div>`).join('')}
    </div>
    <div class="fl g8" style="flex-wrap:wrap">
      <span class="risk-badge risk-s">● 안정 ${stable}동 (95%↑)</span>
      <span class="risk-badge risk-w">● 주의 ${caution}동 (85-94%)</span>
      <span class="risk-badge risk-d">● 위험 ${danger}동 (85%↓)</span>
    </div>
  </div>
  <div class="g2 mb3">
    <div class="card" style="overflow:hidden">
      <div class="p4" style="border-bottom:1px solid var(--border)"><div class="sec-title">지역별 현황</div><div class="sec-desc">수도권 / 지방</div></div>
      <table class="tbl"><thead><tr><th class="l">분류</th><th>건수</th><th>취득가 합계</th><th>임대율</th><th>상태</th></tr></thead><tbody>
        ${Object.entries(regionMap).sort((a,b)=>b[1].count-a[1].count).map(([key,g])=>{const avg=g.rateSum/g.count;return`<tr><td class="l fw6">${key}</td><td>${g.count}동</td><td>${g.price.toFixed(1)}억원</td><td>${avg.toFixed(1)}%</td><td><span class="risk-badge ${riskClass(avg)}">${riskLabel(avg)}</span></td></tr>`;}).join('')}
      </tbody></table>
    </div>
    <div class="card" style="overflow:hidden">
      <div class="p4" style="border-bottom:1px solid var(--border)"><div class="sec-title">건물용도별 현황</div></div>
      <table class="tbl"><thead><tr><th class="l">분류</th><th>건수</th><th>취득가 합계</th><th>임대율</th><th>상태</th></tr></thead><tbody>
        ${Object.entries(useMap).sort((a,b)=>b[1].count-a[1].count).map(([key,g])=>{const avg=g.rateSum/g.count;return`<tr><td class="l fw6 t11">${key}</td><td>${g.count}동</td><td>${g.price.toFixed(1)}억원</td><td>${avg.toFixed(1)}%</td><td><span class="risk-badge ${riskClass(avg)}">${riskLabel(avg)}</span></td></tr>`;}).join('')}
      </tbody></table>
    </div>
  </div>
  <div class="g2">
    <div class="card p5">
      <div class="sec-title mb3">건물별 임대율</div>
      <div style="height:360px"><canvas id="c-lrate"></canvas></div>
    </div>
    <div class="card p5">
      <div class="sec-title mb3">임대면적 vs 전체면적 (상위 10동)</div>
      <div style="height:360px"><canvas id="c-larea"></canvas></div>
    </div>
  </div>`;

  setTimeout(()=>{
    const rc=document.getElementById('c-lrate');
    if(rc){destroyChart('lrate');charts['lrate']=new Chart(rc.getContext('2d'),{type:'bar',data:{labels:rateData.map(d=>d.name),datasets:[{label:'임대율',data:rateData.map(d=>d.rate),backgroundColor:rateData.map(d=>d.vac>0?'rgba(217,119,6,0.7)':'rgba(21,128,61,0.7)'),borderRadius:[0,4,4,0]}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.raw}% (공실 ${rateData[ctx.dataIndex].vac}%)`}}},scales:{x:{max:110,ticks:{callback:v=>`${v}%`,font:{size:10}},grid:{color:'#f0f0f0'}},y:{ticks:{font:{size:10}},grid:{display:false}}}}});}
    const ac2=document.getElementById('c-larea');
    if(ac2){destroyChart('larea');charts['larea']=new Chart(ac2.getContext('2d'),{type:'bar',data:{labels:areaTop10.map(d=>d.name),datasets:[{label:'전체연면적',data:areaTop10.map(d=>d.total),backgroundColor:'rgba(156,163,175,0.4)',borderRadius:[0,4,4,0]},{label:'임대면적',data:areaTop10.map(d=>d.rent),backgroundColor:'rgba(21,128,61,0.7)',borderRadius:[0,4,4,0]}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}},tooltip:{callbacks:{label:ctx=>`${ctx.raw.toLocaleString('ko-KR')}㎡`}}},scales:{x:{ticks:{font:{size:10},callback:v=>v>=10000?`${Math.round(v/10000)}만`:v},grid:{color:'#f0f0f0'}},y:{ticks:{font:{size:10}},grid:{display:false}}}}});}
  },0);
}

// ══════════════════════════════════════
// BUILDINGS
// ══════════════════════════════════════
function renderBuildings(container){
  container.innerHTML=`
  <div class="card p4 mb3">
    <div class="search-wrap">
      <span style="font-size:16px;color:var(--muted)">🔍</span>
      <input id="bld-search" type="text" placeholder="건물명, 주소, 임차인 검색…" oninput="filterBuildings()">
    </div>
  </div>
  <div class="bld-grid" id="bld-grid"></div>`;
  filterBuildings();
}
function filterBuildings(){
  const q=(document.getElementById('bld-search')?.value||'').toLowerCase();
  const filtered=buildings.filter(b=>!q||b.name.toLowerCase().includes(q)||b.address.toLowerCase().includes(q)||(b.tenant||'').toLowerCase().includes(q));
  const grid=document.getElementById('bld-grid');
  if(!grid)return;
  grid.innerHTML=filtered.map(b=>`
  <div class="bld-card" onclick="openBldDrawer('${b.id}')">
    <div class="bld-ph">🏢</div>
    <div class="fw7 t13 mb2">${b.name}</div>
    <div class="t11 tm mb3" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.address}</div>
    <div class="fl jb t11 mb2"><span class="tm">면적</span><span class="fw6 tnums">${(b.areaSqm||0).toLocaleString('ko-KR')}㎡</span></div>
    <div class="fl jb t11 mb2"><span class="tm">취득가</span><span class="${b.acquisitionPrice>=10000000000?'td':''} fw6 tnums">${fmtKR(b.acquisitionPrice)}원</span></div>
    <div class="fl jb t11 mb2"><span class="tm">임대율</span><span class="fw6 tnums">${b.rentalRate}%</span></div>
    <div class="fl jb t11"><span class="tm">임차인</span><span class="t11" style="max-width:160px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.tenant||'—'}</span></div>
  </div>`).join('');
}
function openBldDrawer(id){
  const b=buildings.find(x=>x.id===id);if(!b)return;
  document.getElementById('drawer-title').textContent=b.name;
  document.getElementById('drawer-addr').textContent=b.address;
  const rc=riskClass(b.rentalRate),rl=riskLabel(b.rentalRate);
  const hasCoord=b.lat&&b.lng;
  document.getElementById('drawer-body').innerHTML=`
  ${hasCoord
    ? `<div id="bld-map" style="width:100%;height:200px;border-radius:10px;overflow:hidden;margin-bottom:12px;background:var(--muted-bg)"></div>`
    : `<div class="bld-ph" style="height:120px;font-size:48px">🏢</div>`
  }
  <div class="mt3"><table class="tbl" style="font-size:13px">
    <tbody>
      <tr><td class="l fw6 tm">용도</td><td>${b.use||'—'}</td></tr>
      <tr><td class="l fw6 tm">층수</td><td>${b.floors||'—'}</td></tr>
      <tr><td class="l fw6 tm">연면적</td><td class="tnums">${(b.areaSqm||0).toLocaleString('ko-KR')}㎡ (${(b.areaPyeong||0).toLocaleString('ko-KR')}평)</td></tr>
      <tr><td class="l fw6 tm">사용승인일</td><td class="tnums">${fmtDate(b.approvalDate)}</td></tr>
      <tr><td class="l fw6 tm">취득일</td><td class="tnums">${fmtDate(b.acquisitionDate)}</td></tr>
      <tr><td class="l fw6 tm">취득가</td><td class="tnums fw7 ${b.acquisitionPrice>=10000000000?'td':''}">${fmtKRf(b.acquisitionPrice)}</td></tr>
      <tr><td class="l fw6 tm">임대면적</td><td class="tnums">${(b.rentalArea||0).toLocaleString('ko-KR')}㎡</td></tr>
      <tr><td class="l fw6 tm">임대율</td><td><span class="risk-badge ${rc}">${b.rentalRate}% (${rl})</span></td></tr>
      <tr><td class="l fw6 tm">공실률</td><td class="tnums ${b.vacancy>5?'tw':''}">${b.vacancy}%</td></tr>
      <tr><td class="l fw6 tm">임차인</td><td>${b.tenant||'—'}</td></tr>
    </tbody>
  </table></div>`;
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('building-drawer').classList.add('open');
  if(hasCoord&&typeof kakao!=='undefined'&&kakao.maps){
    setTimeout(()=>{
      const el=document.getElementById('bld-map');
      if(!el)return;
      const map=new kakao.maps.Map(el,{center:new kakao.maps.LatLng(b.lat,b.lng),level:3});
      new kakao.maps.Marker({map,position:new kakao.maps.LatLng(b.lat,b.lng)});
    },120);
  }
}
function closeDrawer(){
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('building-drawer').classList.remove('open');
}

// ══════════════════════════════════════
// STORES
// ══════════════════════════════════════
let selStoreId=null;
function renderStores(container){
  container.innerHTML=`
  <div class="card p4 mb3">
    <div class="search-wrap">
      <span style="font-size:16px;color:var(--muted)">🔍</span>
      <input id="store-search" type="text" placeholder="조직명 또는 사업장명 검색…" oninput="filterStores()">
    </div>
  </div>
  <div class="store-layout">
    <div class="store-list" id="store-list"></div>
    <div id="store-detail" class="card p5"><div style="text-align:center;padding:40px;color:var(--muted)">사업장을 선택하세요</div></div>
  </div>`;
  filterStores();
  if(stores.length>0&&!selStoreId){selStoreId=stores[0].id;renderStoreDetail(stores[0]);}
}
function filterStores(){
  const q=(document.getElementById('store-search')?.value||'').toLowerCase();
  const filtered=stores.filter(s=>!q||s.name.toLowerCase().includes(q)||(s.siteType||'').includes(q));
  const list=document.getElementById('store-list');if(!list)return;
  list.innerHTML=`<div style="padding:10px 16px;font-size:11px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--border)">검색 결과 (${filtered.length}/${stores.length})</div>`+
    filtered.map(s=>`<div class="store-item${selStoreId===s.id?' active':''}" onclick="selectStore('${s.id}')">
      <div><div class="fw6 t12">${s.name}</div><div class="t11 tm">${s.siteType||''}</div></div>
      <span class="t11 tm tnums">${fmtKR(s.assetValue)}</span>
    </div>`).join('');
}
function selectStore(id){
  selStoreId=id;
  const store=stores.find(s=>s.id===id);if(!store)return;
  document.querySelectorAll('.store-item').forEach(el=>el.classList.toggle('active',el.getAttribute('onclick')===`selectStore('${id}')`));
  renderStoreDetail(store);
}
function renderStoreDetail(store){
  const det=document.getElementById('store-detail');if(!det)return;
  const sup=store.supplyByCategory||{};
  const supCnt=store.supplyByCategoryCount||{};
  const assetByType=store.assetByType||{};
  const top10=Object.entries(sup).map(([name,v])=>({name,value:Number(v)})).sort((a,b)=>b.value-a.value).slice(0,10);
  const typeData=Object.entries(assetByType).map(([name,v])=>({name,value:Number(v)})).filter(d=>d.value>0);
  const maxTop=top10[0]?.value||1;
  det.innerHTML=`
  <div class="mb3">
    <span class="fw7" style="font-size:16px">${store.name}</span>
    ${store.siteType?`<span class="tm t11" style="margin-left:6px">· ${store.siteType}</span>`:''}
    <div class="t11 tm mt2">2026-03 기준</div>
  </div>
  <div class="g4 mb3">
    ${[{label:'자산 장부가',val:fmtKRf(store.assetValue)},{label:'자산 항목 수',val:`${store.assetCount.toLocaleString('ko-KR')}건`},{label:'비품 재고액',val:fmtKRf(store.supplyValue)},{label:'비품 카테고리 수',val:`${Object.keys(sup).length}종`}].map(k=>`<div style="border:1px solid var(--border);border-radius:10px;padding:10px;background:var(--muted-bg)"><div class="t11 tm">${k.label}</div><div class="fw7 tnums mt2 t12">${k.val}</div></div>`).join('')}
  </div>
  <div class="g2">
    <div class="card p4">
      <div class="sec-title mb3">비품 카테고리 TOP 10</div>
      ${top10.length===0?'<p class="t11 tm">데이터 없음</p>':top10.map(cat=>`
      <div class="mb3">
        <div class="fl jb t12 mb2"><span class="fw6">${cat.name}</span><span class="tm tnums">${fmtKRf(cat.value)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${(cat.value/maxTop*100).toFixed(1)}%"></div></div>
      </div>`).join('')}
    </div>
    <div class="card p4">
      <div class="sec-title mb3">자산 유형별 구성</div>
      ${typeData.length===0?'<p class="t11 tm">자산 유형 데이터 없음</p>':typeData.map((d,i)=>`
      <div class="fl jb aic mb3"><span class="fl aic g8 t11"><span class="donut-dot" style="background:${donutColor(i)}"></span>${d.name}</span><span class="tnums t11 fw6">${fmtKRf(d.value)}</span></div>`).join('')}
    </div>
  </div>`;
}

// ── INIT ──
navigate('dashboard');
</script>
</body>
</html>""")

html_content = ''.join(HTML_PARTS)
print('Total HTML size:', len(html_content))

with open('AIMS_전체구현.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print('AIMS_전체구현.html written successfully.')
