import { api } from './index';
import type {
  DepreciationSchedule,
  EquipmentLedger,
  LeaseContract,
  MaintenanceLog,
} from '@aims/shared';

export type ExpiringLeases = {
  critical: LeaseContract[];
  warning: LeaseContract[];
};

export type MaintenanceCostSummary = {
  total: string;
  byBuilding: Array<{ buildingId: string; buildingName: string; cost: string }>;
  byCategory: Array<{ category: string; cost: string }>;
};

export type DepreciationSummary = {
  period: string;
  buildings: string;
  equipments: string;
  total: string;
};

export const phase2Api = {
  leases: (params = '') => api.get<LeaseContract[]>(`/leases${params}`),
  expiringLeases: (withinDays = 30) =>
    api.get<ExpiringLeases>(`/leases/expiring?withinDays=${withinDays}`),
  maintenance: (params = '') => api.get<MaintenanceLog[]>(`/maintenance${params}`),
  maintenanceCostSummary: (period?: string) =>
    api.get<MaintenanceCostSummary>(
      `/maintenance/cost-summary${period ? `?period=${encodeURIComponent(period)}` : ''}`,
    ),
  ledger: (params = '') => api.get<EquipmentLedger[]>(`/ledger${params}`),
  equipmentLedger: (equipmentId: string) =>
    api.get<EquipmentLedger[]>(`/equipments/${equipmentId}/ledger`),
  depreciationSummary: (period: string) =>
    api.get<DepreciationSummary>(`/depreciation/summary?period=${encodeURIComponent(period)}`),
  depreciationSchedules: (assetType?: 'building' | 'equipment') =>
    api.get<DepreciationSchedule[]>(
      `/depreciation/schedules${assetType ? `?assetType=${assetType}` : ''}`,
    ),
  buildingDepreciation: (buildingId: string) =>
    api.get<DepreciationSchedule>(`/depreciation/buildings/${buildingId}`),
};
