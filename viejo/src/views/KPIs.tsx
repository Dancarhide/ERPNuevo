import React, { useEffect, useState, useCallback } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    FiUsers, FiDollarSign, FiCalendar, FiBriefcase,
    FiTrendingUp, FiLoader, FiRefreshCw, FiAlertTriangle, FiTarget
} from 'react-icons/fi';
import client from '../api/client';
import './styles/KPIs.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIData {
    resumen: {
        totalActivos: number;
        headcount: Record<string, number>;
        tasaAusentismo: number;
        totalVacantesAbiertas: number;
        nominaMesActual: number;
    };
    headcountPorArea:       { area: string; empleados: number }[];
    headcountPorRol:        { rol: string; empleados: number }[];
    antiguedad:             { rango: string; count: number }[];
    vacaciones:             { estatus: string; total: number }[];
    tendenciaNomina:        { mes: string; total: number; empleados: number; promedio: number }[];
    nominaPorArea:          { area: string; total: number }[];
    incidencias:            { tipo: string; total: number }[];
    reclutamiento: {
        vacantes:                { estatus: string; total: number }[];
        candidatos:              { estatus: string; total: number }[];
        totalVacantesAbiertas:   number;
        totalCandidatos:         number;
    };
    tendenciaContrataciones: { mes: string; total: number }[];
}

// ─── Paletas de color ─────────────────────────────────────────────────────────

const PALETTE = {
    primary:  '#A7313A',
    success:  '#10b981',
    warning:  '#f59e0b',
    danger:   '#ef4444',
    info:     '#44474A',
    purple:   '#858789',
    pink:     '#A4A4A4',
    teal:     '#B59CA4',
    orange:   '#8F2930',
    gray:     '#E1DFE0',
    theme1: '#44474A',
    theme2: '#A7313A',
    theme3: '#858789',
    theme4: '#8F2930',
    theme5: '#5A5D60',
    theme6: '#C24D56',
    theme7: '#A4A4A4',
    theme8: '#2E3134',
};

const AREA_COLORS  = [PALETTE.theme2, PALETTE.theme4, PALETTE.theme6, PALETTE.theme8, PALETTE.theme3, PALETTE.theme5, PALETTE.theme7];
const ROL_COLORS   = [PALETTE.theme1, PALETTE.theme2, PALETTE.theme4, PALETTE.theme6, PALETTE.theme8, PALETTE.theme3, PALETTE.theme7];
const VAC_COLORS   = { Pendiente: PALETTE.warning, Aprobado: PALETTE.success, Rechazado: PALETTE.danger };

const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const CustomTooltipCurrency = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="kpi-tooltip">
            <p className="kpi-tooltip-label">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: {p.name.toLowerCase().includes('total') || p.name.toLowerCase().includes('nómina') || p.name.toLowerCase().includes('promedio')
                        ? fmt(p.value)
                        : p.value}
                </p>
            ))}
        </div>
    );
};

// ─── Tarjeta KPI ──────────────────────────────────────────────────────────────

interface KPICardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, sub, icon }) => (
    <div className="kpi-card">
        <div className="kpi-card-icon" style={{ background: `${PALETTE.primary}15`, color: PALETTE.primary }}>
            {icon}
        </div>
        <div className="kpi-card-body">
            <span className="kpi-card-label">{label}</span>
            <span className="kpi-card-value" style={{ color: PALETTE.primary }}>{value}</span>
            {sub && (
                <span className="kpi-card-sub">{sub}</span>
            )}
        </div>
    </div>
);

// ─── Panel wrapper ────────────────────────────────────────────────────────────

const ChartPanel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; wide?: boolean }> = 
    ({ title, subtitle, children, wide }) => (
    <div className={`kpi-panel ${wide ? 'kpi-panel--wide' : ''}`}>
        <div className="kpi-panel-header">
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
    </div>
);

// ─── Vista principal ──────────────────────────────────────────────────────────

