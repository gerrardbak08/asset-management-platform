// 클라이언트 런타임 환경변수 노출 — Kakao JS 키 등 (REST 키는 노출 금지)
import type { FastifyPluginAsync } from 'fastify';
import { config } from '@/config';
import { requireAuth } from '@/lib/auth/guards';

export const configRoutes: FastifyPluginAsync = async (app) => {
  app.get('/config', { preHandler: requireAuth() }, async () => ({
    ok: true,
    data: {
      kakaoJsKey: config.KAKAO_JS_KEY || null,
    },
  }));
};
