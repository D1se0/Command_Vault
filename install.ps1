<#
.SYNOPSIS
    Instalador de Command Vault v2.0 para Windows.

.DESCRIPTION
    - Detecta si Node.js está instalado (mínimo v18); si no, lo instala con winget/choco
      o descarga el instalador MSI oficial.
    - Instala dependencias de server + client.
    - Compila el cliente (Vite) y el servidor (TypeScript).
    - Crea server\.env si no existe.
    - Ofrece registrar Command Vault como Tarea Programada de Windows para que
      arranque automáticamente al iniciar sesión.

.NOTES
    Ejecutar desde PowerShell (no requiere ser administrador salvo para instalar Node.js
    a nivel de sistema o registrar la tarea programada para "todos los usuarios").
#>

$ErrorActionPreference = "Stop"

function Write-Info  { param($msg) Write-Host "[*] $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-ErrorMsg { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Title { param($msg) Write-Host "`n== $msg ==" -ForegroundColor White }

Write-Host @"

   ____                                          _   __            _ _
  / ___|___  _ __ ___  _ __ ___   __ _ _ __   __| | / /_ ___  ___ | | |_
 | |   / _ \| '_ `` _ \| '_ `` _ \ / _`` | '_ \ / _`` |/ / _`` \ \/ / |_  __|
 | |__| (_) | | | | | | | | | | | (_| | | | | (_| / / (_| |>  <|  | |_
  \____\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_/_/\__,_/_/\_\ |_| \__|

                Pentest & Red Team Command Database -- v2.0
"@ -ForegroundColor Magenta

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $BaseDir

# ---------- Node.js ----------
Write-Title "Comprobando Node.js"

$nodeOk = $false
$minMajor = 18

try {
    $nodeVersionRaw = (node -v) 2>$null
    if ($nodeVersionRaw) {
        $nodeVersion = $nodeVersionRaw.TrimStart("v")
        $major = [int]($nodeVersion.Split(".")[0])
        if ($major -ge $minMajor) {
            Write-Ok "Node.js $nodeVersion detectado (cumple el mínimo v$minMajor)"
            $nodeOk = $true
        } else {
            Write-Warn "Node.js $nodeVersion es demasiado antiguo (mínimo v$minMajor)."
        }
    }
} catch {
    Write-Warn "Node.js no está instalado."
}

if (-not $nodeOk) {
    Write-Info "Instalando Node.js LTS..."

    $installed = $false

    # Intento 1: winget (incluido por defecto en Windows 10/11 modernos)
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        try {
            Write-Info "Instalando vía winget..."
            winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
            $installed = $true
        } catch {
            Write-Warn "winget falló, probando con otro método..."
        }
    }

    # Intento 2: Chocolatey
    if (-not $installed -and (Get-Command choco -ErrorAction SilentlyContinue)) {
        try {
            Write-Info "Instalando vía Chocolatey..."
            choco install nodejs-lts -y
            $installed = $true
        } catch {
            Write-Warn "Chocolatey falló, probando con el instalador MSI incluido..."
        }
    }

    # Intento 3: MSI incluido en el paquete (node/node.msi), si existe
    if (-not $installed) {
        $msiPath = Join-Path $BaseDir "node\node.msi"
        if (Test-Path $msiPath) {
            Write-Info "Instalando con el instalador MSI incluido en el paquete..."
            Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait
            $installed = $true
        }
    }

    # Intento 4: descarga directa del instalador oficial
    if (-not $installed) {
        Write-Info "Descargando el instalador oficial de Node.js LTS..."
        $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
        $msiUrl = "https://nodejs.org/dist/latest-v20.x/node-v20.18.0-$arch.msi"
        $msiOut = Join-Path $env:TEMP "node-installer.msi"
        try {
            Invoke-WebRequest -Uri $msiUrl -OutFile $msiOut -UseBasicParsing
            Start-Process msiexec.exe -ArgumentList "/i `"$msiOut`" /qn /norestart" -Wait
            $installed = $true
        } catch {
            Write-ErrorMsg "No se pudo descargar/instalar Node.js automáticamente."
            Write-Host "    Instálalo manualmente desde https://nodejs.org/ (version 18 o superior)"
            Write-Host "    y vuelve a ejecutar este script."
            exit 1
        }
    }

    Write-Warn "Node.js fue instalado. Es posible que necesites cerrar y volver a abrir esta terminal"
    Write-Warn "para que el PATH se actualice. Vuelve a ejecutar este script si 'node' no se reconoce."

    # Refrescar PATH en la sesión actual (best-effort)
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    try {
        $nodeVersionRaw = (node -v) 2>$null
        Write-Ok "Node.js $nodeVersionRaw detectado tras la instalación"
    } catch {
        Write-ErrorMsg "Node.js se instaló pero no se reconoce en esta sesión. Cierra la terminal, ábrela de nuevo y ejecuta install.ps1 otra vez."
        exit 1
    }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-ErrorMsg "npm no está disponible aunque Node.js sí. Revisa tu instalación de Node.js."
    exit 1
}
Write-Ok "npm detectado: $(npm -v)"

