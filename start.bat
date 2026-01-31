@echo off
set BASEDIR=%~dp0

echo Starting application...

cd /d "%BASEDIR%"

start "Command Vault" cmd /k npm run dev

timeout /t 3 >nul

echo Opening browser...
start http://localhost:5173

echo.
echo 🚀 Command Vault running
