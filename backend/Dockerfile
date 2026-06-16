FROM python:3.11-slim

# Instalar dependencias del sistema y uv
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
RUN pip install uv

WORKDIR /app

# Instalar dependencias del proyecto usando uv
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
