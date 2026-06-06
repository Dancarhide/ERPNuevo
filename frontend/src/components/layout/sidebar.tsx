'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  LayoutDashboard,
  Users,
  Building,
  Calendar,
  ClipboardList,
  Network,
  Info,
  BarChart,
  Wallet,
  Receipt,
  Shield,
  Star,
  AlertTriangle,
  UserCog,
  PieChart,
  Settings,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    path: '/dashboard/empleados',
    label: 'Empleados',
    icon: Users,
    requiredPermission: 'ver_empleados',
  },
  {
    path: '/dashboard/hr-config',
    label: 'Estructura Organizacional',
    icon: Building,
    requiredPermission: 'ver_configuracion',
  },
  {
    path: '/dashboard/vacaciones',
    label: 'Vacaciones',
    icon: Calendar,
    requiredPermission: 'ver_vacaciones',
  },
  { path: '/dashboard/mis-asistencias', label: 'Mis Asistencias', icon: ClipboardList },
  {
    path: '/dashboard/asistencia',
    label: 'Gestión Asistencias',
    icon: ClipboardList,
    requiredPermission: 'ver_asistencia',
  },
  { path: '/dashboard/organigrama', label: 'Organigrama', icon: Network },
  { path: '/dashboard/quienes-somos', label: 'Quienes Somos', icon: Info },
  { path: '/dashboard/reports', label: 'Reportes y KPIs', icon: BarChart },
  { path: '/dashboard/payroll', label: 'Nómina', icon: Wallet },
  { path: '/dashboard/mis-comprobantes', label: 'Mis Recibos', icon: Receipt },
  { path: '/dashboard/estructura', label: 'Reclutamiento', icon: Shield },
  { path: '/dashboard/evaluaciones', label: 'Evaluaciones de Desempeño', icon: Star },
  { path: '/dashboard/incidencias', label: 'Gestión de Incidencias', icon: AlertTriangle },
  { path: '/dashboard/hr-inventory', label: 'Expedientes', icon: UserCog },
  { path: '/dashboard/clima-laboral', label: 'Clima Laboral', icon: PieChart },
  { path: '/dashboard/admin-encuestas', label: 'Gestión de Encuestas', icon: BarChart },
  { path: '/dashboard/admin-eventos', label: 'Comunicados y Eventos', icon: Calendar },
  {
    path: '/dashboard/admin-config',
    label: 'Configuración del Sistema',
    icon: Settings,
    requiredPermission: 'ver_configuracion',
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    return user?.permisos?.includes(item.requiredPermission);
  });

  return (
    <aside
      className={`relative flex flex-col bg-[#44474A] text-white shadow-[2px_0_10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-50 overflow-hidden ${
        isCollapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
    >
      <div className="flex justify-end p-4 hidden md:flex">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#E1DFE0] hover:text-[#A7313A] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-1.5 overflow-y-auto px-0 custom-scrollbar">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <div key={item.path} className="px-4">
                <Link
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${isActive ? 'bg-[#A7313A] text-white' : 'text-[#E1DFE0] hover:bg-white/10'}
                `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="text-[0.95rem] whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </ul>
      </nav>

      {/* Footer Mobile Only from original CSS */}
      <div className="hidden md:hidden border-t border-white/10 p-6 bg-black/20">
        {/* ... user info ... */}
      </div>
    </aside>
  );
}
