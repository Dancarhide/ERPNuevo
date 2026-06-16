export interface Empleado {
  id: number;
  nombre_completo: string;
  email: string;
  rfc?: string;
  curp?: string;
  telefono?: string | null;
  estatus: string;
  fecha_ingreso?: string;
  fecha_baja?: string;
  area_id?: number;
  puesto_id?: number;
  jefe_directo_id?: number;
  sueldo?: string | number;
  sueldo_fiscal?: string | number;
  turno_entrada?: string;
  turno_salida?: string;
  dias_vacaciones_disponibles?: number;
  es_sistema?: boolean;
  area?: { nombre_area: string };
  puesto?: { nombre_puesto: string };
  familiares?: unknown[];
  datos_salud?: unknown;
  cp?: string;
  sexo?: string;
  infonavit_tipo_descuento?: string;
  infonavit_valor_descuento?: string | number;
  password_temporal?: string;
}

export interface Incidencia {
  id: number;
  empleado_id: number;
  tipo_incidencia: string;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: string;
  descripcion?: string;
  justificada?: boolean;
}

export interface Evaluacion {
  id: number;
  id_empleado: number;
  evaluador_id: number;
  campania_id: number;
  respuestas: { id_pregunta: number; respuesta: string }[];
}

export interface Area {
  id: number;
  nombre_area: string;
  descripcion?: string;
}

export interface Puesto {
  id: number;
  nombre_puesto: string;
  area_id?: number | null;
  descripcion?: string | null;
}

export interface NominaLote {
  id: string;
  descripcion: string;
  fecha_creacion: string;
  periodo_inicio: string;
  periodo_fin: string;
  periodicidad: string;
  estatus: string;
  dias_periodo: number;
  aplicar_conceptos_obligatorios?: boolean;
}

export interface ReciboNomina {
  id: number;
  lote_id: string;
  empleado_id: number;
  total_percepciones: number;
  total_deducciones: number;
  neto_pagado: number;
  dias_pagados: number;
}
