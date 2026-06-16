FROM node:22-alpine AS base

# Dependencias para alpine
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

WORKDIR /app

# Stage de instalación de dependencias
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set ignore-scripts true && pnpm install

# Stage de build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dejar vacio para que use ruta relativa por defecto en el cliente
ENV NEXT_PUBLIC_API_URL=""
ENV BACKEND_URL=http://backend:8000
RUN pnpm run build

# Stage de producción
FROM base AS runner
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
