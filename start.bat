@echo off
REM Command Vault v2.0 - Arranque rapido para Windows
setlocal
set BASEDIR=%~dp0

echo.
echo  Iniciando Command Vault...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%BASEDIR%start.ps1"

pause
