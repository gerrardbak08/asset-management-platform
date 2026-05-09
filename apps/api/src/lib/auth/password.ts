// 비밀번호 해시 / 검증 — bcrypt + AUTH_PEPPER
import bcrypt from 'bcryptjs';
import { config } from '@/config';

const PEPPER = config.AUTH_PEPPER;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain + PEPPER, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain + PEPPER, hash);
}
