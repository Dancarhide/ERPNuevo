import { useEffect, useState } from 'react';
import { nominaApi } from '@/lib/api';
import { Wallet, Loader2 } from 'lucide-react';

interface Nomina {
  id: number;
  neto_pagar: number;
  fecha_fin: string;
}

export function MiUltimaNominaStatWidget() {
  const [loading, setLoading] = useState(true);
  const [ultimaNomina, setUltimaNomina] = useState<Nomina | null>(null);

  useEffect(() => {
    let mounted = true;
    nominaApi
      .getMisRecibos()
      .then((data: Nomina[]) => {
        if (mounted && data && data.length > 0) {
          // La API ya los devuelve ordenados por fecha desc
          setUltimaNomina(data[0]);
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

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between h-[140px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#858789] uppercase tracking-wide">
          Mi Última Nómina
        </p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
          <Wallet size={18} />
        </div>
      </div>
      <div>
        {loading ? (
          <Loader2 className="animate-spin text-[#A7313A]" size={24} />
        ) : ultimaNomina ? (
          <p className="text-[2rem] leading-none font-extrabold text-[#44474A] tracking-[-0.02em]">
            {fmt(ultimaNomina.neto_pagar)}
          </p>
        ) : (
          <p className="text-[1.5rem] leading-none font-bold text-[#858789] tracking-[-0.02em]">
            Sin registros
          </p>
        )}
      </div>
    </div>
  );
}
