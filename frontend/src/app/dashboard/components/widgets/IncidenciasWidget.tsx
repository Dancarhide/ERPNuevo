'use client';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { kpiApi } from '@/lib/api';

export function IncidenciasWidget() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kpiApi
      .getIncidencias()
      .then((data) => setTotal(data.total_activas))
      .catch(() => setTotal(0))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-black/5 rounded-xl p-5 flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all duration-300">
      <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 bg-amber-100 text-amber-700">
        <AlertCircle size={20} />
      </div>
      <div className="flex flex-col min-w-0">
        <h3 className="text-[0.8rem] text-[#858789] font-semibold mb-0.5 truncate tracking-[0.01em]">
          Incidencias Activas
        </h3>
        {loading ? (
          <Loader2 size={18} className="animate-spin text-[#858789]" />
        ) : (
          <p className="text-[1.4rem] font-extrabold text-[#44474A] m-0 tracking-[-0.02em]">
            {total}
          </p>
        )}
      </div>
    </div>
  );
}
