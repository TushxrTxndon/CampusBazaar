# Quick fix script to add Node.js to PATH in current terminal session
# Run this in your terminal: .\fix-path.ps1

$env:Path += ";C:\Program Files\nodejs"

Write-Host "Node.js added to PATH for this session!" -ForegroundColor Green
Write-Host "Node version: $(node --version)" -ForegroundColor Cyan
Write-Host "npm version: $(npm --version)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the dev server, run: npm run dev" -ForegroundColor Yellow

