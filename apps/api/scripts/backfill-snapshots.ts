import { prisma } from '../src/lib/prisma';

async function main() {
  const baseSnapshot = await prisma.monthlySnapshot.findUnique({
    where: { period: '2026-02' }
  });

  if (!baseSnapshot) {
    console.error('2026-02 데이터가 없습니다. 먼저 migration을 실행하세요.');
    process.exit(1);
  }

  // 역추정: 매월 0.5% 씩 자산 감소 (과거로 갈수록 작아지게, 즉 현재로 올수록 성장)
  // 2025-02 ~ 2026-01 (12개월)
  const months = [
    '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07',
    '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'
  ];

  let currentTotal = Number(baseSnapshot.totalAsset);
  let currentTangible = Number(baseSnapshot.tangible);
  let currentIntangible = Number(baseSnapshot.intangible);
  let currentEquipment = Number(baseSnapshot.equipment);
  let currentHq = Number(baseSnapshot.hq);
  let currentStore = Number(baseSnapshot.store);
  let currentLogistics = Number(baseSnapshot.logistics);

  // 과거로 가면서 약 0.3%~0.8% 씩 감소시킴
  for (let i = months.length - 1; i >= 0; i--) {
    const period = months[i];
    
    // 감소율 (0.992 ~ 0.997)
    const rate = 0.995; 
    
    currentTotal = Math.round(currentTotal * rate);
    currentTangible = Math.round(currentTangible * rate);
    currentIntangible = Math.round(currentIntangible * rate);
    currentEquipment = Math.round(currentEquipment * rate);
    currentHq = Math.round(currentHq * rate);
    currentStore = Math.round(currentStore * rate);
    currentLogistics = Math.round(currentLogistics * rate);

    const kpiJson = JSON.stringify({
      total: currentTotal,
      tangible: { value: currentTangible, ratio: 0.93 },
      intangible: { value: currentIntangible, ratio: 0.02 },
      supplies: { value: currentEquipment, ratio: 0.05 }
    });

    await prisma.monthlySnapshot.upsert({
      where: { period },
      create: {
        period,
        totalAsset: BigInt(currentTotal),
        tangible: BigInt(currentTangible),
        intangible: BigInt(currentIntangible),
        equipment: BigInt(currentEquipment),
        hq: BigInt(currentHq),
        store: BigInt(currentStore),
        logistics: BigInt(currentLogistics),
        kpiJson,
        rawJson: "{}"
      },
      update: {} // 이미 있으면 건너뜀
    });
    
    console.log(`[역추정 완료] ${period} 데이터 적재 (Total: ${currentTotal})`);
  }

  console.log('역추정 데이터 생성 완료');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
