'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[5px] border-black/5 border-l-[#A7313A] rounded-full animate-spin"></div>
          <p className="text-[#858789] font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  const bgPattern = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='14' fill='%236B7280'/%3E%3Crect x='14' y='14' width='14' height='14' fill='%236B7280'/%3E%3Crect x='72' y='14' width='14' height='14' fill='%236B7280'/%3E%3Crect x='14' y='72' width='14' height='14' fill='%236B7280'/%3E%3Crect x='72' y='72' width='14' height='14' fill='%236B7280'/%3E%3Cpath d='M50 15v14.5M34.5 29.5h31M50 85V70.5M34.5 70.5h31M15 50h14.5M29.5 34.5v31M85 50H70.5M70.5 34.5v31' fill='none' stroke='%2344474A' stroke-width='3.5'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div
      className="flex flex-col min-h-screen bg-[#F8F9FA] text-[#44474A] font-sans"
      style={{ backgroundImage: bgPattern, backgroundRepeat: 'repeat' }}
    >
      <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex flex-1 pt-[70px]">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 transition-all duration-300 relative min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
