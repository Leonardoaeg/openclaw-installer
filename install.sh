#!/bin/bash
# ============================================================
# OpenClaw + Dashboard — Instalador Automático v4
# By Duvan AI (contenads.site)
# 
# Un solo comando para instalar OpenClaw + Dashboard completo
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/opt/openclaw"
DASHBOARD_DIR="/opt/openclaw-dashboard"
DASHBOARD_REPO="https://github.com/duvanchat2/openclaw-dashboard.git"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "TU_IP")

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   🤖 OpenClaw + Dashboard — Instalador v4       ║"
echo "║   By Duvan AI · contenads.site                  ║"
echo "║                                                  ║"
echo "║   Este script instala:                           ║"
echo "║   • OpenClaw (agente de IA)                      ║"
echo "║   • Dashboard de administración                  ║"
echo "║   • Nginx + SSL (opcional)                       ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "  IP detectada: ${CYAN}$SERVER_IP${NC}"
echo ""

# ════════════════════════════════════════════════════════
# 1. VERIFICAR REQUISITOS
# ════════════════════════════════════════════════════════
echo -e "${CYAN}[1/7] Verificando requisitos...${NC}"

# Docker
if ! command -v docker &>/dev/null; then
    echo -e "${YELLOW}  Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
echo -e "${GREEN}  ✓ Docker${NC}"

# Docker Compose
if ! docker compose version &>/dev/null 2>&1; then
    echo -e "${RED}  ✗ docker compose no encontrado. Instala Docker Compose v2${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Docker Compose${NC}"

# Git
if ! command -v git &>/dev/null; then
    apt-get update -qq && apt-get install -y -qq git >/dev/null 2>&1
fi
echo -e "${GREEN}  ✓ Git${NC}"

# Node.js (para dashboard)
if ! command -v node &>/dev/null; then
    echo -e "${YELLOW}  Instalando Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null 2>&1
fi
echo -e "${GREEN}  ✓ Node.js $(node -v)${NC}"

# ════════════════════════════════════════════════════════
# 2. RECOGER DATOS
# ════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[2/7] Configuración del agente${NC}"
echo ""

read -p "  Nombre del agente (ej: Nova, Atlas, Max) [Nova]: " AGENT_NAME
AGENT_NAME=${AGENT_NAME:-Nova}

read -p "  Nombre del negocio/proyecto [Mi Proyecto]: " BUSINESS_NAME
BUSINESS_NAME=${BUSINESS_NAME:-Mi Proyecto}

# ─── Canales ───
echo ""
echo -e "${CYAN}  ═══ Canales de comunicación ═══${NC}"
echo -e "  ${YELLOW}Pega el token completo del bot. Ejemplo: 1234567890:AAH_abc...xyz${NC}"
echo -e "  ${YELLOW}Presiona Enter para saltar si no usas ese canal.${NC}"
echo ""

read -p "  Token de Telegram Bot: " TELEGRAM_TOKEN
read -p "  Token de Discord Bot: " DISCORD_TOKEN

# Validar que al menos un canal existe
if [ -z "$TELEGRAM_TOKEN" ] && [ -z "$DISCORD_TOKEN" ]; then
    echo -e "${RED}  ⚠ No configuraste ningún canal. El agente no podrá recibir mensajes.${NC}"
    read -p "  ¿Continuar de todos modos? (s/N): " CONTINUE
    [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ] && exit 1
fi

# Validar formato de token de Telegram
if [ -n "$TELEGRAM_TOKEN" ]; then
    if ! echo "$TELEGRAM_TOKEN" | grep -qE '^[0-9]+:.+$'; then
        echo -e "${RED}  ⚠ El token de Telegram no parece válido.${NC}"
        echo -e "${YELLOW}  Debe ser algo como: 1234567890:AAH_abcdefghijklmnop${NC}"
        read -p "  ¿Continuar de todos modos? (s/N): " CONTINUE
        [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ] && exit 1
    fi
fi

# ─── API Keys ───
echo ""
echo -e "${CYAN}  ═══ API Keys de IA (mínimo 1 requerida) ═══${NC}"
echo -e "  ${YELLOW}Recomendado: Google/Gemini (gratis en aistudio.google.com)${NC}"
echo ""

