'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, AlertTriangle, Wallet, Clock, Loader2, TrendingUp } from 'lucide-react';
import { kpiApi } from '@/lib/api';

const COLORS = ['#A7313A', '#44474A', '#E1DFE0', '#10B981', '#3B82F6', '#F59E0B', '#6366F1'];
const PIE_COLORS = ['#A7313A', '#3B82F6', '#10B981', '#F59E0B'];

interface ChartDataPoint {
  name: string;
  value: number;
}

// Formatters
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

// Custom Tooltips for charts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-primary font-semibold">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomCurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-primary font-semibold">
          {payload[0].name}: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(true);

  // States for KPIs
  const [headcount, setHeadcount] = useState<{
    total_activos: number;
    antiguedad_promedio_anios: number;
    por_genero: ChartDataPoint[];
    por_area: ChartDataPoint[];
  } | null>(null);

  const [payroll, setPayroll] = useState<{
    nomina_mensual_total: number;
    sueldo_promedio_area: ChartDataPoint[];
  } | null>(null);

  const [incidencias, setIncidencias] = useState<{
    total_activas: number;
    por_estatus: ChartDataPoint[];
  } | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [hcData, payrollData, incidenciasData] = await Promise.all([
        kpiApi.getHeadcount(),
        kpiApi.getPayroll(),
        kpiApi.getIncidencias(),
      ]);
      setHeadcount(hcData);
      setPayroll(payrollData);
      setIncidencias(incidenciasData);
    } catch (err) {
      console.error('Error fetching KPI data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-[#A7313A] mb-4" />
        <p className="font-medium text-lg">Procesando cubos de datos y métricas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Dashboard Ejecutivo</h1>
        <p className="text-slate-500">Métricas en tiempo real y análisis organizacional.</p>
      </header>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Headcount Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Fuerza Laboral Activa
              </p>
              <h3 className="text-4xl font-black text-slate-800">
                {headcount?.total_activos || 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
            <TrendingUp size={16} className="text-emerald-500 mr-1" />
            <span>Colaboradores Totales</span>
          </div>
        </motion.div>

        {/* Nómina Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Gasto de Nómina Mensual
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {formatCompactNumber(payroll?.nomina_mensual_total || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Wallet size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
            <span className="text-slate-400">Total bruto mensual</span>
          </div>
        </motion.div>

        {/* Antigüedad Promedio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#A7313A]/10 rounded-full blur-xl group-hover:bg-[#A7313A]/20 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Antigüedad Promedio
              </p>
              <h3 className="text-4xl font-black text-slate-800">
                {headcount?.antiguedad_promedio_anios || 0}
              </h3>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl text-[#A7313A]">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
            <span>Años promedio en la empresa</span>
          </div>
        </motion.div>

        {/* Incidencias Activas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Incidencias Pendientes
              </p>
              <h3 className="text-4xl font-black text-slate-800">
                {incidencias?.total_activas || 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
            <span>Requieren atención</span>
          </div>
        </motion.div>
      </div>

      {/* Middle Row - Composición Organizacional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por Género (Pie Chart) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 col-span-1 lg:col-span-1"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">Diversidad Demográfica</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={headcount?.por_genero || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {(headcount?.por_genero || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Headcount por Área (Bar Chart Horizontal) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 col-span-1 lg:col-span-2"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            Distribución del Talento por Área
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={headcount?.por_area || []}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Empleados" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                  {(headcount?.por_area || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Finanzas y Operaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sueldo Promedio por Área */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            Sueldo Promedio Mensual por Área
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={payroll?.sueldo_promedio_area || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(val) => `$${formatCompactNumber(val)}`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <RechartsTooltip content={<CustomCurrencyTooltip />} />
                <Bar dataKey="value" name="Sueldo Promedio" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Estatus de Incidencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            Estado de las Incidencias Reportadas
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incidencias?.por_estatus || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Cantidad" fill="#F59E0B" radius={[6, 6, 0, 0]}>
                  {(incidencias?.por_estatus || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === 'Pendiente' ? '#F59E0B' : '#10B981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
