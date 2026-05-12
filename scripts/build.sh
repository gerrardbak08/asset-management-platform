#!/bin/bash
set -e

echo "🚀 Starting build process..."
echo "PWD: $(pwd)"

# 0. Clean previous builds
echo "🧹 Cleaning previous build artifacts..."
rm -rf apps/web/dist
rm -rf apps/api/dist
rm -rf apps/api/public

# 1. Install all dependencies
echo "📦 Installing dependencies..."
NODE_ENV=development pnpm install --frozen-lockfile=false

# 2. Generate Prisma Client
echo "💎 Generating Prisma Client..."
cd apps/api
pnpm exec prisma generate
cd ../..

# 3. Build everything in the monorepo
echo "📦 Building all projects..."
pnpm -r build

# 4. Prepare static assets
echo "📁 Preparing static assets..."
mkdir -p apps/api/public/files/buildings

# Copy building photos (한글 + 영문 파일명 모두)
if [ -d "uploads/buildings" ]; then
  echo "  → Copying uploads/buildings/ → apps/api/public/files/buildings/"
  cp -rf uploads/buildings/. apps/api/public/files/buildings/
  PHOTO_COUNT=$(ls apps/api/public/files/buildings/ 2>/dev/null | wc -l | tr -d ' ')
  echo "  → ${PHOTO_COUNT} photo files copied"
else
  echo "  ⚠️  uploads/buildings/ not found at $(pwd)/uploads/buildings"
  echo "  → Checking alternative locations..."
  for dir in "./uploads/buildings" "../uploads/buildings" "/app/uploads/buildings"; do
    if [ -d "$dir" ]; then
      echo "  → Found at $dir, copying..."
      cp -rf "$dir/." apps/api/public/files/buildings/
      break
    fi
  done
fi

# Copy web dist to api public (SPA 서빙용)
if [ -d "apps/web/dist" ]; then
  echo "  → Copying apps/web/dist/ → apps/api/public/"
  cp -rf apps/web/dist/. apps/api/public/
  echo "  → Web dist copied"
else
  echo "❌ Error: apps/web/dist not found!"
  exit 1
fi

# 5. Verify final output
echo ""
echo "📊 Build verification:"
FINAL_PHOTOS=$(ls apps/api/public/files/buildings/ 2>/dev/null | wc -l | tr -d ' ')
echo "  photos in apps/api/public/files/buildings/ → ${FINAL_PHOTOS} files"
if [ "$FINAL_PHOTOS" -gt 0 ]; then
  echo "  sample files:"
  ls apps/api/public/files/buildings/ | head -5
fi
echo "  apps/api/public/index.html → $(test -f apps/api/public/index.html && echo 'OK' || echo 'MISSING')"
echo ""
echo "✅ Build completed successfully!"
