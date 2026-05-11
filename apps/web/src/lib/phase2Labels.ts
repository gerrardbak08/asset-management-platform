import type {
  DepMethod,
  LedgerTxType,
  LeaseStatus,
  LocationType,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from '@aims/shared';

export const leaseStatusLabel: Record<LeaseStatus, string> = {
  active: '진행',
  expired: '만료',
  terminated: '해지',
  pending: '예정',
};

export const maintenanceStatusLabel: Record<MaintenanceStatus, string> = {
  open: '접수',
  in_progress: '진행',
  closed: '완료',
  cancelled: '취소',
};

export const maintenanceCategoryLabel: Record<MaintenanceCategory, string> = {
  regular_inspection: '정기점검',
  emergency_repair: '긴급수리',
  facility_upgrade: '시설개선',
  safety_diagnosis: '안전진단',
};

export const maintenancePriorityLabel: Record<MaintenancePriority, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
  critical: '긴급',
};

export const ledgerTxLabel: Record<LedgerTxType, string> = {
  purchase: '구매',
  transfer: '이동',
  disposal: '폐기',
  adjustment: '조정',
};

export const locationLabel: Record<LocationType, string> = {
  hq: '본사',
  store: '매장',
  logistics: '물류',
};

export const depMethodLabel: Record<DepMethod, string> = {
  straight_line: '정액법',
  declining_balance: '정률법',
};
