'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  LogOut,
  Bell,
  UserCircle,
  Menu,
  MessageSquare,
  ClipboardList,
  Settings,
  ChevronDown,
} from 'lucide-react';

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = user?.email?.split('@')[0] || 'Administrador';
  const userRole = user?.is_superuser ? 'Súper Administrador' : 'Empleado';
  const initials = userName.substring(0, 2).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[70px] bg-white border-b border-[#A4A4A4] flex items-center justify-between px-8 shadow-[0_2px_10px_rgba(0,0,0,0.05)] fixed top-0 left-0 right-0 z-[100]">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-[#44474A] p-1">
          <Menu size={24} />
        </button>
        <Image
          src="/logo.png"
          alt="Logo"
          width={120}
          height={40}
          className="object-contain h-10 w-auto"
        />
      </div>

      <div className="flex items-center gap-5" ref={dropdownRef}>
        <button className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#858789] hover:text-[#A7313A] hover:bg-white hover:border-[#A7313A] hover:shadow-[0_4px_12px_rgba(167,49,58,0.12)] transition-all">
          <ClipboardList size={20} />
        </button>

        <button className="relative flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#858789] hover:text-[#A7313A] hover:bg-white hover:border-[#A7313A] hover:shadow-[0_4px_12px_rgba(167,49,58,0.12)] transition-all">
          <Bell size={20} />
          {/* Badge */}
        </button>

        <button className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#858789] hover:text-[#A7313A] hover:bg-white hover:border-[#A7313A] hover:shadow-[0_4px_12px_rgba(167,49,58,0.12)] transition-all">
          <MessageSquare size={20} />
        </button>

        <div
          className="relative flex items-center gap-2 p-1.5 rounded-lg cursor-pointer hover:bg-[#E1DFE0] transition-colors ml-2"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="flex flex-col text-right mr-1 hidden sm:flex">
            <span className="text-[0.9rem] font-bold text-[#44474A] leading-tight">{userName}</span>
            <span className="text-[0.75rem] font-medium text-[#858789]">{userRole}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#A7313A] text-white flex items-center justify-center font-bold text-[1.1rem]">
            {initials}
          </div>
          <ChevronDown
            size={16}
            className={`text-[#858789] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
          />

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2.5 bg-white border border-[#A4A4A4] rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] min-w-[200px] py-2.5 z-[1000] flex flex-col">
              <button
                onClick={() => router.push('/dashboard/mi-perfil')}
                className="flex items-center gap-3 px-5 py-2.5 text-[0.95rem] font-medium text-[#44474A] hover:bg-[#E1DFE0] hover:text-[#A7313A] transition-colors w-full text-left"
              >
                <UserCircle size={18} /> Mi Perfil
              </button>
              {user?.is_superuser && (
                <button
                  onClick={() => router.push('/dashboard/roles')}
                  className="flex items-center gap-3 px-5 py-2.5 text-[0.95rem] font-medium text-[#44474A] hover:bg-[#E1DFE0] hover:text-[#A7313A] transition-colors w-full text-left"
                >
                  <Settings size={18} /> Configuración
                </button>
              )}
              <div className="h-px bg-[#E1DFE0] my-2" />
              <button
                onClick={logout}
                className="flex items-center gap-3 px-5 py-2.5 text-[0.95rem] font-medium text-[#A7313A] hover:bg-[#A7313A]/5 transition-colors w-full text-left"
              >
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
