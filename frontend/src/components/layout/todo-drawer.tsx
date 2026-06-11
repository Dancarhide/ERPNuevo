import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ClipboardList, Plus, CheckCircle2, Calendar, Trash2 } from 'lucide-react';
import { tareasApi } from '@/lib/api';

type Tarea = {
  id: number;
  titulo: string;
  descripcion: string;
  completada: boolean;
  fecha_vencimiento: string | null;
  prioridad: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ToDoDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTareas();
    }
  }, [isOpen]);

  async function fetchTareas() {
    try {
      setLoading(true);
      const data = await tareasApi.getAll();
      setTareas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setLoading(true);
      await tareasApi.create({
        titulo: newTaskTitle.trim(),
        descripcion: '',
        prioridad: 'Media',
        fecha_vencimiento: newTaskDate || null,
      });
      setNewTaskTitle('');
      setNewTaskDate('');
      fetchTareas();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (tarea: Tarea) => {
    try {
      await tareasApi.update(tarea.id, {
        completada: !tarea.completada,
      });
      setTareas((prev) =>
        prev.map((t) => (t.id === tarea.id ? { ...t, completada: !t.completada } : t))
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) return;
    try {
      await tareasApi.delete(id);
      setTareas((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (!isOpen) return null;

  const activeTasks = tareas.filter((t) => !t.completada);
  const completedTasks = tareas.filter((t) => t.completada);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-[400px] bg-white h-full shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#F3F4F6] shrink-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#44474A]">
            <ClipboardList className="text-[#A7313A]" /> Tareas Pendientes
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#858789] hover:bg-[#F3F4F6] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA]">
          {/* New Task Form */}
          <form
            onSubmit={handleCreateTask}
            className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-[#E1DFE0] shadow-sm mb-6"
          >
            <input
              type="text"
              className="w-full h-10 border-none bg-transparent focus:outline-none text-[#44474A] placeholder:text-[#A4A4A4]"
              placeholder="¿Qué hay que hacer?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              disabled={loading}
            />
            <div className="flex items-center gap-2 border-t border-[#F3F4F6] pt-3">
              <input
                type="date"
                className="flex-1 h-9 px-2 text-sm text-[#858789] border border-[#E1DFE0] rounded-lg focus:outline-none focus:border-[#A7313A] bg-[#F8F9FA]"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="flex items-center gap-1 h-9 px-4 bg-[#A7313A] text-white text-sm font-bold rounded-lg hover:bg-[#8a272f] transition-colors disabled:opacity-50"
                disabled={loading || !newTaskTitle.trim()}
              >
                <Plus size={16} /> Agregar
              </button>
            </div>
          </form>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#858789] mb-3 uppercase tracking-wider">
                Por hacer ({activeTasks.length})
              </h3>
              <div className="flex flex-col gap-3">
                {activeTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#E1DFE0] shadow-sm group hover:shadow-md transition-all"
                  >
                    <button
                      onClick={() => handleToggleTask(t)}
                      className="mt-0.5 text-[#E1DFE0] hover:text-[#2ecc71] transition-colors"
                    >
                      <CheckCircle2 size={22} />
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-[#44474A] text-sm leading-tight">{t.titulo}</p>
                      {t.fecha_vencimiento && (
                        <p className="flex items-center gap-1 text-xs font-bold text-[#A7313A] mt-2">
                          <Calendar size={12} /> {t.fecha_vencimiento}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-[#E1DFE0] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#858789] mb-3 uppercase tracking-wider">
                Completadas
              </h3>
              <div className="flex flex-col gap-3">
                {completedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 bg-transparent p-4 rounded-xl border border-dashed border-[#E1DFE0] opacity-60"
                  >
                    <button onClick={() => handleToggleTask(t)} className="mt-0.5 text-[#2ecc71]">
                      <CheckCircle2 size={22} />
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-[#A4A4A4] line-through text-sm leading-tight">
                        {t.titulo}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-[#E1DFE0] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {tareas.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center mt-12 opacity-50">
              <ClipboardList size={48} className="text-[#A4A4A4] mb-4" />
              <p className="text-[#858789] font-medium">No tienes tareas pendientes.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
