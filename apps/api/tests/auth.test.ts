// 인증 라우트 통합 테스트 — fastify.inject 로 in-process 실행
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth/password';

type FastifyAppType = Awaited<ReturnType<typeof buildServer>>;

let app: FastifyAppType;
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'test12345!';

beforeAll(async () => {
  app = await buildServer();
  await app.ready();
  await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      passwordHash: await hashPassword(TEST_PASSWORD),
      role: 'viewer',
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await app.close();
  await prisma.$disconnect();
});

describe('POST /api/auth/login', () => {
  it('정상 자격증명이면 200 + Set-Cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as { ok: boolean; data: { user: { email: string; role: string } } };
    expect(json.ok).toBe(true);
    expect(json.data.user.email).toBe(TEST_EMAIL);
    expect(json.data.user.role).toBe('viewer');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('비밀번호 틀리면 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: TEST_EMAIL, password: 'wrong-password' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('이메일 없으면 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { password: TEST_PASSWORD },
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('GET /api/auth/me', () => {
  it('미인증이면 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });

  it('로그인 후 쿠키 포함하면 200 + user', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookie = login.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookie) ? cookie.join('; ') : (cookie ?? '');
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookieHeader },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json() as { ok: boolean; data: { user: { email: string } } };
    expect(json.data.user.email).toBe(TEST_EMAIL);
  });
});

describe('POST /api/auth/logout', () => {
  it('clearCookie 로 sid 만료', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
    expect(res.statusCode).toBe(200);
    const setCookie = res.headers['set-cookie'];
    const setCookieStr = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
    expect(setCookieStr).toMatch(/sid=;/);
  });
});
