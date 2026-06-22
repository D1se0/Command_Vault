#!/usr/bin/env bash
#
# Command Vault v2.0 — Instalador para Linux / macOS
#
# - Detecta el sistema operativo y el gestor de paquetes
# - Instala Node.js (LTS) si no está presente
# - Instala dependencias de server + client
# - Compila el cliente (build de producción) y el servidor (TypeScript)
# - En Linux, ofrece instalar Command Vault como servicio systemd
#
set -euo pipefail

# ---------- Colores ----------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

info()  { echo -e "${BLUE}[*]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
title() { echo -e "\n${BOLD}== $1 ==${NC}"; }

BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MIN_MAJOR=18
REQUIRED_NODE_VERSION="20"

cat << "EOF"

   ____                                          _   __            _ _
  / ___|___  _ __ ___  _ __ ___   __ _ _ __   __| | / /_ ___  ___ | | |_
 | |   / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` |/ / _` \ \/ / |_  __|
 | |__| (_) | | | | | | | | | | | (_| | | | | (_| / / (_| |>  <|  | |_
  \____\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_/_/\__,_/_/\_\ |_| \__|

                 Pentest & Red Team Command Database — v2.0
EOF

title "Detectando sistema operativo"

OS="unknown"
case "$(uname -s)" in
    Linux*)  OS="linux" ;;
    Darwin*) OS="macos" ;;
    *)       OS="unknown" ;;
esac

if [ "$OS" = "unknown" ]; then
    err "Sistema operativo no reconocido. Usa install.ps1 en Windows o sigue la guía manual del README."
    exit 1
fi
ok "Sistema detectado: $OS"

PKG_MANAGER=""
if [ "$OS" = "linux" ]; then
    if command -v apt-get >/dev/null 2>&1; then PKG_MANAGER="apt"
    elif command -v dnf >/dev/null 2>&1; then PKG_MANAGER="dnf"
    elif command -v yum >/dev/null 2>&1; then PKG_MANAGER="yum"
    elif command -v pacman >/dev/null 2>&1; then PKG_MANAGER="pacman"
    elif command -v zypper >/dev/null 2>&1; then PKG_MANAGER="zypper"
    elif command -v apk >/dev/null 2>&1; then PKG_MANAGER="apk"
    fi
    [ -n "$PKG_MANAGER" ] && ok "Gestor de paquetes detectado: $PKG_MANAGER" || warn "No se detectó un gestor de paquetes conocido."
elif [ "$OS" = "macos" ]; then
    if command -v brew >/dev/null 2>&1; then PKG_MANAGER="brew"
    else warn "Homebrew no está instalado. Se recomienda instalarlo desde https://brew.sh para gestionar Node.js fácilmente."
    fi
fi

# ---------- Node.js ----------
title "Comprobando Node.js"

node_ok=false
if command -v node >/dev/null 2>&1; then
    NODE_VERSION="$(node -v | sed 's/v//')"
    NODE_MAJOR="${NODE_VERSION%%.*}"
    if [ "$NODE_MAJOR" -ge "$NODE_MIN_MAJOR" ]; then
        ok "Node.js $NODE_VERSION detectado (cumple el mínimo v$NODE_MIN_MAJOR)"
        node_ok=true
    else
        warn "Node.js $NODE_VERSION es demasiado antiguo (mínimo v$NODE_MIN_MAJOR). Se instalará una versión más reciente."
    fi
else
    warn "Node.js no está instalado."
fi

if [ "$node_ok" = false ]; then
    info "Instalando Node.js v${REQUIRED_NODE_VERSION} LTS..."

    if [ "$OS" = "linux" ]; then
        case "$PKG_MANAGER" in
            apt)
                curl -fsSL "https://deb.nodesource.com/setup_${REQUIRED_NODE_VERSION}.x" | sudo -E bash - >/dev/null 2>&1 || \
                    warn "No se pudo configurar el repositorio NodeSource (¿sin conexión?). Continuando con lo disponible."
                sudo apt-get install -y nodejs
                ;;
            dnf)
                curl -fsSL "https://rpm.nodesource.com/setup_${REQUIRED_NODE_VERSION}.x" | sudo -E bash - >/dev/null 2>&1 || true
                sudo dnf install -y nodejs
                ;;
            yum)
                curl -fsSL "https://rpm.nodesource.com/setup_${REQUIRED_NODE_VERSION}.x" | sudo -E bash - >/dev/null 2>&1 || true
                sudo yum install -y nodejs
                ;;
            pacman)
                sudo pacman -Sy --noconfirm nodejs npm
                ;;
            zypper)
                sudo zypper install -y nodejs20 npm20 || sudo zypper install -y nodejs npm
                ;;
            apk)
                sudo apk add --no-cache nodejs npm
                ;;
            *)
                err "No se pudo determinar cómo instalar Node.js automáticamente."
                echo "    Instálalo manualmente desde https://nodejs.org/ (versión 18 o superior) y vuelve a ejecutar este script."
                exit 1
                ;;
        esac
    elif [ "$OS" = "macos" ]; then
        if command -v brew >/dev/null 2>&1; then
            brew install node@20 || brew install node
            brew link --overwrite node@20 2>/dev/null || true
        else
            err "Instala Homebrew (https://brew.sh) o Node.js manualmente desde https://nodejs.org/ y vuelve a ejecutar."
            exit 1
        fi
    fi

    if ! command -v node >/dev/null 2>&1; then
        err "La instalación automática de Node.js falló. Instálalo manualmente y vuelve a ejecutar este script."
        exit 1
    fi
    ok "Node.js instalado: $(node -v)"
