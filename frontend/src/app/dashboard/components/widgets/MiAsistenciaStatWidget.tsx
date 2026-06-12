import { useEffect, useState } from 'react';
import { asistenciasApi } from '@/lib/api';
import { CalendarCheck, Loader2 } from 'lucide-react';

interface Asistencia {
  id: number;
  fecha: string;
  hora_entrada?: string;
}

export function MiAsistenciaStatWidget() {
  const [loading, setLoading] = useState(true);
  const [asistenciasMes, setAsistenciasMes] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    asistenciasApi
      .getMisAsistencias()
      .then((data: Asistencia[]) => {
        if (mounted) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const delMes = data.filter((a) => {
            const date = new Date(a.fecha + 'T00:00:00');
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          });

          setAsistenciasMes(delMes.length);
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

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between h-[140px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#858789] uppercase tracking-wide">
          Mis Asistencias (Mes)
        </p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
          <CalendarCheck size={18} />
        </div>
      </div>
      <div>
        {loading ? (
          <Loader2 className="animate-spin text-[#A7313A]" size={24} />
        ) : (
          <p className="text-[2rem] leading-none font-extrabold text-[#44474A] tracking-[-0.02em]">
            {asistenciasMes}{' '}
            <span className="text-sm font-medium text-[#858789] tracking-normal">días</span>
          </p>
        )}
      </div>
    </div>
  );
}
