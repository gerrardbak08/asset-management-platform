// 업로드 라우트 — POST /api/upload/xlsb (movers/mom 자동 계산) + CSV 5종 업로드 + 양식 다운로드
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { parseMonthlyXlsb } from '@/lib/xlsb/parse';
import { parseCsv, validateHeaders, num, str, type CsvType } from '@/lib/csv/parse';
import {
  calculateLocationMom,
  calculateMom,
  calculateMovers,
  calculateSuppliesKpiMom,
  previousPeriod,
} from '@/lib/mom';
import type { M0AssetMatrixRow, M0Data } from '@aims/shared';

const TEMPLATES: Record<string, string> = {
  asset: '품목명,구매(본사),구매(매장),구매(물류),이동(본사),이동(매장),이동(물류),폐기(본사),폐기(매장),폐기(물류),재고(본사),재고(매장),재고(물류)\n',
  ledger_asset: '사업장,장부가,자산유형\n',
  ledger_eq: '사업장,카테고리,금액,수량\n',
  eq_ops: '품목명,재고,구매,이동,폐기\n',
  buildings: '건물명,주소,용도,연면적(㎡),평,층수,사용승인일,취득일,취득가액,임대면적,임대율,공실률,임차인\n',
};

function locationFromMatrix(matrix: M0AssetMatrixRow[]): { hq: number; store: number; logistics: number } {
  const totalRow = matrix.find((m) => m.category === '합계' || m.subcategory === '합계');
  return {
    hq: totalRow?.hq ?? 0,
    store: totalRow?.store ?? 0,
    logistics: totalRow?.logistics ?? 0,
  };
}

const VALID_CSV_TYPES: CsvType[] = ['asset', 'ledger_asset', 'ledger_eq', 'eq_ops', 'buildings'];

async function applyBuildingsCsv(rows: Record<string, unknown>[]): Promise<number> {
  let count = 0;
  for (const r of rows) {
    const name = str(r['건물명']);
    if (!name) continue;
    const existing = await prisma.building.findFirst({ where: { name } });
    if (!existing) continue;
    const data: Record<string, unknown> = {};
    if (r['주소'] != null) data.address = str(r['주소']);
    if (r['용도'] != null) data.use = str(r['용도']);
    if (r['연면적(㎡)'] != null) data.areaSqm = num(r['연면적(㎡)']);
    if (r['평'] != null) data.areaPyeong = num(r['평']);
    if (r['층수'] != null) data.floors = str(r['층수']);
    if (r['사용승인일'] != null && str(r['사용승인일']) && str(r['사용승인일']) !== '-') {
      data.approvalDate = new Date(str(r['사용승인일']));
    }
    if (r['취득일'] != null) data.acquisitionDate = new Date(str(r['취득일']));
    if (r['취득가액'] != null) data.acquisitionPrice = BigInt(Math.round(num(r['취득가액'])));
    if (r['임대면적'] != null) data.rentalArea = num(r['임대면적']);
    if (r['임대율'] != null) data.rentalRate = num(r['임대율']);
    if (r['공실률'] != null) data.vacancy = num(r['공실률']);
    if (r['임차인'] != null) data.tenant = str(r['임차인'], '-');
    await prisma.building.update({ where: { id: existing.id }, data });
    count++;
  }
  return count;
}

