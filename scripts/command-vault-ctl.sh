#!/usr/bin/env bash
#
# Wrapper amigable para gestionar el servicio systemd de Command Vault.
#
# Uso:
#   ./scripts/command-vault-ctl.sh status
#   ./scripts/command-vault-ctl.sh start
#   ./scripts/command-vault-ctl.sh stop
#   ./scripts/command-vault-ctl.sh restart
#   ./scripts/command-vault-ctl.sh enable
#   ./scripts/command-vault-ctl.sh disable
#   ./scripts/command-vault-ctl.sh logs
#
set -euo pipefail

SERVICE_NAME="command-vault"
RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

if ! command -v systemctl >/dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} systemd no está disponible en este sistema."
    exit 1
fi

if ! systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
    echo -e "${RED}[ERROR]${NC} El servicio '${SERVICE_NAME}' no está instalado."
    echo "Instálalo primero con: ./scripts/install-systemd-service.sh"
    exit 1
fi

ACTION="${1:-status}"

case "$ACTION" in
    status)
        systemctl status "$SERVICE_NAME" --no-pager
        ;;
    start)
        echo -e "${BLUE}[*]${NC} Iniciando $SERVICE_NAME..."
        sudo systemctl start "$SERVICE_NAME"
        echo -e "${GREEN}[OK]${NC} Servicio iniciado"
        ;;
    stop)
        echo -e "${BLUE}[*]${NC} Deteniendo $SERVICE_NAME..."
        sudo systemctl stop "$SERVICE_NAME"
        echo -e "${GREEN}[OK]${NC} Servicio detenido"
        ;;
    restart)
        echo -e "${BLUE}[*]${NC} Reiniciando $SERVICE_NAME..."
        sudo systemctl restart "$SERVICE_NAME"
        echo -e "${GREEN}[OK]${NC} Servicio reiniciado"
        ;;
    enable)
        sudo systemctl enable "$SERVICE_NAME"
        echo -e "${GREEN}[OK]${NC} Arranque automático activado"
        ;;
    disable)
        sudo systemctl disable "$SERVICE_NAME"
        echo -e "${GREEN}[OK]${NC} Arranque automático desactivado"
        ;;
    logs)
        journalctl -u "$SERVICE_NAME" -f
        ;;
    *)
        echo "Uso: $0 {status|start|stop|restart|enable|disable|logs}"
        exit 1
        ;;
esac