read -p "  Google/Gemini API Key: " GOOGLE_KEY
read -p "  OpenRouter API Key (opcional): " OPENROUTER_KEY
read -p "  Anthropic/Claude API Key (opcional): " ANTHROPIC_KEY
read -p "  OpenAI API Key (opcional): " OPENAI_KEY

if [ -z "$GOOGLE_KEY" ] && [ -z "$OPENROUTER_KEY" ] && [ -z "$ANTHROPIC_KEY" ] && [ -z "$OPENAI_KEY" ]; then
    echo -e "${RED}  ✗ Necesitas al menos 1 API key de IA${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ API keys configuradas${NC}"

# ─── Puertos ───
echo ""
echo -e "${CYAN}  ═══ Puertos ═══${NC}"
read -p "  Puerto del dashboard [7000]: " DASH_PORT
DASH_PORT=${DASH_PORT:-7000}

# ─── Dominio (opcional) ───
echo ""
read -p "  Dominio (opcional, dejar vacío si no tiene): " DOMAIN

# ════════════════════════════════════════════════════════
# 3. INSTALAR OPENCLAW
# ════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[3/7] Instalando OpenClaw...${NC}"

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ─── Dockerfile ───
cat > "$INSTALL_DIR/Dockerfile" << 'DOCKEREOF'
FROM node:25-bookworm-slim
RUN apt-get update && apt-get install -y \
    git python3 make g++ cmake curl wget \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
RUN npm install -g openclaw@2026.2.25
RUN useradd -m -s /bin/bash openclaw
USER openclaw
WORKDIR /home/openclaw
EXPOSE 18789
CMD ["openclaw", "gateway"]
DOCKEREOF

# ─── docker-compose.yml ───
cat > "$INSTALL_DIR/docker-compose.yml" << COMPOSEEOF
version: '3.8'
services:
  openclaw:
    build: .
    container_name: openclaw
    restart: unless-stopped
    network_mode: host
    command: ["openclaw", "gateway", "--allow-unconfigured"]
    volumes:
      - ./data:/home/openclaw/.openclaw
      - ./config:/home/openclaw/.config
    environment:
      - NODE_ENV=production
      - TZ=America/Bogota
COMPOSEEOF

[ -n "$TELEGRAM_TOKEN" ] && echo "      - TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN" >> "$INSTALL_DIR/docker-compose.yml"
[ -n "$DISCORD_TOKEN" ] && echo "      - DISCORD_BOT_TOKEN=$DISCORD_TOKEN" >> "$INSTALL_DIR/docker-compose.yml"
[ -n "$GOOGLE_KEY" ] && echo "      - GOOGLE_API_KEY=$GOOGLE_KEY" >> "$INSTALL_DIR/docker-compose.yml"
[ -n "$OPENROUTER_KEY" ] && echo "      - OPENROUTER_API_KEY=$OPENROUTER_KEY" >> "$INSTALL_DIR/docker-compose.yml"
[ -n "$ANTHROPIC_KEY" ] && echo "      - ANTHROPIC_API_KEY=$ANTHROPIC_KEY" >> "$INSTALL_DIR/docker-compose.yml"
[ -n "$OPENAI_KEY" ] && echo "      - OPENAI_API_KEY=$OPENAI_KEY" >> "$INSTALL_DIR/docker-compose.yml"

echo -e "${GREEN}  ✓ Docker compose creado${NC}"

# ════════════════════════════════════════════════════════
# 4. CREAR ESTRUCTURA DE WORKSPACE
# ════════════════════════════════════════════════════════
echo -e "${CYAN}[4/7] Creando workspace...${NC}"

mkdir -p "$INSTALL_DIR/data/workspace/skills"
mkdir -p "$INSTALL_DIR/data/workspace/memory"
mkdir -p "$INSTALL_DIR/data/workspace/data"
mkdir -p "$INSTALL_DIR/data/agents/main/sessions"
mkdir -p "$INSTALL_DIR/data/agents/main/agent"
mkdir -p "$INSTALL_DIR/data/config"
mkdir -p "$INSTALL_DIR/config"

