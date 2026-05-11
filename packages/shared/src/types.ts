// 도메인 타입 정의 — V16 데이터 모양 보존 (Building/Equipment/Store/Monthly/M0Data) + 새 시스템 메타
// docs/spec.md §1 참조

// ── 기본 타입
export type Role = 'admin' | 'editor' | 'viewer' | 'auditor';
export type SiteType = '본사' | '매장' | '물류';
export type LocationType = 'hq' | 'store' | 'logistics';
export type Period = string; // 'YYYY-MM' — '2026-03' 등
export type LeaseStatus = 'active' | 'expired' | 'terminated' | 'pending';
export type MaintenanceCategory =
  | 'regular_inspection'
  | 'emergency_repair'
  | 'facility_upgrade'
  | 'safety_diagnosis';
export type MaintenanceStatus = 'open' | 'in_progress' | 'closed' | 'cancelled';
export type MaintenancePriority = 'low' | 'normal' | 'high' | 'critical';
export type LedgerTxType = 'purchase' | 'transfer' | 'disposal' | 'adjustment';
export type DepAssetType = 'building' | 'equipment';
export type DepMethod = 'straight_line' | 'declining_balance';

export const M_KEYS = [
  '총자산규모',
  '건물자산금액',
  '비품재고액',
  '비품구매금액',
  '비품이동금액',
  '비품폐기금액',
] as const;
export type MetricKey = (typeof M_KEYS)[number];

export const ROLES: readonly Role[] = ['admin', 'editor', 'viewer', 'auditor'] as const;
export const LEASE_STATUSES: readonly LeaseStatus[] = ['active', 'expired', 'terminated', 'pending'] as const;
export const MAINTENANCE_CATEGORIES: readonly MaintenanceCategory[] = [
  'regular_inspection',
  'emergency_repair',
  'facility_upgrade',
  'safety_diagnosis',
] as const;
export const MAINTENANCE_STATUSES: readonly MaintenanceStatus[] = [
  'open',
  'in_progress',
  'closed',
  'cancelled',
] as const;
export const MAINTENANCE_PRIORITIES: readonly MaintenancePriority[] = [
  'low',
  'normal',
  'high',
  'critical',
] as const;
export const LEDGER_TX_TYPES: readonly LedgerTxType[] = [
  'purchase',
  'transfer',
  'disposal',
  'adjustment',
] as const;
export const LOCATION_TYPES: readonly LocationType[] = ['hq', 'store', 'logistics'] as const;
export const DEP_ASSET_TYPES: readonly DepAssetType[] = ['building', 'equipment'] as const;
export const DEP_METHODS: readonly DepMethod[] = ['straight_line', 'declining_balance'] as const;

// ── 사용자
export type User = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

