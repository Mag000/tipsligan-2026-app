# Tipsligan 2026 App - Project Verification
# This script verifies all files are in place

Write-Host ""
Write-Host "🔍 Tipsligan 2026 App - Project Verification" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Function to check file
function Test-ProjectFile {
    param($path, $name)
    if (Test-Path $path) {
        Write-Host "  ✅ $name" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "  ❌ $name - MISSING" -ForegroundColor Red
        return $false
    }
}

Write-Host "📂 Checking Core Files..." -ForegroundColor Yellow
$allGood = (Test-ProjectFile "package.json" "package.json") -and $allGood
$allGood = (Test-ProjectFile "tsconfig.json" "tsconfig.json") -and $allGood
$allGood = (Test-ProjectFile ".env" ".env") -and $allGood
$allGood = (Test-ProjectFile ".gitignore" ".gitignore") -and $allGood
$allGood = (Test-ProjectFile "README.md" "README.md") -and $allGood
$allGood = (Test-ProjectFile "START.ps1" "START.ps1") -and $allGood

Write-Host ""
Write-Host "📂 Checking Public Files..." -ForegroundColor Yellow
$allGood = (Test-ProjectFile "public/index.html" "public/index.html") -and $allGood

Write-Host ""
Write-Host "📂 Checking Source Files..." -ForegroundColor Yellow
$allGood = (Test-ProjectFile "src/App.tsx" "src/App.tsx") -and $allGood
$allGood = (Test-ProjectFile "src/index.tsx" "src/index.tsx") -and $allGood
$allGood = (Test-ProjectFile "src/index.css" "src/index.css") -and $allGood

Write-Host ""
Write-Host "📂 Checking Hooks..." -ForegroundColor Yellow
$allGood = (Test-ProjectFile "src/hooks/useToken.ts" "src/hooks/useToken.ts") -and $allGood

Write-Host ""
Write-Host "📂 Checking Pages..." -ForegroundColor Yellow
$allGood = (Test-ProjectFile "src/pages/Login.tsx" "src/pages/Login.tsx") -and $allGood
$allGood = (Test-ProjectFile "src/pages/Home.tsx" "src/pages/Home.tsx") -and $allGood
$allGood = (Test-ProjectFile "src/pages/Standings.tsx" "src/pages/Standings.tsx") -and $allGood
$allGood = (Test-ProjectFile "src/pages/Matches.tsx" "src/pages/Matches.tsx") -and $allGood
$allGood = (Test-ProjectFile "src/pages/Profile.tsx" "src/pages/Profile.tsx") -and $allGood

Write-Host ""
Write-Host "📂 Checking Services..." -ForegroundColor Yellow
$allGood = (Test-ProjectFile "src/services/APIManager.ts" "src/services/APIManager.ts") -and $allGood

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host ""
    Write-Host "✅ All files present and verified!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to start!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run: .\START.ps1" -ForegroundColor White
    Write-Host "  2. Or: npm install && npm start" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "❌ Some files are missing!" -ForegroundColor Red
    Write-Host "Please check the output above." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "📖 For detailed documentation, see README.md" -ForegroundColor Cyan
Write-Host ""
