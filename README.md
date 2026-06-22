# 🛡️ Command Vault v2.0

**Tu base de datos local de comandos para pentesting, red team y administración de sistemas.**

Command Vault es una aplicación web autoalojada (self-hosted) que se ejecuta por completo en tu máquina: sin nube, sin telemetría, sin dependencias externas en tiempo de ejecución. Guarda, organiza, versiona y busca comandos de hacking ético en segundos, directamente desde tu navegador.

Incluye una base de datos inicial de **258 comandos curados**, organizados en **17 categorías** que cubren todas las fases de un pentest: reconocimiento, escaneo, web hacking, Active Directory, escalada de privilegios, explotación, post-explotación, cracking, wireless, cloud, mobile y forense.

---

## ✨ Características principales

- **Búsqueda avanzada**: por título, descripción, contenido del comando, lenguaje o tags — tanto dentro de una sección como en todo el vault a la vez.
- **Sistema de tags**: clasifica y filtra comandos combinando texto libre + etiquetas.
- **Versionado de comandos**: cada edición guarda un histórico. Puedes fijar (pin) una versión como la preferida sin perder las anteriores.
- **Favoritos**: marca tus comandos más usados para acceder a ellos con un clic desde cualquier sección.
- **Niveles de riesgo**: cada comando puede etiquetarse como `info`, `bajo`, `medio`, `alto` o `crítico`, con un badge visual y filtro dedicado.
- **Contador de uso**: Command Vault registra cuántas veces has copiado cada comando.
- **Copiado con un clic**: copia la versión activa (actual o histórica) directamente al portapapeles.
- **+130 iconos** organizados por categoría (recon, web, AD, cloud, mobile, wireless, malware...).
- **Múltiples workspaces**: separa tus comandos por cliente, proyecto o entorno (CTF, OSCP, auditoría real...).
- **Exportación / Importación**: backup completo en JSON de toda tu base de datos, o exporta una sección individual como cheatsheet en Markdown.
- **Autenticación local opcional**: protege tu instancia con contraseña si la expones en tu red local.
- **100% local**: los datos se guardan en SQLite, en tu propia máquina o contenedor.

---

## 📸 Resumen técnico

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Base de datos | SQLite (better-sqlite3) |
| Despliegue | Scripts nativos (Linux/macOS/Windows) o Docker |
| Servicio persistente | systemd (Linux) / Tarea Programada (Windows) / contenedor con `restart: unless-stopped` (Docker) |

---

## 🚀 Instalación

Elige el método que prefieras. **Todos** dejan la aplicación accesible en `http://localhost:5179`.

### Opción A — Linux / macOS (script nativo)

Requiere `bash` y `sudo` (para instalar Node.js si no lo tienes, y para el servicio systemd si lo eliges).

```bash
chmod +x install.sh
./install.sh
```

El script:
1. Detecta tu distribución / macOS y el gestor de paquetes disponible.
2. Instala Node.js 20 LTS si no está presente (o es demasiado antiguo).
3. Instala las herramientas de compilación necesarias para SQLite nativo (`build-essential`/`Development Tools`/Xcode CLT).
4. Instala dependencias y compila cliente + servidor.
5. **En Linux**, te pregunta si quieres instalarlo como **servicio systemd** (recomendado para uso continuo).

Arranque manual sin systemd:

```bash
./start.sh        # modo producción (build compilado)
./dev.sh           # modo desarrollo (recarga en caliente)
```

### Opción B — Windows (PowerShell)

```powershell
# Desde PowerShell (no hace falta ser administrador salvo para instalar Node.js a nivel de sistema)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1
```

También puedes hacer doble clic en `install.bat`, que simplemente lanza el script de PowerShell.

El instalador:
1. Detecta Node.js; si falta, lo instala vía `winget`, `Chocolatey` o el instalador oficial MSI (en ese orden de preferencia).
2. Instala dependencias y compila cliente + servidor.
3. Te pregunta si quieres registrar Command Vault como **Tarea Programada** para que arranque automáticamente al iniciar sesión.

