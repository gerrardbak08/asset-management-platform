#!/bin/bash
set -e

echo "🚀 Starting build process..."

# 1. Install all dependencies (including devDependencies)
pnpm install --prod=false

# 2. Build everything in the monorepo
echo "📦 Building all projects..."
pnpm -r build

# 3. Prepare static assets
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