async function applyEquipmentSnapshotsCsv(
  rows: Record<string, unknown>[],
  period: string,
): Promise<number> {
  let count = 0;
  for (const r of rows) {
    const name = str(r['품목명']);
    if (!name) continue;
    const item = await prisma.equipmentItem.findFirst({ where: { name } });
    if (!item) continue;
    const has3Locs =
      r['구매(본사)'] != null || r['재고(본사)'] != null || r['이동(본사)'] != null;
    const locs: Array<{ loc: 'hq' | 'store' | 'logistics'; suffix: string }> = has3Locs
      ? [
          { loc: 'hq', suffix: '(본사)' },
          { loc: 'store', suffix: '(매장)' },
          { loc: 'logistics', suffix: '(물류)' },
        ]
      : [{ loc: 'hq', suffix: '' }];
    for (const { loc, suffix } of locs) {
      const purchase = num(r[`구매${suffix}`]);
      const transfer = num(r[`이동${suffix}`]);
      const disposal = num(r[`폐기${suffix}`]);
      const inventory = num(r[`재고${suffix}`]);
      await prisma.equipmentSnapshot.upsert({
        where: {
          equipmentId_period_locationType: {
            equipmentId: item.id,
            period,
            locationType: loc,
          },
        },
        create: {
          equipmentId: item.id,
          period,
          locationType: loc,
          purchaseAmount: BigInt(Math.round(purchase)),
          transferAmount: BigInt(Math.round(transfer)),
          disposalAmount: BigInt(Math.round(disposal)),
          inventoryAmount: BigInt(Math.round(inventory)),
        },
        update: {
          purchaseAmount: BigInt(Math.round(purchase)),
          transferAmount: BigInt(Math.round(transfer)),
          disposalAmount: BigInt(Math.round(disposal)),
          inventoryAmount: BigInt(Math.round(inventory)),
        },
      });
    }
    count++;
  }
  return count;
}

async function applyStoresLedgerCsv(rows: Record<string, unknown>[], period: string): Promise<number> {
  const sums = new Map<string, number>();
  for (const r of rows) {
    const name = str(r['사업장']);
    if (!name) continue;
    sums.set(name, (sums.get(name) ?? 0) + num(r['장부가']));
  }
  let count = 0;
  await prisma.$transaction(
    Array.from(sums.entries()).map(([name, value]) => {
      count++;
      return prisma.store.upsert({
        where: { name_period: { name, period } },
        create: {
          name,
          period,
          assetValue: BigInt(Math.round(value)),
          assetCount: 0,
          supplyValue: 0n,
          assetByTypeJson: '{}',
          supplyByCategoryJson: '{}',
          supplyByCategoryCountJson: '{}',
        },
        update: { assetValue: BigInt(Math.round(value)) },
      });
    }),
  );
  return count;
}

