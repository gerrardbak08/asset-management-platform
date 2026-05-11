// Fastify 서버 진입점 — CORS / Cookie / Multipart / Static / 라우트 + 인증 preHandler 등록
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import { config } from './config';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { buildingRoutes } from './routes/buildings';
import { dashboardRoutes } from './routes/dashboard';
import { storeRoutes } from './routes/stores';
import { uploadRoutes } from './routes/upload';
import { adminRoutes } from './routes/admin';
import { configRoutes } from './routes/config';
import { exportRoutes } from './routes/export';
import { leaseRoutes } from './routes/leases';
import { maintenanceRoutes } from './routes/maintenance';
import { ledgerRoutes } from './routes/ledger';
import { depreciationRoutes } from './routes/depreciation';
import { attachUser } from './lib/auth/guards';

export async function buildServer() {
  const app = Fastify({
    logger: { level: config.NODE_ENV === 'production' ? 'info' : 'info' },
  });

  // CORS
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  // 쿠키 (세션은 PR #3 에서 추가)
  await app.register(cookie, {
    secret: config.SESSION_SECRET,
  });

  // 멀티파트 업로드 (사진 / xlsb)
  await app.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB
      files: 1,
    },
  });

  // 업로드된 사진 정적 노출 — /files/*
  await app.register(staticPlugin, {
    root: path.resolve(config.UPLOADS_DIR),
    prefix: '/files/',
    decorateReply: false,
  });

  // 프로덕션: 빌드된 웹 정적 파일 서빙 + SPA fallback
  const webDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../public',
  );
  app.log.info({ webDist }, 'Static files path');
  try {
    const { existsSync } = await import('node:fs');
    if (existsSync(webDist)) {
      await app.register(staticPlugin, {
        root: webDist,
        prefix: '/',
        wildcard: true,
        decorateReply: false,
        index: 'index.html',
      });
      // SPA fallback — /api·/files 이외 GET 요청은 index.html 반환
      app.setNotFoundHandler(async (req, reply) => {
        if (!req.url.startsWith('/api') && !req.url.startsWith('/files')) {
          return reply.sendFile('index.html', webDist);
        }
        reply.status(404).send({ ok: false, code: 'NOT_FOUND', message: '경로를 찾을 수 없습니다.' });
      });
    }
  } catch {
    // 개발 환경 또는 public 폴더 없을 때 무시
  }

  // 모든 요청에 대해 user 데코레이션 (있으면 req.user 채움, 없으면 그대로)
  app.addHook('preHandler', attachUser);

  // 라우트
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(buildingRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });
  await app.register(storeRoutes, { prefix: '/api' });
  await app.register(uploadRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/api' });
  await app.register(configRoutes, { prefix: '/api' });
  await app.register(exportRoutes, { prefix: '/api' });
  await app.register(leaseRoutes, { prefix: '/api' });
  await app.register(maintenanceRoutes, { prefix: '/api' });
  await app.register(ledgerRoutes, { prefix: '/api' });
  await app.register(depreciationRoutes, { prefix: '/api' });

  return app;
}

const isEntry =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntry) {
  buildServer()
    .then((app) => app.listen({ port: config.PORT, host: config.HOST }))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
