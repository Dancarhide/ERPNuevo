FROM node:22-alpine AS base

# Dependencias para alpine
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

WORKDIR /app

# Stage de instalación de dependencias
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Stage de build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Usar variable estática para build, pero Cloudflare o el proxy hará que funcione
ENV NEXT_PUBLIC_API_URL=/api
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