async function applyStoresSupplyCsv(rows: Record<string, unknown>[], period: string): Promise<number> {
  const map = new Map<string, Map<string, { amount: number; count: number }>>();
  for (const r of rows) {
    const name = str(r['사업장']);
    const cat = str(r['카테고리']);
    if (!name || !cat) continue;
    const amt = num(r['금액']);
    const cnt = num(r['수량']);
    let bucket = map.get(name);
    if (!bucket) {
      bucket = new Map();
      map.set(name, bucket);
    }
    const prev = bucket.get(cat) ?? { amount: 0, count: 0 };
    bucket.set(cat, { amount: prev.amount + amt, count: prev.count + cnt });
  }
  let count = 0;
  await prisma.$transaction(
    Array.from(map.entries()).map(([name, byCat]) => {
      count++;
      const byCategory: Record<string, number> = {};
      const byCategoryCount: Record<string, number> = {};
      let supplyValue = 0;
      for (const [cat, v] of byCat) {
        byCategory[cat] = v.amount;
        byCategoryCount[cat] = v.count;
        supplyValue += v.amount;
      }
      return prisma.store.upsert({
        where: { name_period: { name, period } },
        create: {
          name,
          period,
          assetValue: 0n,
          assetCount: 0,
          supplyValue: BigInt(Math.round(supplyValue)),
          assetByTypeJson: '{}',
          supplyByCategoryJson: JSON.stringify(byCategory),
          supplyByCategoryCountJson: JSON.stringify(byCategoryCount),
        },
        update: {
          supplyValue: BigInt(Math.round(supplyValue)),
          supplyByCategoryJson: JSON.stringify(byCategory),
          supplyByCategoryCountJson: JSON.stringify(byCategoryCount),
        },
      });
    }),
  );
  return count;
}

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /api/upload/xlsb (editor+) — V16 handleMonthlyXlsbUpload 동등
  app.post('/upload/xlsb', { preHandler: requireRole('editor', 'admin') }, async (req, reply) => {
    const file = await req.file();
    if (!file) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'xlsb 파일 없음' });
      return;
    }
    if (!/\.(xlsb|xlsx|xls)$/i.test(file.filename)) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'xlsb/xlsx 파일만 허용' });
      return;
    }

    const buf = await file.toBuffer();
    let parsed: ReturnType<typeof parseMonthlyXlsb>;
    try {
      parsed = parseMonthlyXlsb(buf);
    } catch (err) {
      reply
        .code(422)
        .send({ ok: false, code: 'UPLOAD_PARSE', message: `xlsb 파싱 실패 — ${(err as Error).message}` });
      return;
    }

    const prevPeriod = previousPeriod(parsed.period);
    const prevSnap = await prisma.monthlySnapshot.findUnique({ where: { period: prevPeriod } });
    let prevM0: M0Data | null = null;
    if (prevSnap) {
      try {
        prevM0 = JSON.parse(prevSnap.rawJson) as M0Data;
      } catch {
        prevM0 = null;
      }
    }

    const currentKpi = {
      total: parsed.totalAsset,
      tangible: parsed.tangible,
      intangible: parsed.intangible,
      supplies: parsed.equipment,
    };
    const previousKpi = prevM0
      ? {
          total: prevM0.current.asset_kpi.total,
          tangible: prevM0.current.asset_kpi.tangible.value,
          intangible: prevM0.current.asset_kpi.intangible.value,
          supplies: prevM0.current.asset_kpi.supplies.value,
        }
      : { total: 0, tangible: 0, intangible: 0, supplies: 0 };

    const currentLoc = locationFromMatrix(parsed.assetMatrix);
    const previousLoc = prevM0
      ? locationFromMatrix(
          (prevM0.current as { asset_matrix?: M0AssetMatrixRow[] }).asset_matrix ?? [],
        )
      : { hq: 0, store: 0, logistics: 0 };

    const currentSuppliesKpi = parsed.suppliesKpi;
    const prevSuppliesKpi = prevM0?.current.supplies_kpi ?? {
      stock: 0,
      purchase: 0,
      transfer: 0,
      disposal: 0,
    };

    const movers = prevM0
      ? calculateMovers(
          parsed.assetMatrix,
          (prevM0.current as { asset_matrix?: M0AssetMatrixRow[] }).asset_matrix ?? [],
        )
      : { top_up: [], top_down: [] };

    const m0: M0Data = {
      meta: {
        current_period: parsed.period,
        previous_period: prevPeriod,
        currency: 'KRW',
        schema_version: '1.0',
      },
      current: {
        asset_kpi: {
          total: parsed.totalAsset,
          tangible: { value: parsed.tangible, ratio: 0 },
          intangible: { value: parsed.intangible, ratio: 0 },
          supplies: { value: parsed.equipment, ratio: 0 },
        },
        asset_matrix: parsed.assetMatrix,
        supplies_kpi: currentSuppliesKpi,
        location: currentLoc,
      },
      previous: prevM0?.current ?? {
        asset_kpi: {
          total: 0,
          tangible: { value: 0, ratio: 0 },
          intangible: { value: 0, ratio: 0 },
          supplies: { value: 0, ratio: 0 },
        },
        asset_matrix: [],
      },
      mom: {
        ...calculateMom(currentKpi, previousKpi),
        location: calculateLocationMom(currentLoc, previousLoc),
        supplies_kpi: calculateSuppliesKpiMom(currentSuppliesKpi, prevSuppliesKpi),
      },
      movers,
    };

    await prisma.monthlySnapshot.upsert({
      where: { period: parsed.period },
      create: {
        period: parsed.period,
        totalAsset: BigInt(Math.round(parsed.totalAsset)),
        tangible: BigInt(Math.round(parsed.tangible)),
        intangible: BigInt(Math.round(parsed.intangible)),
        equipment: BigInt(Math.round(parsed.equipment)),
        hq: BigInt(Math.round(currentLoc.hq)),
        store: BigInt(Math.round(currentLoc.store)),
        logistics: BigInt(Math.round(currentLoc.logistics)),
        kpiJson: JSON.stringify(m0.current.asset_kpi),
        rawJson: JSON.stringify(m0),
      },
      update: {
        totalAsset: BigInt(Math.round(parsed.totalAsset)),
        tangible: BigInt(Math.round(parsed.tangible)),
        intangible: BigInt(Math.round(parsed.intangible)),
        equipment: BigInt(Math.round(parsed.equipment)),
        hq: BigInt(Math.round(currentLoc.hq)),
        store: BigInt(Math.round(currentLoc.store)),
        logistics: BigInt(Math.round(currentLoc.logistics)),
        kpiJson: JSON.stringify(m0.current.asset_kpi),
        rawJson: JSON.stringify(m0),
      },
    });

    const storesUpdated = parsed.storesAssetSum.size;
    if (storesUpdated > 0) {
      await prisma.$transaction(
        Array.from(parsed.storesAssetSum.entries()).map(([name, value]) =>
          prisma.store.upsert({
            where: { name_period: { name, period: parsed.period } },
            create: {
              name,
              period: parsed.period,
              assetValue: BigInt(Math.round(value)),
              assetCount: 0,
              supplyValue: 0n,
              assetByTypeJson: '{}',
              supplyByCategoryJson: '{}',
              supplyByCategoryCountJson: '{}',
            },
            update: { assetValue: BigInt(Math.round(value)) },
          }),
        ),
      );
    }

    return {
      ok: true,
      data: {
        period: parsed.period,
        totalAsset: parsed.totalAsset,
        tangible: parsed.tangible,
        intangible: parsed.intangible,
        equipment: parsed.equipment,
        storesUpdated,
        matrixRows: parsed.assetMatrix.length,
        moversTopUp: movers.top_up.length,
        moversTopDown: movers.top_down.length,
        previousPeriodFound: !!prevM0,
      },
    };
  });

  // ── POST /api/upload/csv/:type (editor+)
  app.post<{ Params: { type: string }; Querystring: { period?: string } }>(
    '/upload/csv/:type',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      if (!VALID_CSV_TYPES.includes(req.params.type as CsvType)) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'type 형식 오류' });
        return;
      }
      const type = req.params.type as CsvType;
      const period = req.query.period ?? '2026-03';
      const file = await req.file();
      if (!file) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'CSV 파일 없음' });
        return;
      }
      if (!/\.csv$/i.test(file.filename)) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'CSV 파일만 허용' });
        return;
      }
      const buf = await file.toBuffer();
      let parsed: ReturnType<typeof parseCsv>;
      try {
        parsed = parseCsv(buf);
      } catch (err) {
        reply
          .code(422)
          .send({ ok: false, code: 'UPLOAD_PARSE', message: `CSV 파싱 실패 — ${(err as Error).message}` });
        return;
      }
      const headerErr = validateHeaders(type, parsed.headers);
      if (headerErr) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: headerErr });
        return;
      }
      let rowsApplied = 0;
      try {
        switch (type) {
          case 'buildings':
            rowsApplied = await applyBuildingsCsv(parsed.rows);
            break;
          case 'asset':
          case 'eq_ops':
            rowsApplied = await applyEquipmentSnapshotsCsv(parsed.rows, period);
            break;
          case 'ledger_asset':
            rowsApplied = await applyStoresLedgerCsv(parsed.rows, period);
            break;
          case 'ledger_eq':
            rowsApplied = await applyStoresSupplyCsv(parsed.rows, period);
            break;
        }
      } catch (err) {
        reply
          .code(422)
          .send({ ok: false, code: 'UPLOAD_PARSE', message: `적재 실패 — ${(err as Error).message}` });
        return;
      }
      return { ok: true, data: { type, period, rowsApplied, totalRows: parsed.rows.length } };
    },
  );

  // ── GET /api/upload/templates/:type (editor+)
  app.get<{ Params: { type: string } }>(
    '/upload/templates/:type',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const tmpl = TEMPLATES[req.params.type];
      if (!tmpl) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '양식 없음' });
        return;
      }
      reply
        .type('text/csv; charset=utf-8')
        .header('content-disposition', `attachment; filename="${req.params.type}.csv"`)
        .send('﻿' + tmpl);
    },
  );
};
