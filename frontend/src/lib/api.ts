interface FetchApiOptions extends RequestInit {
  parseJson?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchApi = async <T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> => {
  const { parseJson = true, ...restOptions } = options;
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...restOptions.headers,
    },
    // Esto asegura que se envíen las cookies HttpOnly al proxy de Next.js
    credentials: 'same-origin',
  };

  const res = await fetch(`/api${endpoint}`, {
    ...defaultOptions,
    ...restOptions,
  });

  if (!parseJson) {
    if (!res.ok) {
      throw new Error('Ocurrió un error en el servidor al obtener el archivo');
    }
    return (await res.text()) as unknown as T;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}: Respuesta no pudo ser procesada`);
    }
  }

  if (!res.ok) {
    throw new Error(data?.detail || `Error HTTP ${res.status}`);
  }

  return data as T;
};

export type ApiData = unknown;

export const uploadApi = async <T = unknown>(endpoint: string, file: File): Promise<T> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || 'Ocurrió un error en el servidor al subir el archivo');
  }

  return data as T;
};

export const authApi = {
  getMe: () => fetchApi('/auth/me'),
  logout: () => fetchApi('/auth/logout', { method: 'POST' }),
  getWsToken: () => fetchApi('/auth/ws-token'),
  changePassword: (new_password: string) =>
    fetchApi('/auth/change-password', { method: 'POST', body: JSON.stringify({ new_password }) }),
};

import { Area, Puesto, Empleado } from '@/types';

export const areasApi = {
  getAll: () => fetchApi<Area[]>('/areas/'),
  create: (data: Partial<Area>) =>
    fetchApi<Area>('/areas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Area>) =>
    fetchApi<Area>(`/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/areas/${id}`, { method: 'DELETE' }),
};

export const puestosApi = {
  getAll: () => fetchApi<Puesto[]>('/puestos/'),
  create: (data: Partial<Puesto>) =>
    fetchApi<Puesto>('/puestos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Puesto>) =>
    fetchApi<Puesto>(`/puestos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/puestos/${id}`, { method: 'DELETE' }),
};

export const empleadosApi = {
  getAll: (
    page: number = 1,
    size: number = 20,
    search: string = '',
    estatus: string = '',
    area_id: number | '' = '',
    puesto_id: number | '' = '',
    jefe_directo_id: number | '' = '',
    fecha_ingreso_inicio: string = '',
    fecha_ingreso_fin: string = ''
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    if (estatus && estatus !== 'Todos') params.append('estatus', estatus);
    if (area_id !== '') params.append('area_id', String(area_id));
    if (puesto_id !== '') params.append('puesto_id', String(puesto_id));
    if (jefe_directo_id !== '') params.append('jefe_directo_id', String(jefe_directo_id));
    if (fecha_ingreso_inicio) params.append('fecha_ingreso_inicio', fecha_ingreso_inicio);
    if (fecha_ingreso_fin) params.append('fecha_ingreso_fin', fecha_ingreso_fin);

    return fetchApi<{ items: Empleado[]; total: number }>(`/empleados/?${params.toString()}`);
  },
  getById: (id: number) => fetchApi<Empleado>(`/empleados/${id}`),
  create: (data: Partial<Empleado> & Record<string, unknown>) =>
    fetchApi<Empleado>('/empleados/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Empleado> & Record<string, unknown>) =>
    fetchApi<Empleado>(`/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (id: number) =>
    fetchApi<{ message: string; password_temporal: string }>(`/empleados/${id}/reset-password`, {
      method: 'POST',
    }),
};

export const organigramaApi = {
  get: () => fetchApi('/organigrama'),
};

