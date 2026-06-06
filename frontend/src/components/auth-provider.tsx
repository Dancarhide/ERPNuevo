'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

type User = {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string | null;
  requiere_cambio_contrasena: boolean;
  permisos: string[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await authApi.getMe();
        if (mounted) {
          setUser(data);
        }
      } catch {
        // Si el middleware no lo atrapró o el token expiró, fallará aquí.
        if (mounted) {
          setUser(null);
          router.push('/login');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (_err) {
      console.error('Error al cerrar sesión', _err);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