Arranque manual:

```powershell
.\start.ps1        # modo producción
.\dev.ps1           # modo desarrollo
```

o haz doble clic en `start.bat`.

### Opción C — Docker / Docker Compose (recomendado para máxima portabilidad)

Funciona igual en Windows, Linux y macOS siempre que tengas Docker instalado.

```bash
docker compose up -d --build
```

Eso es todo. La app queda disponible en `http://localhost:5179` y los datos persisten en un volumen Docker (`command-vault-data`) aunque borres o reconstruyas el contenedor.

Comandos útiles:

```bash
docker compose logs -f          # ver logs en vivo
docker compose stop             # detener
docker compose start            # volver a iniciar
docker compose down             # detener y eliminar el contenedor (el volumen de datos se conserva)
docker compose down -v          # ⚠️ detener y BORRAR también los datos
```

---

## 🩺 Gestión del servicio (Linux / systemd)

Si elegiste instalar el servicio systemd durante `install.sh` (o lo instalas después con `./scripts/install-systemd-service.sh`), puedes gestionarlo con los comandos estándar de systemd:

```bash
sudo systemctl status   command-vault
sudo systemctl start    command-vault
sudo systemctl stop     command-vault
sudo systemctl restart  command-vault
sudo systemctl enable   command-vault    # arranque automático al iniciar el sistema
sudo systemctl disable  command-vault    # desactivar arranque automático
journalctl -u command-vault -f           # logs en vivo
```

O usando el script de ayuda incluido (mismo resultado, más cómodo):

```bash
./scripts/command-vault-ctl.sh status
./scripts/command-vault-ctl.sh start
./scripts/command-vault-ctl.sh stop
./scripts/command-vault-ctl.sh restart
./scripts/command-vault-ctl.sh enable
./scripts/command-vault-ctl.sh disable
./scripts/command-vault-ctl.sh logs
```

Para desinstalar el servicio (no borra el proyecto ni la base de datos):

```bash
./scripts/uninstall-systemd-service.sh
```

En **Windows**, el equivalente es la Tarea Programada `CommandVault`:

```powershell
Start-ScheduledTask -TaskName CommandVault
Stop-ScheduledTask  -TaskName CommandVault
Get-ScheduledTask   -TaskName CommandVault | Select State
Unregister-ScheduledTask -TaskName CommandVault -Confirm:$false   # desinstalar
```

---

## 🔐 Protegerlo con contraseña (opcional)

Por defecto Command Vault no requiere login: está pensado para correr en tu propia máquina. Si vas a exponerlo en tu red local (por ejemplo, para acceder desde el móvil o compartirlo en un equipo pequeño), puedes activar una contraseña desde la propia interfaz:

**Ajustes (icono de engranaje) → Acceso con contraseña → Activar protección**

A partir de ahí, cualquier acceso a la API (salvo el propio login) exigirá una sesión válida.

> ⚠️ Esto es una protección básica pensada para una LAN de confianza, no un sistema de gestión de usuarios con roles. Si necesitas exponerlo en Internet, colócalo detrás de un reverse proxy con HTTPS (Caddy, Nginx, Traefik) y activa `FORCE_SECURE_COOKIE=true` en `server/.env`.

---

## 🗂️ Estructura del proyecto

```
command-vault/
├── client/                  # Frontend React + Vite
│   └── src/
│       ├── components/      # CommandCard, CommandEditor, SettingsPanel, Login...
│       └── lib/api.ts        # Cliente HTTP tipado
├── server/                  # Backend Express + TypeScript
│   ├── data/
│   │   └── seed/
│   │       ├── build_seed.py            # Generador de la base de datos de comandos
│   │       └── commands-database.json   # Base de datos de comandos (258 comandos)
│   └── src/
│       ├── db/               # Schema, migraciones, carga del seed
│       ├── routes/           # workspaces, sections, commands, auth, data (export/import)
│       └── middleware/       # Autenticación opcional basada en sesión
├── scripts/                  # Instalación/gestión del servicio systemd
├── install.sh / install.ps1 / install.bat   # Instaladores
├── start.sh / start.ps1 / start.bat         # Arranque en producción
├── dev.sh / dev.ps1                          # Arranque en desarrollo
├── Dockerfile / docker-compose.yml           # Despliegue en contenedor
└── RELEASEV2.0.txt                            # Notas de la release
```

