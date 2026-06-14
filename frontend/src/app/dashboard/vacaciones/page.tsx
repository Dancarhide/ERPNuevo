'use client';

import React, { useState, useEffect } from 'react';
import {
  FaHistory,
  FaCheckCircle,
  FaSave,
  FaPlus,
  FaClock,
  FaPlane,
  FaTimes,
} from 'react-icons/fa';
import { vacacionesApi } from '@/lib/api';

interface Vacacion {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estatus_vacacion: string;
  motivo: string | null;
  tipo_solicitud: string;
  empleado_nombre: string;
}

export default function VacacionesPage() {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ available: 12, pending: 0, taken: 0 }); // Todo: Available dynamic

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    motivo: '',
    tipo_solicitud: 'Vacaciones',
  });

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Asumimos empleado actual id = 1 para demo, pero ideal usar auth
      // Para admin se cargan todas
      const res = await vacacionesApi.getAll();
      setVacaciones(res);

      const pendingList = res.filter((v: Vacacion) => v.estatus_vacacion === 'Pendiente');
      const approvedList = res.filter((v: Vacacion) => v.estatus_vacacion === 'Aprobado');

      let totalTaken = 0;
      approvedList.forEach((v: Vacacion) => {
        totalTaken += calculateDays(v.fecha_inicio, v.fecha_fin);
      });

      setStats((prev) => ({
        ...prev,
        pending: pendingList.length,
        taken: totalTaken,
      }));
    } catch (error) {
      console.error('Error fetching vacations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Usar empleado 1 hardcoded para demo temporal
      await vacacionesApi.create({ ...formData, empleado_id: 1 });
      setIsModalOpen(false);
      setFormData({ fecha_inicio: '', fecha_fin: '', motivo: '', tipo_solicitud: 'Vacaciones' });
      fetchData();
    } catch (error) {
      console.error('Error submitting', error);
      alert('Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await vacacionesApi.updateStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Error updating status', error);
      alert('Error al actualizar');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8 w-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vacaciones y Ausencias</h1>
          <p className="text-gray-500">Gestión de días de descanso</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#A7313A] text-white rounded-xl hover:bg-[#85252e] transition-colors shadow-md font-medium w-full md:w-auto"
        >
          <FaPlus /> Nueva Solicitud
        </button>
      </header>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-500 font-medium mb-1">Días Disponibles</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.available}</h3>
          </div>
          <div className="p-4 bg-blue-50 text-blue-500 rounded-xl">
            <FaPlane size={24} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-500 font-medium mb-1">Solicitudes Pendientes</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.pending}</h3>
          </div>
          <div className="p-4 bg-orange-50 text-orange-500 rounded-xl">
            <FaClock size={24} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-500 font-medium mb-1">Días Gozados</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.taken}</h3>
          </div>
          <div className="p-4 bg-green-50 text-green-500 rounded-xl">
            <FaCheckCircle size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Historial de Solicitudes</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando...</div>
        ) : vacaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <FaHistory size={48} className="mb-4 opacity-20" />
            <p>No hay solicitudes registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium border-b border-gray-100">Empleado</th>
                  <th className="p-4 font-medium border-b border-gray-100">Periodo</th>
                  <th className="p-4 font-medium border-b border-gray-100">Días</th>
                  <th className="p-4 font-medium border-b border-gray-100">Tipo</th>
                  <th className="p-4 font-medium border-b border-gray-100">Estado</th>
                  <th className="p-4 font-medium border-b border-gray-100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vacaciones.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <td className="p-4 font-medium text-gray-800">{req.empleado_nombre}</td>
                    <td className="p-4 text-gray-600">
                      {req.fecha_inicio} al {req.fecha_fin}
                    </td>
                    <td className="p-4 text-gray-600">
                      {calculateDays(req.fecha_inicio, req.fecha_fin)}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        {req.tipo_solicitud}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          req.estatus_vacacion === 'Aprobado'
                            ? 'bg-green-100 text-green-700'
                            : req.estatus_vacacion === 'Pendiente'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {req.estatus_vacacion}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.estatus_vacacion === 'Pendiente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'Aprobado')}
                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'Rechazado')}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Nueva Solicitud</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="vacation-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Solicitud
                  </label>
                  <select
                    name="tipo_solicitud"
                    value={formData.tipo_solicitud}
                    onChange={handleFormChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all"
                  >
                    <option value="Vacaciones">Vacaciones Anuales</option>
                    <option value="Permiso Personal">Permiso Personal</option>
                    <option value="Incapacidad">Incapacidad Médica</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={handleFormChange}
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={handleFormChange}
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo (Opcional)
                  </label>
                  <textarea
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all resize-none"
                    placeholder="Detalles adicionales..."
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="vacation-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#A7313A] text-white rounded-xl hover:bg-[#85252e] font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? (
                  'Guardando...'
                ) : (
                  <>
                    <FaSave /> Guardar Solicitud
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
