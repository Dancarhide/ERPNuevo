'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { incidenciasApi, empleadosApi, areasApi } from '@/lib/api';
import {
  Loader2,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  KanbanSquare,
  Table2,
  Building2,
  UserCheck,
  Calendar,
} from 'lucide-react';
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

type Area = { id: number; nombre_area: string };

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
  onStatusChange,
}: {
  item: Incidencia;
  isDragging?: boolean;
  isOverlay?: boolean;
  onStatusChange?: (id: number, newEstatus: string) => void;
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

      {onStatusChange && !isOverlay && !isDragging && (
        <div
          className="mt-3 pt-3 border-t border-[#F3F4F6] flex justify-between items-center"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-[0.7rem] font-bold text-[#A4A4A4] uppercase tracking-wider">
            Mover a:
          </span>
          <select
            className="text-[0.75rem] border border-[#E1DFE0] rounded-lg p-1 bg-[#F9F9F9] text-[#44474A] cursor-pointer outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A]"
            value={item.estatus}
            onChange={(e) => onStatusChange(item.id, e.target.value)}
          >
            {COLUMNAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function DraggableCard({
  item,
  onStatusChange,
}: {
  item: Incidencia;
  onStatusChange: (id: number, newEstatus: string) => void;
}) {
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
      <IncidenciaCard item={item} isDragging={isDragging} onStatusChange={onStatusChange} />
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filters state
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<number | ''>('');
  const [empleadoFilter, setEmpleadoFilter] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newIncidencia, setNewIncidencia] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'Retardo',
    gravedad: 'Baja',
    empleado_reportado_id: '',
    fecha_incidencia: new Date().toISOString().split('T')[0],
  });

  const loadCatalogs = useCallback(async () => {
    try {
      const empData = await empleadosApi.getAll(1, 1000);
      if (empData && empData.items) {
        setEmpleados(empData.items);
      }
      const areasData = await areasApi.getAll();
      setAreas(Array.isArray(areasData) ? areasData : (areasData as { items: Area[] }).items || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await incidenciasApi.getAll(
        undefined,
        search,
        fechaInicio,
        fechaFin,
        areaFilter,
        empleadoFilter
      );
      setIncidencias(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, fechaInicio, fechaFin, areaFilter, empleadoFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      void fetchData();
    }, 500);
    return () => clearTimeout(delayDebounce);
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

  const clearFilters = () => {
    setSearch('');
    setAreaFilter('');
    setEmpleadoFilter('');
    setFechaInicio('');
    setFechaFin('');
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
    <div className="p-4 md:p-8 h-[calc(100vh-70px)] flex flex-col overflow-hidden max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-0 mb-6 shrink-0">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#44474A] tracking-[-0.02em] mb-1">
            Incidencias
          </h1>
          <p className="text-[#858789]">Gestión de incidencias, reportes y reconocimientos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#A7313A] text-white rounded-xl font-semibold hover:bg-[#8F2930] transition-all shadow-sm w-full md:w-auto"
        >
          <Plus size={20} /> Nueva Incidencia
        </button>
      </div>

      {/* Main Toolbar */}
      <div className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col mb-4 shrink-0 overflow-hidden">
        <div className="p-4 border-b border-[#F3F4F6] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="relative w-full xl:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#858789]" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] text-[#44474A] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                  viewMode === 'kanban'
                    ? 'bg-white shadow-sm text-[#A7313A]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <KanbanSquare size={18} /> <span className="hidden sm:inline px-1">Tablero</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-[#A7313A]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Table2 size={18} /> <span className="hidden sm:inline px-1">Lista</span>
              </button>
            </div>

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
          <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={14} /> Fecha Desde
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={14} /> Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 size={14} /> Área
              </label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
              >
                <option value="">Todas las Áreas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre_area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck size={14} /> Empleado Reportado
              </label>
              <select
                value={empleadoFilter}
                onChange={(e) => setEmpleadoFilter(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-[#E1DFE0] rounded-lg text-sm focus:outline-none focus:border-[#A7313A] bg-white text-[#44474A]"
              >
                <option value="">Cualquier Empleado</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_completo}
                  </option>
                ))}
              </select>
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
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#A7313A]" size={40} />
        </div>
      ) : viewMode === 'kanban' ? (
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
                    <DraggableCard key={item.id} item={item} onStatusChange={handleStatusChange} />
                  ))}
                  {colItems.length === 0 && (
                    <div className="text-center py-8 text-[#A4A4A4] text-sm border-2 border-dashed border-[#E1DFE0] rounded-xl bg-transparent">
                      Sin incidencias
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
      ) : (
        <div className="flex-1 overflow-auto bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr className="text-[#858789] text-[0.85rem] uppercase tracking-wider bg-gray-100/50">
                <th className="px-6 py-4 font-semibold border border-[#E1DFE0]">Incidencia</th>
                <th className="px-6 py-4 font-semibold border border-[#E1DFE0]">Empleado</th>
                <th className="px-6 py-4 font-semibold border border-[#E1DFE0]">Fecha</th>
                <th className="px-6 py-4 font-semibold border border-[#E1DFE0]">Gravedad</th>
                <th className="px-6 py-4 font-semibold border border-[#E1DFE0]">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {incidencias.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-[#858789] border border-[#E1DFE0]"
                  >
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <p className="font-semibold text-[#44474A] text-lg mb-1">Sin Resultados</p>
                    <p className="text-sm">
                      No se encontraron incidencias con los filtros aplicados.
                    </p>
                  </td>
                </tr>
              ) : (
                incidencias.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 border border-[#E1DFE0]">
                      <div className="font-bold text-[#44474A] text-[0.95rem]">{inc.titulo}</div>
                      <div className="text-[0.85rem] text-[#858789] bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        {inc.tipo}
                      </div>
                    </td>
                    <td className="px-6 py-4 border border-[#E1DFE0]">
                      <div className="text-[#44474A] font-semibold text-[0.95rem]">
                        {inc.empleado_reportado?.nombre_completo || 'N/A'}
                      </div>
                      <div className="text-[0.85rem] text-[#858789] mt-1 flex items-center gap-1">
                        <span className="text-[#A4A4A4] uppercase text-[0.65rem] font-bold">
                          Reportó:
                        </span>
                        {inc.reportante?.nombre_completo || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 border border-[#E1DFE0]">
                      <div className="text-[#44474A] text-[0.95rem] font-medium flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#858789]" />
                        {inc.fecha_incidencia}
                      </div>
                    </td>
                    <td className="px-6 py-4 border border-[#E1DFE0]">
                      <span
                        className={`text-[0.7rem] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${GRAVEDAD_COLORS[inc.gravedad] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {inc.gravedad}
                      </span>
                    </td>
                    <td className="px-6 py-4 border border-[#E1DFE0]">
                      <select
                        className="text-[0.8rem] font-bold border border-[#E1DFE0] rounded-lg px-2 py-1 bg-white text-[#44474A] cursor-pointer outline-none focus:border-[#A7313A] shadow-sm"
                        value={inc.estatus}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                      >
                        {COLUMNAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
