# Master Launch Script - Starts both backend and frontend
# Run this after setup is complete

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   Unified AI Insurance Claims Processing Platform         ║
║   Starting Application...                                  ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""

# Check if setup was completed
if (!(Test-Path "backend\.env")) {
    Write-Host "⚠ Backend .env file not found!" -ForegroundColor Red
    Write-Host "Please run setup first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  .\setup.ps1" -ForegroundColor White
    exit 1
}

if (!(Test-Path ".venv")) {
    Write-Host "⚠ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run backend setup first" -ForegroundColor Yellow
    exit 1
}

if (!(Test-Path "frontend\node_modules")) {
    Write-Host "⚠ Frontend dependencies not installed!" -ForegroundColor Red
    Write-Host "Please run frontend setup first:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  .\setup.ps1" -ForegroundColor White
    exit 1
}

Write-Host "✓ All setup checks passed" -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\.venv\Scripts\Activate.ps1; cd backend; uvicorn main:app --reload"
Write-Host "✓ Backend starting at http://localhost:8000" -ForegroundColor Green

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start"
Write-Host "✓ Frontend starting at http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Application Started Successfully!                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Default Login (Quick Test):" -ForegroundColor Yellow
Write-Host "  Email:    user@example.com" -ForegroundColor White
Write-Host "  Password: user123" -ForegroundColor White
Write-Host ""
Write-Host "See SETUP_GUIDE.md for all login credentials" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C in the server windows to stop" -ForegroundColor Gray
Write-Host ""
