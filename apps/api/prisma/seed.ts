// admin 사용자 시드 — SEED_ADMIN_PASSWORD 가 비어있으면 임의 16자 생성 후 콘솔 출력
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { config } from '@/config';

function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(16);
  let out = '';
  for (let i = 0; i < 16; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

async function main() {
  let pw = config.SEED_ADMIN_PASSWORD;
  let generated = false;
  if (!pw) {
    pw = generatePassword();
    generated = true;
  }

  const peppered = pw + config.AUTH_PEPPER;
  const hash = await bcrypt.hash(peppered, 12);

  const user = await prisma.user.upsert({
    where: { email: config.SEED_ADMIN_EMAIL },
    create: {
      email: config.SEED_ADMIN_EMAIL,
      passwordHash: hash,
      role: 'admin',
    },
    update: {
      passwordHash: hash,
      role: 'admin',
    },
  });

  console.log(`✅ admin 시드 완료 — ${user.email}`);
  if (generated) {
    console.log(`\n⚠️  SEED_ADMIN_PASSWORD 가 비어있어 임의 비밀번호를 생성했습니다.`);
    console.log(`    아래 값을 안전한 곳에 복사하고, 첫 로그인 후 즉시 변경하세요.\n`);
    console.log(`    📋 임시 비밀번호: ${pw}\n`);
  } else {
    console.log(`    .env 의 SEED_ADMIN_PASSWORD 가 적용됨.`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('시드 실패:', err);
  await prisma.$disconnect();
  process.exit(1);
});