# ---------- Build Tools nativas (para better-sqlite3) ----------
Write-Title "Herramientas de compilación nativa"
Write-Info "better-sqlite3 puede requerir Visual Studio Build Tools si no hay binarios precompilados disponibles."
Write-Info "Si la instalación de dependencias falla más abajo, instala 'Visual Studio Build Tools' (workload: Desktop development with C++)"
Write-Info "desde https://visualstudio.microsoft.com/visual-cpp-build-tools/ y vuelve a ejecutar este script."

# ---------- Instalación de dependencias ----------
Write-Title "Instalando dependencias del proyecto"

npm install --no-fund --no-audit
Write-Ok "Dependencias instaladas"

# ---------- Build ----------
Write-Title "Compilando Command Vault"

Write-Info "Construyendo el cliente (Vite build)..."
npm run build -w client
Write-Ok "Cliente compilado en client\dist"

Write-Info "Compilando el servidor (TypeScript)..."
npm run build -w server
Write-Ok "Servidor compilado en server\dist"

# ---------- Configuración ----------
Write-Title "Configuración"

$envFile = Join-Path $BaseDir "server\.env"
if (-not (Test-Path $envFile)) {
    @"
PORT=5179
DB_PATH=./data/command-vault.db
NODE_ENV=production
"@ | Out-File -FilePath $envFile -Encoding utf8
    Write-Ok "Archivo server\.env creado con valores por defecto"
} else {
    Write-Ok "server\.env ya existe, se mantiene tal cual"
}

New-Item -ItemType Directory -Force -Path (Join-Path $BaseDir "server\data") | Out-Null

# ---------- Tarea programada (arranque automático opcional) ----------
Write-Title "Arranque automático (Tarea Programada)"
$answer = Read-Host "¿Quieres que Command Vault arranque automáticamente al iniciar sesión en Windows? [s/N]"

if ($answer -match '^[sS]') {
    $taskName = "CommandVault"
    $nodeExe = (Get-Command node).Source
    $serverEntry = Join-Path $BaseDir "server\dist\index.js"

    $action = New-ScheduledTaskAction -Execute $nodeExe -Argument "`"$serverEntry`"" -WorkingDirectory (Join-Path $BaseDir "server")
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Command Vault - Pentest command database server" | Out-Null
        Write-Ok "Tarea programada '$taskName' creada. Se iniciará automáticamente al iniciar sesión."
        Write-Host ""
        Write-Host "Gestión de la tarea:"
        Write-Host "  Start-ScheduledTask -TaskName $taskName"
        Write-Host "  Stop-ScheduledTask  -TaskName $taskName"
        Write-Host "  Get-ScheduledTask   -TaskName $taskName | Select State"
        Write-Host "  Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false   # desinstalar"
        Write-Host ""

        $startNow = Read-Host "¿Iniciar Command Vault ahora? [S/n]"
        if ($startNow -notmatch '^[nN]') {
            Start-ScheduledTask -TaskName $taskName
            Write-Ok "Command Vault iniciado en segundo plano."
        }
    } catch {
        Write-Warn "No se pudo crear la tarea programada automáticamente: $_"
        Write-Host "Puedes arrancar Command Vault manualmente con .\start.ps1"
    }
} else {
    Write-Title "Instalación completada"
    Write-Ok "Command Vault está listo."
    Write-Host ""
    Write-Host "Para arrancarlo manualmente:"
    Write-Host "  .\start.ps1        (modo producción, usa el build compilado)"
    Write-Host "  npm run dev        (modo desarrollo con recarga en caliente)"
}

Write-Ok "¡Instalación finalizada!"
