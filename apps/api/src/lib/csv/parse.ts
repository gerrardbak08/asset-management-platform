// CSV 파서 + 타입별 매퍼 — V16 의 5종 업로드 (asset / ledger_asset / ledger_eq / eq_ops / buildings)
import * as XLSX from 'xlsx';

export type CsvType = 'asset' | 'ledger_asset' | 'ledger_eq' | 'eq_ops' | 'buildings';

export type CsvParseResult = { rows: Record<string, unknown>[]; headers: string[] };

export function parseCsv(buf: Buffer): CsvParseResult {
  const wb = XLSX.read(buf, { type: 'buffer', codepage: 65001 });
  const sheet = wb.Sheets[wb.SheetNames[0] ?? ''];
  if (!sheet) throw new Error('CSV 시트 없음');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const headers = (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[]) ?? [];
  return { rows, headers };
}

const TYPE_REQUIRED_HEADERS: Record<CsvType, string[]> = {
  asset: ['품목명'],
  ledger_asset: ['사업장', '장부가'],
  ledger_eq: ['사업장', '카테고리'],
  eq_ops: ['품목명'],
  buildings: ['건물명'],
};

export function validateHeaders(type: CsvType, headers: string[]): string | null {
  const required = TYPE_REQUIRED_HEADERS[type];
  for (const h of required) {
    if (!headers.includes(h)) return `필수 헤더 누락 — '${h}'`;
  }
  return null;
}

export function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function str(v: unknown, def = ''): string {
  if (v == null) return def;
  return String(v).trim();
}
