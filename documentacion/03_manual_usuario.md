# Manual de Usuario del ERP

Bienvenido al manual operativo del Sistema. Este manual le guiara por todos los procesos funcionales disponibles en la plataforma.

## 1. Primeros Pasos y Configuracion Inicial

### 1.1. Creacion del Usuario Super Administrador
La primera vez que el sistema se instala, la base de datos se encuentra vacia. El primer usuario (Super Administrador) no puede ser registrado desde la interfaz grafica por razones de seguridad.

El administrador de TI debe ejecutar el siguiente comando directamente en el servidor para generar las credenciales iniciales de acceso:

```bash
docker compose exec backend uv run python scripts/create_super_admin.py --email admin@empresa.com --password "ContrasenaSegura123"
```
Una vez ejecutado, puede utilizar dicho correo y contrasena en la pantalla de inicio de sesion (Login) del ERP.

### 1.2. Configuracion de la Empresa
El primer paso logico es registrar la entidad legal.
*   Dirigirse a la vista de "Configuracion de Empresa".
*   Ingresar el RFC, Razon Social, y Registro Patronal vigente.

### 1.3. Seguridad, Roles y Permisos
Antes de dar de alta a ningun trabajador operativo o administrativo, es obligatorio definir los Roles del sistema (Control de Acceso Basado en Roles - RBAC).
*   Dirigirse a la seccion de "Roles y Permisos".
*   Crear los perfiles necesarios (ej. "Recursos Humanos", "Nominas", "Auditor", "Empleado General").
*   Asignar los permisos granulares a cada Rol (ej. "Ver Nomina", "Editar Empleado", "Solo Lectura").
*   *Nota:* El Super Administrador creado por terminal ya cuenta con todos los permisos por defecto y no puede ser eliminado.

### 1.4. Parametros Fiscales (CRITICO PARA NOMINA)
Para que los calculos monetarios sean precisos ante el SAT y el IMSS, debe actualizar anualmente esta configuracion:
*   Ir a "Parametros Fiscales".
*   **Indicadores Globales:** Configurar el valor vigente de la UMA (Unidad de Medida y Actualizacion), UMI (para Infonavit), y el Salario Minimo General (y Fronterizo si aplica).
*   **Tablas de Impuestos:** Ingresar las tablas vigentes de retencion de ISR (mensual/quincenal).
*   **Cuotas Obrero-Patronales:** Verificar los porcentajes de retencion del IMSS.
*   *Advertencia:* Sin estos parametros, el sistema bloqueara la generacion de nominas para evitar discrepancias legales.

### 1.5. Configuracion de Control de Asistencia (Relojes Checadores)
El sistema soporta dos modalidades para registrar la entrada y salida del personal, las cuales deben configurarse antes de arrancar operaciones:
1.  **Modo Hardware (Reloj Biometrico Fisico):** Existen dos variantes de conexion para los dispositivos (ej. ZKTeco):
    *   **Por IP Local:** El reloj y el servidor ERP comparten la misma red WiFi/Ethernet. El ERP hara "polling" (consultas periodicas) a la IP del reloj para extraer las huellas.
    *   **Por Webhook/Token (ADMS):** El reloj esta en una sucursal lejana. Se configura en el reloj la URL del ERP y un Token de seguridad. El reloj "empujara" las checadas hacia el ERP a traves de internet.

## 2. Modulo de Recursos Humanos

### 2.1. Estructura Organizacional
Antes de registrar empleados, es vital crear la estructura en el siguiente orden:
1.  **Areas/Departamentos:** Crear las clasificaciones maestras (Administracion, Operaciones, Ventas).
2.  **Puestos:** Asignar los puestos y relacionarlos a un Area. Especificar sueldo diario y nivel jerarquico.
3.  **Organigrama:** Revisar visualmente que la relacion de lineas de reporte sean correctas.

### 2.2. Expediente del Empleado
La seccion de Empleados permite administrar toda la vida laboral del personal.
*   Para ingresar a alguien: Boton "Nuevo Empleado".
*   Llenar la Ficha Tecnica: NSS, CURP, RFC y Direccion.
*   Al guardarse, el sistema generara un Numero de Empleado (clave interna) y permitira cargar contratos y generar altas.

### 2.3. Control de Asistencia e Incidencias
El sistema concentra los "Checados" recibidos desde los relojes fisicos o desde la plataforma web.
*   El administrador podra ver el panel de asistencias en tiempo real.
*   Si el sistema detecta una anomalia (ej. llegada despues de la tolerancia), el modulo de "Incidencias" registrara un Retardo.
*   **Regla de Negocio:** La acumulacion de 3 retardos en un periodo configurado generara automaticamente una "Falta Injustificada", la cual se descontara en la nomina de dicho periodo.

## 3. Modulo de Nomina y Calculos Fiscales

### 3.1. Periodos y Generacion
Para pagar la nomina:
*   Ir a "Calculo de Nomina" y generar un nuevo Periodo.
*   El sistema hara un barrido por todos los empleados activos cruzando sus Asistencias y Faltas.
*   Se aplicaran las deducciones correspondientes al ISR e IMSS usando las tablas tributarias registradas en el modulo "Parametros Fiscales".
*   Se aplicaran las retenciones proporcionales de creditos INFONAVIT si el empleado tiene dicha configuracion activa en su expediente.

### 3.2. Timbrado y Certificacion SAT
Al cerrar y validar el total del periodo, la empresa tiene dos opciones dependiendo de su configuracion:
*   **Modo Automatizado (Con PAC):** Si el area de TI configuro un Proveedor Autorizado de Certificacion en el sistema, al usar el boton "Timbrar Nomina", el ERP generara el XML Version 4.0 y lo enviara al PAC automaticamente. Tras recibir el Sello del SAT, los recibos (PDF) estaran disponibles para descarga.
*   **Modo Manual (Sin PAC):** Si la empresa aun no contrata un PAC, el ERP generara los calculos exactos (conteo, retenciones y percepciones). Esta informacion servira como base precisa para que el contador de la empresa realice el timbrado manualmente desde el portal oficial del SAT.

## 4. Auditoria y Consultas

### 4.1. Seguimiento Operativo
Todo evento de relevancia operativa (alta, baja, alteracion de sueldos o asistencias manuales) es archivado irrevocablemente por el modulo interno de Seguridad. Un usuario con nivel "Auditor" podra consultar la trazabilidad exacta de "Quien hizo que y en que fecha" dentro de las bitacoras del sistema.
