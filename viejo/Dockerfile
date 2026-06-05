# ─────────────────────────────────────────────────────────
# Dockerfile del Frontend — ERP React + Vite
# Build de producción servido con nginx
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# La URL del API en producción se pasa como build arg
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─────────────────────────────────────────────────────────
# Stage 2: Servidor nginx para servir la SPA
# ─────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copiar el build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA (react-router)
# Todas las rutas sirven index.html — el routing lo maneja React
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