export const vacacionesApi = {
  getAll: (empleadoId?: number) => {
    const params = new URLSearchParams();
    if (empleadoId) params.append('empleado_id', String(empleadoId));
    return fetchApi(`/vacaciones?${params.toString()}`);
  },
  create: (data: Record<string, unknown>) =>
    fetchApi('/vacaciones', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, estatus: string, motivo_rechazo?: string) =>
    fetchApi(`/vacaciones/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ estatus_vacacion: estatus, motivo_rechazo }),
    }),
};

export const asistenciasApi = {
  getAll: (
    page: number = 1,
    size: number = 20,
    search: string = '',
    tipo: string = '',
    area_id: number | '' = '',
    fecha_inicio: string = '',
    fecha_fin: string = ''
  ) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    if (tipo && tipo !== 'Todos') params.append('tipo', tipo);
    if (area_id !== '') params.append('area_id', String(area_id));
    if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) params.append('fecha_fin', fecha_fin);

    return fetchApi(`/asistencias?${params.toString()}`);
  },
  bulkUpdate: (registros: Array<{ idempleado: number; fecha: string; tipo: string }>) =>
    fetchApi('/asistencias/bulk', { method: 'POST', body: JSON.stringify({ registros }) }),
  getMisAsistencias: () => fetchApi('/asistencias/mis-asistencias'),
  checar: () => fetchApi('/asistencias/checar', { method: 'POST' }),
};

export const rolesApi = {
  getAll: () => fetchApi('/roles'),
  create: (data: Record<string, unknown>) =>
    fetchApi('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/roles/${id}`, { method: 'DELETE' }),
  asignar: (empleado_id: number, rol_id: number) =>
    fetchApi('/roles/asignar', { method: 'POST', body: JSON.stringify({ empleado_id, rol_id }) }),
  getPermisos: () => fetchApi('/roles/recursos/permisos'),
  getEmpleadoPermisos: (empleado_id: number) => fetchApi(`/roles/empleado/${empleado_id}/permisos`),
  updateEmpleadoPermisos: (empleado_id: number, permisos: Record<number, boolean>) =>
    fetchApi(`/roles/empleado/${empleado_id}/permisos`, {
      method: 'PUT',
      body: JSON.stringify({ permisos }),
    }),
};

