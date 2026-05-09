// 헬스체크 라우트 — Railway 배포 readiness probe + 빌드 확인용
import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({
    ok: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      now: new Date().toISOString(),
    },
  }));
};
