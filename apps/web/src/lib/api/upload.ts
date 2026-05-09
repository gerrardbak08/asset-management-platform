// 업로드 API — xlsb 월마감 + CSV 5종 + 양식 다운로드 + export 3종
import { ApiError } from './index';

export type CsvType = 'asset' | 'ledger_asset' | 'ledger_eq' | 'eq_ops' | 'buildings';

export type XlsbResult = {
  period: string;
  totalAsset: number;
  tangible: number;
  intangible: number;
  equipment: number;
  storesUpdated: number;
  matrixRows: number;
  moversTopUp: number;
  moversTopDown: number;
  previousPeriodFound: boolean;
};

export type CsvUploadResult = {
  type: CsvType;
  period: string;
  rowsApplied: number;
  totalRows: number;
};

async function postFile<T>(url: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(url, { method: 'POST', body: fd, credentials: 'include' });
  const json = (await res.json()) as { ok: true; data: T } | { ok: false; code: string; message: string };
  if (!json.ok) throw new ApiError(json.code, json.message, res.status);
  return json.data;
}

export const uploadApi = {
  xlsb: (file: File) => postFile<XlsbResult>('/api/upload/xlsb', file),
  csv: (type: CsvType, file: File, period?: string) =>
    postFile<CsvUploadResult>(
      `/api/upload/csv/${type}${period ? `?period=${encodeURIComponent(period)}` : ''}`,
      file,
    ),
  templateUrl: (type: CsvType): string => `/api/upload/templates/${type}`,
};

export const exportApi = {
  snapshotJsonUrl: '/api/export/snapshot.json',
  buildingsCsvUrl: '/api/export/buildings.csv',
  equipmentsCsvUrl: (period = '2026-03') => `/api/export/equipments.csv?period=${encodeURIComponent(period)}`,
};
