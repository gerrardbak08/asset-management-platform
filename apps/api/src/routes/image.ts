// 이미지 최적화 라우트 — sharp를 이용한 리사이징 및 WebP 변환
import { FastifyInstance } from 'fastify';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

export async function imageRoutes(app: FastifyInstance) {
  app.get('/api/images/optimized', async (req, reply) => {
    const { src, w, q } = req.query as { src: string; w?: string; q?: string };
    
    if (!src) {
      return reply.status(400).send({ error: 'src is required' });
    }

    // 보안 및 경로 정규화: 디코딩 후 basename 추출
    const decodedSrc = decodeURIComponent(src);
    const safeSrc = path.basename(decodedSrc).toLowerCase();
    
    // 여러 경로 후보 확인 (루트 또는 apps/api 기준)
    const candidates = [
      path.join(process.cwd(), 'uploads', 'buildings', safeSrc),
      path.join(process.cwd(), '..', '..', 'uploads', 'buildings', safeSrc),
      path.join(process.cwd(), 'apps', 'api', 'public', 'files', 'buildings', safeSrc),
      path.join(process.cwd(), 'public', 'files', 'buildings', safeSrc),
      path.join(process.cwd(), 'dist', 'public', 'files', 'buildings', safeSrc),
      // 대문자 버전도 시도
      path.join(process.cwd(), 'uploads', 'buildings', safeSrc.toUpperCase())
    ];

    app.log.info({ cwd: process.cwd(), safeSrc, candidates }, 'Image optimization search');

    let inputPath = '';
    for (const cand of candidates) {
      try {
        await fs.access(cand);
        inputPath = cand;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!inputPath) {
      return reply.status(404).send({ error: 'Image not found' });
    }

    const width = w ? parseInt(w, 10) : 800;
    const quality = q ? parseInt(q, 10) : 80;

    try {
      const buffer = await sharp(inputPath)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      reply
        .type('image/webp')
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .send(buffer);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to process image' });
    }
  });
}
