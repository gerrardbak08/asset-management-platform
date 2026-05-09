// 세션 쿠키 — @fastify/cookie 의 signed 기능 사용. payload = userId 만, 검증/갱신은 매 요청마다
import type { FastifyReply, FastifyRequest } from 'fastify';

export const COOKIE_NAME = 'sid';
export const SESSION_MAX_AGE_S = 12 * 60 * 60; // 12 시간

export function setSessionCookie(reply: FastifyReply, userId: string): void {
  reply.setCookie(COOKIE_NAME, userId, {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAME, { path: '/' });
}

export function readUserIdFromSession(request: FastifyRequest): string | null {
  const raw = request.cookies[COOKIE_NAME];
  if (!raw) return null;
  const result = request.unsignCookie(raw);
  return result.valid ? result.value : null;
}
