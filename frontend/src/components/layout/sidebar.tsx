'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Network,
  Info,
  BarChart,
  Wallet,
  Star,
  UserCog,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';

interface SubMenuItem {
  path: string;
  label: string;
}

interface MenuItem {
  path?: string;
  label: string;
  icon: React.ElementType;
  requiredPermission?: string;
  subItems?: SubMenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { path: '/dashboard/quienes-somos', label: 'Quiénes Somos', icon: Info },
  {
    label: 'Mi Espacio',
    icon: UserCog,
    subItems: [
      { path: '/dashboard/mis-asistencias', label: 'Mis Asistencias' },
      { path: '/dashboard/mis-comprobantes', label: 'Mi Nómina' },
    ],
  },
  {
    label: 'Recursos Humanos',
    icon: Users,
    requiredPermission: 'ver_empleados',
    subItems: [
      { path: '/dashboard/empleados', label: 'Empleados' },
      { path: '/dashboard/incidencias', label: 'Incidencias' },
    ],
  },
  { path: '/dashboard/organigrama', label: 'Organigrama', icon: Network },
  {
    label: 'Tiempo y Asistencia',
    icon: ClipboardList,
    requiredPermission: 'ver_asistencia',
    subItems: [
      { path: '/dashboard/asistencia', label: 'Gestión Asistencias' },
      { path: '/dashboard/vacaciones', label: 'Vacaciones' },
    ],
  },
  {
    label: 'Talento y Desarrollo',
    icon: Star,
    requiredPermission: 'ver_empleados',
    subItems: [
      { path: '/dashboard/estructura', label: 'Reclutamiento' },
      { path: '/dashboard/evaluaciones', label: 'Evaluaciones' },
      { path: '/dashboard/clima-laboral', label: 'Clima Laboral' },
    ],
  },
  {
    label: 'Nómina',
    icon: Wallet,
    requiredPermission: 'ver_configuracion',
    subItems: [
      { path: '/dashboard/payroll', label: 'Lotes de Nómina' },
      { path: '/dashboard/payroll/conceptos', label: 'Catálogo de Conceptos' },
    ],
  },
  {
    path: '/dashboard/calendario',
    label: 'Calendario',
    icon: Calendar,
  },
  {
    path: '/dashboard/reports',
    label: 'Reportes y KPIs',
    icon: BarChart,
    requiredPermission: 'ver_configuracion',
  },
  {
    label: 'Configuración',
    icon: Settings,
    requiredPermission: 'ver_configuracion',
    subItems: [
      { path: '/dashboard/admin-config', label: 'Sistema' },
      { path: '/dashboard/admin/empresa', label: 'Identidad Empresa' },
      { path: '/dashboard/hr-config', label: 'Estructura Organizacional' },
    ],
  },
];

function SidebarItem({
  item,
  isActive,
  isCollapsed,
  pathname,
}: {
  item: MenuItem;
  isActive: boolean;
  isCollapsed: boolean;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  const hasActiveSubItem = item.subItems?.some((sub) => pathname === sub.path);
  const isItemActive = isActive || hasActiveSubItem;

  if (!item.subItems) {
    return (
      <div className="px-4">
        <Link
          href={item.path!}
          className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200
            ${isItemActive ? 'bg-[#A7313A] text-white' : 'text-[#E1DFE0] hover:bg-white/10'}
        `}
          title={isCollapsed ? item.label : undefined}
        >
          <Icon size={20} className="shrink-0" />
          {!isCollapsed && <span className="text-[0.95rem] whitespace-nowrap">{item.label}</span>}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-200
          ${isItemActive && !isOpen ? 'bg-[#A7313A]/50 text-white' : 'text-[#E1DFE0] hover:bg-white/10'}
        `}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center gap-4">
          <Icon size={20} className="shrink-0" />
          {!isCollapsed && <span className="text-[0.95rem] whitespace-nowrap">{item.label}</span>}
        </div>
        {!isCollapsed && (
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {!isCollapsed && isOpen && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/10 pl-2">
          {item.subItems.map((sub) => {
            const isSubActive = pathname === sub.path;
            return (
              <Link
                key={sub.path}
                href={sub.path}
                className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200
                  ${isSubActive ? 'bg-[#A7313A] text-white font-semibold' : 'text-[#E1DFE0] hover:bg-white/10 hover:text-white'}
                `}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (mobileMenuOpen && setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    return user?.permisos?.includes(item.requiredPermission);
  });

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[40] md:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-[70px] md:top-[70px] flex flex-col shrink-0 bg-[#44474A] text-white shadow-[2px_0_10px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out z-50 overflow-hidden h-[calc(100vh-70px)]
          ${mobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full w-[260px] md:translate-x-0'}
        `}
      >
        <div className="flex justify-end p-2 hidden md:flex">
          {/* Spacer to replace button area and keep some top padding */}
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1.5 overflow-y-auto px-0 custom-scrollbar">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                isActive={pathname === item.path}
                isCollapsed={false}
                pathname={pathname}
              />
            ))}
          </ul>
        </nav>

        {/* Footer Mobile Only from original CSS */}
        <div className="hidden md:hidden border-t border-white/10 p-6 bg-black/20">
          {/* ... user info ... */}
        </div>
      </aside>
    </>
  );
}
