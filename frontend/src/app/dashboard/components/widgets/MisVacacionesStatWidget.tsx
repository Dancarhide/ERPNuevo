import { useEffect, useState } from 'react';
import { vacacionesApi } from '@/lib/api';
import { Plane, Loader2 } from 'lucide-react';

interface Vacacion {
  id: number;
  dias_solicitados: number;
  estatus_vacacion: string;
}

export function MisVacacionesStatWidget() {
  const [loading, setLoading] = useState(true);
  const [diasAprobados, setDiasAprobados] = useState(0);

  useEffect(() => {
    let mounted = true;
    vacacionesApi
      .getAll()
      .then((data: Vacacion[]) => {
        if (mounted) {
          const aprobadas = data.filter((v) => v.estatus_vacacion === 'Aprobada');
          const total = aprobadas.reduce((acc, v) => acc + v.dias_solicitados, 0);
          setDiasAprobados(total);
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
          Mis Vacaciones Aprobadas
        </p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
          <Plane size={18} />
        </div>
      </div>
      <div>
        {loading ? (
          <Loader2 className="animate-spin text-[#A7313A]" size={24} />
        ) : (
          <p className="text-[2rem] leading-none font-extrabold text-[#44474A] tracking-[-0.02em]">
            {diasAprobados}{' '}
            <span className="text-sm font-medium text-[#858789] tracking-normal">días</span>
          </p>
        )}
      </div>
    </div>
  );
}
