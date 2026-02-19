@echo off
echo ==========================================
echo YT-CHAT-APPLICATION DEFINITIVE FIX
echo ==========================================
echo.

echo [1/4] Closing any active Node/NPM processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM npm.exe /T 2>nul

echo [2/4] Verifying Frontend Configuration...
cd frontend
:: Double check react-scripts version in package.json
powershell -Command "(Get-Content package.json) -replace '\"react-scripts\": \".*\"', '\"react-scripts\": \"^5.0.1\"' | Set-Content package.json"

echo [3/4] Performing Clean Installation...
if exist "node_modules" rd /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"

echo Installing dependencies...
npm install --no-audit --no-fund --legacy-peer-deps

echo.
echo [4/4] Starting the Application...
echo Starting Backend in new window...
start cmd /k "cd ..\backend && npm install && npm run dev"

echo Starting Frontend...
npm start
