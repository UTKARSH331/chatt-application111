@echo off
echo Stopping Node.js processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM npm.exe /T 2>nul

echo Deleting locked and corrupted files...
if exist "node_modules" rd /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"
if exist ".eslintcache" del /f /q ".eslintcache"

echo Clearing npm cache...
npm cache clean --force

echo Installing React Scripts specifically...
npm install react-scripts@5.0.1 --save --no-audit --no-fund --legacy-peer-deps

echo Installing all dependencies...
npm install --no-audit --no-fund --legacy-peer-deps

echo.
echo IF SUCCESSFUL, START THE APP WITH: npm start
echo.
echo ==========================================
echo FIX COMPLETED. TRY RUNNING 'npm start' NOW.
echo ==========================================
