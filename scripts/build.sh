#!/bin/bash
set -e

echo "🚀 Starting build process..."

# 2. Build API
echo "📦 Building API..."
cd apps/api
pnpm exec prisma generate
pnpm run build
cd ../..

# 3. Build Web
echo "📦 Building Web..."
cd apps/web
pnpm run build
cd ../..

# 4. Prepare static assets
echo "📁 Preparing static assets..."
mkdir -p uploads/buildings
mkdir -p apps/api/public/files/buildings

# Copy building photos
if [ -d "uploads/buildings" ]; then
  cp -rv uploads/buildings/. apps/api/public/files/buildings/ || true
fi

# Copy web dist to api public
if [ -d "apps/web/dist" ]; then
  cp -rv apps/web/dist/. apps/api/public/
fi

echo "✅ Build completed successfully!"
