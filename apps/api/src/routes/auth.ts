// 인증 라우트 — POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/change-password
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { LoginInput } from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { setSessionCookie, clearSessionCookie } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/guards';

const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  // ── 로그인
  app.post('/auth/login', async (req, reply) => {
    const parsed = LoginInput.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({
        ok: false,
        code: 'VALIDATION',
        message: 'email/password 형식 오류',
      });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply
        .code(401)
        .send({ ok: false, code: 'AUTH_REQUIRED', message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply
        .code(401)
        .send({ ok: false, code: 'AUTH_REQUIRED', message: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }
    setSessionCookie(reply, user.id);
    return {
      ok: true,
      data: { user: { id: user.id, email: user.email, role: user.role } },
    };
  });

  // ── 로그아웃
  app.post('/auth/logout', async (_req, reply) => {
    clearSessionCookie(reply);
    return { ok: true, data: {} };
  });

  // ── 현재 사용자
  app.get('/auth/me', { preHandler: requireAuth() }, async (req) => {
    return { ok: true, data: { user: req.user } };
  });

  // ── 비밀번호 변경 (본인)
  app.post('/auth/change-password', { preHandler: requireAuth() }, async (req, reply) => {
    const parsed = ChangePasswordInput.safeParse(req.body);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '사용자 없음' });
      return;
    }
    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      reply
        .code(401)
        .send({ ok: false, code: 'AUTH_REQUIRED', message: '현재 비밀번호가 올바르지 않습니다' });
      return;
    }
    const newHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    return { ok: true, data: {} };
  });
};
