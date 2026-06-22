#!/usr/bin/env bash
#
# Desinstala el servicio systemd de Command Vault (no borra el proyecto ni la base de datos).
#
set -euo pipefail

SERVICE_NAME="command-vault"
GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

if ! command -v systemctl >/dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} systemd no está disponible en este sistema."
    exit 1
fi

if ! systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
    echo "El servicio '${SERVICE_NAME}' no está instalado. Nada que hacer."
    exit 0
fi

echo -e "${BLUE}[*]${NC} Deteniendo y deshabilitando el servicio..."
sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true
sudo systemctl disable "$SERVICE_NAME" 2>/dev/null || true

echo -e "${BLUE}[*]${NC} Eliminando el unit file..."
sudo rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
sudo systemctl daemon-reload
sudo systemctl reset-failed 2>/dev/null || true

echo -e "${GREEN}[OK]${NC} Servicio systemd desinstalado. El proyecto y la base de datos no se han modificado."
