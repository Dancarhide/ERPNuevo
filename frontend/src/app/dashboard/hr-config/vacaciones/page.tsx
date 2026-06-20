'use client';

import { useState, useEffect } from 'react';
import { politicasVacacionalesApi } from '@/lib/api';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

type Politica = {
  id: number;
  anios_desde: number;
  anios_hasta: number;
  dias_otorgados: number;
  activo: boolean;
};

export default function PoliticasVacacionalesPage() {
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    anios_desde: 1,
    anios_hasta: 1,
    dias_otorgados: 12,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await politicasVacacionalesApi.getAll();
      setPoliticas(res || []);
    } catch (error) {
      console.error('Error fetching politicas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
     
  }, []);

  const openModal = (politica?: Politica) => {
    if (politica) {
      setEditingId(politica.id);
      setFormData({
        anios_desde: politica.anios_desde,
        anios_hasta: politica.anios_hasta,
        dias_otorgados: politica.dias_otorgados,
      });
    } else {
      setEditingId(null);
      setFormData({ anios_desde: 1, anios_hasta: 1, dias_otorgados: 12 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await politicasVacacionalesApi.update(editingId, formData);
      } else {
        await politicasVacacionalesApi.create(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving politica:', error);
      alert('Error al guardar la política');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta política?')) {
      try {
        await politicasVacacionalesApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting politica:', error);
        alert('Error al eliminar');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando políticas...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Políticas de Vacaciones</h1>
          <p className="text-gray-500">Configuración de días otorgados por rango de antigüedad</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#A7313A] text-white rounded-lg hover:bg-[#85252e] transition"
        >
          <FaPlus /> Agregar Rango
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">Antigüedad (Años)</th>
                <th className="p-4 font-medium">Días Otorgados</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {politicas.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4">
                    De {p.anios_desde} a {p.anios_hasta} año(s)
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                      {p.dias_otorgados} días
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(p)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {politicas.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No hay políticas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Política' : 'Nueva Política'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año Desde</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.anios_desde}
                    onChange={(e) =>
                      setFormData({ ...formData, anios_desde: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año Hasta</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.anios_hasta}
                    onChange={(e) =>
                      setFormData({ ...formData, anios_hasta: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días Otorgados
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.dias_otorgados}
                  onChange={(e) =>
                    setFormData({ ...formData, dias_otorgados: Number(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#A7313A] text-white rounded-lg hover:bg-[#85252e] transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