fi

if ! command -v npm >/dev/null 2>&1; then
    err "npm no está disponible aunque Node.js sí. Revisa tu instalación de Node.js."
    exit 1
fi
ok "npm detectado: $(npm -v)"

# ---------- Dependencias del sistema para compilar better-sqlite3 ----------
title "Comprobando herramientas de compilación nativa"

if [ "$OS" = "linux" ]; then
    if ! command -v make >/dev/null 2>&1 || ! command -v gcc >/dev/null 2>&1 && ! command -v g++ >/dev/null 2>&1; then
        warn "Faltan herramientas de compilación (build-essential / Development Tools)."
        case "$PKG_MANAGER" in
            apt)    sudo apt-get install -y build-essential python3 ;;
            dnf)    sudo dnf groupinstall -y "Development Tools"; sudo dnf install -y python3 ;;
            yum)    sudo yum groupinstall -y "Development Tools"; sudo yum install -y python3 ;;
            pacman) sudo pacman -Sy --noconfirm base-devel python ;;
            zypper) sudo zypper install -y -t pattern devel_basis; sudo zypper install -y python3 ;;
            apk)    sudo apk add --no-cache build-base python3 ;;
            *)      warn "Instala manualmente un compilador C/C++ y Python 3 si la compilación de dependencias nativas falla." ;;
        esac
    else
        ok "Herramientas de compilación disponibles"
    fi
elif [ "$OS" = "macos" ]; then
    if ! xcode-select -p >/dev/null 2>&1; then
        warn "Las Command Line Tools de Xcode no están instaladas. Lanzando instalador..."
        xcode-select --install || true
        echo "    Completa la instalación de Xcode Command Line Tools y vuelve a ejecutar este script."
        exit 1
    else
        ok "Xcode Command Line Tools disponibles"
    fi
fi

# ---------- Instalación de dependencias del proyecto ----------
title "Instalando dependencias del proyecto"

cd "$BASEDIR"

info "Instalando dependencias raíz / server / client (npm workspaces)..."
npm install --no-fund --no-audit
ok "Dependencias instaladas"

# ---------- Build ----------
title "Compilando Command Vault"

info "Construyendo el cliente (Vite build)..."
npm run build -w client
ok "Cliente compilado en client/dist"

info "Compilando el servidor (TypeScript)..."
npm run build -w server
ok "Servidor compilado en server/dist"

# ---------- Configuración del entorno ----------
title "Configuración"

ENV_FILE="$BASEDIR/server/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << ENVEOF
PORT=5179
DB_PATH=./data/command-vault.db
NODE_ENV=production
ENVEOF
    ok "Archivo server/.env creado con valores por defecto"
else
    ok "server/.env ya existe, se mantiene tal cual"
fi

mkdir -p "$BASEDIR/server/data"

# ---------- systemd (solo Linux) ----------
INSTALL_SERVICE=false
if [ "$OS" = "linux" ] && command -v systemctl >/dev/null 2>&1; then
    title "Servicio systemd"
    echo "¿Quieres instalar Command Vault como servicio systemd?"
    echo "Esto permite arrancarlo automáticamente al iniciar el sistema y gestionarlo con:"
    echo "  systemctl status|start|stop|restart|enable|disable command-vault"
    read -r -p "Instalar como servicio systemd [s/N]: " answer
    case "$answer" in
        [sS]|[sS][iI]) INSTALL_SERVICE=true ;;
        *) INSTALL_SERVICE=false ;;
    esac
fi

if [ "$INSTALL_SERVICE" = true ]; then
    bash "$BASEDIR/scripts/install-systemd-service.sh"
else
    title "Instalación completada"
    ok "Command Vault está listo."
    echo ""
    echo "Para arrancarlo manualmente:"
    echo "  ${BOLD}./start.sh${NC}            (modo producción, usa el build compilado)"
    echo "  ${BOLD}npm run dev${NC}            (modo desarrollo con recarga en caliente)"
    echo ""
    if [ "$OS" = "linux" ] && command -v systemctl >/dev/null 2>&1; then
        echo "También puedes instalar el servicio systemd más tarde con:"
        echo "  ${BOLD}./scripts/install-systemd-service.sh${NC}"
        echo ""
    fi
fi

ok "¡Instalación finalizada! 🛡️"
