// 감사 로그 조회 라우트 — admin/auditor 전용, 페이지네이션 + 필터
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().optional(),
});

export const auditLogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/audit-logs', { preHandler: requireRole('admin', 'auditor') }, async (req, reply) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      reply.code(422).send({ ok: false, code: 'VALIDATION', message: '입력 형식 오류' });
      return;
    }
    const { page, pageSize, action, resource, userId } = parsed.data;

    const where = {
      ...(action ? { action } : {}),
      ...(resource ? { resource } : {}),
      ...(userId ? { userId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      ok: true,
      data: {
        items: items.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
        total,
        page,
        pageSize,
      },
    };
  });
};

export async function writeAuditLog(opts: {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  detail?: string | null;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({ data: opts });
  } catch {
    // 감사 로그 기록 실패는 주요 흐름을 방해하지 않음
  }
}
