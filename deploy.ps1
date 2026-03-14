# BootStuff deploy script
# Run with: npm run deploy

$dest    = "$env:LOCALAPPDATA\BootStuff"
$destExe = "$dest\BootStuff.exe"

Write-Host ""
Write-Host "  BootStuff Deploy" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor DarkGray

# Step 1: Build
Write-Host "[1/3] Building portable exe..." -ForegroundColor Yellow
& npm run build:portable
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

# Step 2: Find the built exe (works for any version number)
$builtExe = Get-ChildItem -Path "dist" -Filter "*.exe" | Select-Object -First 1
if (-not $builtExe) {
    Write-Host "No .exe found in dist\" -ForegroundColor Red
    exit 1
}
Write-Host "[2/3] Found: $($builtExe.Name)" -ForegroundColor Yellow

# Step 3: Create folder if needed
Write-Host "[3/3] Deploying to $destExe ..." -ForegroundColor Yellow
if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
    Write-Host "  Created: $dest" -ForegroundColor DarkGray
}

# Stop running instance so file isn't locked
$running = Get-Process -Name "BootStuff" -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "  Stopping running instance..." -ForegroundColor DarkGray
    $running | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Copy
Copy-Item -Path $builtExe.FullName -Destination $destExe -Force

if (Test-Path $destExe) {
    Write-Host ""
    Write-Host "Deployed successfully!" -ForegroundColor Green
    Write-Host "  $destExe" -ForegroundColor DarkGray
    Write-Host ""
    $launch = Read-Host "Launch now? (y/n)"
    if ($launch -eq "y") {
        Start-Process $destExe
    }
} else {
    Write-Host "Copy failed - file not found at destination." -ForegroundColor Red
}
