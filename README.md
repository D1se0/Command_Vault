# 🧠 Command Vault (BETA)

**Command Vault** es una aplicación web local diseñada para **almacenar, organizar y consultar comandos técnicos rápidos** orientados a:

- 🔐 Hacking ético / Pentesting
- 🧰 Sysadmin / DevOps
- 🤖 Automatización / RPA
- 🖥️ Uso diario en terminal (Bash, PowerShell, Python, etc.)

La aplicación funciona **100% en local**, no requiere internet una vez instalada y está pensada como un **vault personal de comandos útiles** con explicación y resaltado de sintaxis.

> ⚠️ Estado actual: **BETA**  
> La aplicación es funcional pero puede cambiar estructura y features.

Actualmente la aplicación incluye comandos de prueba cuyo objetivo es validar la funcionalidad general del sistema.

El código se encuentra publicado para facilitar aportaciones, mejoras y feedback por parte de la comunidad.

Paralelamente, el proyecto está en desarrollo activo y se irán incorporando nuevos comandos de forma progresiva.
Cuando la base de datos alcance un volumen sólido y útil de comandos reales, se publicará una nueva release en GitHub con una Command Database mucho más amplia y madura.

Documentación en GitBook: [GitBook Documentación](https://dise0.gitbook.io/h4cker_b00k/proyectos/command-vault-beta)

---

## 🖼️ Capturas del proyecto

<img width="1919" height="783" alt="1" src="https://github.com/user-attachments/assets/07669430-988e-4dbb-aec2-d97e6300f673" />
<img width="936" height="534" alt="2" src="https://github.com/user-attachments/assets/23b29952-5994-4a53-811b-437af1d08c16" />
<img width="819" height="632" alt="3" src="https://github.com/user-attachments/assets/002e7917-e150-41ef-a2d7-3907ad1af9c6" />
<img width="798" height="277" alt="4" src="https://github.com/user-attachments/assets/62b78dc3-6d5a-49e2-9e95-136d7804b7f9" />
<img width="805" height="602" alt="5" src="https://github.com/user-attachments/assets/2fc8f9bf-0919-4236-9cd0-a86a6b3b8912" />

---

## ✨ Características

- 📂 Workspaces → Secciones → Comandos
- 🎨 Resaltado de sintaxis automático por lenguaje
- ⌨️ Editor con vista previa de código en tiempo real
- 🗃️ Base de datos local (persistencia)
- 🌐 Interfaz web moderna (React + Vite)
- ⚡ Muy rápida, sin dependencias externas
- 🖥️ Funciona en segundo plano

---

## 🧩 Tecnologías utilizadas

### Frontend
- **React + TypeScript**
- **Vite** (bundler ultrarrápido)
- **Framer Motion** (animaciones)
- **Lucide Icons**
- **react-syntax-highlighter (Prism)**

### Backend
- **Node.js (v20.20.0)**
- **TypeScript**
- API local (REST)
- Base de datos local (persistente)

### Entorno
- Todo se ejecuta en **localhost**
- No se envía ningún dato fuera
- Ideal para entornos de pentesting

---

## 📦 Distribución

El proyecto se distribuye como un **archivo `.zip` portable**.

No hay instalador gráfico.  
Todo se controla desde un único archivo:


```bash
run.bat
```

---

## 🚀 Instalación (MUY IMPORTANTE)

### Requisitos

- 🪟 **Windows**
- ✅ Necesitas Node (v20.20.0) instalado previamente (En la misma carpeta esta el instalador)
- ❌ No necesitas configurar nada manualmente

---

### Pasos de instalación

1. **Descarga el `.zip` del proyecto**
2. **Descomprímelo** en cualquier carpeta
3. Dentro verás algo como:

```
command-vault/
│
├─ client/
├─ server/
├─ node/
│ └─ node.msi
├─ run.bat
├─ install.bat
```

4. **Haz doble click en `install.bat`**
5. **Despues de instalar las dependencias haz doble click en `run.bat`**

---

### ¿Qué hace `install.bat`?

Automáticamente:

1. ✔️ Comprueba si **Node.js** está instalado
2. 📦 Si no lo está, lo instala en silencio
3. 📥 Instala dependencias del backend
4. 📥 Instala dependencias del frontend

### ¿Qué hace `run.bat`?

Automáticamente:

1. 🚀 Arranca backend + frontend
2. 🌐 Abre el navegador en:


```
http://localhost:5173
```

> 🟢 La terminal queda abierta en segundo plano  
> 🟢 No necesitas interactuar con ella (Solamente para parar el proceso)

---

## 🌍 Uso

Una vez abierto el navegador:

- Toda la interacción se hace desde la web
- Puedes cerrar el navegador y volver a abrir la URL
- Mientras la terminal esté abierta, la app sigue funcionando

---

## 🛑 Cómo detener la aplicación

- Cierra la ventana de la terminal que abrió `run.bat`
- O cierra el proceso de Node desde el Administrador de tareas

---

## 🚀 Despliegue en Linux / Raspberry Pi (Docker + Portainer)

Command Vault puede ejecutarse fácilmente en Linux y especialmente en Raspberry Pi (recomendado 4 / 8 GB RAM) utilizando Docker y Portainer, manteniendo persistentes tanto la base de datos como el código fuente.

Este método permite:

- Ejecución local vía navegador
- Persistencia de datos (`.db`)
- Reinicio automático del servicio
- Desarrollo activo sin recompilar imágenes

---

## 📋 Requisitos previos

- Raspberry Pi 4 (4 GB mínimo, 8 GB recomendado) o cualquier Linux x64
- Sistema operativo basado en Debian (Raspberry Pi OS, Ubuntu, etc.)
- Docker instalado
- Portainer instalado y funcionando
- Acceso a la carpeta `/opt`

---

## 📁 Estructura del proyecto en el host

El proyecto debe ubicarse en el host de la Raspberry Pi en la siguiente ruta:

```
/opt/command-vault/
├── client/
├── server/
│   └── data/
│       └── command-vault.db
├── package.json
├── package-lock.json
└── docker-compose.yml
```
> ⚠️ La carpeta server/data/ es crítica, ya que contiene la base de datos SQLite y debe ser persistente.

---

## 🐳 Docker Compose (Portainer Stack)

Este es el `docker-compose.yml` funcional utilizado para el despliegue:

```yaml
version: "3.9"

services:
  command-vault:
    image: node:20.20.0-bullseye
    container_name: command-vault
    restart: unless-stopped

    working_dir: /app

    environment:
      NODE_ENV: development
      DB_PATH: /app/server/data/command-vault.db

    ports:
      - "600:5173"   # Frontend (Vite)
      - "5179:5179"  # Backend API

    volumes:
      # Código fuente (persistente)
      - /opt/command-vault/server:/app/server
      - /opt/command-vault/client:/app/client
      - /opt/command-vault/package.json:/app/package.json
      - /opt/command-vault/package-lock.json:/app/package-lock.json

      # Base de datos persistente
      - /opt/command-vault/server/data:/app/server/data

    command: >
      sh -c "
        npm install &&
        npm run dev
      "
```
---

## ▶️ Despliegue desde Portainer

1. Accede a Portainer
2. Ve a Stacks
3. Crea un nuevo Stack
4. Pega el contenido del `docker-compose.yml`
5. Asigna un nombre (por ejemplo: `command-vault`)
6. Pulsa Deploy the stack

Portainer descargará la imagen, instalará dependencias y lanzará el frontend y backend automáticamente.

---

## 🌐 Acceso a la aplicación

> NOTA IMPORTANTE!
> Para que se pueda acceder de forma externa hay que añadirle en el archivo `command-vault/client/vite.config.ts` una linea `host: true` para que pueda tener acceso desde fuera (`0.0.0.0`)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // 👈 AÑADIR ESTO DE AQUÍ
    port: 5173,
    proxy: {
      "/api": "http://localhost:5179"
    }
  }
});
```

Una vez desplegado:

- Frontend Web:

```
http://<IP_DE_LA_RASPBERRY>:600
```

- Backend API:

```
http://<IP_DE_LA_RASPBERRY>:5179
```

La aplicación se ejecuta completamente en local desde el navegador, sin necesidad de Electron ni binarios adicionales.

---

## 💾 Persistencia y reinicios

- La base de datos SQLite se guarda en:

```
/opt/command-vault/server/data/
```

- Los cambios en código (`.ts`, `.tsx`, etc.) son persistentes
- El contenedor puede reiniciarse sin pérdida de datos
- Ideal tanto para uso diario como para desarrollo activo

---

## 🔐 Seguridad

- No se conecta a internet
- No ejecuta comandos automáticamente
- Solo **almacena texto**
- El usuario es responsable del uso de los comandos

---

## 🧪 Estado BETA

Esta versión es **BETA**, lo que implica:

- Posibles cambios en estructura
- Posibles bugs visuales
- No se recomienda para producción crítica

Feedback, ideas y mejoras son bienvenidas.

---

## 🧠 Filosofía del proyecto

> “No perder tiempo buscando el mismo comando por quinta vez.”

Command Vault está pensado como:
- Un **cerebro externo**
- Un **vault personal**
- Una **base de conocimiento viva**

Ideal para:
- Pentesters
- Red Team
- Blue Team
- Sysadmins
- Estudiantes de seguridad

---

## 📜 Licencia

Uso personal / educativo.  
El autor no se responsabiliza del uso indebido de los comandos almacenados.

---

## 🧩 Próximas ideas (no garantizadas)

- Import / export de comandos
- Búsqueda avanzada
- Tags
- Shortcuts
- Versionado de comandos

---

💀 Happy hacking (ethical)  
⚡ Built for speed
