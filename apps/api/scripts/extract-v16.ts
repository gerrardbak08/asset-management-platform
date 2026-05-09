// V16 단일 HTML 에서 EMBEDDED_* 변수와 defBd/defEq 데이터 추출 → data/v16-extracted.json + uploads/buildings/*.png
// 실행 — pnpm --filter api etl:extract  (V16_PATH 환경변수로 위치 변경 가능)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const V16_PATH =
  process.env.V16_PATH ??
  'C:/Users/sjowo/OneDrive/바탕 화면/SJ_대시보드_V16.html';
const OUT_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), '..', '..', 'uploads', 'buildings');

function findBlock(src: string, pattern: RegExp, opener: '{' | '[' = '{'): string | null {
  const m = pattern.exec(src);
  if (!m) return null;
  const closer = opener === '{' ? '}' : ']';
  const start = m.index + m[0].length;
  const i = src.indexOf(opener, start);
  if (i < 0) return null;
  let depth = 0;
  let inStr: '"' | "'" | '`' | null = null;
  let escape = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (escape) {
      escape = false;
      continue;
    }
    if (inStr) {
      if (c === '\\') escape = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c;
      continue;
    }
    if (c === opener) depth++;
    else if (c === closer) {
      depth--;
      if (depth === 0) return src.slice(i, j + 1);
    }
  }
  return null;
}

function evalLiteral<T>(src: string): T {
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  return vm.runInContext(`(${src})`, ctx, { timeout: 5000 }) as T;
}

type V16Photos = Record<string, string>;
type V16BuildingRaw = unknown[];
type V16EquipmentRaw = unknown[];