# ─── Config principal (CRÍTICO) ───
cat > "$INSTALL_DIR/data/config/config.json" << 'CFGEOF'
{
  "gateway": {
    "mode": "local"
  }
}
CFGEOF

# ─── SOUL.md ───
cat > "$INSTALL_DIR/data/workspace/SOUL.md" << SOULEOF
# SOUL.md — $AGENT_NAME

## Identidad
Soy $AGENT_NAME, el agente de IA de $BUSINESS_NAME.

## Principios
- **Acción > Palabras:** Ejecuto primero, explico después.
- **Velocidad > Perfección:** Entrego rápido e itero.
- **Proactiva:** Si veo un problema u oportunidad, actúo sin esperar.
- **Directa:** Sin relleno, sin frases vacías. Solo resultados.

## Comunicación
- Respondo en español
- Soy concisa y clara
- Uso emojis con moderación
- Confirmo antes de acciones destructivas (eliminar, publicar)

## Reglas
- Siempre leo MEMORY.md antes de actuar
- Documento mis acciones en el historial
- Pido confirmación antes de publicar o eliminar contenido
- Si no sé algo, lo digo y busco la respuesta
SOULEOF

# ─── MEMORY.md ───
cat > "$INSTALL_DIR/data/workspace/MEMORY.md" << MEMEOF
# MEMORY.md — $AGENT_NAME

## Proyecto
- Nombre: $BUSINESS_NAME
- Agente: $AGENT_NAME
- Instalado: $(date '+%Y-%m-%d')

## Skills disponibles
(Ninguna configurada aún)

## Notas
(Vacío — se irá llenando con el uso)
MEMEOF

# ─── IDENTITY.md ───
cat > "$INSTALL_DIR/data/workspace/IDENTITY.md" << IDEOF
# $AGENT_NAME
Agente de IA para $BUSINESS_NAME
Powered by OpenClaw
IDEOF

# ─── USER.md ───
cat > "$INSTALL_DIR/data/workspace/USER.md" << USEREOF
# Usuario
- Proyecto: $BUSINESS_NAME
- Idioma: Español
USEREOF

# ─── AGENTS.md ───
cat > "$INSTALL_DIR/data/workspace/AGENTS.md" << AGENTEOF
# Agentes
- main: $AGENT_NAME (orquestador principal)
AGENTEOF

# ─── TOOLS.md ───
cat > "$INSTALL_DIR/data/workspace/TOOLS.md" << 'TOOLSEOF'
# Herramientas disponibles
- curl: Peticiones HTTP
- python3: Scripts y procesamiento
- exec: Ejecutar comandos del sistema
TOOLSEOF

# ─── credentials-vault.json ───
cat > "$INSTALL_DIR/data/workspace/data/credentials-vault.json" << 'VAULTEOF'
{
  "providers": [],
  "mcps": []
}
VAULTEOF

# ─── Auth profiles ───
AUTH_JSON="{"
FIRST=true

if [ -n "$GOOGLE_KEY" ]; then
    AUTH_JSON="${AUTH_JSON}\"google\":{\"apiKey\":\"$GOOGLE_KEY\"}"
    FIRST=false
fi
if [ -n "$OPENROUTER_KEY" ]; then
    [ "$FIRST" = false ] && AUTH_JSON="${AUTH_JSON},"
    AUTH_JSON="${AUTH_JSON}\"openrouter\":{\"apiKey\":\"$OPENROUTER_KEY\"}"
    FIRST=false
fi
if [ -n "$ANTHROPIC_KEY" ]; then
    [ "$FIRST" = false ] && AUTH_JSON="${AUTH_JSON},"
    AUTH_JSON="${AUTH_JSON}\"anthropic\":{\"apiKey\":\"$ANTHROPIC_KEY\"}"
    FIRST=false
fi
if [ -n "$OPENAI_KEY" ]; then
    [ "$FIRST" = false ] && AUTH_JSON="${AUTH_JSON},"
    AUTH_JSON="${AUTH_JSON}\"openai\":{\"apiKey\":\"$OPENAI_KEY\"}"
fi

AUTH_JSON="${AUTH_JSON}}"

