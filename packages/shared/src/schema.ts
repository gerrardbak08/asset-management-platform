// zod 스키마 — API 입력 검증. spec.md §3.7 / §4 참조
import { z } from 'zod';
import { ROLES, M_KEYS } from './types';

// ── 공용 정규식
export const PeriodSchema = z.string().regex(/^\d{4}-\d{2}$/, 'period 형식은 YYYY-MM');
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date 형식은 YYYY-MM-DD');
export const RoleSchema = z.enum(ROLES as unknown as [string, ...string[]]);

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
