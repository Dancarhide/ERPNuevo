'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  Users,
  Briefcase,
  UserPlus,
  Search,
  ChevronRight,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';

interface Puesto {
  id: number;
  nombre_puesto: string;
  cupo_maximo: number;
  personal_actual: number;
  sueldo_min: number;
  sueldo_max: number;
}

interface Vacante {
  id: number;
  titulo: string;
  estatus: string;
  cantidad_solicitada: number;
  cantidad_contratada: number;
  puesto_id: number;
}

interface Candidato {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  estatus: string;
  vacante_id: number;
}

export default function ReclutamientoPage() {
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [activeTab, setActiveTab] = useState<'estructura' | 'reclutamiento'>('estructura');
  const [loading, setLoading] = useState(true);
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [isEditingPuesto, setIsEditingPuesto] = useState(false);
  const [editForm, setEditForm] = useState<{
    cupo_maximo: number | string;
    sueldo_min: number | string;
    sueldo_max: number | string;
  }>({
    cupo_maximo: 1,
    sueldo_min: '',
    sueldo_max: '',
  });

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [puestosData, vacantesData, candidatosData] = await Promise.all([
        fetchApi('/puestos').catch(() => []),
        fetchApi('/vacantes').catch(() => []),
        fetchApi('/candidatos').catch(() => []),
      ]);
      setPuestos(puestosData || []);
      setVacantes(vacantesData || []);
      setCandidatos(candidatosData || []);
    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const handleCreateCandidato = async () => {
    const nombre = prompt('Nombre del candidato:');
    if (!nombre) return;
    const vacanteIdStr = prompt('ID de la vacante (opcional):');
    const vacanteId = vacanteIdStr ? parseInt(vacanteIdStr, 10) : null;

    try {
      await fetchApi('/candidatos', {
        method: 'POST',
        body: JSON.stringify({
          nombre_completo: nombre,
          estatus: 'Postulado',
          idvacante: vacanteId,
        }),
      });
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error al crear candidato');
    }
  };

  const handleUpdateStatus = async (candidatoId: number, nuevoEstatus: string) => {
    try {
      await fetchApi(`/candidatos/${candidatoId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ estatus: nuevoEstatus }),
      });
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error al actualizar');
    }
  };

  const handleSavePuesto = async () => {
    if (!selectedPuesto) return;
    try {
      const payload = {
        ...selectedPuesto,
        cupo_maximo: Number(editForm.cupo_maximo) || 1,
        sueldo_min: Number(editForm.sueldo_min) || 0,
        sueldo_max: Number(editForm.sueldo_max) || 0,
      };

      await fetchApi(`/puestos/${selectedPuesto.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSelectedPuesto(payload as Puesto);
      setIsEditingPuesto(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error al guardar puesto');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#A7313A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#858789] font-medium animate-pulse">Cargando Módulo de Talento...</p>
        </div>
      </div>
    );
  }

  const openVacancies = vacantes.filter((v) => v.estatus === 'Abierta').length;
  const activeCandidates = candidatos.filter(
    (c) => c.estatus !== 'Rechazado' && c.estatus !== 'Seleccionado'
  ).length;

  const columns = ['Postulado', 'En Entrevista', 'Seleccionado', 'Rechazado'];

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#44474A] mb-1">Estructura y Talento</h1>
          <p className="text-[#858789] text-sm">
            Gestión estratégica del organigrama y pipeline de contratación.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 text-[#858789] hover:text-[#44474A] hover:bg-[#F3F4F6] rounded-lg transition-colors shadow-sm bg-white border border-[#E5E7EB]"
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleCreateCandidato}
            className="flex items-center gap-2 bg-[#A7313A] text-white px-5 py-2.5 rounded-lg hover:bg-[#8a272f] transition-all shadow-md hover:shadow-lg text-sm font-semibold"
          >
            <UserPlus size={18} />
            Nuevo Candidato
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Puestos Totales',
            value: puestos.length,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'Vacantes Abiertas',
            value: openVacancies,
            icon: Briefcase,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Candidatos Activos',
            value: activeCandidates,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E5E7EB] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 flex items-center gap-5"
          >
            <div className={`p-4 rounded-xl ${metric.bg} ${metric.color}`}>
              <metric.icon size={26} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#858789] uppercase tracking-wider mb-1">
                {metric.title}
              </p>
              <h3 className="text-3xl font-black text-[#44474A]">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] mb-6">
        <button
          onClick={() => setActiveTab('estructura')}
          className={`px-8 py-3.5 font-semibold text-sm transition-all duration-300 relative ${
            activeTab === 'estructura'
              ? 'text-[#A7313A]'
              : 'text-[#858789] hover:text-[#44474A] hover:bg-gray-50'
          }`}
        >
          Estructura Organizacional
          {activeTab === 'estructura' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A7313A] rounded-t-full shadow-[0_-2px_10px_rgba(167,49,58,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reclutamiento')}
          className={`px-8 py-3.5 font-semibold text-sm transition-all duration-300 relative ${
            activeTab === 'reclutamiento'
              ? 'text-[#A7313A]'
              : 'text-[#858789] hover:text-[#44474A] hover:bg-gray-50'
          }`}
        >
          Pipeline de Reclutamiento
          {activeTab === 'reclutamiento' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A7313A] rounded-t-full shadow-[0_-2px_10px_rgba(167,49,58,0.5)]" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'estructura' && (
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#E5E7EB] overflow-hidden">
          <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#FAFAFA]">
            <div>
              <h2 className="font-bold text-[#44474A] text-lg">Catálogo de Puestos</h2>
              <p className="text-xs text-[#858789] mt-0.5">Control de Headcount y Presupuesto</p>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858789]"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar puesto..."
                className="pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 transition-shadow"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#F3F4F6]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[#858789] uppercase tracking-wide text-xs">
                    Puesto
                  </th>
                  <th className="px-6 py-4 font-semibold text-[#858789] uppercase tracking-wide text-xs">
                    Ocupación
                  </th>
                  <th className="px-6 py-4 font-semibold text-[#858789] uppercase tracking-wide text-xs">
                    Rango Salarial
                  </th>
                  <th className="px-6 py-4 font-semibold text-[#858789] uppercase tracking-wide text-xs">
                    Estado
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {puestos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-[#858789]">
                      <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-medium text-[#44474A]">No hay puestos registrados</p>
                      <p className="text-xs mt-1">Configura la estructura organizacional</p>
                    </td>
                  </tr>
                )}
                {puestos.map((p) => {
                  const max = p.cupo_maximo || 1;
                  const deficit = p.personal_actual < p.cupo_maximo;
                  const porcentaje = Math.min((p.personal_actual / max) * 100, 100);

                  return (
                    <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-[#44474A]">{p.nombre_puesto}</div>
                        <div className="text-[#858789] text-xs mt-1">ID: {p.id}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="font-bold text-[#44474A] w-12">
                            {p.personal_actual}{' '}
                            <span className="text-[#858789] font-normal">/ {p.cupo_maximo}</span>
                          </div>
                          <div className="w-32 h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                deficit ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] text-[#44474A] font-semibold text-xs shadow-sm">
                          ${p.sueldo_min?.toLocaleString() || '0'} - $
                          {p.sueldo_max?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {deficit ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] shadow-sm">
                            <Clock size={14} /> Contratando
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] shadow-sm">
                            <CheckCircle2 size={14} /> Cubierto
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => setSelectedPuesto(p)}
                          className="p-2 text-[#858789] hover:text-[#A7313A] rounded-lg hover:bg-[#A7313A]/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reclutamiento' && (
        <div className="flex flex-col h-[650px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
            {columns.map((col) => {
              const colCandidatos = candidatos.filter((c) => c.estatus === col);
              return (
                <div
                  key={col}
                  className="bg-[#FAFAFA] rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden"
                >
                  <div className="p-4 border-b border-[#E5E7EB] bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-[#44474A] uppercase tracking-wide text-sm">
                        {col}
                      </h3>
                      <span className="bg-[#F3F4F6] text-[#44474A] text-xs font-black px-2.5 py-1 rounded-full border border-[#E5E7EB]">
                        {colCandidatos.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                    {colCandidatos.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 group cursor-grab active:cursor-grabbing border-l-4 border-l-[#A7313A]"
                      >
                        <h4 className="font-bold text-[#44474A] text-[0.95rem]">
                          {c.nombre_completo}
                        </h4>
                        <p className="text-xs text-[#858789] mt-1.5 truncate">
                          {c.email || 'Sin correo registrado'}
                        </p>

                        <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex justify-between items-center">
                          <div className="text-xs font-bold text-[#A4A4A4] bg-[#F8F9FA] px-2 py-1 rounded-md">
                            ID: {c.id}
                          </div>
                          <select
                            className="text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 bg-white text-[#44474A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 cursor-pointer shadow-sm"
                            value={c.estatus}
                            onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                          >
                            {columns.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    {colCandidatos.length === 0 && (
                      <div className="h-28 border-2 border-dashed border-[#E5E7EB] rounded-xl flex flex-col items-center justify-center text-sm text-[#A4A4A4] bg-white/50">
                        <TrendingUp size={20} className="mb-2 opacity-50" />
                        <span className="font-medium">Sin candidatos</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Modal Puesto */}
      {selectedPuesto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] bg-[#FAFAFA]">
              <h2 className="text-xl font-bold text-[#44474A]">
                {isEditingPuesto ? 'Editar Puesto' : 'Detalles del Puesto'}
              </h2>
              <button
                onClick={() => {
                  setSelectedPuesto(null);
                  setIsEditingPuesto(false);
                }}
                className="text-[#858789] hover:text-[#A7313A] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-1">
                  Nombre
                </p>
                <p className="text-lg font-bold text-[#44474A]">{selectedPuesto.nombre_puesto}</p>
              </div>

              {isEditingPuesto ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-1 block">
                      Cupo Máximo
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={editForm.cupo_maximo}
                      onChange={(e) => setEditForm({ ...editForm, cupo_maximo: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-1 block">
                        Sueldo Mínimo
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={editForm.sueldo_min}
                        onChange={(e) => setEditForm({ ...editForm, sueldo_min: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-1 block">
                        Sueldo Máximo
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={editForm.sueldo_max}
                        onChange={(e) => setEditForm({ ...editForm, sueldo_max: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
                      <p className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-1">
                        Ocupación
                      </p>
                      <p className="text-xl font-black text-[#44474A]">
                        {selectedPuesto.personal_actual}{' '}
                        <span className="text-lg font-medium text-[#858789]">
                          / {selectedPuesto.cupo_maximo}
                        </span>
                      </p>
                    </div>
                    <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
                      <p className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-1">
                        ID Puesto
                      </p>
                      <p className="text-xl font-black text-[#44474A]">{selectedPuesto.id}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-1">
                      Rango Salarial (Mensual)
                    </p>
                    <p className="text-md font-semibold text-[#10B981]">
                      ${selectedPuesto.sueldo_min?.toLocaleString() || '0'} - $
                      {selectedPuesto.sueldo_max?.toLocaleString() || '0'}
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4 border-t border-[#F3F4F6] gap-2">
                {isEditingPuesto ? (
                  <>
                    <button
                      onClick={() => setIsEditingPuesto(false)}
                      className="bg-white border border-[#E5E7EB] text-[#44474A] px-6 py-2.5 rounded-lg hover:bg-[#F3F4F6] transition-colors font-semibold text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePuesto}
                      className="bg-[#A7313A] text-white px-6 py-2.5 rounded-lg hover:bg-[#8a272f] transition-all font-semibold text-sm shadow-md"
                    >
                      Guardar Cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditForm({
                          cupo_maximo: selectedPuesto.cupo_maximo || 1,
                          sueldo_min: selectedPuesto.sueldo_min || 0,
                          sueldo_max: selectedPuesto.sueldo_max || 0,
                        });
                        setIsEditingPuesto(true);
                      }}
                      className="bg-white border border-[#E5E7EB] text-[#44474A] px-6 py-2.5 rounded-lg hover:bg-[#F3F4F6] transition-colors font-semibold text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setSelectedPuesto(null)}
                      className="bg-[#F3F4F6] text-[#44474A] px-6 py-2.5 rounded-lg hover:bg-[#E5E7EB] transition-colors font-semibold text-sm"
                    >
                      Cerrar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
