'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { fetchApi } from '@/lib/api';
import React from 'react';

interface Evento {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  tipo: string;
  color: string | null;
}

export default function CalendarioPage() {
  const { user } = useAuth();
  const canManage = user?.permisos?.includes('gestionar_calendario');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'Evento',
    color: '#3B82F6',
  });

  const loadEventos = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/eventos');
      setEventos(data);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => await loadEventos();
    run();
  }, [currentDate, loadEventos]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openModal = (dateStr: string, evento?: Evento) => {
    if (!canManage && !evento) return; // Non-managers can't create, they can only view if we let them. Wait, they can just see it on the calendar.

    if (evento) {
      setSelectedEvent(evento);
      setFormData({
        titulo: evento.titulo,
        descripcion: evento.descripcion || '',
        fecha_inicio: evento.fecha_inicio,
        fecha_fin: evento.fecha_fin,
        tipo: evento.tipo,
        color: evento.color || '#3B82F6',
      });
    } else {
      setSelectedEvent(null);
      setFormData({
        titulo: '',
        descripcion: '',
        fecha_inicio: dateStr,
        fecha_fin: dateStr,
        tipo: 'Evento',
        color: '#3B82F6',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEvent) {
        await fetchApi(`/eventos/${selectedEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi('/eventos', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      closeModal();
      loadEventos();
    } catch (error) {
      console.error('Error guardando evento', error);
      alert('Error guardando evento');
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (!confirm('¿Eliminar evento?')) return;
    try {
      await fetchApi(`/eventos/${selectedEvent.id}`, {
        method: 'DELETE',
      });
      closeModal();
      loadEventos();
    } catch (error) {
      console.error('Error eliminando evento', error);
      alert('Error eliminando evento');
    }
  };

  // Rendering calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const renderCells = () => {
    const cells = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(
        <div
          key={`empty-${i}`}
          className="min-h-[120px] bg-transparent border border-slate-100 rounded-lg opacity-50"
        ></div>
      );
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Filter events that fall on this day
      // Simple logic: if dateStr is between fecha_inicio and fecha_fin
      const dayEvents = eventos.filter((e) => {
        return dateStr >= e.fecha_inicio && dateStr <= e.fecha_fin;
      });

      const isToday = dateStr === new Date().toISOString().split('T')[0];

      cells.push(
        <div
          key={day}
          onClick={() => openModal(dateStr)}
          className={`min-h-[120px] p-2 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors cursor-pointer flex flex-col gap-1 ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span
              className={`text-sm font-medium ${isToday ? 'bg-[#A7313A] text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-slate-600'}`}
            >
              {day}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(dateStr, ev);
                }}
                className="text-xs px-2 py-1 rounded truncate text-white shadow-sm"
                style={{ backgroundColor: ev.color || '#A7313A' }}
                title={ev.titulo}
              >
                {ev.titulo}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="bg-white border-b border-[#F3F4F6] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#A7313A] to-[#8a272f] rounded-2xl flex items-center justify-center shadow-lg shadow-[#A7313A]/20">
            <CalendarIcon className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#44474A]">Calendario</h1>
            <p className="text-sm font-medium text-[#858789]">
              Consulta eventos y días festivos de la empresa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-bold text-slate-800 min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {canManage && (
            <button
              onClick={() => openModal(new Date().toISOString().split('T')[0])}
              className="bg-[#A7313A] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#8a272f] transition-all shadow-md flex items-center gap-2"
            >
              <Plus size={18} /> Nuevo Evento
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Cargando calendario...</div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="grid grid-cols-7 gap-4 mb-4">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-bold text-slate-400 text-sm uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">{renderCells()}</div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-transparent">
              <h2 className="text-lg font-bold text-slate-800">
                {selectedEvent
                  ? canManage
                    ? 'Editar Evento'
                    : 'Detalles del Evento'
                  : 'Nuevo Evento'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    disabled={!canManage}
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 disabled:bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    disabled={!canManage}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 disabled:bg-transparent resize-none h-24"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      required
                      disabled={!canManage}
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 disabled:bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      required
                      disabled={!canManage}
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 disabled:bg-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
                    <select
                      disabled={!canManage}
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 disabled:bg-transparent"
                    >
                      <option value="Evento">Evento</option>
                      <option value="Día Festivo">Día Festivo</option>
                      <option value="Aniversario">Aniversario</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Color</label>
                    <input
                      type="color"
                      disabled={!canManage}
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-[42px] px-1 py-1 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="mt-8 flex justify-between items-center">
                  {selectedEvent ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Eliminar
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#A7313A] text-white rounded-xl font-bold hover:bg-[#8a272f] shadow-md transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}
              {!canManage && (
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 bg-[#A7313A] text-white rounded-xl font-bold hover:bg-[#8a272f] shadow-md transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
