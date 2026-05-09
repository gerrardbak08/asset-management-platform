// 자산현황 페이지 API — MoM (M0Data) / snapshots / equipments
import { api } from './index';
import type { M0Data } from '@aims/shared';

export type EquipmentSnapshotItem = {
  id: string;
  equipmentId: string;
  equipmentLegacyId: string;
  equipmentName: string;
  period: string;
  locationType: 'hq' | 'store' | 'logistics';
  purchaseAmount: number;
  transferAmount: number;
  disposalAmount: number;
  inventoryAmount: number;
};

export const dashboardApi = {
  mom: (period: string) => api.get<M0Data>(`/mom?period=${encodeURIComponent(period)}`),
  snapshots: () => api.get<Array<{ period: string; totalAsset: number; tangible: number; intangible: number; equipment: number; hq: number; store: number; logistics: number }>>('/snapshots'),
  equipmentSnapshots: (period: string) =>
    api.get<EquipmentSnapshotItem[]>(`/equipments/snapshots?period=${encodeURIComponent(period)}`),
};
