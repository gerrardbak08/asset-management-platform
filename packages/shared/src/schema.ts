// zod 스키마 — API 입력 검증. spec.md §3.7 / §4 참조
import { z } from 'zod';
import {
  DEP_METHODS,
  LEDGER_TX_TYPES,
  LEASE_STATUSES,
  LOCATION_TYPES,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  M_KEYS,
  ROLES,
} from './types';

// ── 공용 정규식
export const PeriodSchema = z.string().regex(/^\d{4}-\d{2}$/, 'period 형식은 YYYY-MM');
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date 형식은 YYYY-MM-DD');
export const RoleSchema = z.enum(ROLES as unknown as [string, ...string[]]);
export const MoneyInput = z
  .union([z.bigint(), z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
  .transform((v) => (typeof v === 'bigint' ? v : BigInt(v)));
export const LeaseStatusSchema = z.enum(LEASE_STATUSES as unknown as [string, ...string[]]);
export const MaintenanceCategorySchema = z.enum(
  MAINTENANCE_CATEGORIES as unknown as [string, ...string[]],
);
export const MaintenanceStatusSchema = z.enum(
  MAINTENANCE_STATUSES as unknown as [string, ...string[]],
);
export const MaintenancePrioritySchema = z.enum(
  MAINTENANCE_PRIORITIES as unknown as [string, ...string[]],
);
export const LedgerTxTypeSchema = z.enum(LEDGER_TX_TYPES as unknown as [string, ...string[]]);
export const LocationTypeSchema = z.enum(LOCATION_TYPES as unknown as [string, ...string[]]);
export const DepMethodSchema = z.enum(DEP_METHODS as unknown as [string, ...string[]]);

// ── 인증
export const LoginInput = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
});
export type LoginInputT = z.infer<typeof LoginInput>;

// ── 건물
export const BuildingUpdate = z.object({
  name: z.string().min(1).max(80).optional(),
  address: z.string().max(200).optional(),
  use: z.string().max(200).optional(),
  area: z
    .object({ sqm: z.number().min(0), pyeong: z.number().min(0) })
    .optional(),
  floors: z.string().max(50).optional(),
  approvalDate: DateSchema.nullable().optional(),
  acquisitionDate: DateSchema.optional(),
  acquisitionPrice: z.union([z.bigint(), z.number().int().nonnegative()]).optional(),
  rental: z
    .object({
      area: z.number().min(0),
      rate: z.number().min(0).max(100),
      vacancy: z.number().min(0).max(100),
    })
    .optional(),
  tenant: z.string().max(200).optional(),
  lat: z.number().min(33).max(39).optional(),
  lng: z.number().min(124).max(132).optional(),
});
export type BuildingUpdateT = z.infer<typeof BuildingUpdate>;

export const BuildingMemoInput = z.object({
  body: z.string().max(10000),
});
export type BuildingMemoInputT = z.infer<typeof BuildingMemoInput>;

// ── 비품
export const EquipmentItemUpdate = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});
export type EquipmentItemUpdateT = z.infer<typeof EquipmentItemUpdate>;

export const EquipmentSnapshotInput = z.object({
  period: PeriodSchema,
  items: z.array(
    z.object({
      equipmentId: z.string().uuid(),
      locationType: z.enum(['hq', 'store', 'logistics']),
      purchaseAmount: z.union([z.bigint(), z.number().int().nonnegative()]),
      transferAmount: z.union([z.bigint(), z.number().int().nonnegative()]),
      disposalAmount: z.union([z.bigint(), z.number().int().nonnegative()]),
      inventoryAmount: z.union([z.bigint(), z.number().int().nonnegative()]),
    }),
  ),
});
export type EquipmentSnapshotInputT = z.infer<typeof EquipmentSnapshotInput>;

// ── 사업장
export const StoresQuery = z.object({
  q: z.string().max(80).optional(),
  period: PeriodSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});
export type StoresQueryT = z.infer<typeof StoresQuery>;

