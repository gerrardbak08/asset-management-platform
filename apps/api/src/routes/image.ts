// 이미지 최적화 라우트 — sharp를 이용한 리사이징 및 WebP 변환
import { FastifyInstance } from 'fastify';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { config } from '../config';

// 한글 파일명 → 영문 파일명 매핑 (V16 마이그레이션 호환)
const PHOTO_ALIAS: Record<string, string> = {
  '속초본점.jpg': 'b001.jpg',
  '속초본점_detail.jpg': 'b001_detail.jpg',
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
};

// 역매핑 (영문 → 한글)
const REVERSE_ALIAS: Record<string, string> = {};
for (const [kr, en] of Object.entries(PHOTO_ALIAS)) {
  REVERSE_ALIAS[en] = kr;
}

export async function imageRoutes(app: FastifyInstance) {
  const cwd = process.cwd();
  const publicFiles = path.join(cwd, 'public', 'files', 'buildings');
  const uploadsDir = path.resolve(config.UPLOADS_DIR);
  const uploadsBuildings = path.join(uploadsDir, 'buildings');
  const rootUploads = path.resolve(cwd, '..', '..', 'uploads', 'buildings');

  // 서버 시작 시 사진 디렉토리 상태 로깅
  for (const dir of [publicFiles, uploadsBuildings, rootUploads]) {
    try {
      const files = await fs.readdir(dir);
      app.log.info({ dir, count: files.length }, 'Image directory found');
    } catch {
      app.log.info({ dir }, 'Image directory NOT found');
    }
  }

  app.get('/api/images/optimized', async (req, reply) => {
    const { src, w, q } = req.query as { src: string; w?: string; q?: string };

    if (!src) {
      return reply.status(400).send({ error: 'src is required' });
    }

    const decodedSrc = decodeURIComponent(src);
    const normalized = decodedSrc.replace(/\\/g, '/');
    const filename = path.basename(normalized);

    // 한글/영문 양방향 alias
    const aliasFilename = PHOTO_ALIAS[filename] ?? REVERSE_ALIAS[filename] ?? filename;
    const hasAlias = aliasFilename !== filename;

    // 모든 가능한 경로 후보
    const candidates: string[] = [];
    const filenames = hasAlias ? [filename, aliasFilename] : [filename];

    for (const fn of filenames) {
      candidates.push(path.join(publicFiles, fn));
      candidates.push(path.join(uploadsBuildings, fn));
      candidates.push(path.join(rootUploads, fn));
      candidates.push(path.join(cwd, 'uploads', 'buildings', fn));
    }

    // subPath 기반 후보
    const subPath = normalized.replace(/^\/?files\//, '');
    if (subPath !== filename) {
      candidates.push(path.join(cwd, 'public', 'files', subPath));
      candidates.push(path.join(uploadsDir, subPath));
      if (hasAlias) {
        candidates.push(path.join(cwd, 'public', 'files', subPath.replace(filename, aliasFilename)));
        candidates.push(path.join(uploadsDir, subPath.replace(filename, aliasFilename)));
      }
    }

    const uniqueCandidates = [...new Set(candidates)];

    let inputPath = '';
    for (const cand of uniqueCandidates) {
      try {
        await fs.access(cand);
        inputPath = cand;
        break;
      } catch {
        continue;
      }
    }

    if (!inputPath) {
      app.log.warn({ src: decodedSrc, filename, aliasFilename, cwd }, 'Image not found');
      return reply.status(404).send({ error: 'Image not found' });
    }

    const width = w ? parseInt(w, 10) : 800;
    const quality = q ? parseInt(q, 10) : 80;

    try {
      const buffer = await sharp(inputPath)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      return reply
        .type('image/webp')
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .send(buffer);
    } catch (err) {
      app.log.error({ err, inputPath }, 'sharp processing failed, serving original');
      // sharp 실패 시 원본 전송
      const buf = await fs.readFile(inputPath);
      const ext = path.extname(inputPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return reply
        .type(mime)
        .header('Cache-Control', 'public, max-age=86400')
        .send(buf);
    }
  });
}
