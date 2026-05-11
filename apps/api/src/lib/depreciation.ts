import type { DepMethod, DepreciationSchedule } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { addMonths, monthPeriod } from '@/lib/dates';

function clampMoney(value: bigint, min = 0n): bigint {
  return value < min ? min : value;
}

function straightLineExpense(
  acquisitionPrice: bigint,
  salvageRate: number,
  usefulLifeYears: number,
): bigint {
  const lifeMonths = BigInt(usefulLifeYears * 12);
  const salvage = BigInt(Math.round(Number(acquisitionPrice) * salvageRate));
  return lifeMonths > 0n ? (acquisitionPrice - salvage) / lifeMonths : 0n;
}

function decliningBalanceExpense(
  bookValue: bigint,
  acquisitionPrice: bigint,
  salvageRate: number,
  usefulLifeYears: number,
): bigint {
  const salvage = BigInt(Math.round(Number(acquisitionPrice) * salvageRate));
  const monthlyRate = 2 / usefulLifeYears / 12;
  const next = BigInt(Math.round(Number(bookValue) * monthlyRate));
  return clampMoney(next, 0n) > bookValue - salvage ? clampMoney(bookValue - salvage, 0n) : next;
}

function monthlyExpense(
  method: DepMethod,
  bookValue: bigint,
  acquisitionPrice: bigint,
  salvageRate: number,
  usefulLifeYears: number,
): bigint {
  if (method === 'declining_balance') {
    return decliningBalanceExpense(bookValue, acquisitionPrice, salvageRate, usefulLifeYears);
  }
  return straightLineExpense(acquisitionPrice, salvageRate, usefulLifeYears);
}

export async function recomputeDepEntries(scheduleId: string): Promise<{ rowsCreated: number }> {
  const schedule = await prisma.depreciationSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { rowsCreated: 0 };

  const entries = computeEntries(schedule);
  await prisma.$transaction(async (tx) => {
    await tx.depEntry.deleteMany({ where: { scheduleId } });
    if (entries.length > 0) {
      await tx.depEntry.createMany({ data: entries });
    }
  });
  return { rowsCreated: entries.length };
}

export function computeEntries(schedule: DepreciationSchedule) {
  const lifeMonths = schedule.usefulLifeYears * 12;
  const rows: Array<{
    scheduleId: string;
    period: string;
    expense: bigint;
    accumulated: bigint;
    bookValue: bigint;
  }> = [];
  let accumulated = 0n;
  let bookValue = schedule.acquisitionPrice;
  const salvage = BigInt(Math.round(Number(schedule.acquisitionPrice) * schedule.salvageRate));

  for (let i = 0; i < lifeMonths; i++) {
    const rawExpense = monthlyExpense(
      schedule.method,
      bookValue,
      schedule.acquisitionPrice,
      schedule.salvageRate,
      schedule.usefulLifeYears,
    );
    const expense = clampMoney(rawExpense > bookValue - salvage ? bookValue - salvage : rawExpense);
    accumulated += expense;
    bookValue = clampMoney(schedule.acquisitionPrice - accumulated, salvage);

    rows.push({
      scheduleId: schedule.id,
      period: monthPeriod(addMonths(schedule.acquisitionDate, i)),
      expense,
      accumulated,
      bookValue,
    });

    if (bookValue <= salvage) break;
  }

  return rows;
}
