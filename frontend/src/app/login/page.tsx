'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  // Estados del Formulario Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para Cambio Obligatorio de Contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.requiere_cambio_contrasena) {
        setIsChangingPassword(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Credenciales inválidas o error de conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al guardar la nueva contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  const bgPattern = `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.10'%3E%3Ccircle cx='50' cy='50' r='14' fill='%23A7313A'/%3E%3Crect x='14' y='14' width='14' height='14' fill='%23A7313A'/%3E%3Crect x='72' y='14' width='14' height='14' fill='%23A7313A'/%3E%3Crect x='14' y='72' width='14' height='14' fill='%23A7313A'/%3E%3Crect x='72' y='72' width='14' height='14' fill='%23A7313A'/%3E%3Cpath d='M50 15v14.5M34.5 29.5h31M50 85V70.5M34.5 70.5h31M15 50h14.5M29.5 34.5v31M85 50H70.5M70.5 34.5v31' fill='none' stroke='%2344474A' stroke-width='3.5'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div className="flex min-h-screen w-full bg-[#E1DFE0] font-sans">
      {/* Columna Izquierda: Formulario */}
      <div className="flex flex-1 items-center justify-center p-8 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.04)] z-10 relative">
        <div className="w-full max-w-[420px] rounded-xl">
          <div className="mb-10">
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={160}
              height={70}
              className="object-contain"
              priority
            />
          </div>

          {!isChangingPassword ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold text-[#44474A] mb-2 tracking-tight">
                Bienvenido de nuevo
              </h2>
              <p className="text-[#858789] text-[0.95rem] mb-10">
                Inicie sesión en su cuenta empresarial
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-semibold text-[#858789]">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    required
                    className="p-3.5 text-base border border-[#A4A4A4] rounded-lg outline-none transition-all duration-200 text-[#44474A] placeholder:text-[#A4A4A4] focus:border-[#A7313A] focus:ring-4 focus:ring-[#A7313A]/10 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-semibold text-[#858789]">
                    Contraseña
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full p-3.5 pr-12 text-base border border-[#A4A4A4] rounded-lg outline-none transition-all duration-200 text-[#44474A] placeholder:text-[#A4A4A4] focus:border-[#A7313A] focus:ring-4 focus:ring-[#A7313A]/10 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 p-1 text-[#858789] hover:text-[#44474A] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-[#A7313A] text-sm bg-[#A7313A]/10 p-3.5 rounded-md border-l-4 border-[#A7313A] font-medium animate-in fade-in duration-300">
                    {error}
                  </div>
                )}

                <div className="flex justify-end -mt-1 mb-2">
                  <a
                    href="#"
                    className="text-sm text-[#A7313A] font-medium hover:text-[#8F2930] hover:underline transition-colors"
                  >
                    ¿Olvidó su contraseña?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#A7313A] text-white p-3.5 text-base font-semibold border-none rounded-lg cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(167,49,58,0.2),0_2px_4px_-1px_rgba(167,49,58,0.1)] hover:bg-[#8F2930] hover:-translate-y-px hover:shadow-[0_6px_8px_-1px_rgba(167,49,58,0.3),0_4px_6px_-1px_rgba(167,49,58,0.2)] active:translate-y-0 active:shadow-[0_2px_4px_-1px_rgba(167,49,58,0.2)] disabled:bg-[#B59CA4] disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-70 mt-2"
                >
                  {loading ? 'Autenticando...' : 'Iniciar Sesión'}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-3xl font-bold text-[#44474A] mb-2 tracking-tight">
                Actualizar Contraseña
              </h2>
              <p className="text-[#858789] text-[0.95rem] mb-10 leading-relaxed">
                Por tu seguridad, debes cambiar la contraseña predeterminada antes de continuar.
              </p>

              <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="newPassword" className="text-sm font-semibold text-[#858789]">
                    Nueva Contraseña
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ingresa tu nueva contraseña"
                      required
                      className="w-full p-3.5 pr-12 text-base border border-[#A4A4A4] rounded-lg outline-none transition-all duration-200 text-[#44474A] placeholder:text-[#A4A4A4] focus:border-[#A7313A] focus:ring-4 focus:ring-[#A7313A]/10 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 p-1 text-[#858789] hover:text-[#44474A] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-[#858789]">
                    Confirmar Contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Vuelve a ingresar la contraseña"
                    required
                    className="w-full p-3.5 text-base border border-[#A4A4A4] rounded-lg outline-none transition-all duration-200 text-[#44474A] placeholder:text-[#A4A4A4] focus:border-[#A7313A] focus:ring-4 focus:ring-[#A7313A]/10 bg-white"
                  />
                </div>

                {error && (
                  <div className="text-[#A7313A] text-sm bg-[#A7313A]/10 p-3.5 rounded-md border-l-4 border-[#A7313A] font-medium animate-in fade-in duration-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#A7313A] text-white p-3.5 text-base font-semibold border-none rounded-lg cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(167,49,58,0.2),0_2px_4px_-1px_rgba(167,49,58,0.1)] hover:bg-[#8F2930] hover:-translate-y-px hover:shadow-[0_6px_8px_-1px_rgba(167,49,58,0.3),0_4px_6px_-1px_rgba(167,49,58,0.2)] active:translate-y-0 active:shadow-[0_2px_4px_-1px_rgba(167,49,58,0.2)] disabled:bg-[#B59CA4] disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-70 mt-2"
                >
                  {loading ? 'Guardando...' : 'Guardar y Continuar'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Fondo Decorativo */}
      <div
        className="hidden lg:block lg:flex-[1.2] bg-[#E1DFE0] relative overflow-hidden"
        style={{
          backgroundImage: bgPattern,
          backgroundSize: '200px 200px',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      >
        {/* Overlay sutil para darle profundidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#E1DFE0]/50" />
      </div>
    </div>
  );
}
