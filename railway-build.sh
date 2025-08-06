#!/bin/bash

# Railway build script
echo "🚀 Starting Railway build process..."

# Clean any existing build
echo "🧹 Cleaning previous build..."
rm -rf .next

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🔨 Building Next.js application..."
pnpm build

# Verify build
echo "✅ Build completed successfully!"
echo "📁 Build artifacts:"
ls -la .next/

echo "🚀 Ready for deployment!" 