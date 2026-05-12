// 이미지 최적화 라우트 — sharp를 이용한 리사이징 및 WebP 변환
import { FastifyInstance } from 'fastify';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { config } from '../config';

export async function imageRoutes(app: FastifyInstance) {
  app.get('/api/images/optimized', async (req, reply) => {
    const { src, w, q } = req.query as { src: string; w?: string; q?: string };
    
    if (!src) {
      return reply.status(400).send({ error: 'src is required' });
    }

    // 보안 및 경로 정규화: 디코딩 후 경로 추출
    const decodedSrc = decodeURIComponent(src);
    const normalized = decodedSrc.replace(/\\/g, '/');
    const filename = path.basename(normalized);
    // 경로에서 서브디렉토리 추출 (예: /files/buildings/xxx.jpg → buildings/xxx.jpg)
    const subPath = normalized.replace(/^\/?files\//, '');
    
    // 여러 경로 후보 확인
    const uploadsDir = path.resolve(config.UPLOADS_DIR);
    const candidates = [
      // uploads 디렉토리 기준 (서브경로 포함)
      path.join(uploadsDir, subPath),
      path.join(uploadsDir, filename),
      path.join(uploadsDir, 'buildings', filename),
      // cwd 기준
      path.join(process.cwd(), 'uploads', 'buildings', filename),
      path.join(process.cwd(), 'uploads', subPath),
      // public/files 기준
      path.join(process.cwd(), 'public', 'files', subPath),
      path.join(process.cwd(), 'public', 'files', 'buildings', filename),
    ];

    // 대소문자 변형도 추가
    const extraCandidates = candidates.flatMap(c => {
      const dir = path.dirname(c);
      const base = path.basename(c);
      return [
        path.join(dir, base.toLowerCase()),
        path.join(dir, base.toUpperCase()),
      ];
    });

    const allCandidates = [...new Set([...candidates, ...extraCandidates])];

    let inputPath = '';
    for (const cand of allCandidates) {
      try {
        await fs.access(cand);
        inputPath = cand;
        break;
      } catch {
        continue;
      }
    }
    
    if (!inputPath) {
      app.log.warn({ src, filename, subPath, uploadsDir }, 'Image not found in any candidate path');
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