---

## 📈 Ampliar la base de datos de comandos

La base de datos inicial vive en `server/data/seed/commands-database.json` y se genera a partir de `server/data/seed/build_seed.py`. Este script existe precisamente para que ampliarla sea cómodo y ordenado:

1. Abre `server/data/seed/build_seed.py`.
2. Cada sección es una llamada a `SECTION("Título", "icono")` seguida de varias llamadas a `CMD(seccion, titulo, descripcion, lenguaje, comando, tags, riesgo, referencia_opcional)`.
3. Añade tus propios comandos siguiendo el mismo patrón, o crea una sección nueva.
4. Regenera el JSON:
   ```bash
   npm run seed:rebuild
   # equivalente a: python3 server/data/seed/build_seed.py
   ```
5. El nuevo `commands-database.json` se cargará automáticamente la próxima vez que la base de datos esté vacía (primera instalación). Si ya tienes una base de datos con datos, el seed **no la sobrescribe** — usa la opción "Importar backup" desde Ajustes para fusionar contenido nuevo en un workspace separado, o borra `server/data/command-vault.db` para forzar una recarga completa del seed (perderás los cambios manuales que hayas hecho).

> Por supuesto, también puedes simplemente usar la interfaz: **Nueva sección → Nuevo comando**, sin tocar ningún archivo.

---

## 💾 Backups

Desde **Ajustes → Copia de seguridad**:

- **Exportar todo (JSON)**: descarga un único archivo con todos tus workspaces, secciones, comandos e historial de versiones.
- **Importar backup**: sube un JSON exportado previamente. Se crea siempre un **workspace nuevo**, nunca se sobrescriben datos existentes.
- **Exportar sección a Markdown**: desde el panel de secciones, el icono de descarga genera un cheatsheet `.md` listo para compartir o imprimir.

---

## 🧯 Solución de problemas

**`better-sqlite3` falla al compilar durante `npm install`**
Necesitas un compilador de C/C++ y Python 3 instalados:
- Linux: `sudo apt install build-essential python3` (o el equivalente en tu distro — `install.sh` lo hace por ti).
- macOS: `xcode-select --install`.
- Windows: instala "Visual Studio Build Tools" con el workload *Desktop development with C++* desde https://visualstudio.microsoft.com/visual-cpp-build-tools/.

**El puerto 5179 ya está en uso**
Cambia `PORT=5179` en `server/.env` a otro puerto libre y reinicia.

**Quiero reiniciar la base de datos desde cero**
Detén el servicio, borra `server/data/command-vault.db*` y vuelve a arrancar: se recreará el esquema y se recargará el seed de 258 comandos.

**El servicio systemd no arranca**
Revisa los logs con `journalctl -u command-vault -e` y confirma que `server/dist/index.js` existe (ejecuta `npm run build -w server` si no).

---

## 🤝 Filosofía del proyecto

Command Vault no es solo un gestor de comandos: es tu memoria técnica personal, un vault de conocimiento ofensivo y defensivo, pensado por y para hackers éticos que necesitan tener a mano, organizado y buscable, todo lo que normalmente vive disperso en notas, cheatsheets y pestañas del navegador.

---

## ⚖️ Uso responsable

Todos los comandos y técnicas incluidos en la base de datos están pensados exclusivamente para su uso en entornos donde tengas **autorización explícita**: laboratorios propios, máquinas de práctica (HTB, THM, etc.), CTFs, o auditorías de seguridad contratadas y dentro del alcance acordado. El uso de estas técnicas contra sistemas sin autorización es ilegal.

---

Consulta **`RELEASEV2.0.txt`** para el detalle completo de las novedades de esta versión.
