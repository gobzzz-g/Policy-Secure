#!/usr/bin/env pwsh
# Firebase Deployment Script for PolicySecure
# Automates the build and deployment process

Write-Host "🚀 PolicySecure Firebase Deployment" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "firebase.json")) {
    Write-Host "❌ Error: firebase.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check Firebase CLI
Write-Host "📋 Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase CLI not found. Install with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Firebase CLI: $firebaseVersion`n" -ForegroundColor Green

# Check if logged in
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Yellow
$projects = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged into Firebase. Run: firebase login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated`n" -ForegroundColor Green

# Ask user what to deploy
Write-Host "What would you like to deploy?" -ForegroundColor Cyan
Write-Host "1. Everything (Hosting + Functions + Rules)"
Write-Host "2. Hosting only"
Write-Host "3. Functions only"
Write-Host "4. Firestore rules only"
Write-Host "5. Test with emulators"
$choice = Read-Host "`nEnter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n🏗️  Building frontend..." -ForegroundColor Yellow
        Set-Location frontend
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Frontend build failed" -ForegroundColor Red
            exit 1
        }
        Set-Location ..
        Write-Host "✅ Frontend built successfully`n" -ForegroundColor Green
        
        Write-Host "☁️  Deploying everything to Firebase..." -ForegroundColor Yellow
        firebase deploy
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
            Write-Host "`n📱 Your app is now live!" -ForegroundColor Cyan
        } else {
            Write-Host "`n❌ Deployment failed" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host "`n🏗️  Building frontend..." -ForegroundColor Yellow
        Set-Location frontend
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Frontend build failed" -ForegroundColor Red
            exit 1
        }
        Set-Location ..
        Write-Host "✅ Frontend built successfully`n" -ForegroundColor Green
        
        Write-Host "☁️  Deploying hosting..." -ForegroundColor Yellow
        firebase deploy --only hosting
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Hosting deployed!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Deployment failed" -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host "`n☁️  Deploying functions..." -ForegroundColor Yellow
        Write-Host "`n⚠️  Make sure you've set environment variables:" -ForegroundColor Yellow
        Write-Host "   In Firebase Console → Functions → Configuration" -ForegroundColor Yellow
        Write-Host "   Add: GEMINI_API_KEY = your-api-key`n" -ForegroundColor Yellow
        
        $confirm = Read-Host "Continue with deployment? (y/n)"
        if ($confirm -eq "y") {
            firebase deploy --only functions
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ Functions deployed!" -ForegroundColor Green
            } else {
                Write-Host "`n❌ Deployment failed" -ForegroundColor Red
            }
        }
    }
    
    "4" {
        Write-Host "`n☁️  Deploying Firestore rules..." -ForegroundColor Yellow
        firebase deploy --only firestore:rules
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Rules deployed!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Deployment failed" -ForegroundColor Red
        }
    }
    
    "5" {
        Write-Host "`n🧪 Starting Firebase emulators..." -ForegroundColor Yellow
        Write-Host "`nEmulators will start on:" -ForegroundColor Cyan
        Write-Host "  • Auth: http://localhost:9099"
        Write-Host "  • Firestore: http://localhost:8080"
        Write-Host "  • Functions: http://localhost:5001"
        Write-Host "  • Hosting: http://localhost:5000"
        Write-Host "  • Storage: http://localhost:9199"
        Write-Host "  • Emulator UI: http://localhost:4000`n"
        
        firebase emulators:start
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✨ Done!" -ForegroundColor Cyan
