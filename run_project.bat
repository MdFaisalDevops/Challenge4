@echo off
echo ===================================================
echo   CrowdMind AI: Starting Platform Servers...
echo ===================================================
echo.

:: Check if Node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on your system!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b
)

:: Check if node_modules folder exists
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)

echo.
echo [INFO] Starting servers (Express backend on 5000, Next.js frontend on 3000)...
echo.
call npm run dev
pause
