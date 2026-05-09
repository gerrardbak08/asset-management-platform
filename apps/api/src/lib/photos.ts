// 사진 압축 — sharp 로 가로 800px, JPEG quality 80 으로 변환 (V16 compressImg 동등)
import sharp from 'sharp';

const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;
const TARGET_QUALITY = 80;

export async function compressBuildingPhoto(buf: Buffer): Promise<{ buf: Buffer; mime: string; ext: string }> {
  const out = await sharp(buf)
    .rotate() // EXIF 회전 보정
    .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: TARGET_QUALITY, progressive: true })
    .toBuffer();
  return { buf: out, mime: 'image/jpeg', ext: 'jpg' };
}
