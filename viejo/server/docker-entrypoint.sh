#!/bin/sh
# docker-entrypoint.sh
# Ejecuta migrations + seed antes de arrancar el servidor.
# Esto garantiza que en cualquier entorno nuevo la BD esté lista.

set -e

echo "🔄 Aplicando migraciones de base de datos..."
npx prisma migrate deploy

echo "🌱 Ejecutando seed de datos base..."
# El seed es idempotente — si ya existe, no duplica nada
npx tsx prisma/seed.ts

echo "🚀 Iniciando servidor ERP..."
exec "$@"