echo "$AUTH_JSON" | python3 -m json.tool > "$INSTALL_DIR/data/agents/main/agent/auth-profiles.json" 2>/dev/null || echo "$AUTH_JSON" > "$INSTALL_DIR/data/agents/main/agent/auth-profiles.json"

chmod -R 777 "$INSTALL_DIR/data"
chmod -R 777 "$INSTALL_DIR/config"

echo -e "${GREEN}  ✓ Workspace creado${NC}"

# ════════════════════════════════════════════════════════
# 5. BUILD Y ARRANCAR OPENCLAW
# ════════════════════════════════════════════════════════
echo -e "${CYAN}[5/7] Construyendo imagen Docker (2-5 min)...${NC}"

cd "$INSTALL_DIR"
docker compose build --quiet
docker compose up -d

echo -e "${YELLOW}  Esperando 15 segundos...${NC}"
sleep 15

if docker ps --format '{{.Names}} {{.Status}}' | grep -q "openclaw.*Up"; then
    echo -e "${GREEN}  ✓ OpenClaw corriendo${NC}"
else
    echo -e "${YELLOW}  ⚠ Verificando estado...${NC}"
    docker logs openclaw --tail 5 2>/dev/null
fi

# ════════════════════════════════════════════════════════
# 6. INSTALAR DASHBOARD
# ════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[6/7] Instalando Dashboard...${NC}"

DASHBOARD_INSTALLED=false

if [ -d "$DASHBOARD_DIR/.git" ]; then
    echo -e "${YELLOW}  Dashboard ya existe, actualizando...${NC}"
    cd "$DASHBOARD_DIR"
    git pull --quiet 2>/dev/null || true
    DASHBOARD_INSTALLED=true
else
    rm -rf "$DASHBOARD_DIR"
    if git clone --quiet "$DASHBOARD_REPO" "$DASHBOARD_DIR" 2>/dev/null; then
        DASHBOARD_INSTALLED=true
    else
        echo -e "${RED}  ✗ No se pudo clonar el dashboard desde $DASHBOARD_REPO${NC}"
        echo -e "${YELLOW}  Puedes instalarlo manualmente después.${NC}"
    fi
fi

if [ "$DASHBOARD_INSTALLED" = true ] && [ -f "$DASHBOARD_DIR/server.js" ]; then
    mkdir -p "$DASHBOARD_DIR/data"

    cat > /etc/systemd/system/openclaw-dashboard.service << SVCEOF
[Unit]
Description=OpenClaw Dashboard
After=network.target docker.service

[Service]
Type=simple
WorkingDirectory=$DASHBOARD_DIR
Environment=DASHBOARD_PORT=$DASH_PORT
Environment=OPENCLAW_DIR=$INSTALL_DIR/data
Environment=WORKSPACE_DIR=$INSTALL_DIR/data/workspace
Environment=OPENCLAW_WORKSPACE=$INSTALL_DIR/data/workspace
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

    systemctl daemon-reload
    systemctl enable openclaw-dashboard >/dev/null 2>&1
    systemctl start openclaw-dashboard

    sleep 3
    if systemctl is-active --quiet openclaw-dashboard; then
        echo -e "${GREEN}  ✓ Dashboard corriendo en puerto $DASH_PORT${NC}"
    else
        echo -e "${RED}  ⚠ Dashboard no arrancó. Revisa: journalctl -u openclaw-dashboard -n 20${NC}"
        DASHBOARD_INSTALLED=false
    fi
else
    echo -e "${YELLOW}  ⚠ Dashboard no instalado${NC}"
    DASHBOARD_INSTALLED=false
fi

