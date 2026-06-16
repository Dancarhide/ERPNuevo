'use client';

import { useState, useEffect } from 'react';
import { areasApi, puestosApi } from '@/lib/api';
import { Building, Briefcase, Plus, Loader2, Edit2, Trash2, X } from 'lucide-react';

type Area = { id: number; nombre_area: string; jefe_area_id: number | null };
type Puesto = {
  id: number;
  nombre_puesto: string;
  area_id: number | null;
  hierarchy_level: number;
  descripcion: string | null;
  reporta_a_puesto_id: number | null;
  reporta_matricialmente_a_id: number | null;
  es_rol_staff: boolean;
};

export default function HrConfigPage() {
  const [activeTab, setActiveTab] = useState<'areas' | 'puestos'>('areas');
  const [areas, setAreas] = useState<Area[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isPuestoModalOpen, setIsPuestoModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newAreaName, setNewAreaName] = useState('');
  const [newPuestoData, setNewPuestoData] = useState({
    nombre_puesto: '',
    area_id: '',
    hierarchy_level: '10',
    descripcion: '',
    reporta_a_puesto_id: '',
    reporta_matricialmente_a_id: '',
    es_rol_staff: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resAreas, resPuestos] = await Promise.all([areasApi.getAll(), puestosApi.getAll()]);
        setAreas((resAreas as Area[]) || []);
        setPuestos((resPuestos as Puesto[]) || []);
      } catch (err) {
        console.error('Error fetching catalogs', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const openAreaModal = (area?: Area) => {
    if (area) {
      setEditingId(area.id);
      setNewAreaName(area.nombre_area);
    } else {
      setEditingId(null);
      setNewAreaName('');
    }
    setIsAreaModalOpen(true);
  };

  const openPuestoModal = (puesto?: Puesto) => {
    if (puesto) {
      setEditingId(puesto.id);
      setNewPuestoData({
        nombre_puesto: puesto.nombre_puesto,
        area_id: puesto.area_id ? String(puesto.area_id) : '',
        hierarchy_level: puesto.hierarchy_level ? String(puesto.hierarchy_level) : '10',
        descripcion: puesto.descripcion || '',
        reporta_a_puesto_id: puesto.reporta_a_puesto_id ? String(puesto.reporta_a_puesto_id) : '',
        reporta_matricialmente_a_id: puesto.reporta_matricialmente_a_id
          ? String(puesto.reporta_matricialmente_a_id)
          : '',
        es_rol_staff: puesto.es_rol_staff || false,
      });
    } else {
      setEditingId(null);
      setNewPuestoData({
        nombre_puesto: '',
        area_id: '',
        hierarchy_level: '10',
        descripcion: '',
        reporta_a_puesto_id: '',
        reporta_matricialmente_a_id: '',
        es_rol_staff: false,
      });
    }
    setIsPuestoModalOpen(true);
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await areasApi.update(editingId, { nombre_area: newAreaName });
      } else {
        await areasApi.create({ nombre_area: newAreaName });
      }
      setIsAreaModalOpen(false);
      const resAreas = await areasApi.getAll();
      setAreas((resAreas as Area[]) || []);
    } catch {
      alert('Error al guardar área');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre_puesto: newPuestoData.nombre_puesto,
        area_id: newPuestoData.area_id ? parseInt(newPuestoData.area_id) : null,
        hierarchy_level: parseInt(newPuestoData.hierarchy_level) || 10,
        descripcion: newPuestoData.descripcion || null,
        reporta_a_puesto_id: newPuestoData.reporta_a_puesto_id
          ? parseInt(newPuestoData.reporta_a_puesto_id)
          : null,
        reporta_matricialmente_a_id: newPuestoData.reporta_matricialmente_a_id
          ? parseInt(newPuestoData.reporta_matricialmente_a_id)
          : null,
        es_rol_staff: newPuestoData.es_rol_staff,
      };

      if (editingId) {
        await puestosApi.update(editingId, payload);
      } else {
        await puestosApi.create(payload);
      }
      setIsPuestoModalOpen(false);
      const resPuestos = await puestosApi.getAll();
      setPuestos((resPuestos as Puesto[]) || []);
    } catch {
      alert('Error al guardar puesto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!confirm('¿Eliminar esta área?')) return;
    try {
      await areasApi.delete(id);
      const resAreas = await areasApi.getAll();
      setAreas((resAreas as Area[]) || []);
    } catch {
      alert('Error al eliminar');
    }
  };

  const handleDeletePuesto = async (id: number) => {
    if (!confirm('¿Eliminar este puesto?')) return;
    try {
      await puestosApi.delete(id);
      const resPuestos = await puestosApi.getAll();
      setPuestos((resPuestos as Puesto[]) || []);
    } catch {
      alert('Error al eliminar');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-bold text-[#44474A] tracking-[-0.02em] mb-1">
          Estructura Organizacional
        </h1>
        <p className="text-[#858789] text-[1rem]">
          Administra los catálogos base de departamentos y posiciones laborales.
        </p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[#E1DFE0]">
        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-colors ${
            activeTab === 'areas'
              ? 'text-[#A7313A] border-b-2 border-[#A7313A]'
              : 'text-[#858789] hover:text-[#44474A]'
          }`}
        >
          <Building size={20} />
          Áreas (Departamentos)
        </button>
        <button
          onClick={() => setActiveTab('puestos')}
          className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-colors ${
            activeTab === 'puestos'
              ? 'text-[#A7313A] border-b-2 border-[#A7313A]'
              : 'text-[#858789] hover:text-[#44474A]'
          }`}
        >
          <Briefcase size={20} />
          Puestos de Trabajo
        </button>
      </div>

      <div className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 border-b border-[#F3F4F6] flex justify-between items-center">
          <h2 className="text-[1.1rem] font-bold text-[#44474A]">
            Catálogo de {activeTab === 'areas' ? 'Áreas' : 'Puestos'}
          </h2>
          <button
            onClick={() => (activeTab === 'areas' ? openAreaModal() : openPuestoModal())}
            className="bg-[#A7313A] hover:bg-[#8F2930] text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={18} />
            Nuevo {activeTab === 'areas' ? 'Área' : 'Puesto'}
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="animate-spin text-[#A7313A] mx-auto mb-4" />
              <p className="text-[#858789]">Cargando información...</p>
            </div>
          ) : activeTab === 'areas' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-transparent text-[#858789] text-[0.85rem] uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Nombre del Área</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#858789]">
                      No hay áreas registradas
                    </td>
                  </tr>
                ) : (
                  areas.map((a) => (
                    <tr key={a.id} className="hover:bg-transparent transition-colors">
                      <td className="px-6 py-4 text-[#858789]">#{a.id}</td>
                      <td className="px-6 py-4 font-medium text-[#44474A]">{a.nombre_area}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openAreaModal(a)}
                          className="p-2 text-[#858789] hover:text-[#A7313A] rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteArea(a.id)}
                          className="p-2 text-[#858789] hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-transparent text-[#858789] text-[0.85rem] uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Nombre del Puesto</th>
                  <th className="px-6 py-4 font-semibold">Área Asignada</th>
                  <th className="px-6 py-4 font-semibold">Nivel Jerárquico</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {puestos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#858789]">
                      No hay puestos registrados
                    </td>
                  </tr>
                ) : (
                  puestos.map((p) => {
                    const areaName =
                      areas.find((a) => a.id === p.area_id)?.nombre_area || 'Sin área';
                    return (
                      <tr key={p.id} className="hover:bg-transparent transition-colors">
                        <td className="px-6 py-4 font-medium text-[#44474A]">{p.nombre_puesto}</td>
                        <td className="px-6 py-4 text-[#858789]">{areaName}</td>
                        <td className="px-6 py-4 text-[#858789]">Nivel {p.hierarchy_level}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openPuestoModal(p)}
                            className="p-2 text-[#858789] hover:text-[#A7313A] rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePuesto(p.id)}
                            className="p-2 text-[#858789] hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Area */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] shrink-0">
              <h3 className="text-[1.25rem] font-bold text-[#44474A]">
                {editingId ? 'Editar Área' : 'Nueva Área'}
              </h3>
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="text-[#858789] hover:text-[#44474A]"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateArea} className="p-6 overflow-y-auto">
              <div className="mb-6">
                <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                  Nombre del Área *
                </label>
                <input
                  required
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
                  placeholder="Ej. Recursos Humanos"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-5 py-2.5 text-[#44474A] font-medium hover:bg-transparent rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#A7313A] hover:bg-[#8F2930] text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Puesto */}
      {isPuestoModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] shrink-0">
              <h3 className="text-[1.25rem] font-bold text-[#44474A]">
                {editingId ? 'Editar Puesto' : 'Nuevo Puesto'}
              </h3>
              <button
                onClick={() => setIsPuestoModalOpen(false)}
                className="text-[#858789] hover:text-[#44474A]"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreatePuesto} className="p-6 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                  Nombre del Puesto *
                </label>
                <input
                  required
                  type="text"
                  value={newPuestoData.nombre_puesto}
                  onChange={(e) =>
                    setNewPuestoData({ ...newPuestoData, nombre_puesto: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
                  placeholder="Ej. Gerente Comercial"
                />
              </div>
              <div className="mb-4">
                <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                  Área a la que pertenece *
                </label>
                <select
                  required
                  value={newPuestoData.area_id}
                  onChange={(e) => setNewPuestoData({ ...newPuestoData, area_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
                >
                  <option value="">Seleccione un área...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre_area}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                  Reporta a (Jefe Directo)
                </label>
                <select
                  value={newPuestoData.reporta_a_puesto_id}
                  onChange={(e) =>
                    setNewPuestoData({ ...newPuestoData, reporta_a_puesto_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
                >
                  <option value="">Ninguno / Director General</option>
                  {puestos
                    .filter((p) => p.id !== editingId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre_puesto} (Nivel {p.hierarchy_level})
                      </option>
                    ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                  Reporta a (Jefe Matricial / Proyecto)
                </label>
                <select
                  value={newPuestoData.reporta_matricialmente_a_id}
                  onChange={(e) =>
                    setNewPuestoData({
                      ...newPuestoData,
                      reporta_matricialmente_a_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
                >
                  <option value="">Ninguno</option>
                  {puestos
                    .filter((p) => p.id !== editingId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre_puesto} (Nivel {p.hierarchy_level})
                      </option>
                    ))}
                </select>
                <p className="text-[#858789] text-[0.8rem] mt-1">
                  Línea punteada de segunda dependencia.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                  Descripción / Responsabilidades
                </label>
                <textarea
                  rows={3}
                  value={newPuestoData.descripcion}
                  onChange={(e) =>
                    setNewPuestoData({ ...newPuestoData, descripcion: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
                  placeholder="Descripción del puesto..."
                />
              </div>
              <div className="mb-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="es_rol_staff"
                  checked={newPuestoData.es_rol_staff}
                  onChange={(e) =>
                    setNewPuestoData({ ...newPuestoData, es_rol_staff: e.target.checked })
                  }
                  className="w-5 h-5 text-[#A7313A] rounded border-[#E1DFE0] focus:ring-[#A7313A]"
                />
                <label
                  htmlFor="es_rol_staff"
                  className="text-[0.9rem] font-semibold text-[#44474A] cursor-pointer"
                >
                  Es un Rol de Staff (Asistente / Asesor)
                </label>
              </div>
              <div className="mb-6">
                <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                  Nivel Jerárquico
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newPuestoData.hierarchy_level}
                  onChange={(e) =>
                    setNewPuestoData({ ...newPuestoData, hierarchy_level: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
                />
                <p className="text-[#858789] text-[0.8rem] mt-1">
                  1 = Director. Números mayores = operativos.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPuestoModalOpen(false)}
                  className="px-5 py-2.5 text-[#44474A] font-medium hover:bg-transparent rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#A7313A] hover:bg-[#8F2930] text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
