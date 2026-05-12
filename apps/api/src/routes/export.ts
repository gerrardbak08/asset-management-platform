// 데이터 export — V16 exportJSON 동등 + buildings.csv / equipments.csv
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = headers.map(csvEscape).join(',');
  const body = rows.map((r: any) => r.map((c: any) => csvEscape(c)).join(',')).join('\n');
  return '﻿' + head + '\n' + body + '\n';
}

export const exportRoutes: FastifyPluginAsync = async (app) => {
  // ── JSON 통째 export (V16 exportJSON 동등)
  app.get('/export/snapshot.json', { preHandler: requireAuth() }, async (_req, reply) => {
    const [buildings, equipments, snapshots, monthly] = await Promise.all([
      prisma.building.findMany({ orderBy: { legacyId: 'asc' } }),
      prisma.equipmentItem.findMany({ orderBy: { legacyId: 'asc' } }),
      prisma.equipmentSnapshot.findMany({
        include: { equipment: true },
        orderBy: [{ period: 'desc' }, { equipment: { legacyId: 'asc' } }],
      }),
      prisma.monthlySnapshot.findMany({ orderBy: { period: 'desc' } }),
    ]);

    const payload = {
      version: '0.1.0',
      exportedAt: new Date().toISOString(),
      buildings: buildings.map((b: any) => ({
        ...b,
        acquisitionPrice: b.acquisitionPrice.toString(),
        acquisitionDate: b.acquisitionDate.toISOString().slice(0, 10),
        approvalDate: b.approvalDate ? b.approvalDate.toISOString().slice(0, 10) : null,
      })),
      equipments,
      snapshots: snapshots.map((s: any) => ({
        ...s,
        equipmentLegacyId: s.equipment.legacyId,
        equipmentName: s.equipment.name,
        purchaseAmount: s.purchaseAmount.toString(),
        transferAmount: s.transferAmount.toString(),
        disposalAmount: s.disposalAmount.toString(),
        inventoryAmount: s.inventoryAmount.toString(),
      })),
      monthlySnapshots: monthly.map((m: any) => ({
        ...m,
        totalAsset: m.totalAsset.toString(),
        tangible: m.tangible.toString(),
        intangible: m.intangible.toString(),
        equipment: m.equipment.toString(),
        hq: m.hq.toString(),
        store: m.store.toString(),
        logistics: m.logistics.toString(),
      })),
    };

    const filename = `dashboard_${new Date().toISOString().slice(0, 10)}.json`;
    reply
      .type('application/json; charset=utf-8')
      .header('content-disposition', `attachment; filename="${filename}"`)
      .send(JSON.stringify(payload, null, 2));
  });

  // ── 건물 CSV
  app.get('/export/buildings.csv', { preHandler: requireAuth() }, async (_req, reply) => {
    const items = await prisma.building.findMany({ orderBy: { legacyId: 'asc' } });
    const csv = rowsToCsv(
      ['건물명', '주소', '용도', '연면적(㎡)', '평', '층수', '사용승인일', '취득일', '취득가액', '임대면적', '임대율', '공실률', '임차인'],
      items.map((b: any) => [
        b.name,
        b.address,
        b.use,
        b.areaSqm,
        b.areaPyeong,
        b.floors,
        b.approvalDate ? b.approvalDate.toISOString().slice(0, 10) : '',
        b.acquisitionDate.toISOString().slice(0, 10),
        b.acquisitionPrice.toString(),
        b.rentalArea,
        b.rentalRate,
        b.vacancy,
        b.tenant,
      ]),
    );
    reply
      .type('text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="buildings_${new Date().toISOString().slice(0, 10)}.csv"`)
      .send(csv);
  });

  // ── 비품 CSV (현재 가장 최근 period 의 snapshot 합산)
  app.get<{ Querystring: { period?: string } }>(
    '/export/equipments.csv',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const period = req.query.period ?? '2026-03';
      const equipments = await prisma.equipmentItem.findMany({
        orderBy: { legacyId: 'asc' },
        include: { snapshots: { where: { period } } },
      });
      const csv = rowsToCsv(
        [
          '품목명',
          '구매(본사)', '구매(매장)', '구매(물류)',
          '이동(본사)', '이동(매장)', '이동(물류)',
          '폐기(본사)', '폐기(매장)', '폐기(물류)',
          '재고(본사)', '재고(매장)', '재고(물류)',
        ],
        equipments.map((e: any) => {
          const byLoc = (loc: 'hq' | 'store' | 'logistics') => e.snapshots.find((s: any) => s.locationType === loc);
          const hq = byLoc('hq');
          const st = byLoc('store');
          const lg = byLoc('logistics');
          return [
            e.name,
            hq?.purchaseAmount.toString() ?? '0',
            st?.purchaseAmount.toString() ?? '0',
            lg?.purchaseAmount.toString() ?? '0',
            hq?.transferAmount.toString() ?? '0',
            st?.transferAmount.toString() ?? '0',
            lg?.transferAmount.toString() ?? '0',
            hq?.disposalAmount.toString() ?? '0',
            st?.disposalAmount.toString() ?? '0',
            lg?.disposalAmount.toString() ?? '0',
            hq?.inventoryAmount.toString() ?? '0',
            st?.inventoryAmount.toString() ?? '0',
            lg?.inventoryAmount.toString() ?? '0',
          ];
        }),
      );
      reply
        .type('text/csv; charset=utf-8')
        .header(
          'content-disposition',
          `attachment; filename="equipments_${period}.csv"`,
        )
        .send(csv);
    },
  );
};
