import type { FastifyPluginAsync } from 'fastify';
import type { DepMethod, Prisma } from '@prisma/client';
import { DepreciationScheduleUpdate, PeriodSchema } from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/guards';
import { recomputeDepEntries } from '@/lib/depreciation';
import { toDateOnly } from '@/lib/dates';

type ScheduleRow = NonNullable<Awaited<ReturnType<typeof prisma.depreciationSchedule.findFirst>>>;

function serializeEntry(entry: {
  id: string;
  scheduleId: string;
  period: string;
  expense: bigint;
  accumulated: bigint;
  bookValue: bigint;
  computedAt: Date;
}) {
  return {
    id: entry.id,
    scheduleId: entry.scheduleId,
    period: entry.period,
    expense: entry.expense.toString(),
    accumulated: entry.accumulated.toString(),
    bookValue: entry.bookValue.toString(),
    computedAt: entry.computedAt.toISOString(),
  };
}

function serializeSchedule(
  row: ScheduleRow & {
    building?: { name: string } | null;
    equipmentItem?: { name: string } | null;
    entries?: Parameters<typeof serializeEntry>[0][];
  },
) {
  return {
    id: row.id,
    assetType: row.assetType,
    buildingId: row.buildingId,
    buildingName: row.building?.name ?? null,
    equipmentItemId: row.equipmentItemId,
    equipmentName: row.equipmentItem?.name ?? null,
    acquisitionDate: toDateOnly(row.acquisitionDate),
    acquisitionPrice: row.acquisitionPrice.toString(),
    usefulLifeYears: row.usefulLifeYears,
    method: row.method,
    salvageRate: row.salvageRate,
    startedAt: row.startedAt.toISOString(),
    notes: row.notes,
    entries: row.entries?.map(serializeEntry),
  };
}

export const depreciationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/depreciation/summary', { preHandler: requireAuth() }, async (req, reply) => {
    const q = req.query as { period?: string };
    const period = q.period ?? new Date().toISOString().slice(0, 7);
    if (!PeriodSchema.safeParse(period).success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'period 형식 오류' });
      return;
    }
    const entries = await prisma.depEntry.findMany({
      where: { period },
      include: { schedule: { select: { assetType: true } } },
    });
    let buildings = 0n;
    let equipments = 0n;
    for (const entry of entries) {
      if (entry.schedule.assetType === 'building') buildings += entry.expense;
      else equipments += entry.expense;
    }
    return {
      ok: true,
      data: {
        period,
        buildings: buildings.toString(),
        equipments: equipments.toString(),
        total: (buildings + equipments).toString(),
      },
    };
  });

  app.get('/depreciation/schedules', { preHandler: requireAuth() }, async (req) => {
    const q = req.query as { assetType?: 'building' | 'equipment' };
    const schedules = await prisma.depreciationSchedule.findMany({
      where: q.assetType ? { assetType: q.assetType } : undefined,
      include: {
        building: { select: { name: true } },
        equipmentItem: { select: { name: true } },
        entries: { orderBy: { period: 'desc' }, take: 1 },
      },
      orderBy: { startedAt: 'desc' },
      take: 200,
    });
    return { ok: true, data: schedules.map(serializeSchedule) };
  });

  app.get<{ Params: { id: string } }>(
    '/depreciation/buildings/:id',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const schedule = await prisma.depreciationSchedule.findFirst({
        where: { assetType: 'building', buildingId: req.params.id },
        include: {
          building: { select: { name: true } },
          entries: { orderBy: { period: 'asc' }, take: 120 },
        },
      });
      if (!schedule) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '감가상각 스케줄 없음' });
        return;
      }
      return { ok: true, data: serializeSchedule(schedule) };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/depreciation/equipments/:id',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const schedule = await prisma.depreciationSchedule.findFirst({
        where: { assetType: 'equipment', equipmentItemId: req.params.id },
        include: {
          equipmentItem: { select: { name: true } },
          entries: { orderBy: { period: 'asc' }, take: 120 },
        },
      });
      if (!schedule) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '감가상각 스케줄 없음' });
        return;
      }
      return { ok: true, data: serializeSchedule(schedule) };
    },
  );

  app.put<{ Params: { id: string } }>(
    '/depreciation/:id',
    { preHandler: requireRole('admin') },
    async (req, reply) => {
      const parsed = DepreciationScheduleUpdate.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
        return;
      }
      try {
        const data: Prisma.DepreciationScheduleUpdateInput = {};
        if (parsed.data.usefulLifeYears !== undefined) data.usefulLifeYears = parsed.data.usefulLifeYears;
        if (parsed.data.method !== undefined) data.method = parsed.data.method as DepMethod;
        if (parsed.data.salvageRate !== undefined) data.salvageRate = parsed.data.salvageRate;
        if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
        const updated = await prisma.depreciationSchedule.update({
          where: { id: req.params.id },
          data,
        });
        const recomputed = await recomputeDepEntries(updated.id);
        return { ok: true, data: { schedule: serializeSchedule(updated), recomputed } };
      } catch {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '감가상각 스케줄 없음' });
      }
    },
  );
};
