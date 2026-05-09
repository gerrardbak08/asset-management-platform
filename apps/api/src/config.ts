// 환경변수 로드 + 검증 — 누락 시 즉시 throw 해서 부팅 단계에서 실패
import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3001),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET 은 16자 이상'),
  AUTH_PEPPER: z.string().min(8, 'AUTH_PEPPER 는 8자 이상'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOADS_DIR: z.string().default('./uploads'),
  KAKAO_JS_KEY: z.string().optional().default(''),
  KAKAO_REST_KEY: z.string().optional().default(''),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  SEED_ADMIN_PASSWORD: z.string().optional().default(''),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error('환경변수 검증 실패:', parsed.error.flatten().fieldErrors);
  throw new Error('환경변수 누락. .env 를 확인하세요.');
}

export const config = parsed.data;
