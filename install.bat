@echo off
set BASEDIR=%~dp0
set NODE_MSI=%BASEDIR%node\node.msi

echo Checking Node installation...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node not found. Installing Node.js...
    msiexec /i "%NODE_MSI%" /qn /norestart

    echo Node installed. Restarting installer...
    start "" cmd /k "%~f0"
    exit /b
)

echo Node already available

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm not found. Something went wrong.
    pause
    exit /b 1
)

echo Installing SERVER deps...
cd /d "%BASEDIR%server"
call npm install

echo Installing CLIENT deps...
cd /d "%BASEDIR%client"
call npm install

echo.
echo ✅ Installation completed successfully
pause
