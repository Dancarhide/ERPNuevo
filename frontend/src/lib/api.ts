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
