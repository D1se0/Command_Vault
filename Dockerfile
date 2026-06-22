# ============================================================
# Command Vault v2.0 — Dockerfile multi-stage
# ============================================================

# ---------- Stage 1: build del cliente (Vite/React) ----------
FROM node:20-bullseye-slim AS client-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm install --no-fund --no-audit
COPY client ./client
RUN npm run build -w client

# ---------- Stage 2: build del servidor (TypeScript) ----------
FROM node:20-bullseye-slim AS server-build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm install --no-fund --no-audit
COPY server ./server
RUN npm run build -w server

# ---------- Stage 3: imagen final (runtime) ----------
FROM node:20-bullseye-slim AS runtime
LABEL org.opencontainers.image.title="Command Vault"
LABEL org.opencontainers.image.description="Pentest & Red Team command database, self-hosted"
LABEL org.opencontainers.image.version="2.0.0"

WORKDIR /app

# Solo dependencias de producción del servidor
COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev --no-fund --no-audit

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client/dist
COPY server/data/seed ./server/data/seed

ENV NODE_ENV=production
ENV PORT=5179
ENV DB_PATH=/app/server/data/command-vault.db

RUN mkdir -p /app/server/data
VOLUME ["/app/server/data"]

EXPOSE 5179

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:'+(process.env.PORT||5179)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/server
CMD ["node", "dist/index.js"]
