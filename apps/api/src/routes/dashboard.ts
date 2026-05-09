// 자산현황 페이지용 API — MoM / monthly snapshots / equipments
import type { FastifyPluginAsync } from 'fastify';
import { MomQuery, PeriodSchema } from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

function bigintToNum(b: bigint): number {
  // V16 자산 단위는 ≤ 1.2조 정도라 Number 안전 (2^53 ≈ 9.007e15)
  return Number(b);
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /api/mom?period=2026-03 — V16 M0_DATA 그대로 반환
  app.get('/mom', { preHandler: requireAuth() }, async (req, reply) => {
    const parsed = MomQuery.safeParse(req.query);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'period 형식 오류' });
      return;
    }
    const snap = await prisma.monthlySnapshot.findUnique({
      where: { period: parsed.data.period },
    });
    if (!snap) {
      reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '해당 기간 스냅샷 없음' });
      return;
    }
    const m0 = JSON.parse(snap.rawJson) as unknown;
    return { ok: true, data: m0 };
  });

  // ── GET /api/snapshots?fromPeriod=&toPeriod=
  app.get('/snapshots', { preHandler: requireAuth() }, async (req) => {
    const q = req.query as { fromPeriod?: string; toPeriod?: string };
    const where: Record<string, unknown> = {};
    if (q.fromPeriod && PeriodSchema.safeParse(q.fromPeriod).success) where.gte = q.fromPeriod;
    if (q.toPeriod && PeriodSchema.safeParse(q.toPeriod).success) where.lte = q.toPeriod;

    const items = await prisma.monthlySnapshot.findMany({
      where: Object.keys(where).length ? { period: where } : undefined,
      orderBy: { period: 'asc' },
    });
    return {
      ok: true,
      data: items.map((s) => ({
        period: s.period,
        totalAsset: bigintToNum(s.totalAsset),
        tangible: bigintToNum(s.tangible),
        intangible: bigintToNum(s.intangible),
        equipment: bigintToNum(s.equipment),
        hq: bigintToNum(s.hq),
        store: bigintToNum(s.store),
        logistics: bigintToNum(s.logistics),
        kpiJson: JSON.parse(s.kpiJson),
      })),
    };
  });

  // ── GET /api/equipments
  app.get('/equipments', { preHandler: requireAuth() }, async () => {
    const items = await prisma.equipmentItem.findMany({
      orderBy: { legacyId: 'asc' },
    });
    return {
      ok: true,
      data: items.map((e) => ({
        id: e.id,
        legacyId: e.legacyId,
        name: e.name,
        isActive: e.isActive,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  });

  // ── GET /api/equipments/snapshots?period=2026-03
  app.get<{ Querystring: { period?: string } }>(
    '/equipments/snapshots',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const period = req.query.period ?? '2026-03';
      if (!PeriodSchema.safeParse(period).success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'period 형식 오류' });
        return;
      }
      const items = await prisma.equipmentSnapshot.findMany({
        where: { period },
        include: { equipment: true },
        orderBy: { equipment: { legacyId: 'asc' } },
      });
      return {
        ok: true,
        data: items.map((s) => ({
          id: s.id,
          equipmentId: s.equipmentId,
          equipmentLegacyId: s.equipment.legacyId,
          equipmentName: s.equipment.name,
          period: s.period,
          locationType: s.locationType,
          purchaseAmount: bigintToNum(s.purchaseAmount),
          transferAmount: bigintToNum(s.transferAmount),
          disposalAmount: bigintToNum(s.disposalAmount),
          inventoryAmount: bigintToNum(s.inventoryAmount),
        })),
      };
    },
  );
};
