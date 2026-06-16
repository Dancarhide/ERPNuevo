import { EmpleadosActivosWidget } from './components/widgets/EmpleadosActivosWidget';
import { AsistenciasHoyWidget } from './components/widgets/AsistenciasHoyWidget';
import { NominaMensualWidget } from './components/widgets/NominaMensualWidget';
import { IncidenciasWidget } from './components/widgets/IncidenciasWidget';
import { AvisosWidget } from './components/widgets/AvisosWidget';
import { HeadcountChartWidget } from './components/widgets/HeadcountChartWidget';
import { PayrollChartWidget } from './components/widgets/PayrollChartWidget';
import { MisVacacionesStatWidget } from './components/widgets/MisVacacionesStatWidget';
import { MiUltimaNominaStatWidget } from './components/widgets/MiUltimaNominaStatWidget';
import { MiAsistenciaStatWidget } from './components/widgets/MiAsistenciaStatWidget';

export type WidgetType = 'stat' | 'panel';

export interface WidgetConfig {
  id: string;
  component: React.ComponentType<Record<string, unknown>>;
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
    id: 'stat_mis_vacaciones',
    component: MisVacacionesStatWidget,
    requiredPermission: null, // Todos los empleados
    type: 'stat',
  },
  {
    id: 'stat_mi_nomina',
    component: MiUltimaNominaStatWidget,
    requiredPermission: null, // Todos los empleados
    type: 'stat',
  },
  {
    id: 'stat_mi_asistencia',
    component: MiAsistenciaStatWidget,
    requiredPermission: null, // Todos los empleados
    type: 'stat',
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
