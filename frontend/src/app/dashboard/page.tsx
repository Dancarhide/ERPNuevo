'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { WIDGET_REGISTRY } from './widgetRegistry';
import { dashboardApi } from '@/lib/api';
import { SortableItem } from './components/SortableItem';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Save, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [layout, setLayout] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sensores de arrastre
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const bgPattern = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='14' fill='%236B7280'/%3E%3Crect x='14' y='14' width='14' height='14' fill='%236B7280'/%3E%3Crect x='72' y='14' width='14' height='14' fill='%236B7280'/%3E%3Crect x='14' y='72' width='14' height='14' fill='%236B7280'/%3E%3Crect x='72' y='72' width='14' height='14' fill='%236B7280'/%3E%3Cpath d='M50 15v14.5M34.5 29.5h31M50 85V70.5M34.5 70.5h31M15 50h14.5M29.5 34.5v31M85 50H70.5M70.5 34.5v31' fill='none' stroke='%2344474A' stroke-width='3.5'/%3E%3C/g%3E%3C/svg%3E")`;

  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      try {
        const config = await dashboardApi.getConfig();
        if (mounted) {
          if (
            config.layout_json &&
            Array.isArray(config.layout_json) &&
            config.layout_json.length > 0
          ) {
            setLayout(config.layout_json as string[]);
          } else {
            // Generar layout por defecto
            setLayout(WIDGET_REGISTRY.map((w) => w.id));
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard config:', error);
        if (mounted) {
          setLayout(WIDGET_REGISTRY.map((w) => w.id));
        }
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    };
    fetchConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        setHasChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await dashboardApi.saveConfig(layout);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving dashboard config:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="w-full min-h-[calc(100vh-70px)] bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // Filtrar widgets según permisos
  const userPermissions = user?.permisos || [];
  const allowedWidgetsMap = new Map(
    WIDGET_REGISTRY.filter((widget) => {
      if (!widget.requiredPermission) return true;
      return userPermissions.includes(widget.requiredPermission);
    }).map((w) => [w.id, w])
  );

  // Ordenar los permitidos según el layout, e incluir los nuevos al final si no están en el layout
  const orderedAllowedWidgets = [];
  const processedIds = new Set<string>();

  for (const id of layout) {
    if (allowedWidgetsMap.has(id)) {
      orderedAllowedWidgets.push(allowedWidgetsMap.get(id)!);
      processedIds.add(id);
    }
  }

  for (const [id, widget] of allowedWidgetsMap.entries()) {
    if (!processedIds.has(id)) {
      orderedAllowedWidgets.push(widget);
    }
  }

  const statWidgets = orderedAllowedWidgets.filter((w) => w.type === 'stat');
  const panelWidgets = orderedAllowedWidgets.filter((w) => w.type === 'panel');

  return (
    <div
      className="w-full min-h-[calc(100vh-70px)] bg-[#F8F9FA] p-6 md:p-8"
      style={{ backgroundImage: bgPattern, backgroundRepeat: 'repeat' }}
    >
      <div className="mb-6 flex justify-between items-start">
        <div className="flex flex-col">
          <h1 className="text-[2rem] font-bold text-[#44474A] tracking-[-0.02em] leading-tight">
            Bienvenido de vuelta, {user?.nombre_completo || user?.email?.split('@')[0] || 'Usuario'}
          </h1>
          <p className="text-[1rem] text-[#858789]">Aquí tienes un resumen de tu espacio hoy.</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 bg-[#A7313A] text-white px-4 py-2 rounded-lg hover:bg-[#8B2830] transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span className="font-medium text-sm">Guardar Disposición</span>
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {statWidgets.length > 0 && (
          <SortableContext items={statWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 w-full">
              {statWidgets.map((widget) => {
                const WidgetComponent = widget.component;
                return (
                  <SortableItem key={widget.id} id={widget.id}>
                    <WidgetComponent />
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        )}

        {panelWidgets.length > 0 && (
          <SortableContext items={panelWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {panelWidgets.map((widget, index) => {
                const WidgetComponent = widget.component;
                // Alternar anchos
                const isWide = index % 2 === 0 && panelWidgets.length > 1;
                return (
                  <div key={widget.id} className={isWide ? 'lg:col-span-1' : ''}>
                    <SortableItem id={widget.id}>
                      <WidgetComponent />
                    </SortableItem>
                  </div>
                );
              })}
            </div>
          </SortableContext>
        )}
      </DndContext>

      {orderedAllowedWidgets.length === 0 && (
        <div className="flex items-center justify-center h-64 bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-[#858789] text-lg">No tienes widgets asignados para visualizar.</p>
        </div>
      )}
    </div>
  );
}
