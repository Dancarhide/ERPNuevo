# Guia de Instalacion y Despliegue (Produccion)

Este manual esta disenado para el equipo tecnico encargado de instalar el ERP en los servidores locales (On-Premise) de nuevos clientes. El proceso ha sido simplificado mediante el uso de contenedores y tunneling.

## 1. Requisitos Previos en el Servidor del Cliente
El servidor fisico o maquina virtual designada debe contar con los siguientes elementos instalados:
1.  **Docker** (Engine).
2.  **Docker Compose** (V2).
3.  **Git** (Opcional, util para descargar el codigo fuente de los repositorios).
4.  Sistema operativo basado en Linux preferentemente (Ubuntu, Debian, CentOS), aunque Windows Server con WSL2 es compatible.

## 2. Preparacion de Credenciales y Rutas (Cloudflare)
El sistema utiliza Cloudflare Zero Trust (Tunnels) para exponer el ERP local hacia internet sin necesidad de solicitar apertura de puertos 80/443 en el ruteador de la empresa, lo cual facilita la instalacion y aumenta la seguridad.
*   Acceder al dashboard de Cloudflare Zero Trust de la empresa administradora.
*   Crear un nuevo tunnel local asociado al servidor del cliente.
*   Copiar el token generado.
*   Configurar un subdominio que apunte a dicho tunnel (ej: `empresa.nuestro-erp.com`).

## 3. Despliegue Paso a Paso

### Paso 3.1: Descarga del Proyecto
Transferir los archivos del sistema al servidor de produccion. 

### Paso 3.2: Configuracion de Entorno
Copiar la plantilla principal de variables de entorno y ajustarla:
```bash
cp .env.example .env
```
Abrir el archivo `.env` en cualquier editor de texto y llenar los siguientes valores esenciales:
*   `DB_PASSWORD`: Contrasena segura para la base de datos (Ej: un hash de 32 caracteres).
*   `DB_NAME`: Nombre descriptivo para el cliente actual.
*   `JWT_SECRET`: Llave fuerte de cifrado. No omitir.
*   `DOMAIN`: Subdominio de Cloudflare que se asocio (Ej: `empresa.nuestro-erp.com`).
*   `CLOUDFLARE_TUNNEL_TOKEN`: Pegar el token copiado del Paso 2.

### Paso 3.3: Arranque de Servicios
Desde la raiz del proyecto (donde se encuentra el archivo `docker-compose.yml`), ejecutar:
```bash
docker compose up -d --build
```
Este comando construira las imagenes del Backend y Frontend, y descargara las oficiales para PostgreSQL y Redis.

### Paso 3.4: Ejecucion de Migraciones Base de Datos
Una vez que todos los contenedores reporten estar corriendo (`docker compose ps`), se debe construir la estructura de tablas de la base de datos vacia:
```bash
docker compose exec backend uv run alembic upgrade head
```

### Paso 3.5: Verificacion de Enlace
Probar el acceso en el navegador dirigiendose al dominio configurado (`https://empresa.nuestro-erp.com`). Debera mostrar la pantalla de inicio de sesion.

### Paso 3.6: Creacion del Super Administrador
Para poder ingresar por primera vez, es necesario crear una cuenta maestra ejecutando el siguiente comando interactivo en la terminal del servidor:
```bash
docker compose exec backend uv run python scripts/create_super_admin.py --email admin@empresa.com --password "ContrasenaSegura123"
```
En este punto el servidor puede ser entregado al area de administracion de la empresa cliente con esas credenciales.
