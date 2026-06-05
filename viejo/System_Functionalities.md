# Documentación de Funcionalidades del Sistema ERP

Este documento detalla todas las funcionalidades actualmente implementadas en el sistema ERP, clasificándolas según su estado de desarrollo (Funcional con Backend vs. Prototipo/Frontend).

## 1. Módulos Principales (Funcionales con Conexión a Base de Datos)

Estos módulos están completamente integrados con el backend (Node.js/Express) y la base de datos (PostgreSQL).

### **Autenticación y Seguridad**
*   **Inicio de Sesión**: Autenticación segura mediante JWT (JSON Web Tokens).
*   **Control de Acceso Basado en Roles (RBAC)**:
    *   Soporte para múltiples roles: `administrador`, `director`, `jefe_area`, `empleado`, `rh`.
    *   Protección de rutas tanto en frontend como en backend.
*   **Gestión de Permisos Granular**:
    *   Panel de administración para configurar permisos específicos (Ver, Crear, Editar, Eliminar) por recurso y rol.
    *   Alcance de permisos: Global, Departamento, Propio.

### **Gestión de Capital Humano (Empleados)**
*   **Directorio de Empleados**: Lista completa con búsqueda, filtrado por departamento y estatus, y ordenamiento.
*   **Perfil del Empleado**:
    *   Información personal, laboral y de contacto.
    *   Datos de salud y contactos de emergencia.
    *   **Auditoría**: Registro de fecha de creación y última modificación de cada perfil.
*   **Operaciones CRUD**: Crear, leer, actualizar y eliminar (baja lógica) empleados.
*   **Organigrama Institucional**: Visualización jerárquica generada dinámicamente desde la base de datos.
*   **Restablecimiento de Contraseñas**: Funcionalidad para resetear credenciales de acceso de empleados.

### **Gestión de Incidencias y Reportes**
*   **Reporte de Incidencias**:
    *   Registro de incidencias laborales (comportamiento, asistencia, seguridad, etc.).
    *   Clasificación por tipo y gravedad.
*   **Seguimiento**:
    *   Dashboard de incidencias recientes con estatus y detalles.

### **Gestión de Vacaciones y Ausencias**
*   **Solicitud de Vacaciones**:
    *   Flujo para que los empleados soliciten días libres.
    *   Validación de saldo de días disponibles.
*   **Aprobación/Rechazo**: Panel para administradores y jefes para gestionar solicitudes.
*   **Historial**: Visualización de "Mis Solicitudes" con estado actual.

### **Configuración del Sistema**
*   **Días Festivos**:
    *   Gestión (CRUD) de días no laborables oficiales.
    *   Integración con el calendario para no descontar estos días de vacaciones.
*   **Áreas y Departamentos**: Gestión administrativa de la estructura organizacional.

### **Dashboard y Métricas**
*   **Resumen Ejecutivo**: KPIs financieros y operativos (Ingresos, Gastos, EBITDA).
*   **Estadísticas de RRHH**: Conteo de personal, estimación de nómina, alertas de presupuesto.
*   **Panel de Actividades**: Resumen de tareas pendientes y eventos recientes.

### **Tareas y Colaboración**
*   **Gestión de Tareas**:
    *   Creación y asignación de tareas a empleados.
    *   Estados de tarea (Pendiente, Completada).
    *   Priorización y fechas de vencimiento.

### **Nómina y Compensaciones**
*   **Gestión por Lotes**: Creación de lotes de nómina por periodos (quincenal/mensual).
*   **Cálculo Automático**: Cálculo de sueldos, fondo de ahorro, vales de despensa e infonavit.
*   **Recibos PDF**: Generación y descarga de comprobantes de pago en formato profesional.
*   **Autoservicio**: Panel para que los empleados consulten y descarguen sus propios recibos.

---

## 2. Módulos en Prototipo / Lógica Frontend

Estos módulos presentan una interfaz funcional y lógica de negocio en el cliente, pero actualmente utilizan almacenamiento local, datos simulados (mock data) o cálculos en tiempo real sin persistencia histórica en base de datos.


### **Reclutamiento y Selección (Captación y Inducción)**
*   **Pipeline de Talento**: Tablero visual del proceso (Publicación -> Entrevistas -> Selección -> Contratación -> Inducción).
*   **Checklists Interactivos**: Listas de verificación para cada etapa del proceso.
*   **Notas del Reclutador**: Espacio para anotaciones rápidas.
    *   *Nota: Persistencia mediante `localStorage` del navegador.*

### **Control de Asistencia (Reloj Checador)**
*   **Registro Diario**: Funcionalidad visual de Entrada/Salida.
*   **Historial de Asistencia**: Tabla de registros diarios con estados (Presente, Retardo, Ausente).
    *   *Nota: Actualmente utiliza datos simulados (`Mock Data`) para demostración.*

### **Evaluación de Desempeño**
*   **Evaluaciones 360°**: Formularios para autoevaluación, evaluación de jefes y pares.
*   **Cuestionarios Dinámicos**: Preguntas predefinidas para competencias y liderazgo.
    *   *Nota: Los formularios son funcionales pero el envío actualmente solo simula el proceso (console.log).*

### **Plan de Carrera (Oportunidades)**
*   **Visualización de Crecimiento**: Muestra el siguiente paso lógico en la carrera del empleado basado en su puesto actual.
*   **Requisitos del Puesto**: Lista de requisitos y competencias necesarias para ascender.
    *   *Nota: La estructura del organigrama es real (BD), pero los requisitos específicos están mapeados estáticamente en el frontend.*

---

## 3. Instrucciones de Configuración Inicial

Para activar la conexión completa con la base de datos y habilitar los módulos principales, siga estos pasos:

1.  **Configurar Base de Datos**:
    *   Asegúrese de tener **PostgreSQL** instalado y ejecutándose.
    *   Edite el archivo `server/.env` y actualice la variable `DATABASE_URL` con su contraseña real:
        ```env
        DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/erp
        ```

2.  **Inicializar Esquema y Datos**:
    *   Ejecute el script de inicialización desde la carpeta raíz:
        ```cmd
        setup-database.bat
        ```
    *   Este script creará la base de datos `erp` y sembrará los datos iniciales necesarios (roles, permisos, usuario admin).

3.  **Iniciar Aplicación**:
    *   Ejecute el iniciador general:
        ```cmd
        start-app.bat
        ```
    *   Esto levantará tanto el **Backend** (Puerto 4000) como el **Frontend** (Vite).

4.  **Acceso Inicial**:
    *   Sistema: `http://localhost:5173`
    *   Credenciales por defecto (si se usó `db:seed:super_admin`):
        *   Email: `admin@ferro.com`
        *   Password: `123`
