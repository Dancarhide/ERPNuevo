'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { incidenciasApi, empleadosApi } from '@/lib/api';
import { Loader2, Plus, AlertTriangle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';

type Incidencia = {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  gravedad: string;
  estatus: string;
  fecha_incidencia: string;
  empleado_reportado: { nombre_completo: string };
  reportante: { nombre_completo: string };
  creado_el: string;
};

const COLUMNAS = ['Pendiente', 'En Revisión', 'Resuelta', 'Descartada'];

const GRAVEDAD_COLORS: Record<string, string> = {
  Baja: 'bg-blue-100 text-blue-800',
  Media: 'bg-yellow-100 text-yellow-800',
  Alta: 'bg-orange-100 text-orange-800',
  Crítica: 'bg-red-100 text-red-800',
};

const COLUMN_ICONS: Record<string, ReactNode> = {
  Pendiente: <AlertCircle size={18} className="text-gray-500" />,
  'En Revisión': <AlertTriangle size={18} className="text-orange-500" />,
  Resuelta: <CheckCircle2 size={18} className="text-emerald-500" />,
  Descartada: <XCircle size={18} className="text-red-500" />,
};

function IncidenciaCard({
  item,
  isDragging,
  isOverlay,
}: {
  item: Incidencia;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  return (
    <div
      className={`bg-white border border-black/5 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow ${isDragging ? 'opacity-50' : 'opacity-100'} ${isOverlay ? 'cursor-grabbing shadow-[0_10px_30px_rgba(0,0,0,0.15)] scale-105' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-[0.7rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${GRAVEDAD_COLORS[item.gravedad] || 'bg-gray-100 text-gray-800'}`}
        >
          {item.gravedad}
        </span>
        <span className="text-[0.75rem] text-[#858789] font-medium bg-transparent px-2 py-0.5 rounded-md">
          {item.tipo}
        </span>
      </div>
      <h4 className="font-bold text-[#44474A] text-[0.95rem] mb-1 line-clamp-2 leading-tight">
        {item.titulo}
      </h4>
      <p className="text-[0.8rem] text-[#858789] line-clamp-2 mb-3">{item.descripcion}</p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F3F4F6]">
        <div className="flex flex-col">
          <span className="text-[0.65rem] uppercase font-bold text-[#A4A4A4] tracking-wider">
            Reportado
          </span>
          <span className="text-[0.8rem] font-medium text-[#44474A] truncate max-w-[120px]">
            {item.empleado_reportado?.nombre_completo || 'N/A'}
          </span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[0.65rem] uppercase font-bold text-[#A4A4A4] tracking-wider">
            Fecha
          </span>
          <span className="text-[0.8rem] font-medium text-[#44474A]">{item.fecha_incidencia}</span>
        </div>
      </div>
    </div>
  );
}

function DraggableCard({ item }: { item: Incidencia }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id.toString(),
    data: { item },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-manipulation`}
    >
      <IncidenciaCard item={item} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({
  id,
  title,
  count,
  icon,
  children,
}: {
  id: string;
  title: string;
  count: number;
  icon: ReactNode;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`w-[280px] md:w-[320px] shrink-0 flex flex-col border border-[#E1DFE0] rounded-2xl p-4 transition-colors ${
        isOver ? 'bg-[#F3F4F6]' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-[#44474A]">{title}</h3>
        </div>
        <span className="bg-[#E1DFE0] text-[#858789] text-xs font-bold px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 pb-10">{children}</div>
    </div>
  );
}

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState<{ id: number; nombre_completo: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newIncidencia, setNewIncidencia] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Retardo',
    gravedad: 'Baja',
    empleado_reportado_id: '',
    fecha_incidencia: new Date().toISOString().split('T')[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await incidenciasApi.getAll();
      setIncidencias(data);

      const empData = await empleadosApi.getAll(1, 1000);
      if (empData && empData.items) {
        setEmpleados(empData.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: number, newEstatus: string) => {
    try {
      setIncidencias((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, estatus: newEstatus } : inc))
      );
      await incidenciasApi.update(id, { estatus: newEstatus });
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incidenciasApi.create({
        ...newIncidencia,
        empleado_reportado_id: parseInt(newIncidencia.empleado_reportado_id),
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error al crear la incidencia. Revisa el ID del empleado.');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over) {
      const id = parseInt(active.id as string);
      const newStatus = over.id as string;
      const item = incidencias.find((i) => i.id === id);
      if (item && item.estatus !== newStatus) {
        handleStatusChange(id, newStatus);
      }
    }
  };

  const activeItem = incidencias.find((i) => i.id.toString() === activeId);

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-70px)] flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-0 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#44474A]">Incidencias</h1>
          <p className="text-[#858789]">Gestión de incidencias, reportes y reconocimientos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#A7313A] text-white rounded-xl font-medium hover:bg-[#8a272f] transition-all shadow-[0_4px_12px_rgba(167,49,58,0.2)] w-full md:w-auto"
        >
          <Plus size={20} /> Nueva Incidencia
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#A7313A]" size={40} />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
            {COLUMNAS.map((col) => {
              const colItems = incidencias.filter((i) => i.estatus === col);
              return (
                <DroppableColumn
                  key={col}
                  id={col}
                  title={col}
                  count={colItems.length}
                  icon={COLUMN_ICONS[col]}
                >
                  {colItems.map((item) => (
                    <DraggableCard key={item.id} item={item} />
                  ))}
                  {colItems.length === 0 && (
                    <div className="text-center py-8 text-[#A4A4A4] text-sm border-2 border-dashed border-[#E1DFE0] rounded-xl bg-transparent">
                      Arrastra tarjetas aquí
                    </div>
                  )}
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeItem ? <IncidenciaCard item={activeItem} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-[#44474A]">Levantar Incidencia</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#858789] hover:bg-[#F3F4F6] p-2 rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-[#44474A] mb-1">Título</label>
                  <input
                    required
                    value={newIncidencia.titulo}
                    onChange={(e) => setNewIncidencia({ ...newIncidencia, titulo: e.target.value })}
                    type="text"
                    className="w-full h-11 border border-[#E1DFE0] rounded-lg px-3 focus:outline-none focus:border-[#A7313A]"
                    placeholder="Ej. Llegada tarde reiterada"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-[#44474A] mb-1">Descripción</label>
                  <textarea
                    required
                    value={newIncidencia.descripcion}
                    onChange={(e) =>
                      setNewIncidencia({ ...newIncidencia, descripcion: e.target.value })
                    }
                    className="w-full border border-[#E1DFE0] rounded-lg p-3 min-h-[100px] focus:outline-none focus:border-[#A7313A]"
                    placeholder="Detalles de lo ocurrido..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#44474A] mb-1">
                    Empleado Reportado
                  </label>
                  <select
                    required
                    value={newIncidencia.empleado_reportado_id}
                    onChange={(e) =>
                      setNewIncidencia({ ...newIncidencia, empleado_reportado_id: e.target.value })
                    }
                    className="w-full h-11 border border-[#E1DFE0] rounded-lg px-3 focus:outline-none focus:border-[#A7313A]"
                  >
                    <option value="" disabled>
                      Selecciona un empleado...
                    </option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#44474A] mb-1">Fecha</label>
                  <input
                    required
                    value={newIncidencia.fecha_incidencia}
                    onChange={(e) =>
                      setNewIncidencia({ ...newIncidencia, fecha_incidencia: e.target.value })
                    }
                    type="date"
                    className="w-full h-11 border border-[#E1DFE0] rounded-lg px-3 focus:outline-none focus:border-[#A7313A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#44474A] mb-1">Tipo</label>
                  <select
                    value={newIncidencia.tipo}
                    onChange={(e) => setNewIncidencia({ ...newIncidencia, tipo: e.target.value })}
                    className="w-full h-11 border border-[#E1DFE0] rounded-lg px-3 focus:outline-none focus:border-[#A7313A]"
                  >
                    <option>Retardo</option>
                    <option>Falta Justificada</option>
                    <option>Falta Injustificada</option>
                    <option>Acta Administrativa</option>
                    <option>Reconocimiento</option>
                    <option>Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#44474A] mb-1">Gravedad</label>
                  <select
                    value={newIncidencia.gravedad}
                    onChange={(e) =>
                      setNewIncidencia({ ...newIncidencia, gravedad: e.target.value })
                    }
                    className="w-full h-11 border border-[#E1DFE0] rounded-lg px-3 focus:outline-none focus:border-[#A7313A]"
                  >
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-[#858789] hover:bg-[#F3F4F6] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#A7313A] text-white rounded-lg font-bold hover:bg-[#8a272f] transition-colors shadow-[0_4px_12px_rgba(167,49,58,0.2)]"
                >
                  Crear Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
