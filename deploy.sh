#!/bin/bash
# Production Deployment Script for Perfume Seller Management System
# Run this script to deploy the application to production

echo "🚀 Perfume Seller Management System - Production Deployment"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deployment."
    exit 1
fi

echo "✅ Build successful!"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Please login to Vercel (if not already logged in):"
echo "   Run: vercel login"
echo ""

echo "🌐 To deploy to production, run:"
echo "   vercel --prod"
echo ""

echo "📋 Don't forget to set these environment variables in Vercel:"
echo "   - NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "   - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "   - NEXT_PUBLIC_FIREBASE_APP_ID"
echo ""

echo "🎉 Application is ready for deployment!"
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions."</content>
<parameter name="filePath">d:\Easy2SolutionsProjects\EasyProjects-Web\PerfumeSeller\perfume\deploy.sh