import type { FastifyPluginAsync } from 'fastify';
import type { LedgerTxType, LocationType } from '@prisma/client';
import { EquipmentLedgerInput, LedgerTxTypeSchema, RecomputeSnapshotInput } from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/guards';
import { parseDateOnly, toDateOnly } from '@/lib/dates';
import { recomputeSnapshot } from '@/lib/equipmentLedger';

type LedgerRow = NonNullable<Awaited<ReturnType<typeof prisma.equipmentLedger.findFirst>>>;

function serializeLedger(
  row: LedgerRow & { equipmentItem?: { name: string; legacyId: string } | null },
) {
  return {
    id: row.id,
    equipmentItemId: row.equipmentItemId,
    equipmentName: row.equipmentItem?.name,
    equipmentLegacyId: row.equipmentItem?.legacyId,
    legacyAssetNo: row.legacyAssetNo,
    txType: row.txType,
    txDate: toDateOnly(row.txDate),
    fromLocation: row.fromLocation,
    toLocation: row.toLocation,
    storeId: row.storeId,
    amount: row.amount.toString(),
    quantity: row.quantity,
    reason: row.reason,
    documentUrl: row.documentUrl,
    period: row.period,
    createdBy: row.createdById,
    createdAt: row.createdAt.toISOString(),
  };
}

export const ledgerRoutes: FastifyPluginAsync = async (app) => {
  app.get('/ledger', { preHandler: requireAuth() }, async (req, reply) => {
    const q = req.query as { period?: string; txType?: string; from?: string; to?: string };
    const where: Record<string, unknown> = {};
    if (q.period) where.period = q.period;
    if (q.txType) {
      const txType = LedgerTxTypeSchema.safeParse(q.txType);
      if (!txType.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'txType 형식 오류' });
        return;
      }
      where.txType = txType.data;
    }
    const txDate: Record<string, Date> = {};
    if (q.from) txDate.gte = parseDateOnly(q.from);
    if (q.to) txDate.lte = parseDateOnly(q.to);
    if (Object.keys(txDate).length) where.txDate = txDate;

    const rows = await prisma.equipmentLedger.findMany({
      where,
      include: { equipmentItem: { select: { name: true, legacyId: true } } },
      orderBy: { txDate: 'desc' },
      take: 500,
    });
    return { ok: true, data: rows.map(serializeLedger) };
  });

  app.post('/ledger/recompute-snapshot', { preHandler: requireRole('admin') }, async (req, reply) => {
    const parsed = RecomputeSnapshotInput.safeParse(req.body);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'period 형식 오류' });
      return;
    }
    const result = await recomputeSnapshot(parsed.data.period);
    return { ok: true, data: result };
  });

  app.get<{ Params: { id: string } }>(
    '/equipments/:id/ledger',
    { preHandler: requireAuth() },
    async (req) => {
      const rows = await prisma.equipmentLedger.findMany({
        where: { equipmentItemId: req.params.id },
        include: { equipmentItem: { select: { name: true, legacyId: true } } },
        orderBy: { txDate: 'desc' },
      });
      return { ok: true, data: rows.map(serializeLedger) };
    },
  );

  app.post<{ Params: { id: string } }>(
    '/equipments/:id/ledger',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const parsed = EquipmentLedgerInput.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
        return;
      }
      const data = parsed.data;
      const exists = await prisma.equipmentItem.findUnique({ where: { id: req.params.id } });
      if (!exists) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '비품 없음' });
        return;
      }
      const ledger = await prisma.equipmentLedger.create({
        data: {
          equipmentItemId: req.params.id,
          legacyAssetNo: data.legacyAssetNo ?? null,
          txType: data.txType as LedgerTxType,
          txDate: parseDateOnly(data.txDate),
          fromLocation: (data.fromLocation ?? null) as LocationType | null,
          toLocation: (data.toLocation ?? null) as LocationType | null,
          storeId: data.storeId ?? null,
          amount: data.amount,
          quantity: data.quantity,
          reason: data.reason ?? null,
          documentUrl: data.documentUrl ?? null,
          period: data.period,
          createdById: req.user!.id,
        },
      });
      const snapshot = await recomputeSnapshot(data.period);
      return { ok: true, data: { ledger: serializeLedger(ledger), snapshot } };
    },
  );
};