// ── 월별
export const MonthlyUpdate = z.object({
  entries: z.array(
    z.object({
      metric: z.enum(M_KEYS as unknown as [string, ...string[]]),
      values: z.array(z.number().nullable()).length(12),
    }),
  ),
});
export type MonthlyUpdateT = z.infer<typeof MonthlyUpdate>;

// ── MoM
export const MomQuery = z.object({
  period: PeriodSchema,
});
export type MomQueryT = z.infer<typeof MomQuery>;

// ── 2단계: 임대
export const LeaseContractInput = z.object({
  buildingId: z.string().uuid(),
  tenantName: z.string().min(1).max(120),
  tenantContact: z.string().max(120).nullable().optional(),
  contractStart: DateSchema,
  contractEnd: DateSchema,
  rentArea: z.number().min(0),
  monthlyRent: MoneyInput,
  deposit: MoneyInput,
  renewalOption: z.boolean().default(false),
  renewedFromId: z.string().uuid().nullable().optional(),
  status: LeaseStatusSchema.default('active'),
  notes: z.string().max(10000).nullable().optional(),
});
export type LeaseContractInputT = z.infer<typeof LeaseContractInput>;

export const LeaseContractUpdate = LeaseContractInput.omit({ buildingId: true })
  .partial()
  .extend({
    buildingId: z.string().uuid().optional(),
  });
export type LeaseContractUpdateT = z.infer<typeof LeaseContractUpdate>;

export const LeaseRenewInput = LeaseContractInput.omit({
  buildingId: true,
  renewedFromId: true,
  status: true,
}).extend({
  status: LeaseStatusSchema.default('active'),
});
export type LeaseRenewInputT = z.infer<typeof LeaseRenewInput>;

export const LeaseTerminateInput = z.object({
  reason: z.string().max(1000).optional().default(''),
});
export type LeaseTerminateInputT = z.infer<typeof LeaseTerminateInput>;

// ── 2단계: 유지보수
export const MaintenanceLogInput = z.object({
  buildingId: z.string().uuid(),
  category: MaintenanceCategorySchema,
  title: z.string().min(1).max(160),
  description: z.string().max(10000).nullable().optional(),
  status: MaintenanceStatusSchema.default('open'),
  priority: MaintenancePrioritySchema.default('normal'),
  assigneeId: z.string().uuid().nullable().optional(),
  vendorName: z.string().max(120).nullable().optional(),
  startedAt: DateSchema.nullable().optional(),
  closedAt: DateSchema.nullable().optional(),
  cost: MoneyInput.nullable().optional(),
  attachmentUrls: z.array(z.string().url().or(z.string().startsWith('/'))).default([]),
});
export type MaintenanceLogInputT = z.infer<typeof MaintenanceLogInput>;

export const MaintenanceLogUpdate = MaintenanceLogInput.partial();
export type MaintenanceLogUpdateT = z.infer<typeof MaintenanceLogUpdate>;

// ── 2단계: 비품 원장
export const EquipmentLedgerInput = z.object({
  legacyAssetNo: z.string().max(80).nullable().optional(),
  txType: LedgerTxTypeSchema,
  txDate: DateSchema,
  fromLocation: LocationTypeSchema.nullable().optional(),
  toLocation: LocationTypeSchema.nullable().optional(),
  storeId: z.string().uuid().nullable().optional(),
  amount: MoneyInput,
  quantity: z.number().int().min(1).default(1),
  reason: z.string().max(1000).nullable().optional(),
  documentUrl: z.string().url().or(z.string().startsWith('/')).nullable().optional(),
  period: PeriodSchema,
});
export type EquipmentLedgerInputT = z.infer<typeof EquipmentLedgerInput>;

export const RecomputeSnapshotInput = z.object({
  period: PeriodSchema,
});
export type RecomputeSnapshotInputT = z.infer<typeof RecomputeSnapshotInput>;

// ── 2단계: 감가상각
export const DepreciationScheduleUpdate = z.object({
  usefulLifeYears: z.number().int().min(1).max(80).optional(),
  method: DepMethodSchema.optional(),
  salvageRate: z.number().min(0).max(0.95).optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type DepreciationScheduleUpdateT = z.infer<typeof DepreciationScheduleUpdate>;
