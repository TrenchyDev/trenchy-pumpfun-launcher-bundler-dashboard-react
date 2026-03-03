@echo off
title Pump Launcher - Local Dev
cd /d "%~dp0"

echo.
echo ========================================
echo   Pump Launcher - Starting Local Dev
echo ========================================
echo.

echo [1/2] Killing any processes on ports 5173 and 3001...
node kill-ports.js
timeout /t 2 /nobreak >nul
echo.

echo [2/2] Starting frontend and backend...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
echo Press Ctrl+C to stop both servers.
echo ========================================
echo.

npm run dev

pause