async function main() {
  console.log(`V16 읽는 중: ${V16_PATH}`);
  const html = await fs.promises.readFile(V16_PATH, 'utf-8');
  console.log(`HTML 크기: ${(html.length / 1024).toFixed(0)} KB`);

  // ── EMBEDDED_BUILDING_PHOTOS
  const photosBlock = findBlock(html, /const\s+EMBEDDED_BUILDING_PHOTOS\s*=\s*/);
  if (!photosBlock) throw new Error('EMBEDDED_BUILDING_PHOTOS 못 찾음');
  const photos = evalLiteral<V16Photos>(photosBlock);
  console.log(`사진(정면): ${Object.keys(photos).length} 장`);

  // ── EMBEDDED_BUILDING_DETAILS (있을 수 있음)
  const detailsBlock = findBlock(html, /const\s+EMBEDDED_BUILDING_DETAILS\s*=\s*/);
  const details = detailsBlock ? evalLiteral<V16Photos>(detailsBlock) : {};
  console.log(`사진(디테일): ${Object.keys(details).length} 장`);

  // ── BUILDING_COORDS (배열)
  const coordsBlock = findBlock(html, /const\s+BUILDING_COORDS\s*=\s*/, '[');
  const coords = coordsBlock ? evalLiteral<number[][]>(coordsBlock) : [];
  console.log(`좌표: ${coords.length} 쌍`);

  // ── defBd 의 raw 배열
  const defBdIdx = html.indexOf('function defBd()');
  if (defBdIdx < 0) throw new Error('defBd 함수 못 찾음');
  const defBdSrc = html.slice(defBdIdx, defBdIdx + 30000);
  const bdRawBlock = findBlock(defBdSrc, /const\s+raw\s*=\s*/, '[');
  if (!bdRawBlock) throw new Error('defBd 의 raw 배열 못 찾음');
  const buildingsRaw = evalLiteral<V16BuildingRaw[]>(bdRawBlock);
  console.log(`건물 raw: ${buildingsRaw.length} 행`);

  // ── defEq 의 raw 배열
  const defEqIdx = html.indexOf('function defEq()');
  if (defEqIdx < 0) throw new Error('defEq 함수 못 찾음');
  const defEqSrc = html.slice(defEqIdx, defEqIdx + 30000);
  const eqRawBlock = findBlock(defEqSrc, /const\s+raw\s*=\s*/, '[');
  if (!eqRawBlock) throw new Error('defEq 의 raw 배열 못 찾음');
  const equipmentsRaw = evalLiteral<V16EquipmentRaw[]>(eqRawBlock);
  console.log(`비품 raw: ${equipmentsRaw.length} 행`);

  // ── EMBEDDED_M0_STORES_DATA
  const storesDataBlock = findBlock(html, /const\s+EMBEDDED_M0_STORES_DATA\s*=\s*/);
  if (!storesDataBlock) throw new Error('EMBEDDED_M0_STORES_DATA 못 찾음');
  type StoresPayload = {
    meta?: { current_period?: string };
    stores?: Array<{
      name: string;
      site_type?: string;
      asset_value?: number;
      asset_count?: number;
      supply_value?: number;
      asset_by_type?: Record<string, number>;
      supply_by_category?: Record<string, number>;
      supply_by_category_count?: Record<string, number>;
    }>;
  };
  const storesData = evalLiteral<StoresPayload>(storesDataBlock);
  console.log(`사업장: ${storesData.stores?.length ?? 0} 건`);

  // ── M0_DATA
  const m0Block = findBlock(html, /let\s+M0_DATA\s*=\s*/);
  if (!m0Block) throw new Error('M0_DATA 못 찾음');
  const m0Data = evalLiteral<{
    meta: { current_period: string; previous_period: string };
    current: { asset_kpi: { total: number } };
    previous: { asset_kpi: { total: number } };
    mom: unknown;
  }>(m0Block);
  console.log(
    `M0 current=${m0Data.meta.current_period} previous=${m0Data.meta.previous_period}`,
  );
  console.log(
    `  current total = ${m0Data.current.asset_kpi.total.toLocaleString('ko-KR')}`,
  );
  console.log(
    `  previous total = ${m0Data.previous.asset_kpi.total.toLocaleString('ko-KR')}`,
  );

  // ── 사진 base64 디코딩 → PNG 파일
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });

  function decodeDataUrl(dataUrl: string): { ext: string; buf: Buffer } | null {
    const m = /^data:image\/([a-z]+);base64,(.+)$/i.exec(dataUrl);
    if (!m) return null;
    const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
    return { ext, buf: Buffer.from(m[2], 'base64') };
  }

  function safeName(name: string): string {
    return name.replace(/[\\/:*?"<>|\s]/g, '_');
  }

  let photoCount = 0;
  const photoFiles: Record<string, string> = {};
  for (const [name, dataUrl] of Object.entries(photos)) {
    const decoded = decodeDataUrl(dataUrl);
    if (!decoded) continue;
    const filename = `${safeName(name)}.${decoded.ext}`;
    await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), decoded.buf);
    photoFiles[name] = filename;
    photoCount++;
  }
  console.log(`사진(정면) 디코딩: ${photoCount} 장 → ${UPLOADS_DIR}`);

  let detailCount = 0;
  const detailFiles: Record<string, string> = {};
  for (const [name, dataUrl] of Object.entries(details)) {
    const decoded = decodeDataUrl(dataUrl);
    if (!decoded) continue;
    const filename = `${safeName(name)}_detail.${decoded.ext}`;
    await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), decoded.buf);
    detailFiles[name] = filename;
    detailCount++;
  }
  console.log(`사진(디테일) 디코딩: ${detailCount} 장`);

  // ── JSON 저장 (사진 base64 제외)
  await fs.promises.mkdir(OUT_DIR, { recursive: true });
  const out = {
    meta: { extractedAt: new Date().toISOString(), v16Path: V16_PATH },
    buildingsRaw,
    coords,
    equipmentsRaw,
    photos: photoFiles, // name → 파일명
    details: detailFiles,
    m0Data,
    stores: storesData.stores ?? [],
  };
  const outFile = path.join(OUT_DIR, 'v16-extracted.json');
  await fs.promises.writeFile(outFile, JSON.stringify(out, null, 2));
  console.log(`저장: ${outFile}`);
  console.log('추출 완료.');
}

main().catch((err) => {
  console.error('추출 실패:', err);
  process.exit(1);
});
