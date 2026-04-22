# ─────────────────────────────────────────────────────────
# Stage 1: Builder — compila TypeScript
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests primero para aprovechar cache de capas
COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluyendo devDeps para compilar)
RUN npm ci

# Generar el cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ─────────────────────────────────────────────────────────
# Stage 2: Runner — imagen de producción liviana
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Solo instalar dependencias de producción
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copiar el build compilado desde el stage anterior
COPY --from=builder /app/dist ./dist

# Crear directorio para archivos generados (PDFs/XMLs de nómina)
RUN mkdir -p storage

# El script de entrypoint corre migrations + seed antes de arrancar
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
