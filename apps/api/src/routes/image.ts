// 이미지 최적화 라우트 — sharp를 이용한 리사이징 및 WebP 변환
import { FastifyInstance } from 'fastify';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { config } from '../config';

// 한글 파일명 → 영문 파일명 매핑 (V16 마이그레이션 호환)
const PHOTO_ALIAS: Record<string, string> = {
  '속초본점.jpg': 'b001.jpg',
  '창원상남본점.jpg': 'b002.jpg',
  '창원상남본점_detail.jpg': 'b002_detail.jpg',
  '구로디지털단지역점.jpg': 'b003.jpg',
  '강릉입암점.jpg': 'b004.jpg',
  '강릉입암점_detail.jpg': 'b004_detail.jpg',
  '세종본점.jpg': 'b005.jpg',
  '세종본점_detail.jpg': 'b005_detail.jpg',
  '포항시외버스터미널점.jpg': 'b006.jpg',
  '경기광주본점.jpg': 'b007.jpg',
  '원주무실점.jpg': 'b008.jpg',
  '수원화서점.jpg': 'b009.jpg',
  '성남모란역점.jpg': 'b010.jpg',
  '성남모란역점_detail.jpg': 'b010_detail.jpg',
  '영주본점.jpg': 'b011.jpg',
  '영주본점_detail.jpg': 'b011_detail.jpg',
  '남사물류센터.jpg': 'b012.jpg',
  '부산허브센터.jpg': 'b013.jpg',
  '동탄현대하이페리온_511호.jpg': 'b014.jpg',
  '동탄현대하이페리온_526호.jpg': 'b015.jpg',
  '동탄현대하이페리온_526호_detail.jpg': 'b015_detail.jpg',
  '속초본점_detail.jpg': 'b001_detail.jpg',
};

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
    const subPath = normalized.replace(/^\/?files\//, '');
    
    // 한글 파일명 → 영문 alias 변환
    const aliasFilename = PHOTO_ALIAS[filename] ?? filename;
    const aliasSubPath = subPath.replace(filename, aliasFilename);

    // 여러 경로 후보 확인
    const uploadsDir = path.resolve(config.UPLOADS_DIR);
    const candidates = [
      // 한글 파일명 시도
      path.join(process.cwd(), 'public', 'files', subPath),
      path.join(process.cwd(), 'public', 'files', 'buildings', filename),
      path.join(uploadsDir, subPath),
      path.join(uploadsDir, 'buildings', filename),
      // 영문 alias 시도
      path.join(process.cwd(), 'public', 'files', aliasSubPath),
      path.join(process.cwd(), 'public', 'files', 'buildings', aliasFilename),
      path.join(uploadsDir, aliasSubPath),
      path.join(uploadsDir, 'buildings', aliasFilename),
      // cwd 기준
      path.join(process.cwd(), 'uploads', 'buildings', filename),
      path.join(process.cwd(), 'uploads', 'buildings', aliasFilename),
    ];

    const allCandidates = [...new Set(candidates)];

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
      app.log.warn({ src, filename, aliasFilename, uploadsDir, cwd: process.cwd() }, 'Image not found');
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