export const dispositivosApi = {
  getAll: () => fetchApi('/dispositivos'),
  create: (data: Record<string, unknown>) =>
    fetchApi('/dispositivos', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/dispositivos/${id}`, { method: 'DELETE' }),
  ping: (id: number) => fetchApi(`/dispositivos/${id}/ping`, { method: 'POST' }),
};

export const empresaApi = {
  getInfo: () => fetchApi('/empresa/info'),
  updateInfo: (data: Record<string, unknown>) =>
    fetchApi('/empresa/info', { method: 'PUT', body: JSON.stringify(data) }),
  uploadImage: (file: File) => uploadApi('/empresa/upload-image', file),
};
export const kpiApi = {
  getHeadcount: () => fetchApi('/kpis/headcount'),
  getPayroll: () => fetchApi('/kpis/payroll'),
  getIncidencias: () => fetchApi('/kpis/incidencias'),
};

export const dashboardApi = {
  getConfig: () => fetchApi('/dashboard/config'),
  saveConfig: (layout_json: unknown) =>
    fetchApi('/dashboard/config', { method: 'PUT', body: JSON.stringify({ layout_json }) }),
};

export const nominaApi = {
  // Catálogo de conceptos
  getConceptos: (tipo?: string) => fetchApi(`/nomina/conceptos${tipo ? `?tipo=${tipo}` : ''}`),
  createConcepto: (data: Record<string, unknown>) =>
    fetchApi('/nomina/conceptos', { method: 'POST', body: JSON.stringify(data) }),
  updateConcepto: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/nomina/conceptos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConcepto: (id: number) => fetchApi(`/nomina/conceptos/${id}`, { method: 'DELETE' }),
  seedConceptos: () =>
    fetchApi('/nomina/conceptos/seed', { method: 'POST', body: JSON.stringify({}) }),

  // Lotes
  getLotes: (params?: { año?: number; estatus?: string; periodicidad?: string }) => {
    const q = new URLSearchParams();
    if (params?.año) q.append('año', String(params.año));
    if (params?.estatus) q.append('estatus', params.estatus);
    if (params?.periodicidad) q.append('periodicidad', params.periodicidad);
    return fetchApi(`/nomina/lotes?${q.toString()}`);
  },
  createLote: (data: Record<string, unknown>) =>
    fetchApi('/nomina/lotes', { method: 'POST', body: JSON.stringify(data) }),
  getLote: (loteId: string) => fetchApi(`/nomina/lotes/${loteId}`),
  procesarLote: (loteId: string) =>
    fetchApi(`/nomina/lotes/${loteId}/procesar`, {
      method: 'POST',
      body: JSON.stringify({ aplicar_conceptos_obligatorios: true }),
    }),
  cerrarLote: (loteId: string) => fetchApi(`/nomina/lotes/${loteId}/cerrar`, { method: 'PUT' }),

  // CFDI Stamping
  timbrarRecibo: (nominaId: number) =>
    fetchApi(`/nomina/recibos/${nominaId}/timbrar`, { method: 'POST' }),
  timbrarLote: (loteId: string | number) =>
    fetchApi(`/nomina/lotes/${loteId}/timbrar`, { method: 'POST' }),
  getXmlRecibo: (nominaId: number) =>
    fetchApi(`/nomina/recibos/${nominaId}/xml`, { parseJson: false }),

  // Recibos
  getRecibo: (nominaId: number) => fetchApi(`/nomina/recibos/${nominaId}`),
  updateRecibo: (nominaId: number, data: Record<string, unknown>) =>
    fetchApi(`/nomina/lotes/recibos/${nominaId}`, { method: 'PUT', body: JSON.stringify(data) }),
  createRecibo: (data: Record<string, unknown>) =>
    fetchApi('/nomina/recibos', { method: 'POST', body: JSON.stringify(data) }),
  getMisRecibos: () => fetchApi('/nomina/mis-recibos'),
  getReciboXML: (nominaId: number) => fetchApi(`/nomina/recibos/${nominaId}/xml`),
  getReciboPDF: (nominaId: number) => fetchApi(`/nomina/recibos/${nominaId}/pdf`),
  importarCsv: async (loteId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/nomina/lotes/${loteId}/importar`, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.detail || 'Error al importar');
    return data;
  },
};

export const incidenciasApi = {
  getAll: (estatus?: string) => {
    const q = new URLSearchParams();
    if (estatus) q.append('estatus', estatus);
    return fetchApi(`/incidencias/?${q.toString()}`);
  },
  create: (data: Record<string, unknown>) =>
    fetchApi('/incidencias/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/incidencias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/incidencias/${id}`, { method: 'DELETE' }),
};

export const notificacionesApi = {
  getAll: () => fetchApi('/notificaciones/'),
  marcarLeida: (id: number) => fetchApi(`/notificaciones/${id}/leida`, { method: 'PUT' }),
  marcarTodasLeidas: () => fetchApi('/notificaciones/leidas', { method: 'PUT' }),
};

export const tareasApi = {
  getAll: () => fetchApi('/tareas'),
  create: (data: Record<string, unknown>) =>
    fetchApi('/tareas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/tareas/${id}`, { method: 'DELETE' }),
};

export const chatApi = {
  getMensajes: (destinatario_id: number) => fetchApi(`/chat/conversacion/${destinatario_id}`),
  sendMensaje: (data: Record<string, unknown>) =>
    fetchApi('/chat', { method: 'POST', body: JSON.stringify(data) }),
  getUnread: () => fetchApi('/chat/unread'),
};

export const parametrosFiscalesApi = {
  getAll: () => fetchApi('/parametros_fiscales'),
  create: (data: Record<string, unknown>) =>
    fetchApi('/parametros_fiscales', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/parametros_fiscales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
