// 사업장 라우트 — 검색 + 페이지네이션 + 상세
import type { FastifyPluginAsync } from 'fastify';
import { StoresQuery } from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

function bigintToNum(b: bigint): number {
  return Number(b);
}

function parseJsonObj(s: string): Record<string, number> {
  try {
    return JSON.parse(s) as Record<string, number>;
  } catch {
    return {};
  }
}

export const storeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stores', { preHandler: requireAuth() }, async (req, reply) => {
    const parsed = StoresQuery.safeParse(req.query);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: '쿼리 형식 오류' });
      return;
    }
    const { q, period, page, limit } = parsed.data;
    const where: Record<string, unknown> = {};
    if (period) where.period = period;
    else where.period = '2026-03';
    if (q && q.length > 0) where.name = { contains: q };

    const [items, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: [{ assetValue: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.store.count({ where }),
    ]);

    return {
      ok: true,
      data: {
        items: items.map((s: any) => ({
          id: s.id,
          name: s.name,
          siteType: s.siteType,
          period: s.period,
          assetValue: bigintToNum(s.assetValue),
          assetCount: s.assetCount,
          supplyValue: bigintToNum(s.supplyValue),
        })),
        total,
        page,
        limit,
      },
    };
  });

  app.get<{ Params: { id: string } }>(
    '/stores/:id',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const s = await prisma.store.findUnique({ where: { id: req.params.id } });
      if (!s) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '사업장 없음' });
        return;
      }
      return {
        ok: true,
        data: {
          id: s.id,
          name: s.name,
          siteType: s.siteType,
          period: s.period,
          assetValue: bigintToNum(s.assetValue),
          assetCount: s.assetCount,
          supplyValue: bigintToNum(s.supplyValue),
          assetByType: parseJsonObj(s.assetByTypeJson),
          supplyByCategory: parseJsonObj(s.supplyByCategoryJson),
          supplyByCategoryCount: parseJsonObj(s.supplyByCategoryCountJson),
        },
      };
    },
  );
};
