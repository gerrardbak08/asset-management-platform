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

# Copy building photos
if [ -d "uploads/buildings" ]; then
  echo "  → Copying uploads/buildings/ → apps/api/public/files/buildings/"
  cp -rf uploads/buildings/. apps/api/public/files/buildings/
fi

# Copy web dist to api public
if [ -d "apps/web/dist" ]; then
  echo "  → Copying apps/web/dist/ → apps/api/public/"
  cp -rf apps/web/dist/. apps/api/public/
  echo "  → Web files copied:"
  ls apps/api/public/ | head -10
else
  echo "❌ Error: apps/web/dist not found!"
  exit 1
fi

echo "✅ Build completed successfully!"
