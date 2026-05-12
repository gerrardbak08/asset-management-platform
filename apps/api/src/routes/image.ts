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

    // 보안: 상위 디렉토리 접근 방지
    const safeSrc = path.basename(src);
    const inputPath = path.join(process.cwd(), 'uploads', 'buildings', safeSrc);
    
    try {
      await fs.access(inputPath);
    } catch (e) {
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
