-- CyI: vincular proceso a candidato y puesto (talento estratégico)

ALTER TABLE "cyi_progreso" ADD COLUMN IF NOT EXISTS "idcandidato" INTEGER;
ALTER TABLE "cyi_progreso" ADD COLUMN IF NOT EXISTS "idpuesto" INTEGER;

CREATE INDEX IF NOT EXISTS "cyi_progreso_idcandidato_idx" ON "cyi_progreso"("idcandidato");
CREATE INDEX IF NOT EXISTS "cyi_progreso_idpuesto_idx" ON "cyi_progreso"("idpuesto");

DO $$
BEGIN
  ALTER TABLE "cyi_progreso"
    ADD CONSTRAINT "cyi_progreso_idcandidato_fkey"
    FOREIGN KEY ("idcandidato") REFERENCES "candidatos"("idcandidato")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "cyi_progreso"
    ADD CONSTRAINT "cyi_progreso_idpuesto_fkey"
    FOREIGN KEY ("idpuesto") REFERENCES "puestos"("idpuesto")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cyi_progreso_idcandidato_etapa_id_key" ON "cyi_progreso"("idcandidato", "etapa_id");
