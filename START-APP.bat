@echo off
title YT-Chat App - Deep Fix and Start
color 0A

echo.
echo ============================================================
echo   YT-CHAT APPLICATION - DEEP FIX AND START
echo ============================================================
echo.

echo [1/6] Stopping Node.js and npm processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM npm.exe /T >nul 2>&1
taskkill /F /IM nodemon.exe /T >nul 2>&1
echo Done.

echo.
echo [2/6] Cleaning frontend directory...
cd /d "c:\Users\91735\Desktop\projects\yt-chat-application\frontend"
if exist "node_modules" (
    echo Removing node_modules - please wait...
    rd /s /q "node_modules"
)
if exist "package-lock.json" del /f /q "package-lock.json"
echo Done.

echo.
echo [3/6] Clearing npm cache...
npm cache clean --force
echo Done.

echo.
echo [4/6] Installing react-scripts@5.0.1...
npm install react-scripts@5.0.1 --save-exact --legacy-peer-deps --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install react-scripts! Check your internet connection.
    pause
    exit /b 1
)

echo.
echo [5/6] Installing all remaining dependencies...
npm install --legacy-peer-deps --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
if exist "node_modules\.bin\react-scripts.cmd" (
    echo SUCCESS: react-scripts installed correctly!
) else (
    echo WARNING: react-scripts binary not found. Something went wrong.
    pause
    exit /b 1
)

echo.
echo [6/6] Starting the application...
echo Starting backend in a new window...
cd /d "c:\Users\91735\Desktop\projects\yt-chat-application\backend"
npm install --no-audit --no-fund
start "YT-Chat Backend" cmd /k npm run dev

echo.
echo Starting frontend...
cd /d "c:\Users\91735\Desktop\projects\yt-chat-application\frontend"
echo.
echo ============================================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000  (opens automatically)
echo ============================================================
echo.
npm start
