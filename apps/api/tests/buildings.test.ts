// 건물 라우트 통합 테스트 — viewer 가 PUT 시 403 (권한 가드 검증)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth/password';

type FastifyAppType = Awaited<ReturnType<typeof buildServer>>;
let app: FastifyAppType;
const VIEWER_EMAIL = `viewer-${Date.now()}@test.com`;
const EDITOR_EMAIL = `editor-${Date.now()}@test.com`;
const PASSWORD = 'test12345!';

async function loginAndGetCookie(email: string): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: PASSWORD },
  });
  const c = res.headers['set-cookie'];
  return Array.isArray(c) ? c.join('; ') : (c ?? '');
}

beforeAll(async () => {
  app = await buildServer();
  await app.ready();
  const hash = await hashPassword(PASSWORD);
  await prisma.user.create({ data: { email: VIEWER_EMAIL, passwordHash: hash, role: 'viewer' } });
  await prisma.user.create({ data: { email: EDITOR_EMAIL, passwordHash: hash, role: 'editor' } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [VIEWER_EMAIL, EDITOR_EMAIL] } } });
  await app.close();
  await prisma.$disconnect();
});

describe('GET /api/buildings', () => {
  it('미인증이면 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/buildings' });
    expect(res.statusCode).toBe(401);
  });

  it('viewer 도 list 조회 가능', async () => {
    const cookie = await loginAndGetCookie(VIEWER_EMAIL);
    const res = await app.inject({
      method: 'GET',
      url: '/api/buildings',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as { data: unknown[] };
    expect(Array.isArray(json.data)).toBe(true);
    // ETL 후엔 15건. 빈 DB 면 0건.
  });
});

describe('PUT /api/buildings/:id', () => {
  it('viewer 가 PUT 시 403', async () => {
    const first = await prisma.building.findFirst();
    if (!first) {
      console.warn('빌딩 데이터 없음 — etl 먼저 실행하세요. 테스트 SKIP');
      return;
    }
    const cookie = await loginAndGetCookie(VIEWER_EMAIL);
    const res = await app.inject({
      method: 'PUT',
      url: `/api/buildings/${first.id}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { name: '해킹시도' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('editor 가 PUT 시 200 + 수정', async () => {
    const first = await prisma.building.findFirst();
    if (!first) {
      console.warn('빌딩 데이터 없음 — etl 먼저 실행하세요. 테스트 SKIP');
      return;
    }
    const cookie = await loginAndGetCookie(EDITOR_EMAIL);
    const newAddress = `테스트 주소 ${Date.now()}`;
    const res = await app.inject({
      method: 'PUT',
      url: `/api/buildings/${first.id}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { address: newAddress },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as { ok: boolean; data: { address: string } };
    expect(json.data.address).toBe(newAddress);
    // 원래대로 복구
    await prisma.building.update({
      where: { id: first.id },
      data: { address: first.address },
    });
  });
});
