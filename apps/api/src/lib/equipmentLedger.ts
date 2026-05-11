import type { LocationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Totals = {
  purchaseAmount: bigint;
  transferAmount: bigint;
  disposalAmount: bigint;
  inventoryAmount: bigint;
};

function blankTotals(): Totals {
  return {
    purchaseAmount: 0n,
    transferAmount: 0n,
    disposalAmount: 0n,
    inventoryAmount: 0n,
  };
}

function getBucket(map: Map<string, Totals>, equipmentId: string, location: LocationType): Totals {
  const key = `${equipmentId}:${location}`;
  const existing = map.get(key);
  if (existing) return existing;
  const next = blankTotals();
  map.set(key, next);
  return next;
}

export async function recomputeSnapshot(period: string): Promise<{ rowsUpdated: number }> {
  const entries = await prisma.equipmentLedger.findMany({
    where: { period },
    orderBy: { txDate: 'asc' },
  });
  const buckets = new Map<string, Totals>();

  for (const entry of entries) {
    const amount = entry.amount;
    if ((entry.txType === 'purchase' || entry.txType === 'adjustment') && entry.toLocation) {
      const to = getBucket(buckets, entry.equipmentItemId, entry.toLocation);
      if (entry.txType === 'purchase') to.purchaseAmount += amount;
      to.inventoryAmount += amount;
    }
    if (entry.txType === 'transfer') {
      if (entry.fromLocation) {
        const from = getBucket(buckets, entry.equipmentItemId, entry.fromLocation);
        from.transferAmount += amount;
        from.inventoryAmount -= amount;
      }
      if (entry.toLocation) {
        const to = getBucket(buckets, entry.equipmentItemId, entry.toLocation);
        to.transferAmount += amount;
        to.inventoryAmount += amount;
      }
    }
    if (entry.txType === 'disposal' && entry.fromLocation) {
      const from = getBucket(buckets, entry.equipmentItemId, entry.fromLocation);
      from.disposalAmount += amount;
      from.inventoryAmount -= amount;
    }
  }

  let rowsUpdated = 0;
  for (const [key, totals] of buckets.entries()) {
    const [equipmentId, locationType] = key.split(':') as [string, LocationType];
    await prisma.equipmentSnapshot.upsert({
      where: {
        equipmentId_period_locationType: {
          equipmentId,
          period,
          locationType,
        },
      },
      create: {
        equipmentId,
        period,
        locationType,
        purchaseAmount: totals.purchaseAmount,
        transferAmount: totals.transferAmount,
        disposalAmount: totals.disposalAmount,
        inventoryAmount: totals.inventoryAmount,
      },
      update: {
        purchaseAmount: totals.purchaseAmount,
        transferAmount: totals.transferAmount,
        disposalAmount: totals.disposalAmount,
        inventoryAmount: totals.inventoryAmount,
      },
    });
    rowsUpdated++;
  }

  return { rowsUpdated };
}
