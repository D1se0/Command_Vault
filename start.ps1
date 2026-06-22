<#
.SYNOPSIS
    Arranca Command Vault en modo producción en Windows.
#>
$ErrorActionPreference = "Stop"
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $BaseDir

if (-not (Test-Path "server\dist\index.js")) {
    Write-Host "[!] El servidor no está compilado todavía. Ejecutando build..." -ForegroundColor Yellow
    npm run build -w server
}

if (-not (Test-Path "client\dist")) {
    Write-Host "[!] El cliente no está compilado todavía. Ejecutando build..." -ForegroundColor Yellow
    npm run build -w client
}

$port = "5179"
$envFile = "server\.env"
if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^PORT=' }
    if ($line) { $port = ($line -split '=')[1].Trim() }
}

Write-Host "Iniciando Command Vault..." -ForegroundColor Cyan
Write-Host "    URL: http://localhost:$port"
Write-Host ""

Set-Location server
node dist/index.js
