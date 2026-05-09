// xlsb 파서 — V16 handleMonthlyXlsbUpload 의 시트 매핑 그대로
//   자산현황 시트 행 5 cell B/D/F/H = 총자산/유형/무형/비품
//   비품(프로세스별) 시트 행 5 = 재고/구매/이동/폐기
//   원장_비품_재고: 사업장별 카테고리 집계
//   원장_자산: 사업장별 장부가 집계
import * as XLSX from 'xlsx';

export type XlsbParsed = {
  period: string; // 'YYYY-MM'
  totalAsset: number;
  tangible: number;
  intangible: number;
  equipment: number;
  suppliesKpi: { stock: number; purchase: number; transfer: number; disposal: number };
  assetMatrix: Array<{ category: string; subcategory: string; hq: number; store: number; logistics: number; total: number }>;
  storesAssetSum: Map<string, number>; // 사업장명 → 장부가
  storesSupplyCategory: Map<string, Map<string, { amount: number; count: number }>>; // 사업장명 → 카테고리 → {금액, 수량}
};

function periodFromV16Label(label: string): string {
  const m = /(\d{2,4})[\-./](\d{1,2})/.exec(label);
  if (!m) return new Date().toISOString().slice(0, 7);
  let y = m[1];
  if (y.length === 2) y = '20' + y;
  return `${y}-${m[2].padStart(2, '0')}`;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function parseMonthlyXlsb(buf: Buffer | ArrayBuffer): XlsbParsed {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });

  // ── 자산현황 시트
  const wsAsset = wb.Sheets['자산현황'];
  if (!wsAsset) throw new Error('자산현황 시트 없음');
  const A = XLSX.utils.sheet_to_json<unknown[]>(wsAsset, { header: 1, defval: null });

  const periodLabel = A[0] && Array.isArray(A[0]) && A[0][1] ? String(A[0][1]).trim() : '';
  const period = periodFromV16Label(periodLabel);

  const aRow = (A[4] as unknown[]) ?? [];
  const totalAsset = num(aRow[1]);
  const tangible = num(aRow[3]);
  const intangible = num(aRow[5]);
  const equipment = num(aRow[7]);
  if (totalAsset === 0) throw new Error('자산현황 행 5 합계 누락');

  // ── 자산 매트릭스 — 행 5 이후 데이터 행 흡수 (V16 그대로 단순화)
  const assetMatrix: XlsbParsed['assetMatrix'] = [];
  for (let i = 6; i < A.length; i++) {
    const r = A[i] as unknown[] | null | undefined;
    if (!r) continue;
    const cat = r[0] != null ? String(r[0]).trim() : '';
    const sub = r[1] != null ? String(r[1]).trim() : '';
    if (!cat && !sub) continue;
    const hq = num(r[2]);
    const store = num(r[3]);
    const logistics = num(r[4]);
    const total = num(r[5]);
    if (hq + store + logistics + total === 0 && !cat && !sub) continue;
    assetMatrix.push({ category: cat, subcategory: sub, hq, store, logistics, total });
  }

  // ── 비품 시트
  const wsEq = wb.Sheets['비품(프로세스별)'] ?? wb.Sheets['비품'] ?? null;
  let stock = 0;
  let purchase = 0;
  let transfer = 0;
  let disposal = 0;
  if (wsEq) {
    const E = XLSX.utils.sheet_to_json<unknown[]>(wsEq, { header: 1, defval: null });
    const eRow = (E[4] as unknown[]) ?? [];
    stock = num(eRow[1]);
    purchase = num(eRow[3]);
    transfer = num(eRow[5]);
    disposal = num(eRow[7]);
  }

  // ── 원장_자산 — 사업장별 장부가 합계 (사업장명 컬럼 + 장부가 컬럼 추정)
  const storesAssetSum = new Map<string, number>();
  const wsLedger = wb.Sheets['원장_자산'] ?? null;
  if (wsLedger) {
    const L = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsLedger, { defval: null });
    for (const row of L) {
      const name = String(row['사업장'] ?? row['조직'] ?? row['매장'] ?? row['사업장명'] ?? '').trim();
      if (!name) continue;
      const value = num(row['장부가'] ?? row['장부가액'] ?? row['금액']);
      storesAssetSum.set(name, (storesAssetSum.get(name) ?? 0) + value);
    }
  }

  // ── 원장_비품_재고 — 사업장 × 카테고리 집계
  const storesSupplyCategory = new Map<string, Map<string, { amount: number; count: number }>>();
  const wsSupplyLedger = wb.Sheets['원장_비품_재고'] ?? null;
  if (wsSupplyLedger) {
    const S = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsSupplyLedger, { defval: null });
    for (const row of S) {
      const name = String(row['사업장'] ?? row['조직'] ?? row['매장'] ?? '').trim();
      const category = String(row['카테고리'] ?? row['중분류'] ?? row['품목'] ?? '').trim();
      if (!name || !category) continue;
      const amount = num(row['금액'] ?? row['장부가'] ?? row['재고금액']);
      const count = num(row['수량'] ?? row['재고수량']);
      let bucket = storesSupplyCategory.get(name);
      if (!bucket) {
        bucket = new Map();
        storesSupplyCategory.set(name, bucket);
      }
      const prev = bucket.get(category) ?? { amount: 0, count: 0 };
      bucket.set(category, { amount: prev.amount + amount, count: prev.count + count });
    }
  }

  return {
    period,
    totalAsset,
    tangible,
    intangible,
    equipment,
    suppliesKpi: { stock, purchase, transfer, disposal },
    assetMatrix,
    storesAssetSum,
    storesSupplyCategory,
  };
}
