'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { empleadosApi } from '@/lib/api';
import { Search, Plus, Loader2, Edit2, Trash2 } from 'lucide-react';

type Empleado = {
  id: number;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  rfc: string | null;
  estatus: string;
};

export default function EmpleadosPage() {
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setLoading(true);
        const res = await empleadosApi.getAll(page, 10, search, estatusFilter);
        setEmpleados(res.items || []);
        setTotal(res.total || 0);
      } catch (error) {
        console.error('Error al obtener empleados:', error);
      } finally {
        setLoading(false);
      }
    };
    const delayDebounce = setTimeout(() => {
      void fetchEmpleados();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, page, estatusFilter, refreshKey]);

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

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#44474A] tracking-[-0.02em] mb-1">
            Capital Humano
          </h1>
          <p className="text-[#858789] text-[1rem]">
            Gestiona la información, expedientes y configuración de tus empleados.
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
        {/* Toolbar */}
        <div className="p-5 border-b border-[#F3F4F6] flex justify-between items-center bg-white">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#858789]" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E1DFE0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] text-[#44474A] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={estatusFilter}
              onChange={(e) => {
                setEstatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-[#E1DFE0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] text-[#44474A] transition-all bg-white"
            >
              <option value="Todos">Todos los estatus</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#858789] text-[0.85rem] uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nombre Completo</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Estatus</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 size={32} className="animate-spin text-[#A7313A] mx-auto mb-4" />
                    <p className="text-[#858789]">Cargando empleados...</p>
                  </td>
                </tr>
              ) : empleados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#858789]">
                    No se encontraron empleados.
                  </td>
                </tr>
              ) : (
                empleados.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F8F9FA] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E1DFE0] text-[#44474A] flex items-center justify-center font-bold text-sm shrink-0">
                          {emp.nombre_completo.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#44474A]">{emp.nombre_completo}</div>
                          <div className="text-[0.8rem] text-[#858789]">{emp.rfc || 'Sin RFC'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#44474A] text-[0.95rem]">
                        {emp.email || 'Sin correo'}
                      </div>
                      <div className="text-[0.8rem] text-[#858789]">
                        {emp.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[0.8rem] font-medium ${
                          emp.estatus === 'Activo'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {emp.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleEstatus(emp.id, emp.estatus)}
                        title={emp.estatus === 'Activo' ? 'Dar de baja' : 'Reactivar'}
                        className={`p-2 rounded-lg transition-colors mr-2 ${emp.estatus === 'Activo' ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/empleados/${emp.id}/editar`)}
                        className="p-2 text-[#858789] hover:text-[#A7313A] rounded-lg hover:bg-[#A7313A]/10 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && empleados.length > 0 && (
          <div className="p-4 border-t border-[#F3F4F6] flex items-center justify-between bg-white text-[0.9rem] text-[#858789]">
            <div>
              Mostrando <span className="font-semibold text-[#44474A]">{empleados.length}</span> de{' '}
              <span className="font-semibold text-[#44474A]">{total}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[#E1DFE0] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={empleados.length < 10}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-[#E1DFE0] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-50 transition-colors"
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
