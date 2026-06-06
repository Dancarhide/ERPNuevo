'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { empleadosApi, areasApi, puestosApi } from '@/lib/api';
import {
  Search,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Filter,
  Briefcase,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react';

type Area = { id: number; nombre_area: string };
type Puesto = { id: number; nombre_puesto: string };

type Empleado = {
  id: number;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  rfc: string | null;
  estatus: string;
  area: Area | null;
  puesto: Puesto | null;
  fecha_ingreso: string | null;
  sueldo: number;
  sueldo_fiscal: number;
};

export default function EmpleadosPage() {
  const router = useRouter();

  // Catálogos para filtros
  const [areasList, setAreasList] = useState<Area[]>([]);
  const [puestosList, setPuestosList] = useState<Puesto[]>([]);
  const [jefesList, setJefesList] = useState<{ id: number; nombre_completo: string }[]>([]);

  // Datos de tabla
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtros
  const [search, setSearch] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState<number | ''>('');
  const [puestoFilter, setPuestoFilter] = useState<number | ''>('');
  const [jefeFilter, setJefeFilter] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [page, setPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [areasData, puestosData, jefesData] = await Promise.all([
          areasApi.getAll(),
          puestosApi.getAll(),
          empleadosApi.getAll(1, 100, '', 'Activo'), // Para lista de jefes (max 100)
        ]);

        // Se asume que areasData.items o areasData devuelve la lista. Ajusta según tu backend.
        setAreasList(Array.isArray(areasData) ? areasData : areasData.items || []);
        setPuestosList(Array.isArray(puestosData) ? puestosData : puestosData.items || []);
        setJefesList(jefesData.items || []);
      } catch (error) {
        console.error('Error al cargar catálogos', error);
      }
    };
    loadCatalogs();
  }, []);

  const fetchEmpleados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await empleadosApi.getAll(
        page,
        10,
        search,
        estatusFilter,
        areaFilter,
        puestoFilter,
        jefeFilter,
        fechaInicio,
        fechaFin
      );
      setEmpleados(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('Error al obtener empleados:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, estatusFilter, areaFilter, puestoFilter, jefeFilter, fechaInicio, fechaFin]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmpleados();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [fetchEmpleados, refreshKey]);

  const handleToggleEstatus = async (id: number, currentEstatus: string) => {
    const newEstatus = currentEstatus === 'Activo' ? 'Inactivo' : 'Activo';
    if (!confirm(`¿Estás seguro de marcar a este empleado como ${newEstatus}?`)) return;

    try {
      await empleadosApi.update(id, { estatus: newEstatus });
      setRefreshKey((k) => k + 1);
    } catch {
      alert('Error al actualizar estatus');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setEstatusFilter('Todos');
    setAreaFilter('');
    setPuestoFilter('');
    setJefeFilter('');
    setFechaInicio('');
    setFechaFin('');
    setPage(1);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#44474A] tracking-[-0.02em] mb-1">
            Directorio de Empleados
          </h1>
          <p className="text-[#858789] text-[1rem]">
            Gestiona la información y expedientes de la plantilla laboral.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/empleados/nuevo')}
          className="bg-[#A7313A] hover:bg-[#8F2930] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={20} />
          Nuevo Empleado
        </button>
      </div>

      <div className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
        {/* Main Toolbar */}
        <div className="p-5 border-b border-[#F3F4F6] flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white gap-4">
          <div className="relative w-full xl:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#858789]" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o RFC..."
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
              value={estatusFilter}
              onChange={(e) => {
                setEstatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] text-[#44474A] transition-all bg-white"
            >
              <option value="Todos">Todos los estatus</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
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
          <div className="p-5 bg-gray-50 border-b border-[#F3F4F6] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
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
            <div>
              <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase size={14} /> Puesto
              </label>
              <select
                value={puestoFilter}
                onChange={(e) => {
                  setPuestoFilter(e.target.value ? Number(e.target.value) : '');
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
              >
                <option value="">Todos los Puestos</option>
                {puestosList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre_puesto}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck size={14} /> Jefe Directo
              </label>
              <select
                value={jefeFilter}
                onChange={(e) => {
                  setJefeFilter(e.target.value ? Number(e.target.value) : '');
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
              >
                <option value="">Cualquier Jefe</option>
                {jefesList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-1 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar size={14} /> Ingreso Desde
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
                  <Calendar size={14} /> Ingreso Hasta
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

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-[#858789] hover:text-[#A7313A] underline-offset-4 hover:underline"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#858789] text-[0.85rem] uppercase tracking-wider border-b border-[#E1DFE0]">
                <th className="px-6 py-4 font-semibold">Empleado</th>
                <th className="px-6 py-4 font-semibold">Posición & Área</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Ingreso</th>
                <th className="px-6 py-4 font-semibold">Sueldo Base</th>
                <th className="px-6 py-4 font-semibold">Estatus</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 size={36} className="animate-spin text-[#A7313A] mx-auto mb-4" />
                    <p className="text-[#858789] font-medium">Buscando empleados...</p>
                  </td>
                </tr>
              ) : empleados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[#858789]">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <p className="font-semibold text-[#44474A] text-lg mb-1">Sin Resultados</p>
                    <p className="text-sm">
                      No se encontraron empleados que coincidan con los filtros aplicados.
                    </p>
                  </td>
                </tr>
              ) : (
                empleados.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F8F9FA] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A7313A] to-[#8F2930] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                          {emp.nombre_completo.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#44474A]">{emp.nombre_completo}</div>
                          <div className="text-[0.8rem] font-medium text-[#858789] bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1 border border-gray-200">
                            {emp.rfc || 'Sin RFC'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#44474A] font-semibold text-[0.95rem] flex items-center gap-1.5">
                        <Briefcase size={14} className="text-[#858789]" />
                        {emp.puesto?.nombre_puesto || 'Sin Puesto'}
                      </div>
                      <div className="text-[0.85rem] text-[#858789] flex items-center gap-1.5 mt-1">
                        <Building2 size={14} />
                        {emp.area?.nombre_area || 'Sin Área'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#44474A] text-[0.95rem]">{emp.email || '—'}</div>
                      <div className="text-[0.85rem] text-[#858789] mt-1">
                        {emp.telefono || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#44474A] text-[0.95rem] font-medium flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#858789]" />
                        {emp.fecha_ingreso
                          ? new Date(emp.fecha_ingreso).toLocaleDateString('es-MX')
                          : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-emerald-600 text-[0.95rem]">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                        }).format(emp.sueldo)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-bold tracking-wide uppercase shadow-sm border ${
                          emp.estatus === 'Activo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${emp.estatus === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        {emp.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleToggleEstatus(emp.id, emp.estatus)}
                          title={emp.estatus === 'Activo' ? 'Dar de baja' : 'Reactivar'}
                          className={`p-2 rounded-xl transition-all ${emp.estatus === 'Activo' ? 'text-rose-500 hover:bg-rose-50 hover:border-rose-100 border border-transparent' : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100 border border-transparent'}`}
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/empleados/${emp.id}/editar`)}
                          className="p-2 text-[#858789] hover:text-[#A7313A] rounded-xl hover:bg-[#A7313A]/10 border border-transparent hover:border-[#A7313A]/20 transition-all shadow-sm"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && empleados.length > 0 && (
          <div className="p-4 border-t border-[#F3F4F6] flex items-center justify-between bg-gray-50 text-[0.9rem] text-[#858789]">
            <div>
              Mostrando <span className="font-bold text-[#44474A]">{empleados.length}</span> de{' '}
              <span className="font-bold text-[#44474A]">{total}</span> empleados
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-[#E1DFE0] bg-white rounded-xl hover:bg-[#F8F9FA] hover:text-[#44474A] hover:border-[#44474A] disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-[#E1DFE0] font-medium transition-all shadow-sm"
              >
                Anterior
              </button>
              <button
                disabled={empleados.length < 10}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-[#E1DFE0] bg-white rounded-xl hover:bg-[#F8F9FA] hover:text-[#44474A] hover:border-[#44474A] disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-[#E1DFE0] font-medium transition-all shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
