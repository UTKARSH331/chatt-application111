Write-Host "=== DEEP FIX: Removing corrupted react-scripts ===" -ForegroundColor Cyan

# Step 1: Kill any node/npm processes
Write-Host "[1/5] Stopping Node/npm processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "npm" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Remove the corrupted react-scripts folder
Write-Host "[2/5] Deleting corrupted react-scripts..." -ForegroundColor Yellow
$rsPath = "node_modules\react-scripts"
if (Test-Path $rsPath) {
    Remove-Item -Recurse -Force $rsPath
    Write-Host "  -> Deleted $rsPath" -ForegroundColor Green
} else {
    Write-Host "  -> $rsPath not found, skipping" -ForegroundColor Gray
}

# Step 3: Remove package-lock.json so npm resolves fresh
Write-Host "[3/5] Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "  -> Deleted package-lock.json" -ForegroundColor Green
}

# Step 4: Install react-scripts@5.0.1 specifically
Write-Host "[4/5] Installing react-scripts@5.0.1..." -ForegroundColor Yellow
npm install react-scripts@5.0.1 --save-exact --legacy-peer-deps --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install react-scripts failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Install remaining dependencies
Write-Host "[5/5] Installing all remaining dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    exit 1
}

# Verify react-scripts binary exists
$rsBin = "node_modules\.bin\react-scripts.cmd"
if (Test-Path $rsBin) {
    Write-Host "" 
    Write-Host "SUCCESS! react-scripts is installed correctly." -ForegroundColor Green
    Write-Host "Run 'npm start' to launch the frontend." -ForegroundColor Cyan
} else {
    Write-Host "WARNING: react-scripts binary not found in .bin after install!" -ForegroundColor Red
}
