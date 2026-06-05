import React, { useEffect, useState } from 'react';
import {
    FaUsers, FaCalendarAlt, FaBriefcase, FaMoneyBillWave,
    FaShieldAlt, FaUserPlus, FaExclamationTriangle, FaCheckCircle,
    FaClock, FaTimesCircle
} from 'react-icons/fa';
import client from '../api/client';
import './styles/Dashboard.css';

interface DashboardStats {
    empleadosActivos: number;
    vacacionesPendientes: number;
    vacantesAbiertas: number;
    nominaMesActual: number;
    actividadReciente: {
        tipo: string;
        descripcion: string;
        estatus: string;
        fecha: string;
    }[];
}

const estatusBadge = (estatus: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
        'Pendiente':    { color: '#f59e0b', icon: <FaClock /> },
        'Aprobado':     { color: '#10b981', icon: <FaCheckCircle /> },
        'Rechazado':    { color: '#ef4444', icon: <FaTimesCircle /> },
        'En Revisión':  { color: '#6366f1', icon: <FaClock /> },
        'Resuelto':     { color: '#10b981', icon: <FaCheckCircle /> },
        'Archivado':    { color: '#858789', icon: <FaTimesCircle /> },
    };
    const entry = map[estatus] || { color: '#858789', icon: null };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem',
            fontWeight: 600, background: entry.color + '22', color: entry.color
        }}>
            {entry.icon} {estatus}
        </span>
    );
};

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const Home: React.FC = () => {
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const userName = userData?.nombre || 'Administrador';

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        client.get('/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(() => setError('No se pudieron cargar los datos del dashboard'))
            .finally(() => setLoading(false));
    }, []);

    const kpis = stats ? [
        {
            label: 'Empleados Activos',
            value: stats.empleadosActivos,
            icon: <FaUsers />,
            color: '#3b82f6'
        },
        {
            label: 'Vacaciones Pendientes',
            value: stats.vacacionesPendientes,
            icon: <FaCalendarAlt />,
            color: '#f59e0b'
        },
        {
            label: 'Vacantes Abiertas',
            value: stats.vacantesAbiertas,
            icon: <FaBriefcase />,
            color: '#10b981'
        },
        {
            label: 'Nómina (Este Mes)',
            value: formatCurrency(stats.nominaMesActual),
            icon: <FaMoneyBillWave />,
            color: '#A7313A'
        }
    ] : [];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Bienvenido, <strong>{userName}</strong>. Aquí está el resumen operativo.</p>
            </div>

            {/* KPI Cards */}
            {loading ? (
                <div className="dashboard-loading">
                    <div className="spinner" />
                    <p>Cargando datos...</p>
                </div>
            ) : error ? (
                <div className="dashboard-error">{error}</div>
            ) : (
                <>
                    <div className="stats-grid">
                        {kpis.map((kpi, i) => (
                            <div className="stat-card" key={i} style={{ color: kpi.color }}>
                                <div className="stat-icon" style={{ background: `${kpi.color}15` }}>
                                    {kpi.icon}
                                </div>
                                <div className="stat-info">
                                    <h3>{kpi.label}</h3>
                                    <p className="stat-value">{kpi.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Talent Hub */}
                    <div className="dashboard-section-title">
                        <h2>Centro de Talento</h2>
                        <p>Accesos rápidos a los módulos principales.</p>
                    </div>

                    <div className="talent-hub-grid">
                        <div className="talent-card" onClick={() => window.location.href = '/estructura'}>
                            <div className="talent-card-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><FaShieldAlt /></div>
                            <div className="talent-card-info">
                                <h4>Estructura Organizativa</h4>
                                <p>Auditoría de staff y control de puestos.</p>
                            </div>
                        </div>
                        <div className="talent-card" onClick={() => window.location.href = '/cyi'}>
                            <div className="talent-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}><FaUserPlus /></div>
                            <div className="talent-card-info">
                                <h4>Captación e Inducción</h4>
                                <p>Ver procesos de reclutamiento activos.</p>
                            </div>
                        </div>
                        <div className="talent-card" onClick={() => window.location.href = '/incidencias'}>
                            <div className="talent-card-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><FaExclamationTriangle /></div>
                            <div className="talent-card-info">
                                <h4>Incidencias</h4>
                                <p>{stats!.vacacionesPendientes > 0 ? `${stats!.vacacionesPendientes} solicitudes pendientes` : 'Sin pendientes'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="dashboard-content-grid">
                        <div className="dashboard-panel">
                            <h2>Actividad Reciente</h2>
                            {stats!.actividadReciente.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                                    Sin actividad reciente
                                </p>
                            ) : (
                                <ul className="activity-list">
                                    {stats!.actividadReciente.map((item, i) => (
                                        <li className="activity-item" key={i}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <span className="activity-desc">{item.descripcion}</span>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    {estatusBadge(item.estatus)}
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        background: item.tipo === 'vacacion' ? '#e0f2fe' : '#fee2e2',
                                                        color: item.tipo === 'vacacion' ? '#0369a1' : '#b91c1c',
                                                        padding: '1px 8px', borderRadius: 10, fontWeight: 600
                                                    }}>
                                                        {item.tipo === 'vacacion' ? 'Vacación' : 'Incidencia'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="activity-time">{formatDate(item.fecha)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="dashboard-panel">
                            <h2>Resumen Rápido</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Empleados activos', val: stats!.empleadosActivos, color: '#6366f1' },
                                    { label: 'Aprobaciones pendientes', val: stats!.vacacionesPendientes, color: '#f59e0b' },
                                    { label: 'Posiciones abiertas', val: stats!.vacantesAbiertas, color: '#10b981' },
                                ].map((row, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--color-bg-light)' }}>
                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{row.label}</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.4rem', color: row.color }}>{row.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
