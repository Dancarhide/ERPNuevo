import React, { useEffect, useState } from 'react';
import { 
    FaPollH, FaChartPie, FaToggleOn, FaToggleOff, 
    FaUsers, FaStar, FaExclamationCircle, FaFileDownload, 
    FaSync, FaSpinner, FaPaperPlane, FaArrowRight, FaArrowLeft
} from 'react-icons/fa';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import './styles/Dashboard.css';

interface ClimateStats {
    total_responses: number;
    averages: {
        orientacion_org: number;
        admin_talento: number;
        estilo_direccion: number;
        comunicacion_int: number;
        trabajo_equipo: number;
        capacidad_prof: number;
    };
}

const SurveyAdmin: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({
        expediente_active: false,
        clima_active: false
    });
    const [activeTab, setActiveTab] = useState<'clima' | 'expediente'>('clima');
    const [stats, setStats] = useState<ClimateStats | null>(null);
    const [responsesList, setResponsesList] = useState<any[]>([]);
    const [expedienteStats, setExpedienteStats] = useState<{ total: number, completed: number, pending: number }>({ total: 0, completed: 0, pending: 0 });

    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const token = sessionData?.token;
    const host = window.location.hostname;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configRes, statsRes, expRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/config`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/admin/expediente-stats`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (configRes.ok) {
                const configData = await configRes.json();
                setConfig(configData);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
                // We use the responses already included in statsData
                if (statsData.responses) {
                    setResponsesList(statsData.responses);
                }
            }

            if (expRes.ok) {
                const expData = await expRes.json();
                setExpedienteStats(expData);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: string, currentValue: boolean) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/admin/toggle`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key, value: !currentValue })
            });

            if (res.ok) {
                setConfig(prev => ({ ...prev, [key]: !currentValue }));
            }
        } catch (error) {
            console.error('Error toggling survey:', error);
        }
    };

    // Prepare data for the Radar Chart
    const radarData = stats ? [
        { subject: 'Orientación Org.', A: stats.averages.orientacion_org, fullMark: 5 },
        { subject: 'Talento', A: stats.averages.admin_talento, fullMark: 5 },
        { subject: 'Dirección', A: stats.averages.estilo_direccion, fullMark: 5 },
        { subject: 'Comunicación', A: stats.averages.comunicacion_int, fullMark: 5 },
        { subject: 'Trabajo Equipo', A: stats.averages.trabajo_equipo, fullMark: 5 },
        { subject: 'Capacidad Prof.', A: stats.averages.capacidad_prof, fullMark: 5 },
    ] : [];

    // Prepare data for the Bar Chart
    const barData = stats ? Object.entries(stats.averages).map(([key, val]) => ({
        name: key.replace('_', ' ').toUpperCase(),
        Puntaje: val
    })) : [];

    if (loading && !stats) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
            <FaSpinner className="spin" style={{ fontSize: '3rem', color: '#A7313A' }} />
            <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600 }}>Cargando panel de RH...</p>
        </div>
    );

    return (
        <div className="survey-admin-container" style={{ padding: '30px' }}>
            <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#44474A' }}>Panel de Encuestas RH</h1>
                    <p style={{ color: '#858789' }}>Administración de campañas y análisis de resultados</p>
                </div>
                <div className="admin-controls" style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn-modern outline" onClick={fetchData}><FaSync /> Actualizar</button>
                    
                    {/* E-Expediente Toggle */}
                    <div 
                        onClick={() => handleToggle('expediente_active', config.expediente_active)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '10px 18px', 
                            borderRadius: '12px', 
                            background: config.expediente_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${config.expediente_active ? '#10b981' : '#ef4444'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        title="Activar/Desactivar llenado de Expediente Digital"
                    >
                        {config.expediente_active ? <FaToggleOn style={{ color: '#10b981' }} /> : <FaToggleOff style={{ color: '#ef4444' }} />}
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: config.expediente_active ? '#10b981' : '#ef4444' }}>
                            E-EXPEDIENTE
                        </span>
                    </div>

                    {/* Clima Laboral Toggle */}
                    <div 
                        onClick={() => handleToggle('clima_active', config.clima_active)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '10px 18px', 
                            borderRadius: '12px', 
                            background: config.clima_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${config.clima_active ? '#10b981' : '#ef4444'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        title="Activar/Desactivar Encuesta de Clima Laboral"
                    >
                        {config.clima_active ? <FaToggleOn style={{ color: '#10b981' }} /> : <FaToggleOff style={{ color: '#ef4444' }} />}
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: config.clima_active ? '#10b981' : '#ef4444' }}>
                            CLIMA LABORAL
                        </span>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="admin-tabs" style={{ display: 'flex', gap: '30px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0' }}>
                <button 
                    onClick={() => setActiveTab('clima')}
                    style={{ 
                        padding: '10px 20px', 
                        border: 'none', 
                        background: 'none', 
                        fontSize: '1rem', 
                        fontWeight: activeTab === 'clima' ? 800 : 500,
                        color: activeTab === 'clima' ? '#A7313A' : '#64748b',
                        borderBottom: activeTab === 'clima' ? '4px solid #A7313A' : 'none',
                        cursor: 'pointer',
                        transition: '0.2s'
                    }}
                >
                    <FaChartPie /> Resultados Clima Laboral
                </button>
                <button 
                    onClick={() => setActiveTab('expediente')}
                    style={{ 
                        padding: '10px 20px', 
                        border: 'none', 
                        background: 'none', 
                        fontSize: '1rem', 
                        fontWeight: activeTab === 'expediente' ? 800 : 500,
                        color: activeTab === 'expediente' ? '#A7313A' : '#64748b',
                        borderBottom: activeTab === 'expediente' ? '4px solid #A7313A' : 'none',
                        cursor: 'pointer',
                        transition: '0.2s'
                    }}
                >
                    <FaUsers /> Seguimiento E-Expediente
                </button>
            </div>

            {/* Metrics Row */}
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="kpi-card">
                    <div className="kpi-content">
                        <p>Respuestas Totales</p>
                        <h3>{stats? stats.total_responses : 0}</h3>
                    </div>
                    <div className="kpi-icon"><FaUsers /></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-content">
                        <p>Estado Global</p>
                        <h3>{stats?.total_responses && stats.total_responses > 0 ? 'Activo' : 'Sin Datos'}</h3>
                    </div>
                    <div className="kpi-icon"><FaPollH /></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-content">
                        <p>Alerta Clima</p>
                        <h3>Saludable</h3>
                    </div>
                    <div className="kpi-icon"><FaExclamationCircle /></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-content">
                        <p>Último Registro</p>
                        <h3 style={{ fontSize: '1.1rem' }}>{responsesList[0] ? new Date(responsesList[0].fecha).toLocaleDateString() : 'N/A'}</h3>
                    </div>
                    <div className="kpi-icon"><FaStar /></div>
                </div>
            </div>

            {activeTab === 'clima' ? (
                <>
                    <div className="charts-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaChartPie /> Perfil de Clima Organizacional</h3>
                            <div style={{ height: '400px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                        <Radar
                                            name="Actual"
                                            dataKey="A"
                                            stroke="#A7313A"
                                            fill="#A7313A"
                                            fillOpacity={0.6}
                                        />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaPollH /> Detalle por Categoría</h3>
                            <div style={{ height: '400px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={10} />
                                        <YAxis domain={[0, 5]} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Puntaje" fill="#A7313A" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="results-table-card" style={{ marginTop: '30px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#44474A' }}>Explorador de Respuestas Detalladas (Clima)</h3>
                            <button className="btn-modern accent"><FaFileDownload /> Exportar Excel</button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="employees-table">
                                <thead>
                                    <tr>
                                        <th>FECHA</th>
                                        <th>COLABORADOR</th>
                                        <th>NIVEL</th>
                                        <th>UBICACIÓN</th>
                                        <th>ANTIGÜEDAD</th>
                                        <th>CALIF. PROMEDIO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responsesList.map((resp, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td>{new Date(resp.fecha).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 700 }}>{resp.colaborador}</td>
                                            <td><span className="badge-puesto">{resp.nivel_jerarquico}</span></td>
                                            <td>{resp.ubicacion}</td>
                                            <td>{resp.antiguedad}</td>
                                            <td style={{ fontWeight: 800 }}>
                                                <span style={{ color: '#A7313A' }}>{resp.promedio.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {responsesList.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '80px 40px', color: '#858789' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                                    <FaPollH style={{ fontSize: '3rem', opacity: 0.2 }} />
                                                    <p>Sin respuestas de clima todavía.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="expediente-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                        <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '20px' }}>Progreso de Recolección</h3>
                            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                <div style={{ fontSize: '4rem', fontWeight: 900, color: '#A7313A' }}>
                                    {Math.round((expedienteStats.completed / (expedienteStats.total || 1)) * 100)}%
                                </div>
                                <p style={{ color: '#858789', fontSize: '1.2rem' }}>Expedientes Completos</p>
                            </div>
                            <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span>Total Empleados:</span> <strong>{expedienteStats.total}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', color: '#10b981' }}>
                                    <span>Perfiles Listos:</span> <strong>{expedienteStats.completed}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', color: '#ef4444' }}>
                                    <span>Perfiles Incompletos:</span> <strong>{expedienteStats.pending}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '20px' }}>Próximos Pasos Recomendados</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', borderLeft: '4px solid #A7313A' }}>
                                    <h4 style={{ margin: '0 0 5px 0' }}>Enviar Recordatorio General</h4>
                                    <p style={{ margin: 0, color: '#64748b' }}>Notificar a los epleados que aún no terminan su expediente.</p>
                                </div>
                                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                                    <h4 style={{ margin: '0 0 5px 0' }}>Descarga Masiva de Datos</h4>
                                    <p style={{ margin: 0, color: '#64748b' }}>Exportar la base de datos actualizada para el reporte anual de RH.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="results-table-card" style={{ marginTop: '30px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#44474A' }}>Audit de Expediente Digital</h3>
                            <button className="btn-modern accent"><FaUsers /> Ver Todos</button>
                        </div>
                        <p style={{ color: '#858789' }}>Actualmente hay <strong>{expedienteStats.completed}</strong> expedientes validados y <strong>{expedienteStats.pending}</strong> pendientes de revisión.</p>
                    </div>
                </>
            )}
            
            <style>{`
                .employees-table { width: 100%; border-collapse: collapse; }
                .employees-table th { text-align: left; padding: 15px; color: #858789; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
                .employees-table td { padding: 18px 15px; font-size: 0.95rem; color: #44474A; }
                .employees-table tr:hover { background: #f8fafc; }
                .badge-puesto { background: #f1f5f9; color: #44474A; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; }
                .btn-modern { cursor: pointer; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
                .btn-modern.outline { background: white; border: 1px solid #e2e8f0; color: #64748b; }
                .btn-modern.accent { background: #A7313A; color: white; }
                .btn-modern:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .kpi-card { background: white; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: all 0.2s; }
                .kpi-card:hover { transform: translateY(-3px); border-color: #A7313A; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
                .kpi-content p { margin: 0; font-size: 0.85rem; color: #858789; font-weight: 600; }
                .kpi-content h3 { margin: 5px 0 0 0; font-size: 2rem; font-weight: 800; color: #A7313A; }
                .kpi-icon { font-size: 2.2rem; color: #A7313A; opacity: 0.15; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default SurveyAdmin;
