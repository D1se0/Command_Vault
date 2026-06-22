#!/usr/bin/env bash
#
# Instala Command Vault como servicio systemd.
# Genera el unit file dinámicamente apuntando a la ruta real del proyecto
# y al usuario que ejecuta el script (no se ejecuta como root salvo que
# el usuario lo invoque explícitamente con sudo).
#
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()  { echo -e "${BLUE}[*]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

if ! command -v systemctl >/dev/null 2>&1; then
    err "systemd no está disponible en este sistema."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICE_NAME="command-vault"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

RUN_AS_USER="${SUDO_USER:-$(whoami)}"
NODE_BIN="$(command -v node || true)"

if [ -z "$NODE_BIN" ]; then
    err "No se encontró el binario de Node.js en PATH. Instala Node.js antes de continuar."
    exit 1
fi

if [ ! -f "$PROJECT_DIR/server/dist/index.js" ]; then
    err "No se encontró server/dist/index.js. Ejecuta primero ./install.sh o 'npm run build -w server'."
    exit 1
fi

info "Usuario que ejecutará el servicio: $RUN_AS_USER"
info "Directorio del proyecto: $PROJECT_DIR"
info "Binario de Node.js: $NODE_BIN"

TMP_SERVICE_FILE="$(mktemp)"
cat > "$TMP_SERVICE_FILE" << EOF
[Unit]
Description=Command Vault - Pentest & Red Team Command Database
After=network.target
Documentation=https://github.com/

[Service]
Type=simple
User=${RUN_AS_USER}
WorkingDirectory=${PROJECT_DIR}/server
ExecStart=${NODE_BIN} ${PROJECT_DIR}/server/dist/index.js
Restart=on-failure
RestartSec=3
Environment=NODE_ENV=production
EnvironmentFile=-${PROJECT_DIR}/server/.env

# Hardening básico (ajusta si necesitas acceso a más rutas)
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=${PROJECT_DIR}/server/data

[Install]
WantedBy=multi-user.target
EOF

if [ "$(id -u)" -ne 0 ]; then
    info "Se requieren privilegios de administrador para instalar el servicio en /etc/systemd/system."
    sudo cp "$TMP_SERVICE_FILE" "$SERVICE_FILE"
    sudo systemctl daemon-reload
else
    cp "$TMP_SERVICE_FILE" "$SERVICE_FILE"
    systemctl daemon-reload
fi

rm -f "$TMP_SERVICE_FILE"
ok "Servicio creado en $SERVICE_FILE"

read -r -p "¿Habilitar el servicio para que arranque automáticamente al iniciar el sistema? [S/n]: " answer
case "$answer" in
    [nN]|[nN][oO]) ;;
    *)
        if [ "$(id -u)" -ne 0 ]; then sudo systemctl enable "$SERVICE_NAME"; else systemctl enable "$SERVICE_NAME"; fi
        ok "Servicio habilitado (arranque automático activado)"
        ;;
esac

read -r -p "¿Iniciar el servicio ahora? [S/n]: " answer2
case "$answer2" in
    [nN]|[nN][oO]) ;;
    *)
        if [ "$(id -u)" -ne 0 ]; then sudo systemctl start "$SERVICE_NAME"; else systemctl start "$SERVICE_NAME"; fi
        ok "Servicio iniciado"
        ;;
esac

echo ""
echo -e "${BOLD}Gestión del servicio:${NC}"
echo "  sudo systemctl status   $SERVICE_NAME"
echo "  sudo systemctl start    $SERVICE_NAME"
echo "  sudo systemctl stop     $SERVICE_NAME"
echo "  sudo systemctl restart  $SERVICE_NAME"
echo "  sudo systemctl enable   $SERVICE_NAME   # arranque automático"
echo "  sudo systemctl disable  $SERVICE_NAME   # desactivar arranque automático"
echo "  journalctl -u $SERVICE_NAME -f          # ver logs en vivo"
echo ""
echo "También puedes usar el script de ayuda: ./scripts/command-vault-ctl.sh {status|start|stop|restart|enable|disable|logs}"
