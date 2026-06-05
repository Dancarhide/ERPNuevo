-- CreateTable
CREATE TABLE "areas" (
    "idarea" SERIAL NOT NULL,
    "nombre_area" VARCHAR(50),
    "jefe_area" INTEGER,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("idarea")
);

-- CreateTable
CREATE TABLE "auditoria_usuarios" (
    "id" SERIAL NOT NULL,
    "idempleado" INTEGER,
    "modificacion_empleado" TIMESTAMP(6),
    "accion" TEXT,
    "motivo" TEXT,

    CONSTRAINT "auditoria_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversacion_participantes" (
    "id" SERIAL NOT NULL,
    "conversacion_id" INTEGER,
    "empleado_id" INTEGER,
    "fecha_union" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversacion_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255),
    "tipo" VARCHAR(50) DEFAULT 'privada',
    "creado_por" INTEGER,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credenciales" (
    "idcredencial" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "user_password" TEXT NOT NULL,

    CONSTRAINT "credenciales_pkey" PRIMARY KEY ("idcredencial")
);

-- CreateTable
CREATE TABLE "dias_festivos" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,

    CONSTRAINT "dias_festivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "idempleado" SERIAL NOT NULL,
    "nombre_completo_empleado" VARCHAR(255) NOT NULL,
    "curp" VARCHAR(18),
    "rfc" VARCHAR(13),
    "email_empleado" VARCHAR(50),
    "telefono_empleado" VARCHAR(12),
    "fecha_ingreso" DATE DEFAULT CURRENT_DATE,
    "direccion_empleado" VARCHAR(255),
    "idrol" INTEGER,
    "idarea" INTEGER,
    "estatus_empleado" VARCHAR(15) DEFAULT 'Activo',
    "dias_vacaciones_disponibles" INTEGER DEFAULT 12,
    "sueldo" DECIMAL(10,2) DEFAULT 0.00,
    "puesto" VARCHAR(255),
    "foto" TEXT,
    "sueldo_fiscal" DECIMAL(10,2) DEFAULT 0.00,
    "infonavit_mensual" DECIMAL(10,2) DEFAULT 0.00,
    "fondo_ahorro_pct" DECIMAL(5,2) DEFAULT 0.00,
    "vales_despensa_pct" DECIMAL(5,2) DEFAULT 0.00,
    "idvacante" INTEGER,
    "idpuesto" INTEGER,
    "aspiraciones_profesionales" TEXT,
    "cartilla_militar" BOOLEAN DEFAULT false,
    "ciudad" VARCHAR(100),
    "colonia" VARCHAR(100),
    "cp" VARCHAR(10),
    "entidad_federativa" VARCHAR(100),
    "estado_civil" VARCHAR(30),
    "fecha_nacimiento" DATE,
    "lugar_nacimiento" VARCHAR(100),
    "sexo" VARCHAR(10),
    "ultimo_grado_escolar" VARCHAR(50),

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("idempleado")
);

-- CreateTable
CREATE TABLE "empleados_familiar" (
    "idfamiliar" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "nombre_completo_familiar" VARCHAR(255),
    "telefono_familiar" VARCHAR(12),
    "email_familiar" VARCHAR(50),
    "direccion_familiar" VARCHAR(255),
    "parentesco_familiar" VARCHAR(30),

    CONSTRAINT "empleados_familiar_pkey" PRIMARY KEY ("idfamiliar")
);

-- CreateTable
CREATE TABLE "empleados_salud" (
    "idempleadosalud" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "discapacidad" BOOLEAN DEFAULT false,
    "desc_disc" TEXT,
    "condicion" BOOLEAN DEFAULT false,
    "desc_cond" TEXT,
    "tipo_sangre" VARCHAR(10),
    "nss" VARCHAR(11),

    CONSTRAINT "empleados_salud_pkey" PRIMARY KEY ("idempleadosalud")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "idquestion" SERIAL NOT NULL,
    "create_time" DATE,
    "pregunta" TEXT,
    "modification_time" DATE,
    "evaluation_type" TEXT,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("idquestion")
);

