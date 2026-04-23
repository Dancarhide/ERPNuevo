import React, { useEffect, useState, useCallback } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    FaUsers, FaMoneyBillWave, FaCalendarCheck, FaBriefcase,
    FaChartLine, FaSpinner, FaSyncAlt, FaExclamationTriangle
} from 'react-icons/fa';
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
    // Ad-hoc theme colors (Stratia)
    theme1: '#44474A', // Stratia Black
    theme2: '#A7313A', // Stratia Red
    theme3: '#858789', // Stratia Gray
    theme4: '#8F2930', // Stratia Red Dark
    theme5: '#5A5D60', // Lighter Stratia Black
    theme6: '#C24D56', // Lighter Stratia Red
    theme7: '#A4A4A4', // Light Gray
    theme8: '#2E3134', // Darker Stratia Black
};

const AREA_COLORS  = [PALETTE.theme2, PALETTE.theme4, PALETTE.theme6, PALETTE.theme8, PALETTE.theme3, PALETTE.theme5, PALETTE.theme7];
const ROL_COLORS   = [PALETTE.theme1, PALETTE.theme2, PALETTE.theme4, PALETTE.theme6, PALETTE.theme8, PALETTE.theme3, PALETTE.theme7];
const VAC_COLORS   = { Pendiente: PALETTE.warning, Aprobado: PALETTE.success, Rechazado: PALETTE.danger };
const INC_COLORS   = [PALETTE.danger, PALETTE.warning, PALETTE.orange, PALETTE.purple, PALETTE.gray];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    color: string;
    trend?: 'up' | 'down' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ label, value, sub, icon, color, trend }) => (
    <div className="kpi-card" style={{ borderTopColor: color }}>
        <div className="kpi-card-icon" style={{ background: `${color}18`, color }}>
            {icon}
        </div>
        <div className="kpi-card-body">
            <span className="kpi-card-label">{label}</span>
            <span className="kpi-card-value" style={{ color }}>{value}</span>
            {sub && (
                <span className={`kpi-card-sub ${trend ?? ''}`}>{sub}</span>
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

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="kpi-loading">
            <FaSpinner className="kpi-spinner" />
            <p>Calculando indicadores...</p>
        </div>
    );

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error || !data) return (
        <div className="kpi-error">
            <FaExclamationTriangle />
            <p>{error ?? 'Sin datos'}</p>
            <button className="kpi-btn-retry" onClick={fetchKPIs}>Reintentar</button>
        </div>
    );

    const { resumen } = data;

    // ── Tarjetas ejecutivas ───────────────────────────────────────────────────
    const tarjetas: KPICardProps[] = [
        {
            label: 'Empleados Activos',
            value: resumen.totalActivos,
            sub: `${resumen.headcount['Inactivo'] ?? 0} inactivos · ${resumen.headcount['Vacaciones'] ?? 0} en vacaciones`,
            icon: <FaUsers />, color: PALETTE.primary, trend: 'neutral',
        },
        {
            label: 'Nómina Mensual',
            value: fmt(resumen.nominaMesActual),
            sub: 'Total bruto del periodo',
            icon: <FaMoneyBillWave />, color: PALETTE.success, trend: 'neutral',
        },
        {
            label: 'Tasa de Ausentismo',
            value: `${resumen.tasaAusentismo}%`,
            sub: 'Empleados en vacaciones / activos',
            icon: <FaCalendarCheck />,
            color: resumen.tasaAusentismo > 15 ? PALETTE.danger : resumen.tasaAusentismo > 8 ? PALETTE.warning : PALETTE.teal,
            trend: resumen.tasaAusentismo > 15 ? 'up' : 'down',
        },
        {
            label: 'Vacantes Abiertas',
            value: resumen.totalVacantesAbiertas,
            sub: `${data.reclutamiento.totalCandidatos} candidatos en pipeline`,
            icon: <FaBriefcase />,
            color: resumen.totalVacantesAbiertas > 5 ? PALETTE.warning : PALETTE.info,
            trend: 'neutral',
        },
    ];

    return (
        <div className="kpi-container">
            {/* Header */}
            <div className="kpi-header">
                <div>
                    <h1><FaChartLine /> KPIs & Indicadores</h1>
                    <p>Panel ejecutivo de métricas de capital humano en tiempo real.</p>
                </div>
                <button className="kpi-btn-refresh" onClick={fetchKPIs} title="Actualizar datos">
                    <FaSyncAlt /> Actualizar
                </button>
            </div>

            {/* Tarjetas KPI */}
            <div className="kpi-cards-grid">
                {tarjetas.map((t, i) => <KPICard key={i} {...t} />)}
            </div>

            {/* Tabs de sección */}
            <div className="kpi-tabs">
                {(['operativo', 'nomina', 'talento'] as const).map(t => (
                    <button
                        key={t}
                        className={`kpi-tab ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t === 'operativo' ? '📊 Capital Humano'
                         : t === 'nomina' ? '💰 Nómina'
                         : '🎯 Reclutamiento'}
                    </button>
                ))}
            </div>

            {/* ── Tab: Capital Humano ── */}
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
                                    labelLine={true}
                                >
                                    {data.headcountPorRol.map((_, i) => (
                                        <Cell key={i} fill={ROL_COLORS[i % ROL_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel title="Antigüedad del Personal" subtitle="Distribución del tiempo de permanencia">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={data.antiguedad}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="rango" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltipCurrency />} />
                                <Bar dataKey="count" name="Empleados" fill={PALETTE.purple} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel title="Solicitudes de Vacaciones" subtitle="Total histórico por estatus">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={data.vacaciones}
                                    dataKey="total"
                                    nameKey="estatus"
                                    cx="50%" cy="50%"
                                    innerRadius={45}
                                    outerRadius={75}
                                    paddingAngle={3}
                                >
                                    {data.vacaciones.map((v, i) => (
                                        <Cell
                                            key={i}
                                            fill={(VAC_COLORS as any)[v.estatus] ?? PALETTE.gray}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val, name) => [val, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    {data.incidencias.length > 0 && (
                        <ChartPanel title="Incidencias por Tipo" subtitle="Últimos 3 meses">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={data.incidencias}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltipCurrency />} />
                                    <Bar dataKey="total" name="Incidencias" radius={[4, 4, 0, 0]}>
                                        {data.incidencias.map((_, i) => (
                                            <Cell key={i} fill={INC_COLORS[i % INC_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartPanel>
                    )}

                    <ChartPanel title="Contrataciones por Mes" subtitle="Altas de empleados en los últimos 12 meses">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={data.tendenciaContrataciones}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltipCurrency />} />
                                <Line
                                    type="monotone" dataKey="total" name="Contrataciones"
                                    stroke={PALETTE.teal} strokeWidth={2.5}
                                    dot={{ r: 4, fill: PALETTE.teal }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                </div>
            )}

            {/* ── Tab: Nómina ── */}
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
                                <Line
                                    type="monotone" dataKey="promedio" name="Promedio por Empleado"
                                    stroke={PALETTE.info} strokeWidth={2} strokeDasharray="5 5"
                                    dot={{ r: 4, fill: PALETTE.info }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel title="Costo Nómina por Área" subtitle="Distribución del gasto en el mes actual">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.nominaPorArea} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="area" tick={{ fontSize: 11 }} width={130} />
                                <Tooltip content={<CustomTooltipCurrency />} />
                                <Bar dataKey="total" name="Total Nómina" radius={[0, 4, 4, 0]}>
                                    {data.nominaPorArea.map((_, i) => (
                                        <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel title="Empleados en Nómina por Mes" subtitle="Headcount incluido en cada periodo de pago">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data.tendenciaNomina}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltipCurrency />} />
                                <Bar dataKey="empleados" name="Empleados" fill={PALETTE.purple} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                </div>
            )}

            {/* ── Tab: Reclutamiento ── */}
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

                    <ChartPanel title="Candidatos por Estatus" subtitle="Embudo de reclutamiento actual">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.reclutamiento.candidatos}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="estatus" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltipCurrency />} />
                                <Bar dataKey="total" name="Candidatos" radius={[4, 4, 0, 0]}>
                                    {data.reclutamiento.candidatos.map((_, i) => (
                                        <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    {/* Tarjetas de resumen de reclutamiento */}
                    <div className="kpi-recruit-summary">
                        <div className="kpi-recruit-card">
                            <span className="kpi-recruit-num" style={{ color: PALETTE.warning }}>
                                {data.reclutamiento.totalVacantesAbiertas}
                            </span>
                            <span className="kpi-recruit-label">Vacantes Abiertas</span>
                        </div>
                        <div className="kpi-recruit-card">
                            <span className="kpi-recruit-num" style={{ color: PALETTE.primary }}>
                                {data.reclutamiento.totalCandidatos}
                            </span>
                            <span className="kpi-recruit-label">Candidatos Totales</span>
                        </div>
                        <div className="kpi-recruit-card">
                            <span className="kpi-recruit-num" style={{ color: PALETTE.success }}>
                                {data.reclutamiento.candidatos.find(c => c.estatus === 'Contratado')?.total ?? 0}
                            </span>
                            <span className="kpi-recruit-label">Contratados</span>
                        </div>
                        <div className="kpi-recruit-card">
                            <span className="kpi-recruit-num" style={{ color: PALETTE.teal }}>
                                {data.reclutamiento.totalCandidatos > 0
                                    ? `${(((data.reclutamiento.candidatos.find(c => c.estatus === 'Contratado')?.total ?? 0) / data.reclutamiento.totalCandidatos) * 100).toFixed(1)}%`
                                    : '—'}
                            </span>
                            <span className="kpi-recruit-label">Tasa de Conversión</span>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default KPIs;