const KPIs: React.FC = () => {
    const [data, setData]       = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [tab, setTab]         = useState<'operativo' | 'nomina' | 'talento'>('operativo');

    const fetchKPIs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await client.get('/kpis');
            setData(res.data);
        } catch {
            setError('No se pudieron cargar los indicadores. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchKPIs(); }, [fetchKPIs]);

    if (loading) return (
        <div className="kpi-loading">
            <FiLoader className="kpi-spinner" />
            <p>Calculando indicadores...</p>
        </div>
    );

    if (error || !data) return (
        <div className="kpi-error">
            <FiAlertTriangle />
            <p>{error ?? 'Sin datos'}</p>
            <button className="kpi-btn-retry" onClick={fetchKPIs}>Reintentar</button>
        </div>
    );

    const { resumen } = data;

    const tarjetas: KPICardProps[] = [
        {
            label: 'Empleados Activos',
            value: resumen.totalActivos,
            sub: `${resumen.headcount['Inactivo'] ?? 0} inactivos · ${resumen.headcount['Vacaciones'] ?? 0} en vacaciones`,
            icon: <FiUsers />,
        },
        {
            label: 'Nómina Mensual',
            value: fmt(resumen.nominaMesActual),
            sub: 'Total bruto del periodo',
            icon: <FiDollarSign />,
        },
        {
            label: 'Tasa de Ausentismo',
            value: `${resumen.tasaAusentismo}%`,
            sub: 'Empleados en vacaciones / activos',
            icon: <FiCalendar />,
        },
        {
            label: 'Vacantes Abiertas',
            value: resumen.totalVacantesAbiertas,
            sub: `${data.reclutamiento.totalCandidatos} candidatos en pipeline`,
            icon: <FiBriefcase />,
        },
    ];

    return (
        <div className="kpi-container">
            <div className="kpi-header">
                <div>
                    <h1><FiTrendingUp /> KPIs & Indicadores</h1>
                    <p>Panel ejecutivo de métricas de capital humano en tiempo real.</p>
                </div>
                <button className="kpi-btn-refresh" onClick={fetchKPIs} title="Actualizar datos">
                    <FiRefreshCw /> Actualizar
                </button>
            </div>

            <div className="kpi-cards-grid">
                {tarjetas.map((t, i) => <KPICard key={i} {...t} />)}
            </div>

            <div className="kpi-tabs">
                <button 
                    className={`kpi-tab ${tab === 'operativo' ? 'active' : ''}`}
                    onClick={() => setTab('operativo')}
                >
                    <FiUsers /> Capital Humano
                </button>
                <button 
                    className={`kpi-tab ${tab === 'nomina' ? 'active' : ''}`}
                    onClick={() => setTab('nomina')}
                >
                    <FiDollarSign /> Nómina
                </button>
                <button 
                    className={`kpi-tab ${tab === 'talento' ? 'active' : ''}`}
                    onClick={() => setTab('talento')}
                >
                    <FiTarget /> Reclutamiento
                </button>
            </div>

            {tab === 'operativo' && (
                <div className="kpi-grid">
                    <ChartPanel title="Headcount por Área" subtitle="Empleados activos distribuidos por departamento">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.headcountPorArea} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={120} />
                                <Tooltip content={<CustomTooltipCurrency />} />
                                <Bar dataKey="empleados" name="Empleados" radius={[0, 4, 4, 0]}>
                                    {data.headcountPorArea.map((_, i) => (
                                        <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel title="Distribución por Rol" subtitle="Composición del equipo por nivel jerárquico">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data.headcountPorRol}
                                    dataKey="empleados"
                                    nameKey="rol"
                                    cx="50%" cy="50%"
                                    outerRadius={75}
                                    label={({ rol, percent }: any) => `${rol} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {data.headcountPorRol.map((_, i) => (
                                        <Cell key={i} fill={ROL_COLORS[i % ROL_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                </div>
            )}

            {tab === 'nomina' && (
                <div className="kpi-grid">
                    <ChartPanel title="Tendencia de Nómina" subtitle="Total mensual pagado — últimos 6 meses" wide>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.tendenciaNomina}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltipCurrency />} />
                                <Legend />
                                <Line
                                    type="monotone" dataKey="total" name="Total Nómina"
                                    stroke={PALETTE.success} strokeWidth={3}
                                    dot={{ r: 5, fill: PALETTE.success }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                </div>
            )}

            {tab === 'talento' && (
                <div className="kpi-grid">
                    <ChartPanel title="Vacantes por Estatus" subtitle="Estado actual del pipeline de reclutamiento">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data.reclutamiento.vacantes}
                                    dataKey="total"
                                    nameKey="estatus"
                                    cx="50%" cy="50%"
                                    outerRadius={75}
                                    label={({ estatus, percent }: any) => `${estatus} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {data.reclutamiento.vacantes.map((_, i) => (
                                        <Cell key={i} fill={ROL_COLORS[i % ROL_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                </div>
            )}
        </div>
    );
};

export default KPIs;