-- CreateTable
CREATE TABLE "field_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER,
    "resource_key" VARCHAR(50) NOT NULL,
    "field_key" VARCHAR(50) NOT NULL,
    "is_hidden" BOOLEAN DEFAULT true,

    CONSTRAINT "field_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidencias" (
    "idincidencia" SERIAL NOT NULL,
    "id_empleado_reportado" INTEGER NOT NULL,
    "id_reportante" INTEGER,
    "titulo" VARCHAR(150),
    "descripcion" TEXT,
    "tipo" VARCHAR(50),
    "gravedad" VARCHAR(20),
    "estatus" VARCHAR(20) DEFAULT 'Pendiente',
    "fecha_incidencia" DATE DEFAULT CURRENT_DATE,
    "fecha_registro" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "evidencia_url" TEXT,

    CONSTRAINT "incidencias_pkey" PRIMARY KEY ("idincidencia")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id" SERIAL NOT NULL,
    "conversacion_id" INTEGER,
    "emisor_id" INTEGER,
    "contenido" TEXT NOT NULL,
    "fecha_envio" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "leido" BOOLEAN DEFAULT false,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "resource_id" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_evaluacion" (
    "id_respuesta" SERIAL NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "respuesta" TEXT,
    "fecha_respuesta" DATE NOT NULL,

    CONSTRAINT "respuestas_evaluacion_pkey" PRIMARY KEY ("id_respuesta")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "scope" VARCHAR(20) DEFAULT 'global',

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "idrol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(50),
    "desc_rol" TEXT,
    "is_system" BOOLEAN DEFAULT false,
    "description" TEXT,
    "hierarchy_level" INTEGER DEFAULT 10,
    "idarea" INTEGER,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("idrol")
);

-- CreateTable
CREATE TABLE "vacaciones" (
    "idvacacion" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estatus_vacacion" VARCHAR(20) DEFAULT 'Pendiente',
    "tipo_solicitud" VARCHAR(50) DEFAULT 'Vacaciones',
    "motivo" TEXT,
    "motivo_rechazo" TEXT,

    CONSTRAINT "vacaciones_pkey" PRIMARY KEY ("idvacacion")
);

-- CreateTable
CREATE TABLE "tareas" (
    "idtarea" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "titulo" VARCHAR(255),
    "descripcion" TEXT,
    "prioridad" VARCHAR(20) DEFAULT 'Media',
    "fecha_vencimiento" DATE,
    "completada" BOOLEAN DEFAULT false,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "asignado_por" INTEGER,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("idtarea")
);

-- CreateTable
CREATE TABLE "nominas" (
    "idnomina" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "fecha_emision" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "sueldo_base" DECIMAL(10,2) NOT NULL,
    "bonos" DECIMAL(10,2) DEFAULT 0.00,
    "deducciones" DECIMAL(10,2) DEFAULT 0.00,
    "total_pagado" DECIMAL(10,2) NOT NULL,
    "metodo_pago" VARCHAR(50),
    "estado" VARCHAR(20) DEFAULT 'Pagado',
    "monto_reportado_fiscal" DECIMAL(10,2) DEFAULT 0.00,
    "monto_variacion_complemento" DECIMAL(10,2) DEFAULT 0.00,
    "dias_trabajados" INTEGER DEFAULT 15,
    "sdi" DECIMAL(10,2) DEFAULT 0.00,
    "factor_integracion" DECIMAL(10,4) DEFAULT 1.0493,
    "costo_patronal" DECIMAL(10,2) DEFAULT 0.00,
    "certificado_sat" TEXT,
    "estatus_sat" VARCHAR(50) DEFAULT 'Pendiente',
    "fecha_timbrado" TIMESTAMP(6),
    "pdf_url" TEXT,
    "sello_sat" TEXT,
    "uuid_sat" VARCHAR(100),
    "xml_url" TEXT,
    "lote_id" VARCHAR(50),

    CONSTRAINT "nominas_pkey" PRIMARY KEY ("idnomina")
);

-- CreateTable
CREATE TABLE "conceptos_nomina" (
    "idconcepto" SERIAL NOT NULL,
    "clave" VARCHAR(20) NOT NULL,
    "nombre_concepto" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "monto_defecto" DECIMAL(10,2) DEFAULT 0.00,
    "activo" BOOLEAN DEFAULT true,
    "es_fiscal" BOOLEAN DEFAULT false,

    CONSTRAINT "conceptos_nomina_pkey" PRIMARY KEY ("idconcepto")
);

-- CreateTable
CREATE TABLE "detalles_nomina" (
    "iddetalle" SERIAL NOT NULL,
    "idnomina" INTEGER NOT NULL,
    "idconcepto" INTEGER NOT NULL,
    "monto_aplicado" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_nomina_pkey" PRIMARY KEY ("iddetalle")
);

