/*
  Warnings:

  - You are about to drop the column `is_hidden` on the `field_permissions` table. All the data in the column will be lost.

*/
-- AlterTable dias_festivos (idempotente)
ALTER TABLE "dias_festivos" ADD COLUMN IF NOT EXISTS "nota_ley" TEXT;
ALTER TABLE "dias_festivos" ADD COLUMN IF NOT EXISTS "paga_doble" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "dias_festivos" ADD COLUMN IF NOT EXISTS "tipo_ley" VARCHAR(100) NOT NULL DEFAULT 'Obligatorio';

-- AlterTable empleados (idempotente)
ALTER TABLE "empleados" ADD COLUMN IF NOT EXISTS "id_jefe_directo" INTEGER;

-- AlterTable field_permissions (idempotente)
ALTER TABLE "field_permissions" DROP COLUMN IF EXISTS "is_hidden";
ALTER TABLE "field_permissions" ADD COLUMN IF NOT EXISTS "can_read" BOOLEAN DEFAULT true;
ALTER TABLE "field_permissions" ADD COLUMN IF NOT EXISTS "can_write" BOOLEAN DEFAULT false;

-- CreateTable lotes_nomina (idempotente)
CREATE TABLE IF NOT EXISTS "lotes_nomina" (
    "id_lote" VARCHAR(50) NOT NULL,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "tipo_nomina" VARCHAR(20),
    "total_lote" DECIMAL(15,2) NOT NULL,
    "estatus" VARCHAR(20) DEFAULT 'Borrador',
    "creado_por" INTEGER,

    CONSTRAINT "lotes_nomina_pkey" PRIMARY KEY ("id_lote")
);

-- CreateTable empleado_roles (idempotente)
CREATE TABLE IF NOT EXISTS "empleado_roles" (
    "idempleado" INTEGER NOT NULL,
    "idrol" INTEGER NOT NULL,

    CONSTRAINT "empleado_roles_pkey" PRIMARY KEY ("idempleado","idrol")
);

-- CreateTable empleado_permissions (idempotente)
CREATE TABLE IF NOT EXISTS "empleado_permissions" (
    "idempleado" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "scope" VARCHAR(20) DEFAULT 'global',
    "concedido" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empleado_permissions_pkey" PRIMARY KEY ("idempleado","permission_id")
);

-- CreateTable delegacion_roles (idempotente)
CREATE TABLE IF NOT EXISTS "delegacion_roles" (
    "id" SERIAL NOT NULL,
    "delegador_id" INTEGER NOT NULL,
    "delegado_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estatus" VARCHAR(20) NOT NULL DEFAULT 'Activa',

    CONSTRAINT "delegacion_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "ix_nominas_lote" ON "nominas"("lote_id");

-- AddForeignKey (idempotentes via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empleados_id_jefe_directo_fkey') THEN
    ALTER TABLE "empleados" ADD CONSTRAINT "empleados_id_jefe_directo_fkey"
      FOREIGN KEY ("id_jefe_directo") REFERENCES "empleados"("idempleado") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nominas_lote_id_fkey') THEN
    ALTER TABLE "nominas" ADD CONSTRAINT "nominas_lote_id_fkey"
      FOREIGN KEY ("lote_id") REFERENCES "lotes_nomina"("id_lote") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empleado_roles_idempleado_fkey') THEN
    ALTER TABLE "empleado_roles" ADD CONSTRAINT "empleado_roles_idempleado_fkey"
      FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empleado_roles_idrol_fkey') THEN
    ALTER TABLE "empleado_roles" ADD CONSTRAINT "empleado_roles_idrol_fkey"
      FOREIGN KEY ("idrol") REFERENCES "roles"("idrol") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empleado_permissions_idempleado_fkey') THEN
    ALTER TABLE "empleado_permissions" ADD CONSTRAINT "empleado_permissions_idempleado_fkey"
      FOREIGN KEY ("idempleado") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'empleado_permissions_permission_id_fkey') THEN
    ALTER TABLE "empleado_permissions" ADD CONSTRAINT "empleado_permissions_permission_id_fkey"
      FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delegacion_roles_delegador_id_fkey') THEN
    ALTER TABLE "delegacion_roles" ADD CONSTRAINT "delegacion_roles_delegador_id_fkey"
      FOREIGN KEY ("delegador_id") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delegacion_roles_delegado_id_fkey') THEN
    ALTER TABLE "delegacion_roles" ADD CONSTRAINT "delegacion_roles_delegado_id_fkey"
      FOREIGN KEY ("delegado_id") REFERENCES "empleados"("idempleado") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delegacion_roles_rol_id_fkey') THEN
    ALTER TABLE "delegacion_roles" ADD CONSTRAINT "delegacion_roles_rol_id_fkey"
      FOREIGN KEY ("rol_id") REFERENCES "roles"("idrol") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
