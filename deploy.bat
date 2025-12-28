@echo off
REM Production Deployment Script for Perfume Seller Management System
REM Run this script to deploy the application to production

echo 🚀 Perfume Seller Management System - Production Deployment
echo ===========================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v." %%i in ('node --version') do set NODE_MAJOR=%%i
if %NODE_MAJOR% lss 18 (
    echo ❌ Node.js version 18+ required. Current version:
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version check passed:
node --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Run build
echo 🔨 Building application...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix errors before deployment.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Installing Vercel CLI...
    call npm install -g vercel
)

echo.
echo 🔐 Please login to Vercel ^(if not already logged in^):
echo    Run: vercel login
echo.
echo 🌐 To deploy to production, run:
echo    vercel --prod
echo.
echo 📋 Don't forget to set these environment variables in Vercel:
echo    - NEXT_PUBLIC_FIREBASE_API_KEY
echo    - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
echo    - NEXT_PUBLIC_FIREBASE_PROJECT_ID
echo    - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
echo    - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
echo    - NEXT_PUBLIC_FIREBASE_APP_ID
echo.
echo 🎉 Application is ready for deployment!
echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions.

pause</content>
<parameter name="filePath">d:\Easy2SolutionsProjects\EasyProjects-Web\PerfumeSeller\perfume\deploy.bat