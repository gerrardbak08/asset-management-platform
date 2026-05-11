#!/bin/sh
# Railway 시작 스크립트 — DB 마이그레이션 + 서버 시작
set -e

echo "=== AIMS API 시작 ==="

echo "→ Prisma 마이그레이션..."
pnpm exec prisma migrate deploy

echo "→ 서버 시작..."
exec node dist/src/server.js
