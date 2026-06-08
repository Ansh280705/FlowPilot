# Orvicc Setup Script for Windows

Write-Host "🚀 Setting up Orvicc..." -ForegroundColor Green

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit backend\.env with your credentials" -ForegroundColor Yellow
}
Set-Location ..

# Setup Extension
Write-Host "📦 Setting up extension..." -ForegroundColor Yellow
Set-Location extension
npm install
Set-Location ..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend\.env with your DATABASE_URL and GROQ_API_KEY"
Write-Host "2. Run database migrations: cd backend; npm run db:migrate"
Write-Host "3. Start backend: cd backend; npm run dev"
Write-Host "4. Build extension: cd extension; npm run build"
Write-Host "5. Load extension in Chrome from extension\dist folder"
