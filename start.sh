#!/usr/bin/env bash
#
# Arranca Command Vault en modo producción (usa el build compilado).
# Para Linux con systemd, se recomienda usar el servicio en su lugar:
#   ./scripts/command-vault-ctl.sh start
#
set -euo pipefail

BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASEDIR"

if [ ! -f "server/dist/index.js" ]; then
    echo "[!] El servidor no está compilado todavía. Ejecutando build..."
    npm run build -w server
fi

if [ ! -d "client/dist" ]; then
    echo "[!] El cliente no está compilado todavía. Ejecutando build..."
    npm run build -w client
fi

PORT="$(grep -E '^PORT=' server/.env 2>/dev/null | cut -d= -f2 || echo 5179)"
PORT="${PORT:-5179}"

echo "🛡️  Iniciando Command Vault..."
echo "    URL: http://localhost:${PORT}"
echo ""

cd server
exec node dist/index.js