-- CreateTable
CREATE TABLE "cyi_progreso" (
    "id" SERIAL NOT NULL,
    "etapa_id" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "items" JSONB NOT NULL,
    "notas" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempleado" INTEGER,
    "idvacante" INTEGER,
    "idcandidato" INTEGER,
    "idpuesto" INTEGER,

    CONSTRAINT "cyi_progreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos" (
    "idpuesto" SERIAL NOT NULL,
    "nombre_puesto" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "cupo_maximo" INTEGER NOT NULL DEFAULT 1,
    "personal_actual" INTEGER NOT NULL DEFAULT 0,
    "idarea" INTEGER,
    "beneficios" TEXT,
    "requisitos" TEXT,
    "sueldo_max" DECIMAL(10,2),
    "sueldo_min" DECIMAL(10,2),

    CONSTRAINT "puestos_pkey" PRIMARY KEY ("idpuesto")
);

-- CreateTable
CREATE TABLE "vacantes" (
    "idvacante" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "idarea" INTEGER,
    "idrol" INTEGER,
    "cantidad_solicitada" INTEGER NOT NULL,
    "cantidad_contratada" INTEGER NOT NULL DEFAULT 0,
    "descripcion" TEXT,
    "estatus" TEXT NOT NULL DEFAULT 'Abierta',
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idpuesto" INTEGER,

    CONSTRAINT "vacantes_pkey" PRIMARY KEY ("idvacante")
);

-- CreateTable
CREATE TABLE "candidatos" (
    "idcandidato" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "cv_url" TEXT,
    "idvacante" INTEGER,
    "idpuesto" INTEGER,
    "estatus" TEXT NOT NULL DEFAULT 'Postulado',
    "notas" TEXT,
    "fecha_postulacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("idcandidato")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "idprestamo" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL,
    "abono_periodo" DECIMAL(10,2) NOT NULL,
    "fecha_prestamo" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estatus" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "notas" TEXT,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("idprestamo")
);

-- CreateTable
CREATE TABLE "encuesta_clima" (
    "id" SERIAL NOT NULL,
    "idempleado" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nivel_jerarquico" TEXT,
    "ubicacion" TEXT,
    "hijos" TEXT,
    "antiguedad" TEXT,
    "genero" TEXT,
    "orientacion_org" JSONB,
    "admin_talento" JSONB,
    "estilo_direccion" JSONB,
    "comunicacion_int" JSONB,
    "trabajo_equipo" JSONB,
    "capacidad_prof" JSONB,
    "medio_ambiente" JSONB,

    CONSTRAINT "encuesta_clima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_empresa" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "hora_inicio" VARCHAR(5),
    "hora_fin" VARCHAR(5),
    "tipo" VARCHAR(50) NOT NULL DEFAULT 'Evento',
    "color" VARCHAR(7),
    "target_type" VARCHAR(20) DEFAULT 'TODOS',
    "idarea_target" INTEGER,
    "empleados_target" JSONB,
    "creado_por" INTEGER,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_config" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "sys_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "idnotificacion" SERIAL NOT NULL,
    "idempleado" INTEGER,
    "titulo" VARCHAR(100) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" VARCHAR(255),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("idnotificacion")
);

-- CreateIndex
CREATE INDEX "idx_participantes_empleado" ON "conversacion_participantes"("empleado_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversacion_participantes_conversacion_id_empleado_id_key" ON "conversacion_participantes"("conversacion_id", "empleado_id");

-- CreateIndex
CREATE UNIQUE INDEX "credenciales_username_key" ON "credenciales"("username");

-- CreateIndex
CREATE INDEX "ix_cred_idempleado" ON "credenciales"("idempleado");

-- CreateIndex
CREATE INDEX "ix_empleados_idarea" ON "empleados"("idarea");

-- CreateIndex
CREATE INDEX "ix_empleados_idrol" ON "empleados"("idrol");

-- CreateIndex
CREATE INDEX "ix_familiar_idempleado" ON "empleados_familiar"("idempleado");

-- CreateIndex
CREATE INDEX "ix_salud_idempleado" ON "empleados_salud"("idempleado");

-- CreateIndex
CREATE UNIQUE INDEX "field_permissions_role_id_resource_key_field_key_key" ON "field_permissions"("role_id", "resource_key", "field_key");

-- CreateIndex
CREATE INDEX "idx_mensajes_conversacion" ON "mensajes"("conversacion_id");

-- CreateIndex
CREATE INDEX "idx_mensajes_fecha" ON "mensajes"("fecha_envio");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "resources_key_key" ON "resources"("key");

-- CreateIndex
CREATE INDEX "ix_vac_idempleado" ON "vacaciones"("idempleado");

-- CreateIndex
CREATE INDEX "ix_nominas_idempleado" ON "nominas"("idempleado");

-- CreateIndex
CREATE UNIQUE INDEX "conceptos_nomina_clave_key" ON "conceptos_nomina"("clave");

-- CreateIndex
CREATE INDEX "ix_detalles_idnomina" ON "detalles_nomina"("idnomina");

-- CreateIndex
CREATE INDEX "ix_detalles_idconcepto" ON "detalles_nomina"("idconcepto");

-- CreateIndex
CREATE INDEX "cyi_progreso_idempleado_idx" ON "cyi_progreso"("idempleado");

-- CreateIndex
CREATE INDEX "cyi_progreso_idvacante_idx" ON "cyi_progreso"("idvacante");

-- CreateIndex
CREATE INDEX "cyi_progreso_idcandidato_idx" ON "cyi_progreso"("idcandidato");

-- CreateIndex
CREATE INDEX "cyi_progreso_idpuesto_idx" ON "cyi_progreso"("idpuesto");

-- CreateIndex
CREATE INDEX "cyi_progreso_etapa_id_idx" ON "cyi_progreso"("etapa_id");

-- CreateIndex
CREATE UNIQUE INDEX "cyi_progreso_idcandidato_etapa_id_key" ON "cyi_progreso"("idcandidato", "etapa_id");

-- CreateIndex
CREATE INDEX "prestamos_idempleado_idx" ON "prestamos"("idempleado");

-- CreateIndex
CREATE UNIQUE INDEX "encuesta_clima_idempleado_key" ON "encuesta_clima"("idempleado");

-- CreateIndex
CREATE UNIQUE INDEX "sys_config_key_key" ON "sys_config"("key");

-- CreateIndex
CREATE INDEX "notificaciones_idempleado_idx" ON "notificaciones"("idempleado");

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "fk_areas_jefe" FOREIGN KEY ("jefe_area") REFERENCES "empleados"("idempleado") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auditoria_usuarios" ADD CONSTRAINT "auditoria_usuarios_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversacion_participantes" ADD CONSTRAINT "conversacion_participantes_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversacion_participantes" ADD CONSTRAINT "conversacion_participantes_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "empleados"("idempleado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credenciales" ADD CONSTRAINT "fk_empleado_cred" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_idpuesto_fkey" FOREIGN KEY ("idpuesto") REFERENCES "puestos"("idpuesto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_idrol_fkey" FOREIGN KEY ("idrol") REFERENCES "roles"("idrol") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_idvacante_fkey" FOREIGN KEY ("idvacante") REFERENCES "vacantes"("idvacante") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "fk_area" FOREIGN KEY ("idarea") REFERENCES "areas"("idarea") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empleados_familiar" ADD CONSTRAINT "empleados_familiar_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empleados_salud" ADD CONSTRAINT "empleados_salud_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "field_permissions" ADD CONSTRAINT "field_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("idrol") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_id_empleado_reportado_fkey" FOREIGN KEY ("id_empleado_reportado") REFERENCES "empleados"("idempleado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_id_reportante_fkey" FOREIGN KEY ("id_reportante") REFERENCES "empleados"("idempleado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "empleados"("idempleado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "respuestas_evaluacion" ADD CONSTRAINT "respuestas_evaluacion_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleados"("idempleado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "respuestas_evaluacion" ADD CONSTRAINT "respuestas_evaluacion_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "evaluaciones"("idquestion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("idrol") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_idarea_fkey" FOREIGN KEY ("idarea") REFERENCES "areas"("idarea") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vacaciones" ADD CONSTRAINT "fk_empleado_vac" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "empleados"("idempleado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominas" ADD CONSTRAINT "nominas_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalles_nomina" ADD CONSTRAINT "detalles_nomina_idconcepto_fkey" FOREIGN KEY ("idconcepto") REFERENCES "conceptos_nomina"("idconcepto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalles_nomina" ADD CONSTRAINT "detalles_nomina_idnomina_fkey" FOREIGN KEY ("idnomina") REFERENCES "nominas"("idnomina") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cyi_progreso" ADD CONSTRAINT "cyi_progreso_idcandidato_fkey" FOREIGN KEY ("idcandidato") REFERENCES "candidatos"("idcandidato") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cyi_progreso" ADD CONSTRAINT "cyi_progreso_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cyi_progreso" ADD CONSTRAINT "cyi_progreso_idpuesto_fkey" FOREIGN KEY ("idpuesto") REFERENCES "puestos"("idpuesto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cyi_progreso" ADD CONSTRAINT "cyi_progreso_idvacante_fkey" FOREIGN KEY ("idvacante") REFERENCES "vacantes"("idvacante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puestos" ADD CONSTRAINT "puestos_idarea_fkey" FOREIGN KEY ("idarea") REFERENCES "areas"("idarea") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_idarea_fkey" FOREIGN KEY ("idarea") REFERENCES "areas"("idarea") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_idpuesto_fkey" FOREIGN KEY ("idpuesto") REFERENCES "puestos"("idpuesto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_idrol_fkey" FOREIGN KEY ("idrol") REFERENCES "roles"("idrol") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_idpuesto_fkey" FOREIGN KEY ("idpuesto") REFERENCES "puestos"("idpuesto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_idvacante_fkey" FOREIGN KEY ("idvacante") REFERENCES "vacantes"("idvacante") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuesta_clima" ADD CONSTRAINT "encuesta_clima_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE SET NULL ON UPDATE CASCADE;
