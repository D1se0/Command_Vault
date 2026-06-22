<#
.SYNOPSIS
    Arranca Command Vault en modo desarrollo en Windows (recarga en caliente).
#>
$ErrorActionPreference = "Stop"
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $BaseDir

Write-Host "Iniciando Command Vault en modo desarrollo..." -ForegroundColor Cyan
Write-Host "    Cliente (Vite):  http://localhost:5173"
Write-Host "    Servidor (API):  http://localhost:5179"
Write-Host ""

npm run dev
