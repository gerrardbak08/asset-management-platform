// 관리자 라우트 — 사용자 목록·생성·역할 변경·삭제 + 시스템 통계 (admin 전용)
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { requireRole } from '@/lib/auth/guards';
import { ROLES } from '@aims/shared';

const CreateUserInput = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
  role: z.enum(ROLES as unknown as [string, ...string[]]),
});

const UpdateUserInput = z.object({
  role: z.enum(ROLES as unknown as [string, ...string[]]).optional(),
  password: z.string().min(8).max(128).optional(),
});

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // ── 사용자 목록 (admin)
  app.get('/admin/users', { preHandler: requireRole('admin') }, async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    return { ok: true, data: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })) };
  });

  // ── 사용자 생성 (admin)
  app.post('/admin/users', { preHandler: requireRole('admin') }, async (req, reply) => {
    const parsed = CreateUserInput.safeParse(req.body);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
      return;
    }
    const { email, password, role } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      reply.code(409).send({ ok: false, code: 'CONFLICT', message: '이미 존재하는 이메일' });
      return;
    }
    const hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash, role },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    return {
      ok: true,
      data: { ...user, createdAt: user.createdAt.toISOString() },
    };
  });

  // ── 사용자 갱신 (역할 또는 비밀번호) (admin)
  app.put<{ Params: { id: string } }>(
    '/admin/users/:id',
    { preHandler: requireRole('admin') },
    async (req, reply) => {
      const parsed = UpdateUserInput.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
        return;
      }
      const data: Record<string, unknown> = {};
      if (parsed.data.role) data.role = parsed.data.role;
      if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);
      try {
        const user = await prisma.user.update({
          where: { id: req.params.id },
          data,
          select: { id: true, email: true, role: true, createdAt: true },
        });
        return { ok: true, data: { ...user, createdAt: user.createdAt.toISOString() } };
      } catch {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '사용자 없음' });
      }
    },
  );

  // ── 사용자 삭제 (admin) — 본인 삭제 금지
  app.delete<{ Params: { id: string } }>(
    '/admin/users/:id',
    { preHandler: requireRole('admin') },
    async (req, reply) => {
      if (req.user?.id === req.params.id) {
        reply.code(409).send({ ok: false, code: 'CONFLICT', message: '본인 계정은 삭제 불가' });
        return;
      }
      try {
        await prisma.user.delete({ where: { id: req.params.id } });
        return { ok: true, data: {} };
      } catch {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '사용자 없음' });
      }
    },
  );

  // ── 시스템 통계 (admin)
  app.get('/admin/stats', { preHandler: requireRole('admin') }, async () => {
    const [userCount, buildingCount, equipmentCount, snapshotCount, storeCount, monthlyCount] = await Promise.all([
      prisma.user.count(),
      prisma.building.count(),
      prisma.equipmentItem.count(),
      prisma.equipmentSnapshot.count(),
      prisma.store.count(),
      prisma.monthlySnapshot.count(),
    ]);
    const periods = await prisma.monthlySnapshot.findMany({
      select: { period: true },
      orderBy: { period: 'desc' },
    });
    return {
      ok: true,
      data: {
        users: userCount,
        buildings: buildingCount,
        equipments: equipmentCount,
        equipmentSnapshots: snapshotCount,
        stores: storeCount,
        monthlySnapshots: monthlyCount,
        periods: periods.map((p) => p.period),
      },
    };
  });
};
