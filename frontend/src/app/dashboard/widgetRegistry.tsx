import { EmpleadosActivosWidget } from './components/widgets/EmpleadosActivosWidget';
import { AsistenciasHoyWidget } from './components/widgets/AsistenciasHoyWidget';
import { NominaMensualWidget } from './components/widgets/NominaMensualWidget';
import { IncidenciasWidget } from './components/widgets/IncidenciasWidget';
import { ActividadRecienteWidget } from './components/widgets/ActividadRecienteWidget';
import { AvisosWidget } from './components/widgets/AvisosWidget';
import { HeadcountChartWidget } from './components/widgets/HeadcountChartWidget';
import { PayrollChartWidget } from './components/widgets/PayrollChartWidget';

export type WidgetType = 'stat' | 'panel';

export interface WidgetConfig {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  requiredPermission: string | null;
  type: WidgetType;
}

export const WIDGET_REGISTRY: WidgetConfig[] = [
  {
    id: 'stat_empleados',
    component: EmpleadosActivosWidget,
    requiredPermission: 'ver_empleados',
    type: 'stat',
  },
  {
    id: 'stat_asistencias',
    component: AsistenciasHoyWidget,
    requiredPermission: 'ver_asistencia',
    type: 'stat',
  },
  {
    id: 'stat_nomina',
    component: NominaMensualWidget,
    requiredPermission: 'ver_configuracion',
    type: 'stat',
  },
  {
    id: 'stat_incidencias',
    component: IncidenciasWidget,
    requiredPermission: 'ver_empleados',
    type: 'stat',
  },
  {
    id: 'panel_actividad',
    component: ActividadRecienteWidget,
    requiredPermission: null, // Todos pueden ver su actividad
    type: 'panel',
  },
  {
    id: 'panel_avisos',
    component: AvisosWidget,
    requiredPermission: null, // Todos pueden ver avisos generales
    type: 'panel',
  },
  {
    id: 'panel_chart_headcount',
    component: HeadcountChartWidget,
    requiredPermission: 'ver_empleados',
    type: 'panel',
  },
  {
    id: 'panel_chart_payroll',
    component: PayrollChartWidget,
    requiredPermission: 'ver_configuracion',
    type: 'panel',
  },
];
