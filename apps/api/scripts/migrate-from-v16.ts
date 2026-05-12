// V16 추출 데이터를 SQLite DB 로 적재 — buildings/equipment_items/equipment_snapshots/stores/monthly_snapshots
// 실행 — pnpm --filter api etl:migrate  (extract-v16 가 먼저 실행되어 있어야 함)
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { recomputeDepEntries } from '@/lib/depreciation';

type V16Building = [
  string, string, string, number, number, string,
  string, string, number, number, number, number, string,
];
type V16Equipment = [string, [number, number, number], [number, number, number], [number, number, number], [number, number, number]];

type Extracted = {
  meta: { extractedAt: string; v16Path: string };
  buildingsRaw: V16Building[];
  coords: number[][];
  equipmentsRaw: V16Equipment[];
  photos: Record<string, string>;
  details: Record<string, string>;
  m0Data: {
    meta: { current_period: string; previous_period: string };
    current: { asset_kpi: { total: number; tangible: { value: number; ratio: number }; intangible: { value: number; ratio: number }; supplies: { value: number; ratio: number } } };
    previous: { asset_kpi: { total: number; tangible: { value: number; ratio: number }; intangible: { value: number; ratio: number }; supplies: { value: number; ratio: number } } };
    mom: unknown;
  };
  stores: Array<{
    name: string;
    site_type?: string;
    asset_value?: number;
    asset_count?: number;
    supply_value?: number;
    asset_by_type?: Record<string, number>;
    supply_by_category?: Record<string, number>;
    supply_by_category_count?: Record<string, number>;
  }>;
};

function periodFromV16(s: string): string {
  // '26-03' → '2026-03'
  if (/^\d{2}-\d{2}$/.test(s)) return `20${s}`;
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  return s;
}

function fixVacancy(rate: number, vacRaw: number): number {
  if (rate + vacRaw === 0) return 100 - rate;
  if (rate + vacRaw !== 100 && rate > 0) return Math.max(0, 100 - rate);
  return vacRaw;
}

function findPhoto(name: string, photos: Record<string, string>): string | null {
  // name 에 photo key 가 부분 포함되는지 (V16 의 partial match)
  for (const [k, v] of Object.entries(photos)) {
    if (name.includes(k)) return v;
  }
  return null;
}

