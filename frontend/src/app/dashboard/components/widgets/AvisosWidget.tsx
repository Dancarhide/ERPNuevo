import { useEffect, useState } from 'react';
import { notificacionesApi } from '@/lib/api';
import { Bell, Loader2 } from 'lucide-react';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creado_en: string;
}

export function AvisosWidget() {
  const [loading, setLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    let mounted = true;
    notificacionesApi
      .getAll()
      .then((data) => {
        if (mounted) {
          setNotificaciones(data.slice(0, 5)); // Mostrar solo los últimos 5
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full">
      <h2 className="text-[1.5rem] font-bold text-[#44474A] m-0 pb-5 border-b-2 border-[#F3F4F6] tracking-[-0.02em] mb-6 flex items-center gap-2">
        <Bell className="text-[#858789]" size={24} /> Avisos Recientes
      </h2>
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-[#A7313A]" size={24} />
          </div>
        ) : notificaciones.length === 0 ? (
          <p className="text-[#858789]">No hay avisos recientes.</p>
        ) : (
          notificaciones.map((n) => (
            <div key={n.id} className="pb-4 border-b border-[#F3F4F6] last:border-0">
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-[1rem] font-semibold ${n.leida ? 'text-[#858789]' : 'text-[#44474A]'}`}
                >
                  {n.titulo}
                </span>
                <span className="text-[#858789] text-[0.8rem] font-medium whitespace-nowrap ml-2">
                  {formatDate(n.creado_en)}
                </span>
              </div>
              <p className="text-[#858789] text-[0.9rem] leading-snug">{n.mensaje}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
