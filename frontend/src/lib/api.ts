export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Esto asegura que se envíen las cookies HttpOnly al proxy de Next.js
    credentials: 'same-origin',
  };

  const res = await fetch(`/api${endpoint}`, {
    ...defaultOptions,
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || 'Ocurrió un error en el servidor');
  }

  return data;
};

export const authApi = {
  getMe: () => fetchApi('/auth/me'),
  logout: () => fetchApi('/auth/logout', { method: 'POST' }),
};

type ApiData = Record<string, unknown>;

export const areasApi = {
  getAll: () => fetchApi('/areas/'),
  create: (data: ApiData) => fetchApi('/areas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: ApiData) =>
    fetchApi(`/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/areas/${id}`, { method: 'DELETE' }),
};

export const puestosApi = {
  getAll: () => fetchApi('/puestos/'),
  create: (data: ApiData) => fetchApi('/puestos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: ApiData) =>
    fetchApi(`/puestos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/puestos/${id}`, { method: 'DELETE' }),
};

export const empleadosApi = {
  getAll: (page: number = 1, size: number = 20, search: string = '', estatus: string = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    if (estatus && estatus !== 'Todos') params.append('estatus', estatus);
    return fetchApi(`/empleados/?${params.toString()}`);
  },
  getById: (id: number) => fetchApi(`/empleados/${id}`),
  create: (data: ApiData) =>
    fetchApi('/empleados/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: ApiData) =>
    fetchApi(`/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (id: number) => fetchApi(`/empleados/${id}/reset-password`, { method: 'POST' }),
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
  create: (data: ApiData) =>
    fetchApi('/vacaciones', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, estatus: string, motivo_rechazo?: string) =>
    fetchApi(`/vacaciones/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ estatus_vacacion: estatus, motivo_rechazo }),
    }),
};

export const asistenciasApi = {
  getAll: (mes?: number, year?: number, idarea?: number) => {
    const params = new URLSearchParams();
    if (mes) params.append('mes', String(mes));
    if (year) params.append('year', String(year));
    if (idarea) params.append('idarea', String(idarea));
    return fetchApi(`/asistencias?${params.toString()}`);
  },
  bulkUpdate: (registros: Array<{ idempleado: number; fecha: string; tipo: string }>) =>
    fetchApi('/asistencias/bulk', { method: 'POST', body: JSON.stringify({ registros }) }),
  getMisAsistencias: () => fetchApi('/asistencias/mis-asistencias'),
  checar: () => fetchApi('/asistencias/checar', { method: 'POST' }),
};

export const rolesApi = {
  getAll: () => fetchApi('/roles'),
  create: (data: ApiData) => fetchApi('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: ApiData) =>
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