function addMonths(value: Date, months: number): Date {
  const next = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

async function main() {
  const dataPath = path.resolve(process.cwd(), 'data', 'v16-extracted.json');
  const json = JSON.parse(await fs.promises.readFile(dataPath, 'utf-8')) as Extracted;
  console.log(`로드: ${dataPath}`);
  console.log(`  추출 시각: ${json.meta.extractedAt}`);

  const period = periodFromV16(json.m0Data.meta.current_period);
  const prevPeriod = periodFromV16(json.m0Data.meta.previous_period);
  console.log(`  기준월: ${period} (전월 ${prevPeriod})`);

  // ── 1. Buildings (15동)
  console.log('\n[1] Buildings 적재…');
  for (let i = 0; i < json.buildingsRaw.length; i++) {
    const r = json.buildingsRaw[i] as V16Building;
    const legacyId = `bd_${String(i + 1).padStart(3, '0')}`;
    const rate = +r[10] || 0;
    const vacRaw = +r[11] || 0;
    const vacancy = fixVacancy(rate, vacRaw);
    const coord = json.coords[i] ?? [37.5665, 126.978];
    const photoFile = findPhoto(r[0], json.photos);
    const detailFile = findPhoto(r[0], json.details);
    // 실제 디스크 파일명은 b{NNN}.jpg / b{NNN}_detail.jpg 형식
    const diskPhotoFile = `b${String(i + 1).padStart(3, '0')}.jpg`;
    const diskDetailFile = `b${String(i + 1).padStart(3, '0')}_detail.jpg`;

    const acquisitionDate = new Date(r[7]);
    const acquisitionPrice = BigInt(Math.round(+r[8] || 0));
    const building = await prisma.building.upsert({
      where: { legacyId },
      create: {
        legacyId,
        name: r[0],
        address: r[1],
        use: r[2],
        areaSqm: +r[3] || 0,
        areaPyeong: +r[4] || 0,
        floors: r[5],
        approvalDate: r[6] && r[6] !== '-' ? new Date(r[6]) : null,
        acquisitionDate,
        acquisitionPrice,
        rentalArea: +r[9] || 0,
        rentalRate: rate,
        vacancy,
        tenant: r[12] || '-',
        lat: coord[0],
        lng: coord[1],
        photoUrl: photoFile ? `/files/buildings/${diskPhotoFile}` : null,
        detailPhotoUrl: detailFile ? `/files/buildings/${diskDetailFile}` : null,
      },
      update: {
        name: r[0],
        address: r[1],
        use: r[2],
        areaSqm: +r[3] || 0,
        areaPyeong: +r[4] || 0,
        floors: r[5],
        approvalDate: r[6] && r[6] !== '-' ? new Date(r[6]) : null,
        acquisitionDate,
        acquisitionPrice,
        rentalArea: +r[9] || 0,
        rentalRate: rate,
        vacancy,
        tenant: r[12] || '-',
        lat: coord[0],
        lng: coord[1],
        photoUrl: photoFile ? `/files/buildings/${diskPhotoFile}` : null,
        detailPhotoUrl: detailFile ? `/files/buildings/${diskDetailFile}` : null,
      },
    });

    const hasLeaseSnapshot = (r[12] && r[12] !== '-') || (+r[9] || 0) > 0 || rate > 0;
    if (hasLeaseSnapshot) {
      const existingLease = await prisma.leaseContract.findFirst({
        where: { buildingId: building.id, status: 'active' },
      });
      if (!existingLease) {
        const periodStart = new Date(`${period}-01T00:00:00.000Z`);
        await prisma.leaseContract.create({
          data: {
            buildingId: building.id,
            tenantName: r[12] || '-',
            contractStart: periodStart,
            contractEnd: addMonths(periodStart, 12),
            rentArea: +r[9] || 0,
            monthlyRent: 0n,
            deposit: 0n,
            status: 'active',
            notes: 'V16 임대 스냅샷에서 생성. 월 임대료/보증금/계약 종료일은 수동 보정 필요.',
          },
        });
      }
    }

    const existingDep = await prisma.depreciationSchedule.findFirst({
      where: { assetType: 'building', buildingId: building.id },
    });
    if (!existingDep && acquisitionPrice > 0n) {
      const schedule = await prisma.depreciationSchedule.create({
        data: {
          assetType: 'building',
          buildingId: building.id,
          acquisitionDate,
          acquisitionPrice,
          usefulLifeYears: 30,
          method: 'straight_line',
          notes: 'V16 건물 취득가 기준 자동 생성.',
        },
      });
      await recomputeDepEntries(schedule.id);
    }
  }
  console.log(`  ${json.buildingsRaw.length} 건물 upsert 완료`);

  // ── 2. EquipmentItems (41종) + EquipmentSnapshots (123행)
  console.log('\n[2] EquipmentItems + Snapshots 적재…');
  for (let i = 0; i < json.equipmentsRaw.length; i++) {
    const r = json.equipmentsRaw[i] as unknown as [
      string,
      [number, number, number],
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ];
    const legacyId = `eq_${String(i + 1).padStart(3, '0')}`;
    const item = await prisma.equipmentItem.upsert({
      where: { legacyId },
      create: { legacyId, name: r[0] },
      update: { name: r[0] },
    });

    const locations = ['hq', 'store', 'logistics'] as const;
    let inventoryTotal = 0n;
    for (let li = 0; li < locations.length; li++) {
      const lt = locations[li];
      inventoryTotal += BigInt(Math.round(r[4][li] || 0));
      await prisma.equipmentSnapshot.upsert({
        where: {
          equipmentId_period_locationType: {
            equipmentId: item.id,
            period,
            locationType: lt,
          },
        },
        create: {
          equipmentId: item.id,
          period,
          locationType: lt,
          purchaseAmount: BigInt(Math.round(r[1][li] || 0)),
          transferAmount: BigInt(Math.round(r[2][li] || 0)),
          disposalAmount: BigInt(Math.round(r[3][li] || 0)),
          inventoryAmount: BigInt(Math.round(r[4][li] || 0)),
        },
        update: {
          purchaseAmount: BigInt(Math.round(r[1][li] || 0)),
          transferAmount: BigInt(Math.round(r[2][li] || 0)),
          disposalAmount: BigInt(Math.round(r[3][li] || 0)),
          inventoryAmount: BigInt(Math.round(r[4][li] || 0)),
        },
      });
    }

    const existingDep = await prisma.depreciationSchedule.findFirst({
      where: { assetType: 'equipment', equipmentItemId: item.id },
    });
    if (!existingDep && inventoryTotal > 0n) {
      const schedule = await prisma.depreciationSchedule.create({
        data: {
          assetType: 'equipment',
          equipmentItemId: item.id,
          acquisitionDate: new Date(`${period}-01T00:00:00.000Z`),
          acquisitionPrice: inventoryTotal,
          usefulLifeYears: 5,
          method: 'straight_line',
          notes: 'V16 비품 재고 스냅샷 기준 자동 생성.',
        },
      });
      await recomputeDepEntries(schedule.id);
    }
  }
  console.log(`  ${json.equipmentsRaw.length} 비품 × 3 위치 upsert`);

  // ── 3. Stores (2,015건)
  console.log('\n[3] Stores 적재…');
  let storeCount = 0;
  // 2,015 건이라 트랜잭션으로 빠르게
  // 2,015 건이라 트랜잭션으로 빠르게 (하려 했으나 원격 DB 타임아웃 문제로 개별 upsert 진행)
  for (const s of json.stores) {
    await prisma.store.upsert({
      where: { name_period: { name: s.name, period } },
      create: {
        name: s.name,
        siteType: s.site_type ?? null,
        period,
        assetValue: BigInt(Math.round(s.asset_value ?? 0)),
        assetCount: Math.round(s.asset_count ?? 0),
        supplyValue: BigInt(Math.round(s.supply_value ?? 0)),
        assetByTypeJson: JSON.stringify(s.asset_by_type ?? {}),
        supplyByCategoryJson: JSON.stringify(s.supply_by_category ?? {}),
        supplyByCategoryCountJson: JSON.stringify(s.supply_by_category_count ?? {}),
      },
      update: {
        siteType: s.site_type ?? null,
        assetValue: BigInt(Math.round(s.asset_value ?? 0)),
        assetCount: Math.round(s.asset_count ?? 0),
        supplyValue: BigInt(Math.round(s.supply_value ?? 0)),
        assetByTypeJson: JSON.stringify(s.asset_by_type ?? {}),
        supplyByCategoryJson: JSON.stringify(s.supply_by_category ?? {}),
        supplyByCategoryCountJson: JSON.stringify(s.supply_by_category_count ?? {}),
      },
    });
    storeCount++;
    if (storeCount % 200 === 0) {
      console.log(`  …${storeCount} / ${json.stores.length}`);
    }
  }
  console.log(`  ${storeCount} 사업장 upsert 완료`);

  // ── 4. MonthlySnapshot (current period 1행)
  console.log('\n[4] MonthlySnapshot 적재…');
  const cur = json.m0Data.current;
  const total = Math.round(cur.asset_kpi.total || 0);
  const tangible = Math.round(cur.asset_kpi.tangible.value || 0);
  const intangible = Math.round(cur.asset_kpi.intangible.value || 0);
  const equipmentVal = Math.round(cur.asset_kpi.supplies.value || 0);
  // 위치별 합계 — m0Data 의 location 필드 또는 asset_matrix '합계' 행
  const matrix = (cur as unknown as { asset_matrix?: Array<{ category: string; subcategory: string; hq: number; store: number; logistics: number }> }).asset_matrix ?? [];
  const totalRow = matrix.find((m) => m.category === '합계' || m.subcategory === '합계');
  const hq = Math.round(totalRow?.hq ?? 0);
  const store = Math.round(totalRow?.store ?? 0);
  const logistics = Math.round(totalRow?.logistics ?? 0);

  await prisma.monthlySnapshot.upsert({
    where: { period },
    create: {
      period,
      totalAsset: BigInt(total),
      tangible: BigInt(tangible),
      intangible: BigInt(intangible),
      equipment: BigInt(equipmentVal),
      hq: BigInt(hq),
      store: BigInt(store),
      logistics: BigInt(logistics),
      kpiJson: JSON.stringify(cur.asset_kpi),
      rawJson: JSON.stringify(json.m0Data),
    },
    update: {
      totalAsset: BigInt(total),
      tangible: BigInt(tangible),
      intangible: BigInt(intangible),
      equipment: BigInt(equipmentVal),
      hq: BigInt(hq),
      store: BigInt(store),
      logistics: BigInt(logistics),
      kpiJson: JSON.stringify(cur.asset_kpi),
      rawJson: JSON.stringify(json.m0Data),
    },
  });

  // 전월 (검증용)
  const prev = json.m0Data.previous;
  const prevTotal = Math.round(prev.asset_kpi.total || 0);
  const prevTangible = Math.round(prev.asset_kpi.tangible.value || 0);
  const prevIntangible = Math.round(prev.asset_kpi.intangible.value || 0);
  const prevSupplies = Math.round(prev.asset_kpi.supplies.value || 0);
  const prevMatrix = (prev as unknown as { asset_matrix?: Array<{ category: string; subcategory: string; hq: number; store: number; logistics: number }> }).asset_matrix ?? [];
  const prevTotalRow = prevMatrix.find((m) => m.category === '합계' || m.subcategory === '합계');

  await prisma.monthlySnapshot.upsert({
    where: { period: prevPeriod },
    create: {
      period: prevPeriod,
      totalAsset: BigInt(prevTotal),
      tangible: BigInt(prevTangible),
      intangible: BigInt(prevIntangible),
      equipment: BigInt(prevSupplies),
      hq: BigInt(Math.round(prevTotalRow?.hq ?? 0)),
      store: BigInt(Math.round(prevTotalRow?.store ?? 0)),
      logistics: BigInt(Math.round(prevTotalRow?.logistics ?? 0)),
      kpiJson: JSON.stringify(prev.asset_kpi),
      rawJson: JSON.stringify(json.m0Data),
    },
    update: {},
  });
  console.log(`  monthly_snapshots 2건 (${period}, ${prevPeriod}) upsert`);

  console.log('\n마이그레이션 완료. `pnpm --filter api etl:verify` 로 검증 권장.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('마이그레이션 실패:', err);
  await prisma.$disconnect();
  process.exit(1);
});
