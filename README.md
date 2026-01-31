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
