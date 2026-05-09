// 권한 가드 — preHandler 훅. 미인증 401, 권한 부족 403
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { readUserIdFromSession } from './session';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string; role: Role };
  }
}

export async function attachUser(req: FastifyRequest): Promise<void> {
  const userId = readUserIdFromSession(req);
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    req.user = { id: user.id, email: user.email, role: user.role as Role };
  }
}

export function requireAuth() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      reply.code(401).send({ ok: false, code: 'AUTH_REQUIRED', message: '로그인 필요' });
    }
  };
}

export function requireRole(...allowed: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      reply.code(401).send({ ok: false, code: 'AUTH_REQUIRED', message: '로그인 필요' });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      reply
        .code(403)
        .send({ ok: false, code: 'FORBIDDEN', message: `권한 부족 — ${allowed.join('/')} 만 허용` });
    }
  };
}
