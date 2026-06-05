'use client';

import { AuthProvider, useAuth } from '@/components/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

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

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-[#44474A] font-sans">
      <Topbar />
      <div className="flex flex-1 pt-[70px]">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 relative">{children}</main>
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
