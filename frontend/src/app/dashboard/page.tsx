'use client';

import { useAuth } from '@/components/auth-provider';
import { Users, Clock, Wallet, Shield } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const bgPattern = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='14' fill='%236B7280'/%3E%3Crect x='14' y='14' width='14' height='14' fill='%236B7280'/%3E%3Crect x='72' y='14' width='14' height='14' fill='%236B7280'/%3E%3Crect x='14' y='72' width='14' height='14' fill='%236B7280'/%3E%3Crect x='72' y='72' width='14' height='14' fill='%236B7280'/%3E%3Cpath d='M50 15v14.5M34.5 29.5h31M50 85V70.5M34.5 70.5h31M15 50h14.5M29.5 34.5v31M85 50H70.5M70.5 34.5v31' fill='none' stroke='%2344474A' stroke-width='3.5'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div
      className="w-full min-h-[calc(100vh-70px)] bg-[#F8F9FA] p-6 md:p-8"
      style={{ backgroundImage: bgPattern, backgroundRepeat: 'repeat' }}
    >
      <div className="mb-6">
        <h1 className="text-[1.75rem] font-bold text-[#44474A] tracking-[-0.02em] mb-1">
          Bienvenido de vuelta, {user?.email?.split('@')[0]}
        </h1>
        <p className="text-[#858789] text-[1rem]">Resumen general de las operaciones de hoy.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 w-full">
        {/* Stat Card 1 */}
        <div className="bg-white border border-black/5 rounded-xl p-5 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all duration-300">
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-[#A7313A]/10 text-[#A7313A]">
            <Users size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-[0.8rem] text-[#858789] font-semibold mb-0.5 truncate tracking-[0.01em]">
              Empleados Activos
            </h3>
            <p className="text-[1.4rem] font-extrabold text-[#44474A] m-0 tracking-[-0.02em]">--</p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white border border-black/5 rounded-xl p-5 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all duration-300">
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-[#44474A]/10 text-[#44474A]">
            <Clock size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-[0.8rem] text-[#858789] font-semibold mb-0.5 truncate tracking-[0.01em]">
              Asistencias Hoy
            </h3>
            <p className="text-[1.4rem] font-extrabold text-[#44474A] m-0 tracking-[-0.02em]">--</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white border border-black/5 rounded-xl p-5 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all duration-300">
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-[#A7313A]/10 text-[#A7313A]">
            <Wallet size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-[0.8rem] text-[#858789] font-semibold mb-0.5 truncate tracking-[0.01em]">
              Nómina Mensual
            </h3>
            <p className="text-[1.4rem] font-extrabold text-[#44474A] m-0 tracking-[-0.02em]">--</p>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white border border-black/5 rounded-xl p-5 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all duration-300">
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-[#44474A]/10 text-[#44474A]">
            <Shield size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-[0.8rem] text-[#858789] font-semibold mb-0.5 truncate tracking-[0.01em]">
              Incidencias
            </h3>
            <p className="text-[1.4rem] font-extrabold text-[#44474A] m-0 tracking-[-0.02em]">--</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h2 className="text-[1.5rem] font-bold text-[#44474A] m-0 pb-5 border-b-2 border-[#F3F4F6] tracking-[-0.02em] mb-6">
            Actividad Reciente
          </h2>
          <div className="flex flex-col gap-5">
            <div className="flex justify-between pb-5 border-b border-[#F3F4F6]">
              <span className="text-[#44474A] font-semibold text-[1rem]">
                Módulo en construcción
              </span>
              <span className="text-[#858789] text-[0.9rem] font-medium">--:--</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h2 className="text-[1.5rem] font-bold text-[#44474A] m-0 pb-5 border-b-2 border-[#F3F4F6] tracking-[-0.02em] mb-6">
            Avisos
          </h2>
          <div className="flex flex-col gap-5">
            <p className="text-[#858789]">No hay avisos recientes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
