@echo off
REM Command Vault v2.0 - Instalador para Windows
REM Este .bat simplemente lanza el instalador PowerShell (install.ps1),
REM que es mucho mas completo: detecta/instala Node.js, compila el
REM proyecto y puede registrar el arranque automatico.

setlocal
set BASEDIR=%~dp0

echo.
echo  Command Vault v2.0 - Instalador
echo  ================================
echo.
echo  Lanzando instalador de PowerShell...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%BASEDIR%install.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] La instalacion fallo. Revisa los mensajes anteriores.
    pause
    exit /b 1
)

echo.
pause
