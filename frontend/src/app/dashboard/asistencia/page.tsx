'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaClipboardList,
  FaCheckCircle,
  FaExclamationCircle,
  FaNetworkWired,
  FaPlus,
  FaPlug,
  FaTrash,
} from 'react-icons/fa';
import { Search, Filter, Building2, Calendar, Loader2 } from 'lucide-react';
import { asistenciasApi, dispositivosApi, areasApi } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

interface Area {
  id: number;
  nombre_area: string;
}

interface Asistencia {
  id: number;
  empleado_id: number;
  empleado_nombre: string;
  fecha: string;
  hora_entrada: string | null;
  hora_salida_descanso: string | null;
  hora_entrada_descanso: string | null;
  hora_salida: string | null;
  tiempo_efectivo_minutos: number;
  tipo: string;
  justificacion: string | null;
}

interface Dispositivo {
  id: number;
  nombre: string;
  marca: string;
  metodo_conexion: string;
  ip_address: string | null;
  puerto: number | null;
  token_auth: string | null;
  ultima_sincronizacion: string | null;
  activo: boolean;
}

export default function GestionAsistenciaPage() {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'asistencias' | 'dispositivos'>('asistencias');

  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshKey] = useState(0);

  // Filtros Asistencias
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [page, setPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [areasList, setAreasList] = useState<Area[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    nombre: '',
    marca: 'ZKTECO',
    metodo_conexion: 'PULL_IP',
    ip_address: '',
    puerto: 4370,
  });

  // Load Catalogs
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const areasData = await areasApi.getAll();
        setAreasList(
          Array.isArray(areasData) ? areasData : (areasData as { items: Area[] }).items || []
        );
      } catch (error) {
        console.error('Error al cargar catálogos', error);
      }
    };
    if (user?.permisos?.includes('ver_asistencia')) {
      loadCatalogs();
    }
  }, [user]);

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await asistenciasApi.getAll(
        page,
        20,
        search,
        tipoFilter,
        areaFilter,
        fechaInicio,
        fechaFin
      );
      setAsistencias(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('Error fetching asistencias', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, tipoFilter, areaFilter, fechaInicio, fechaFin]);

  const fetchDispositivos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dispositivosApi.getAll();
      setDispositivos(data);
    } catch (error) {
      console.error('Error fetching dispositivos', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.permisos.includes('ver_asistencia')) {
      if (viewMode === 'asistencias') {
        const delayDebounce = setTimeout(() => {
          fetchAsistencias();
        }, 500);
        return () => clearTimeout(delayDebounce);
      } else {
        const delay = setTimeout(() => {
          fetchDispositivos();
        }, 0);
        return () => clearTimeout(delay);
      }
    }
  }, [user, viewMode, fetchAsistencias, fetchDispositivos, refreshKey]);

  const clearFilters = () => {
    setSearch('');
    setTipoFilter('Todos');
    setAreaFilter('');
    setFechaInicio('');
    setFechaFin('');
    setPage(1);
  };

  if (authLoading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  if (!user?.permisos?.includes('ver_asistencia')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <FaClipboardList className="text-6xl text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
        <p className="text-gray-500">No tienes permisos para gestionar asistencias.</p>
      </div>
    );
  }

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispositivosApi.create(newDevice);
      setShowModal(false);
      fetchDispositivos();
    } catch {
      alert('Error al crear dispositivo');
    }
  };

  const handleDeleteDevice = async (id: number) => {
    if (confirm('¿Seguro que deseas eliminar este dispositivo?')) {
      try {
        await dispositivosApi.delete(id);
        fetchDispositivos();
      } catch {
        alert('Error al eliminar');
      }
    }
  };

  const handlePing = async (id: number) => {
    try {
      const res = await dispositivosApi.ping(id);
      alert(res.message || 'Conexión exitosa');
    } catch (error: unknown) {
      const err = error as Error;
      alert('Error de conexión: ' + (err.message || 'Fallo el SDK local'));
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaClipboardList className="text-[#A7313A]" /> Gestión de Asistencias
          </h1>
          <p className="text-gray-500">
            Control global de asistencia y sincronización de checadores físicos
          </p>
        </div>
        <div className="flex gap-3 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => setViewMode('asistencias')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${viewMode === 'asistencias' ? 'bg-[#A7313A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Registros
          </button>
          <button
            onClick={() => setViewMode('dispositivos')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'dispositivos' ? 'bg-[#A7313A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FaNetworkWired /> Dispositivos
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {viewMode === 'asistencias' ? (
          <div className="flex flex-col">
            {/* Main Toolbar */}
            <div className="p-5 border-b border-[#F3F4F6] flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white gap-4">
              <div className="relative w-full xl:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-[#858789]" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre de empleado..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] text-[#44474A] transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <select
                  value={tipoFilter}
                  onChange={(e) => {
                    setTipoFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] text-[#44474A] transition-all bg-white"
                >
                  <option value="Todos">Todos los tipos</option>
                  <option value="Normal">Normal</option>
                  <option value="Retardo">Retardo</option>
                  <option value="Falta">Falta</option>
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showAdvancedFilters ? 'bg-[#A7313A]/10 border-[#A7313A]/30 text-[#A7313A]' : 'bg-white border-[#E1DFE0] text-[#44474A] hover:bg-gray-50'}`}
                >
                  <Filter size={18} />
                  Filtros Avanzados
                </button>
              </div>
            </div>

            {/* Advanced Filters Drawer */}
            {showAdvancedFilters && (
              <div className="p-5 bg-gray-50 border-b border-[#F3F4F6] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 size={14} /> Área
                  </label>
                  <select
                    value={areaFilter}
                    onChange={(e) => {
                      setAreaFilter(e.target.value ? Number(e.target.value) : '');
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
                  >
                    <option value="">Todas las Áreas</option>
                    {areasList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre_area}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={14} /> Desde
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => {
                        setFechaInicio(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={14} /> Hasta
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => {
                        setFechaFin(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm font-semibold text-[#858789] hover:text-[#A7313A] underline-offset-4 hover:underline"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-transparent text-[#858789] text-[0.85rem] uppercase tracking-wider border-b border-[#E1DFE0]">
                    <th className="px-6 py-4 font-semibold">Empleado</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Entrada</th>
                    <th className="px-6 py-4 font-semibold">Descanso (Inicio/Fin)</th>
                    <th className="px-6 py-4 font-semibold">Salida</th>
                    <th className="px-6 py-4 font-semibold">Hrs. Trabajadas</th>
                    <th className="px-6 py-4 font-semibold">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Loader2 size={36} className="animate-spin text-[#A7313A] mx-auto mb-4" />
                        <p className="text-[#858789] font-medium">Cargando registros...</p>
                      </td>
                    </tr>
                  ) : asistencias.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-[#858789]">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="font-semibold text-[#44474A] text-lg mb-1">Sin Resultados</p>
                        <p className="text-sm">
                          No se encontraron asistencias que coincidan con los filtros aplicados.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    asistencias.map((a) => (
                      <tr key={a.id} className="hover:bg-transparent transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#44474A]">{a.empleado_nombre}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-[#858789]">
                          {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4">
                          {a.hora_entrada ? (
                            <span className="text-[#44474A] font-medium">{a.hora_entrada}</span>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Sin registro</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {a.hora_salida_descanso || a.hora_entrada_descanso ? (
                            <span className="text-[#858789] text-sm">
                              {a.hora_salida_descanso || '--:--'} a{' '}
                              {a.hora_entrada_descanso || '--:--'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm italic">No aplica</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {a.hora_salida ? (
                            <span className="text-[#44474A] font-medium">{a.hora_salida}</span>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Sin registro</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#44474A] font-semibold text-sm">
                            {a.tiempo_efectivo_minutos > 0
                              ? `${(a.tiempo_efectivo_minutos / 60).toFixed(1)} hrs`
                              : '0 hrs'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {a.tipo === 'Normal' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[0.75rem] font-bold tracking-wide uppercase shadow-sm">
                              <FaCheckCircle /> Normal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[0.75rem] font-bold tracking-wide uppercase shadow-sm">
                              <FaExclamationCircle /> {a.tipo}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loading && asistencias.length > 0 && (
              <div className="p-4 border-t border-[#F3F4F6] flex items-center justify-between bg-gray-50 text-[0.9rem] text-[#858789]">
                <div>
                  Mostrando <span className="font-bold text-[#44474A]">{asistencias.length}</span>{' '}
                  de <span className="font-bold text-[#44474A]">{total}</span> asistencias
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-[#E1DFE0] bg-white rounded-xl hover:bg-transparent hover:text-[#44474A] hover:border-[#44474A] disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-[#E1DFE0] font-medium transition-all shadow-sm"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={asistencias.length < 20}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border border-[#E1DFE0] bg-white rounded-xl hover:bg-transparent hover:text-[#44474A] hover:border-[#44474A] disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-[#E1DFE0] font-medium transition-all shadow-sm"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VISTA DISPOSITIVOS */
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Checadores Biométricos</h2>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#A7313A] text-white rounded-lg hover:bg-[#85252e] font-medium"
              >
                <FaPlus /> Agregar Dispositivo
              </button>
            </div>
            {loading ? (
              <div className="p-12 text-center text-gray-500">Cargando dispositivos...</div>
            ) : dispositivos.length === 0 ? (
              <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                No tienes checadores físicos configurados. Añade uno para comenzar a recibir
                asistencias.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dispositivos.map((d) => (
                  <div
                    key={d.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-800 text-lg">{d.nombre}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full ${d.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {d.activo ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      <strong>Marca:</strong> {d.marca}
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                      <strong>Modo:</strong> {d.metodo_conexion}
                    </p>

                    {d.metodo_conexion === 'PULL_IP' && (
                      <p className="text-sm text-gray-500 mb-4">
                        <strong>IP Local:</strong> {d.ip_address}:{d.puerto}
                      </p>
                    )}
                    {d.metodo_conexion === 'PUSH_WEBHOOK' && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-bold">Webhook Token:</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                          {d.token_auth}
                        </code>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mb-4">
                      Última sync:{' '}
                      {d.ultima_sincronizacion
                        ? new Date(d.ultima_sincronizacion).toLocaleString()
                        : 'Nunca'}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      {d.metodo_conexion === 'PULL_IP' && (
                        <button
                          onClick={() => handlePing(d.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                        >
                          <FaPlug /> Ping
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDevice(d.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 ml-auto"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add Device */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Nuevo Checador</h2>
            <form onSubmit={handleCreateDevice}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Ubicación
                  </label>
                  <input
                    type="text"
                    required
                    value={newDevice.nombre}
                    onChange={(e) => setNewDevice({ ...newDevice, nombre: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Ej. Entrada Principal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca del Equipo
                  </label>
                  <select
                    value={newDevice.marca}
                    onChange={(e) => setNewDevice({ ...newDevice, marca: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ZKTECO">ZKTeco (o compatible)</option>
                    <option value="HIKVISION">Hikvision</option>
                    <option value="SUPREMA">Suprema</option>
                    <option value="OTRA">Otra (Genérico)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modo de Conexión
                  </label>
                  <select
                    value={newDevice.metodo_conexion}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, metodo_conexion: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {newDevice.marca === 'ZKTECO' && (
                      <option value="PULL_IP">Modo Pasivo (IP Local TCP/IP)</option>
                    )}
                    <option value="PUSH_WEBHOOK">Modo Activo (ADMS / Webhook)</option>
                  </select>
                </div>

                {newDevice.metodo_conexion === 'PULL_IP' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección IP Local
                      </label>
                      <input
                        type="text"
                        required
                        value={newDevice.ip_address}
                        onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="192.168.1.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                      <input
                        type="number"
                        required
                        value={newDevice.puerto}
                        onChange={(e) =>
                          setNewDevice({ ...newDevice, puerto: Number(e.target.value) })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
                {newDevice.metodo_conexion === 'PUSH_WEBHOOK' && (
                  <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    Se generará un Token criptográfico automáticamente al guardar para que
                    configures el ADMS del equipo.
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#A7313A] text-white rounded-lg hover:bg-[#85252e] font-medium"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
