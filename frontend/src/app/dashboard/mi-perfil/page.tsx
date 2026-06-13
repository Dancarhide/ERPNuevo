'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { empleadosApi, authApi } from '@/lib/api';
import { UserCircle, Key, Loader2, Save, CheckCircle } from 'lucide-react';

interface EmpleadoPerfil {
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  area?: { nombre_area?: string };
  puesto?: { nombre_puesto?: string };
  [key: string]: unknown;
}

export default function MiPerfilPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [empleado, setEmpleado] = useState<EmpleadoPerfil | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      empleadosApi
        .getById(user.id)
        .then((data) => {
          setEmpleado(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (password.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }

    setPassLoading(true);
    try {
      await authApi.changePassword(password);
      setPassSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as Error;
      setPassError(error.message || 'Error al cambiar contraseña.');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[#A7313A]" size={32} />
      </div>
    );
  }

  if (!empleado) {
    return (
      <div className="text-center text-[#858789] mt-10">
        No se pudo cargar la información del perfil.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-[2rem] font-bold text-[#44474A] tracking-[-0.02em] flex items-center gap-3">
          <UserCircle className="text-[#A7313A]" size={32} />
          Mi Perfil
        </h1>
        <p className="text-[#858789] mt-2">
          Visualiza tu información personal y gestiona tus credenciales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Información Personal */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5">
          <h2 className="text-[1.2rem] font-bold text-[#44474A] mb-6 pb-4 border-b border-[#F3F4F6]">
            Información Personal
          </h2>
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[0.8rem] font-semibold text-[#858789] uppercase tracking-wide">
                Nombre Completo
              </label>
              <p className="text-[1rem] font-medium text-[#44474A] mt-1">
                {empleado.nombre_completo}
              </p>
            </div>
            <div>
              <label className="text-[0.8rem] font-semibold text-[#858789] uppercase tracking-wide">
                Correo Electrónico
              </label>
              <p className="text-[1rem] font-medium text-[#44474A] mt-1">{empleado.email}</p>
            </div>
            <div>
              <label className="text-[0.8rem] font-semibold text-[#858789] uppercase tracking-wide">
                Teléfono
              </label>
              <p className="text-[1rem] font-medium text-[#44474A] mt-1">
                {empleado.telefono || 'No registrado'}
              </p>
            </div>
            <div>
              <label className="text-[0.8rem] font-semibold text-[#858789] uppercase tracking-wide">
                Área
              </label>
              <p className="text-[1rem] font-medium text-[#44474A] mt-1">
                {empleado.area?.nombre_area || 'Sin área asignada'}
              </p>
            </div>
            <div>
              <label className="text-[0.8rem] font-semibold text-[#858789] uppercase tracking-wide">
                Puesto
              </label>
              <p className="text-[1rem] font-medium text-[#44474A] mt-1">
                {empleado.puesto?.nombre_puesto || 'Sin puesto asignado'}
              </p>
            </div>
          </div>
        </div>

        {/* Cambiar Contraseña */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 h-fit">
          <h2 className="text-[1.2rem] font-bold text-[#44474A] mb-6 pb-4 border-b border-[#F3F4F6] flex items-center gap-2">
            <Key className="text-[#858789]" size={20} /> Seguridad
          </h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="block text-[0.85rem] font-semibold text-[#44474A] mb-1.5">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[42px] px-3 rounded-lg border border-[#D1D5DB] bg-white text-[#44474A] text-[0.95rem] focus:outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-colors"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="block text-[0.85rem] font-semibold text-[#44474A] mb-1.5">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[42px] px-3 rounded-lg border border-[#D1D5DB] bg-white text-[#44474A] text-[0.95rem] focus:outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-colors"
                placeholder="Confirma la contraseña"
                required
              />
            </div>

            {passError && <div className="text-red-500 text-sm mt-1">{passError}</div>}
            {passSuccess && (
              <div className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                <CheckCircle size={16} /> Contraseña actualizada correctamente.
              </div>
            )}

            <button
              type="submit"
              disabled={passLoading}
              className="mt-2 h-[42px] bg-[#A7313A] text-white rounded-lg font-semibold hover:bg-[#8A2930] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {passLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
