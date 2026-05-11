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

  // 모든 요청에 대해 user 데코레이션 (있으면 req.user 채움, 없으면 그대로)
  app.addHook('preHandler', attachUser);

  const webDist = path.join(process.cwd(), 'public');

  // 디버그 엔드포인트
  app.get('/api/debug-uploads', async () => {
    const fs = await import('node:fs');
    const udir = path.join(webDist, 'files');
    let files = [];
    let bfiles = [];
    try { files = fs.readdirSync(udir); } catch(e) {}
    try { bfiles = fs.readdirSync(path.join(udir, 'buildings')); } catch(e) {}
    return {
      cwd: process.cwd(),
      udir,
      files,
      bfiles,
      publicExists: fs.existsSync(webDist)
    };
  });

  // 정적 파일 서빙 (웹 + /files)
  try {
    const { existsSync } = await import('node:fs');
    if (existsSync(webDist)) {
      await app.register(staticPlugin, {
        root: webDist,
        prefix: '/',
        wildcard: true,
        index: 'index.html',
      });
      // SPA fallback
      app.setNotFoundHandler(async (req, reply) => {
        if (!req.url.startsWith('/api') && !req.url.startsWith('/files')) {
          return reply.sendFile('index.html', webDist);
        }
        reply.status(404).send({ ok: false, code: 'NOT_FOUND', message: '경로를 찾을 수 없습니다.' });
      });
    }
  } catch (e) {}

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
