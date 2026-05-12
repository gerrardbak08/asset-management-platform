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
import { imageRoutes } from './routes/image';
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

  // /files 정적 파일 서빙 — public/files 또는 uploads 에서 건물 사진 등 제공
  const filesDir = path.join(process.cwd(), 'public', 'files');
  const uploadsDir = path.resolve(config.UPLOADS_DIR);
  try {
    const { existsSync, mkdirSync } = await import('node:fs');
    const staticRoot = existsSync(filesDir) ? filesDir : uploadsDir;
    if (!existsSync(staticRoot)) {
      mkdirSync(staticRoot, { recursive: true });
    }
    app.log.info({ filesDir, uploadsDir, staticRoot }, '/files static root');
    await app.register(staticPlugin, {
      root: staticRoot,
      prefix: '/files/',
      decorateReply: false,
      maxAge: '7d',
    });
  } catch (e) {
    app.log.warn(e, 'Failed to register /files static route');
  }

  // 정적 파일 서빙 (웹 빌드 결과물) — decorateReply: true 로 sendFile 사용 가능
  try {
    const { existsSync } = await import('node:fs');
    if (existsSync(webDist)) {
      app.log.info({ webDist }, 'Web dist found');
      await app.register(staticPlugin, {
        root: webDist,
        prefix: '/',
        wildcard: false,
        index: 'index.html',
        maxAge: '1d',
      });
      // SPA fallback — index.html 을 직접 파일로 읽어서 전송
      const { readFile } = await import('node:fs/promises');
      const indexPath = path.join(webDist, 'index.html');
      let indexHtml = '';
      try {
        indexHtml = await readFile(indexPath, 'utf-8');
      } catch (err) {
        app.log.error({ err, indexPath }, 'Failed to load index.html');
      }
      app.setNotFoundHandler(async (req, reply) => {
        if (!req.url.startsWith('/api') && !req.url.startsWith('/files')) {
          if (indexHtml) {
            return reply.type('text/html').send(indexHtml);
          }
        }
        reply.status(404).send({ ok: false, code: 'NOT_FOUND', message: '경로를 찾을 수 없습니다.' });
      });
    } else {
      app.log.warn({ webDist }, 'Web dist not found — SPA fallback disabled');
    }
  } catch (e) {
    app.log.error(e, 'Failed to register web static route');
  }

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
  await app.register(imageRoutes); // /api/images/optimized

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