// ── 건물 (V16 보존 + 새 메타)
export type Building = {
  id: string;
  legacyId: string; // bd_001 ~ bd_015
  name: string;
  address: string;
  use: string;
  area: { sqm: number; pyeong: number };
  floors: string;
  approvalDate: string | null;
  acquisitionDate: string;
  acquisitionPrice: bigint;
  rental: { area: number; rate: number; vacancy: number };
  tenant: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  detailPhotoUrl: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

// ── 비품
export type EquipmentItem = {
  id: string;
  legacyId: string; // eq_001 ~ eq_041
  name: string;
  isActive: boolean;
  createdAt: string;
};

export type EquipmentSnapshot = {
  id: string;
  equipmentId: string;
  period: Period;
  locationType: LocationType;
  purchaseAmount: bigint;
  transferAmount: bigint;
  disposalAmount: bigint;
  inventoryAmount: bigint;
};

// ── 사업장
export type Store = {
  id: string;
  name: string;
  siteType: SiteType | null;
  period: Period;
  assetValue: bigint;
  assetCount: number;
  supplyValue: bigint;
  assetByType: Record<string, number>;
  supplyByCategory: Record<string, number>;
  supplyByCategoryCount: Record<string, number>;
};

// ── 월별
export type MonthlyEntry = {
  metric: MetricKey;
  values: Array<number | null>; // 12개 (1~12월)
};

export type AssetKPI = {
  total: number;
  tangible: { value: number; ratio: number };
  intangible: { value: number; ratio: number };
  supplies: { value: number; ratio: number };
};

export type M0Mover = {
  category: string;
  subcategory: string;
  current: number;
  previous: number;
  delta: number;
  ratio: number;
};

export type M0AssetMatrixRow = {
  category: string;
  subcategory: string;
  hq: number;
  store: number;
  logistics: number;
  total: number;
};

export type M0Period = {
  asset_kpi: AssetKPI;
  asset_matrix: M0AssetMatrixRow[];
  supplies_kpi?: { stock: number; purchase: number; transfer: number; disposal: number };
  supplies_category_detail?: Record<string, { amount: number; count: number }>;
  stores?: Array<
    Pick<
      Store,
      | 'name'
      | 'siteType'
      | 'assetValue'
      | 'assetCount'
      | 'supplyValue'
      | 'assetByType'
      | 'supplyByCategory'
      | 'supplyByCategoryCount'
    >
  >;
  location?: { hq: number; store: number; logistics: number };
};

export type M0Data = {
  meta: {
    current_period: string;
    previous_period: string;
    currency: 'KRW';
    schema_version: '1.0';
  };
  current: M0Period;
  previous: M0Period;
  mom: {
    total: { value: number; ratio: number };
    tangible: { value: number; ratio: number };
    intangible: { value: number; ratio: number };
    supplies: { value: number; ratio: number };
    location: {
      hq: { value: number; ratio: number };
      store: { value: number; ratio: number };
      logistics: { value: number; ratio: number };
    };
    supplies_kpi: {
      stock: { value: number; ratio: number };
      purchase: { value: number; ratio: number };
      transfer: { value: number; ratio: number };
      disposal: { value: number; ratio: number };
    };
  };
  movers?: { top_up: M0Mover[]; top_down: M0Mover[] };
};

export type MonthlySnapshot = {
  id: string;
  period: Period;
  totalAsset: bigint;
  tangible: bigint;
  intangible: bigint;
  equipment: bigint;
  hq: bigint;
  store: bigint;
  logistics: bigint;
  kpiJson: AssetKPI;
  rawJson: M0Data;
  createdAt: string;
};

// ── 메모
export type BuildingMemo = {
  buildingId: string;
  body: string;
  updatedBy: string | null;
  updatedAt: string;
};

// ── 2단계: 임대 / 유지보수 / 비품 원장 / 감가상각
export type LeaseContract = {
  id: string;
  buildingId: string;
  buildingName?: string;
  tenantName: string;
  tenantContact: string | null;
  contractStart: string;
  contractEnd: string;
  rentArea: number;
  monthlyRent: string;
  deposit: string;
  renewalOption: boolean;
  renewedFromId: string | null;
  status: LeaseStatus;
  notes: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceLog = {
  id: string;
  buildingId: string;
  buildingName?: string;
  category: MaintenanceCategory;
  title: string;
  description: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  assigneeId: string | null;
  assigneeEmail?: string | null;
  vendorName: string | null;
  startedAt: string | null;
  closedAt: string | null;
  cost: string | null;
  attachmentUrls: string[];
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentLedger = {
  id: string;
  equipmentItemId: string;
  equipmentName?: string;
  equipmentLegacyId?: string;
  legacyAssetNo: string | null;
  txType: LedgerTxType;
  txDate: string;
  fromLocation: LocationType | null;
  toLocation: LocationType | null;
  storeId: string | null;
  amount: string;
  quantity: number;
  reason: string | null;
  documentUrl: string | null;
  period: Period;
  createdBy: string;
  createdAt: string;
};

export type DepEntry = {
  id: string;
  scheduleId: string;
  period: Period;
  expense: string;
  accumulated: string;
  bookValue: string;
  computedAt: string;
};

export type DepreciationSchedule = {
  id: string;
  assetType: DepAssetType;
  buildingId: string | null;
  buildingName?: string | null;
  equipmentItemId: string | null;
  equipmentName?: string | null;
  acquisitionDate: string;
  acquisitionPrice: string;
  usefulLifeYears: number;
  method: DepMethod;
  salvageRate: number;
  startedAt: string;
  notes: string | null;
  entries?: DepEntry[];
};

// ── API 응답 헬퍼
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; code: ApiErrorCode; message: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'UPLOAD_PARSE'
  | 'INTERNAL';
