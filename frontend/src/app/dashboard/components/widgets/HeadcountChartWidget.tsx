'use client';
import { useEffect, useState } from 'react';
import { kpiApi } from '@/lib/api';
import { Loader2, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#A7313A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function HeadcountChartWidget() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kpiApi
      .getHeadcount()
      .then((res) => {
        setData(res.por_area || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col min-h-[350px]">
      <div className="p-5 border-b border-[#F3F4F6] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#A7313A]/10 text-[#A7313A] flex items-center justify-center">
            <Users size={18} />
          </div>
          <h2 className="font-bold text-[#44474A] text-[1.1rem]">Distribución por Área</h2>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col relative justify-center">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#A7313A]" size={30} />
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[#858789]">
            No hay datos disponibles
          </div>
        ) : (
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [value, 'Empleados']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