# ════════════════════════════════════════════════════════
# 7. NGINX + SSL (si tiene dominio)
# ════════════════════════════════════════════════════════
if [ -n "$DOMAIN" ]; then
    echo ""
    echo -e "${CYAN}[7/7] Configurando Nginx + SSL para $DOMAIN...${NC}"

    if ! command -v nginx &>/dev/null; then
        apt-get update -qq && apt-get install -y -qq nginx >/dev/null 2>&1
    fi

    cat > /etc/nginx/sites-available/openclaw << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$DASH_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINXEOF

    ln -sf /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null

    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo -e "${GREEN}  ✓ Nginx configurado${NC}"

        if ! command -v certbot &>/dev/null; then
            apt-get install -y -qq certbot python3-certbot-nginx >/dev/null 2>&1
        fi

        echo -e "${YELLOW}  Obteniendo certificado SSL...${NC}"
        if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null; then
            echo -e "${GREEN}  ✓ SSL activado${NC}"
        else
            echo -e "${YELLOW}  ⚠ SSL falló. Configura DNS primero (registro A → $SERVER_IP)${NC}"
            echo -e "${YELLOW}    Después: certbot --nginx -d $DOMAIN${NC}"
        fi
    else
        echo -e "${RED}  ✗ Error en Nginx${NC}"
    fi
else
    echo ""
    echo -e "${CYAN}[7/7] Sin dominio — saltando Nginx/SSL${NC}"
fi

# ════════════════════════════════════════════════════════
# RESUMEN FINAL
# ════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║          ✅ INSTALACIÓN COMPLETADA               ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "  🤖 Agente:     ${CYAN}$AGENT_NAME${NC} para ${CYAN}$BUSINESS_NAME${NC}"
echo -e "  📁 Datos:      ${CYAN}$INSTALL_DIR/data${NC}"
echo -e "  🌐 Gateway:    ${CYAN}http://$SERVER_IP:18789${NC}"
echo ""

if [ "$DASHBOARD_INSTALLED" = true ]; then
    if [ -n "$DOMAIN" ]; then
        echo -e "  📊 Dashboard:  ${CYAN}https://$DOMAIN${NC}"
    else
        echo -e "  📊 Dashboard:  ${CYAN}http://$SERVER_IP:$DASH_PORT${NC}"
    fi
else
    echo -e "  📊 Dashboard:  ${YELLOW}No instalado${NC}"
fi
echo ""

[ -n "$TELEGRAM_TOKEN" ] && echo -e "  💬 Telegram:   ${GREEN}✓ Configurado${NC}" || echo -e "  💬 Telegram:   ${YELLOW}— No configurado${NC}"
[ -n "$DISCORD_TOKEN" ] && echo -e "  🎮 Discord:    ${GREEN}✓ Configurado${NC}" || echo -e "  🎮 Discord:    ${YELLOW}— No configurado${NC}"

echo ""
echo -e "${CYAN}═══ Próximos pasos ═══${NC}"
echo ""
echo "  1. Verifica: docker logs openclaw --tail 20"
echo "  2. Envía un mensaje al bot en Telegram/Discord"
[ "$DASHBOARD_INSTALLED" = true ] && echo "  3. Abre el dashboard: http://$SERVER_IP:$DASH_PORT"
echo ""
echo -e "${CYAN}═══ Solución de problemas ═══${NC}"
echo ""
echo "  Bot no responde:"
echo "    → docker logs openclaw --tail 20"
echo "    → Si dice '404: Not Found' = token inválido"
echo "    → Crea nuevo token con @BotFather en Telegram"
echo "    → Edita: nano $INSTALL_DIR/docker-compose.yml"
echo "    → Reinicia: cd $INSTALL_DIR && docker compose down && docker compose up -d"
echo ""
echo "  OpenClaw se reinicia:"
echo "    → docker logs openclaw --tail 20"
echo "    → docker compose down && docker compose up -d"
echo ""
echo "  Dashboard no carga:"
echo "    → journalctl -u openclaw-dashboard -n 20"
echo "    → systemctl restart openclaw-dashboard"
echo ""
echo "  SSL no funciona:"
echo "    → Verifica DNS: dig $DOMAIN (debe mostrar $SERVER_IP)"
echo "    → Espera 5-30 min y corre: certbot --nginx -d $DOMAIN"
echo ""
echo -e "${CYAN}═══ Actualizaciones ═══${NC}"
echo ""
echo "  Para actualizar dashboard y verificar servicios:"
echo "    bash <(curl -fsSL https://raw.githubusercontent.com/duvanchat2/openclaw-installer/main/update.sh)"
echo ""
echo -e "${GREEN}  ¿Ayuda? → contenads.site${NC}"
echo ""

# ─── Guardar versión ───
echo "4" > "$INSTALL_DIR/VERSION"
