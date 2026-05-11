import type { FastifyPluginAsync } from 'fastify';
import type { LeaseStatus } from '@prisma/client';
import {
  LeaseContractInput,
  LeaseContractUpdate,
  LeaseRenewInput,
  LeaseStatusSchema,
  LeaseTerminateInput,
} from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/guards';
import { addDays, parseDateOnly, toDateOnly } from '@/lib/dates';

type LeaseRow = NonNullable<Awaited<ReturnType<typeof prisma.leaseContract.findFirst>>>;

function serializeLease(row: LeaseRow & { building?: { name: string } | null }) {
  return {
    id: row.id,
    buildingId: row.buildingId,
    buildingName: row.building?.name,
    tenantName: row.tenantName,
    tenantContact: row.tenantContact,
    contractStart: toDateOnly(row.contractStart),
    contractEnd: toDateOnly(row.contractEnd),
    rentArea: row.rentArea,
    monthlyRent: row.monthlyRent.toString(),
    deposit: row.deposit.toString(),
    renewalOption: row.renewalOption,
    renewedFromId: row.renewedFromId,
    status: row.status,
    notes: row.notes,
    updatedBy: row.updatedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const leaseRoutes: FastifyPluginAsync = async (app) => {
  app.get('/leases/expiring', { preHandler: requireAuth() }, async (req, reply) => {
    const q = req.query as { withinDays?: string };
    const withinDays = Number(q.withinDays ?? 30);
    if (!Number.isFinite(withinDays) || withinDays < 1 || withinDays > 730) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'withinDays 형식 오류' });
      return;
    }
    const now = new Date();
    const cutoff = addDays(now, withinDays);
    const leases = await prisma.leaseContract.findMany({
      where: {
        status: 'active',
        contractEnd: { lte: cutoff },
      },
      include: { building: { select: { name: true } } },
      orderBy: { contractEnd: 'asc' },
    });
    const criticalCutoff = addDays(now, 7);
    return {
      ok: true,
      data: {
        critical: leases
          .filter((lease) => lease.contractEnd <= criticalCutoff)
          .map(serializeLease),
        warning: leases
          .filter((lease) => lease.contractEnd > criticalCutoff)
          .map(serializeLease),
      },
    };
  });

  app.get('/leases', { preHandler: requireAuth() }, async (req, reply) => {
    const q = req.query as { buildingId?: string; status?: string; endingBefore?: string };
    const where: Record<string, unknown> = {};
    if (q.buildingId) where.buildingId = q.buildingId;
    if (q.status) {
      const status = LeaseStatusSchema.safeParse(q.status);
      if (!status.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: 'status 형식 오류' });
        return;
      }
      where.status = status.data;
    }
    if (q.endingBefore) {
      where.contractEnd = { lte: parseDateOnly(q.endingBefore) };
    }

    const leases = await prisma.leaseContract.findMany({
      where,
      include: { building: { select: { name: true } } },
      orderBy: [{ status: 'asc' }, { contractEnd: 'asc' }],
    });
    return { ok: true, data: leases.map(serializeLease) };
  });

  app.get<{ Params: { id: string } }>(
    '/leases/:id',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const lease = await prisma.leaseContract.findUnique({
        where: { id: req.params.id },
        include: { building: { select: { name: true } } },
      });
      if (!lease) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '임대계약 없음' });
        return;
      }
      const chain = lease.renewedFromId
        ? await prisma.leaseContract.findMany({
            where: { OR: [{ id: lease.renewedFromId }, { renewedFromId: lease.renewedFromId }] },
            include: { building: { select: { name: true } } },
            orderBy: { contractStart: 'asc' },
          })
        : [];
      return { ok: true, data: { ...serializeLease(lease), chain: chain.map(serializeLease) } };
    },
  );

  app.post('/leases', { preHandler: requireRole('editor', 'admin') }, async (req, reply) => {
    const parsed = LeaseContractInput.safeParse(req.body);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
      return;
    }
    const data = parsed.data;
    try {
      const lease = await prisma.leaseContract.create({
        data: {
          buildingId: data.buildingId,
          tenantName: data.tenantName,
          tenantContact: data.tenantContact ?? null,
          contractStart: parseDateOnly(data.contractStart),
          contractEnd: parseDateOnly(data.contractEnd),
          rentArea: data.rentArea,
          monthlyRent: data.monthlyRent,
          deposit: data.deposit,
          renewalOption: data.renewalOption,
          renewedFromId: data.renewedFromId ?? null,
          status: data.status as LeaseStatus,
          notes: data.notes ?? null,
          updatedById: req.user!.id,
        },
      });
      return { ok: true, data: serializeLease(lease) };
    } catch {
      reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '건물 없음' });
    }
  });

  app.put<{ Params: { id: string } }>(
    '/leases/:id',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const parsed = LeaseContractUpdate.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
        return;
      }
      const data = parsed.data;
      const updateData: Record<string, unknown> = { updatedById: req.user!.id };
      if (data.buildingId !== undefined) updateData.buildingId = data.buildingId;
      if (data.tenantName !== undefined) updateData.tenantName = data.tenantName;
      if (data.tenantContact !== undefined) updateData.tenantContact = data.tenantContact;
      if (data.contractStart !== undefined) updateData.contractStart = parseDateOnly(data.contractStart);
      if (data.contractEnd !== undefined) updateData.contractEnd = parseDateOnly(data.contractEnd);
      if (data.rentArea !== undefined) updateData.rentArea = data.rentArea;
      if (data.monthlyRent !== undefined) updateData.monthlyRent = data.monthlyRent;
      if (data.deposit !== undefined) updateData.deposit = data.deposit;
      if (data.renewalOption !== undefined) updateData.renewalOption = data.renewalOption;
      if (data.renewedFromId !== undefined) updateData.renewedFromId = data.renewedFromId;
      if (data.status !== undefined) updateData.status = data.status as LeaseStatus;
      if (data.notes !== undefined) updateData.notes = data.notes;

      try {
        const lease = await prisma.leaseContract.update({
          where: { id: req.params.id },
          data: updateData,
        });
        return { ok: true, data: serializeLease(lease) };
      } catch {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '임대계약 없음' });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    '/leases/:id/renew',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const parsed = LeaseRenewInput.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
        return;
      }
      const old = await prisma.leaseContract.findUnique({ where: { id: req.params.id } });
      if (!old) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '임대계약 없음' });
        return;
      }
      const data = parsed.data;
      const next = await prisma.$transaction(async (tx) => {
        await tx.leaseContract.update({
          where: { id: old.id },
          data: { status: 'expired', updatedById: req.user!.id },
        });
        return tx.leaseContract.create({
          data: {
            buildingId: old.buildingId,
            tenantName: data.tenantName,
            tenantContact: data.tenantContact ?? null,
            contractStart: parseDateOnly(data.contractStart),
            contractEnd: parseDateOnly(data.contractEnd),
            rentArea: data.rentArea,
            monthlyRent: data.monthlyRent,
            deposit: data.deposit,
            renewalOption: data.renewalOption,
            renewedFromId: old.id,
            status: data.status as LeaseStatus,
            notes: data.notes ?? null,
            updatedById: req.user!.id,
          },
        });
      });
      return { ok: true, data: serializeLease(next) };
    },
  );

  app.post<{ Params: { id: string } }>(
    '/leases/:id/terminate',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const parsed = LeaseTerminateInput.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
        return;
      }
      const existing = await prisma.leaseContract.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '임대계약 없음' });
        return;
      }
      const suffix = parsed.data.reason ? `\n해지 사유: ${parsed.data.reason}` : '';
      const lease = await prisma.leaseContract.update({
        where: { id: existing.id },
        data: {
          status: 'terminated',
          notes: `${existing.notes ?? ''}${suffix}`.trim() || null,
          updatedById: req.user!.id,
        },
      });
      return { ok: true, data: serializeLease(lease) };
    },
  );
};
