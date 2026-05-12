#!/bin/bash
set -e

echo "🚀 Starting build process..."
echo "PWD: $(pwd)"

# 1. Install all dependencies
NODE_ENV=development pnpm install --frozen-lockfile=false

# 2. Build everything in the monorepo
echo "📦 Building all projects..."
pnpm -r build

# 3. Prepare static assets
echo "📁 Preparing static assets..."
mkdir -p apps/api/public/files/buildings

# Copy building photos (한글 파일명 포함)
if [ -d "uploads/buildings" ]; then
  echo "  → Copying uploads/buildings/ → apps/api/public/files/buildings/"
  cp -rf uploads/buildings/. apps/api/public/files/buildings/
  echo "  → Files copied:"
  ls -la apps/api/public/files/buildings/ | head -30
fi

# Copy web dist to api public
if [ -d "apps/web/dist" ]; then
  echo "  → Copying apps/web/dist/ → apps/api/public/"
  cp -rf apps/web/dist/. apps/api/public/
  echo "  → Web files:"
  ls apps/api/public/ | head -10
fi

# Final check
echo "📊 Final public/files/buildings/ content:"
ls apps/api/public/files/buildings/ 2>/dev/null | wc -l
echo "✅ Build completed successfully!"
