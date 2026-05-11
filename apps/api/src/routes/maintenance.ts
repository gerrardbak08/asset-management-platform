import type { FastifyPluginAsync } from 'fastify';
import type { MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from '@prisma/client';
import {
  MaintenanceLogInput,
  MaintenanceLogUpdate,
  MaintenanceStatusSchema,
  PeriodSchema,
} from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/guards';
import { parseDateOnly, toDateOnly } from '@/lib/dates';

type MaintenanceRow = NonNullable<Awaited<ReturnType<typeof prisma.maintenanceLog.findFirst>>>;

function serializeMaintenance(
  row: MaintenanceRow & {
    building?: { name: string } | null;
    assignee?: { email: string } | null;
  },
) {
  return {
    id: row.id,
    buildingId: row.buildingId,
    buildingName: row.building?.name,
    category: row.category,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assigneeId,
    assigneeEmail: row.assignee?.email ?? null,
    vendorName: row.vendorName,
    startedAt: toDateOnly(row.startedAt),
    closedAt: toDateOnly(row.closedAt),
    cost: row.cost?.toString() ?? null,
    attachmentUrls: row.attachmentUrls,
    createdBy: row.createdById,
    updatedBy: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function quarterRange(period: string): { gte: Date; lt: Date } | null {
  const match = /^(\d{4})-Q([1-4])$/.exec(period);
  if (!match) return null;
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const startMonth = (quarter - 1) * 3;
  return {
    gte: new Date(Date.UTC(year, startMonth, 1)),
    lt: new Date(Date.UTC(year, startMonth + 3, 1)),
  };
}

function monthRange(period: string): { gte: Date; lt: Date } | null {
  if (!PeriodSchema.safeParse(period).success) return null;
  const [year, month] = period.split('-').map(Number);
  return {
    gte: new Date(Date.UTC(year!, month! - 1, 1)),
    lt: new Date(Date.UTC(year!, month!, 1)),
  };
}

export const maintenanceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/maintenance/cost-summary', { preHandler: requireAuth() }, async (req, reply) => {
    const q = req.query as { period?: string };
    const range = q.period ? quarterRange(q.period) ?? monthRange(q.period) : null;
    if (q.period && !range) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'period 형식 오류' });
      return;
    }
    const logs = await prisma.maintenanceLog.findMany({
      where: {
        cost: { not: null },
        ...(range ? { startedAt: { gte: range.gte, lt: range.lt } } : {}),
      },
      include: { building: { select: { name: true } } },
    });
    const byBuilding = new Map<string, { buildingId: string; buildingName: string; cost: bigint }>();
    const byCategory = new Map<string, bigint>();
    let total = 0n;
    for (const log of logs) {
      const cost = log.cost ?? 0n;
      total += cost;
      const b = byBuilding.get(log.buildingId) ?? {
        buildingId: log.buildingId,
        buildingName: log.building.name,
        cost: 0n,
      };
      b.cost += cost;
      byBuilding.set(log.buildingId, b);
      byCategory.set(log.category, (byCategory.get(log.category) ?? 0n) + cost);
    }
    return {
      ok: true,
      data: {
        total: total.toString(),
        byBuilding: [...byBuilding.values()]
          .map((v) => ({ ...v, cost: v.cost.toString() }))
          .sort((a, b) => Number(BigInt(b.cost) - BigInt(a.cost))),
        byCategory: [...byCategory.entries()].map(([category, cost]) => ({
          category,
          cost: cost.toString(),
        })),
      },
    };
  });

  app.get('/maintenance', { preHandler: requireAuth() }, async (req, reply) => {
    const q = req.query as { buildingId?: string; status?: string; from?: string; to?: string };
    const where: Record<string, unknown> = {};
    if (q.buildingId) where.buildingId = q.buildingId;
    if (q.status) {
      const status = MaintenanceStatusSchema.safeParse(q.status);
      if (!status.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'status 형식 오류' });
        return;
      }
      where.status = status.data;
    }
    const startedAt: Record<string, Date> = {};
    if (q.from) startedAt.gte = parseDateOnly(q.from);
    if (q.to) startedAt.lte = parseDateOnly(q.to);
    if (Object.keys(startedAt).length) where.startedAt = startedAt;

    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: {
        building: { select: { name: true } },
        assignee: { select: { email: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return { ok: true, data: logs.map(serializeMaintenance) };
  });

  app.get<{ Params: { id: string } }>(
    '/maintenance/:id',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const log = await prisma.maintenanceLog.findUnique({
        where: { id: req.params.id },
        include: {
          building: { select: { name: true } },
          assignee: { select: { email: true } },
        },
      });
      if (!log) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '유지보수 로그 없음' });
        return;
      }
      return { ok: true, data: serializeMaintenance(log) };
    },
  );

  app.post('/maintenance', { preHandler: requireRole('editor', 'admin') }, async (req, reply) => {
    const parsed = MaintenanceLogInput.safeParse(req.body);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
      return;
    }
    const data = parsed.data;
    try {
      const log = await prisma.maintenanceLog.create({
        data: {
          buildingId: data.buildingId,
          category: data.category as MaintenanceCategory,
          title: data.title,
          description: data.description ?? null,
          status: data.status as MaintenanceStatus,
          priority: data.priority as MaintenancePriority,
          assigneeId: data.assigneeId ?? null,
          vendorName: data.vendorName ?? null,
          startedAt: data.startedAt ? parseDateOnly(data.startedAt) : null,
          closedAt: data.closedAt ? parseDateOnly(data.closedAt) : null,
          cost: data.cost ?? null,
          attachmentUrls: data.attachmentUrls,
          createdById: req.user!.id,
          updatedById: req.user!.id,
        },
      });
      return { ok: true, data: serializeMaintenance(log) };
    } catch {
      reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '건물 또는 사용자 없음' });
    }
  });

  app.put<{ Params: { id: string } }>(
    '/maintenance/:id',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const parsed = MaintenanceLogUpdate.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
        return;
      }
      const data = parsed.data;
      const updateData: Record<string, unknown> = { updatedById: req.user!.id };
      if (data.buildingId !== undefined) updateData.buildingId = data.buildingId;
      if (data.category !== undefined) updateData.category = data.category as MaintenanceCategory;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status as MaintenanceStatus;
      if (data.priority !== undefined) updateData.priority = data.priority as MaintenancePriority;
      if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
      if (data.vendorName !== undefined) updateData.vendorName = data.vendorName;
      if (data.startedAt !== undefined) updateData.startedAt = data.startedAt ? parseDateOnly(data.startedAt) : null;
      if (data.closedAt !== undefined) updateData.closedAt = data.closedAt ? parseDateOnly(data.closedAt) : null;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.attachmentUrls !== undefined) updateData.attachmentUrls = data.attachmentUrls;

      try {
        const log = await prisma.maintenanceLog.update({
          where: { id: req.params.id },
          data: updateData,
        });
        return { ok: true, data: serializeMaintenance(log) };
      } catch {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '유지보수 로그 없음' });
      }
    },
  );
};
