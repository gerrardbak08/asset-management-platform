// 마이그레이션 검증 — docs/spec.md §8.1 의 8개 기준값을 SQL 로 확인. 실패 시 exit 1
// 실행 — pnpm --filter api etl:verify
import { prisma } from '@/lib/prisma';

const EXPECTED = {
  total26_03: 1191529992612n,
  total26_02: 1187005713251n,
  fireExtinguisherInventory: 765902874n, // 23,760 + 719,769,380 + 46,109,734
  buildingsCount: 15,
  equipmentsCount: 41,
  storesCount: 2015,
  momTotalRatio: 0.003811505968752917,
  momTangibleRatio: 0.003510390500781177,
};

let failures = 0;
function check(label: string, actual: unknown, expected: unknown, tolerance = 0): void {
  const ok =
    typeof actual === 'number' && typeof expected === 'number' && tolerance > 0
      ? Math.abs((actual as number) - (expected as number)) < tolerance
      : actual === expected;
  if (ok) {
    console.log(`  PASS  ${label}: ${formatVal(actual)}`);
  } else {
    failures++;
    console.error(
      `  FAIL  ${label}: expected ${formatVal(expected)}, got ${formatVal(actual)}`,
    );
  }
}
function formatVal(v: unknown): string {
  if (typeof v === 'bigint') return v.toLocaleString('ko-KR');
  if (typeof v === 'number') return v.toLocaleString('ko-KR');
  return String(v);
}

async function main() {
  console.log('▶ 검증 시작\n');

  // 1) 자산 합계 26-03
  const cur = await prisma.monthlySnapshot.findUnique({ where: { period: '2026-03' } });
  check('자산 합계 26-03', cur?.totalAsset, EXPECTED.total26_03);

  // 2) 자산 합계 26-02
  const prev = await prisma.monthlySnapshot.findUnique({ where: { period: '2026-02' } });
  check('자산 합계 26-02', prev?.totalAsset, EXPECTED.total26_02);

  // 3) 소화기 재고 합계 (26-03)
  const fire = await prisma.equipmentItem.findUnique({
    where: { legacyId: 'eq_001' },
    include: { snapshots: { where: { period: '2026-03' } } },
  });
  const fireTotal =
    fire?.snapshots.reduce((acc: bigint, s: any) => acc + s.inventoryAmount, 0n) ?? 0n;
  check('소화기 재고 합계 26-03', fireTotal, EXPECTED.fireExtinguisherInventory);

  // 4) 건물 카운트
  const bdCount = await prisma.building.count();
  check('건물 카운트', bdCount, EXPECTED.buildingsCount);

  // 5) 비품 카운트
  const eqCount = await prisma.equipmentItem.count();
  check('비품 카운트', eqCount, EXPECTED.equipmentsCount);

  // 6) 사업장 카운트
  const stCount = await prisma.store.count({ where: { period: '2026-03' } });
  check('사업장 카운트 (2026-03)', stCount, EXPECTED.storesCount);

  // 7) MoM total ratio 검증 — rawJson 에서 추출
  if (cur?.rawJson) {
    try {
      const m0 = JSON.parse(cur.rawJson) as { mom: { total: { ratio: number }; tangible: { ratio: number } } };
      check('MoM total ratio', m0.mom.total.ratio, EXPECTED.momTotalRatio, 1e-9);
      check('MoM tangible ratio', m0.mom.tangible.ratio, EXPECTED.momTangibleRatio, 1e-9);
    } catch (err) {
      failures++;
      console.error(`  FAIL  MoM ratio JSON 파싱 실패: ${(err as Error).message}`);
    }
  } else {
    failures++;
    console.error('  FAIL  monthlySnapshot.rawJson 누락');
  }

  // 사업장 검색 동등성 — V16 와 같은 결과
  const storesDamsa = await prisma.store.count({
    where: { period: '2026-03', name: { contains: '구로' } },
  });
  console.log(`\n  INFO  '구로' 사업장 검색: ${storesDamsa} 건`);
  const storesNamsa = await prisma.store.count({
    where: { period: '2026-03', name: { contains: '남사' } },
  });
  console.log(`  INFO  '남사' 사업장 검색: ${storesNamsa} 건`);

  console.log(`\n${failures === 0 ? '✅ 모든 검증 통과' : `❌ ${failures} 건 실패`}`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('검증 스크립트 실패:', err);
  await prisma.$disconnect();
  process.exit(1);
});
