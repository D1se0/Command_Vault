#!/usr/bin/env bash
#
# Arranca Command Vault en modo desarrollo (recarga en caliente,
# servidor en :5179 y cliente Vite en :5173 con proxy hacia el servidor).
#
set -euo pipefail

BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASEDIR"

echo "🛡️  Iniciando Command Vault en modo desarrollo..."
echo "    Cliente (Vite):  http://localhost:5173"
echo "    Servidor (API):  http://localhost:5179"
echo ""

npm run dev
