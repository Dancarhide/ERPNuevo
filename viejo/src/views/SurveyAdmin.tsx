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
        <div className="survey-admin-container">
            <div className="admin-header">
                <div className="header-text">
                    <h1>Panel de Encuestas RH</h1>
                    <p>Administración de campañas y análisis de resultados</p>
                </div>
                <div className="admin-controls">
                    <button className="btn-modern outline" onClick={fetchData}><FaSync /> Actualizar</button>
                    
                    <div className="toggle-group">
                        {/* E-Expediente Toggle */}
                        <div 
                            className={`toggle-pill ${config.expediente_active ? 'active' : 'inactive'}`}
                            onClick={() => handleToggle('expediente_active', config.expediente_active)}
                            title="Activar/Desactivar llenado de Expediente Digital"
                        >
                            {config.expediente_active ? <FaToggleOn /> : <FaToggleOff />}
                            <span>E-EXPEDIENTE</span>
                        </div>

                        {/* Clima Laboral Toggle */}
                        <div 
                            className={`toggle-pill ${config.clima_active ? 'active' : 'inactive'}`}
                            onClick={() => handleToggle('clima_active', config.clima_active)}
                            title="Activar/Desactivar Encuesta de Clima Laboral"
                        >
                            {config.clima_active ? <FaToggleOn /> : <FaToggleOff />}
                            <span>CLIMA LABORAL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="admin-tabs">
                <button 
                    onClick={() => setActiveTab('clima')}
                    className={`tab-btn ${activeTab === 'clima' ? 'active' : ''}`}
                >
                    <FaChartPie /> <span>Resultados Clima</span>
                </button>
                <button 
                    onClick={() => setActiveTab('expediente')}
                    className={`tab-btn ${activeTab === 'expediente' ? 'active' : ''}`}
                >
                    <FaUsers /> <span>E-Expediente</span>
                </button>
            </div>

            {/* Metrics Row */}
            <div className="metrics-grid">
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
                        <h3 className="date-kpi">{responsesList[0] ? new Date(responsesList[0].fecha).toLocaleDateString() : 'N/A'}</h3>
                    </div>
                    <div className="kpi-icon"><FaStar /></div>
                </div>
            </div>

            {activeTab === 'clima' ? (
                <>
                    <div className="charts-main-grid">
                        <div className="admin-card chart-card">
                            <h3 className="card-title"><FaChartPie /> Perfil de Clima Organizacional</h3>
                            <div className="chart-container">
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

                        <div className="admin-card chart-card">
                            <h3 className="card-title"><FaPollH /> Detalle por Categoría</h3>
                            <div className="chart-container">
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

                    <div className="results-table-card">
                        <div className="card-header-flex">
                            <h3>Explorador de Respuestas</h3>
                            <button className="btn-modern accent"><FaFileDownload /> Exportar</button>
                        </div>
                        <div className="table-responsive-wrap">
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
                                        <tr key={idx}>
                                            <td data-label="FECHA">{new Date(resp.fecha).toLocaleDateString()}</td>
                                            <td data-label="COLABORADOR" className="bold">{resp.colaborador}</td>
                                            <td data-label="NIVEL"><span className="badge-puesto">{resp.nivel_jerarquico}</span></td>
                                            <td data-label="UBICACIÓN">{resp.ubicacion}</td>
                                            <td data-label="ANTIGÜEDAD">{resp.antiguedad}</td>
                                            <td data-label="CALIF. PROMEDIO" className="accent-bold">
                                                <span>{resp.promedio.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {responsesList.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="empty-table">
                                                <FaPollH className="empty-icon" />
                                                <p>Sin respuestas de clima todavía.</p>
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
                    <div className="expediente-stats-grid">
                        <div className="admin-card stats-mini">
                            <h3 className="card-title">Progreso de Recolección</h3>
                            <div className="progress-big">
                                <div className="percent">
                                    {Math.round((expedienteStats.completed / (expedienteStats.total || 1)) * 100)}%
                                </div>
                                <p>Expedientes Completos</p>
                            </div>
                            <div className="stats-breakdown">
                                <div className="stat-row">
                                    <span>Total Empleados:</span> <strong>{expedienteStats.total}</strong>
                                </div>
                                <div className="stat-row ready">
                                    <span>Perfiles Listos:</span> <strong>{expedienteStats.completed}</strong>
                                </div>
                                <div className="stat-row pending">
                                    <span>Perfiles Incompletos:</span> <strong>{expedienteStats.pending}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <div className="admin-card recommend-card">
                            <h3 className="card-title">Próximos Pasos Recomendados</h3>
                            <div className="steps-stack">
                                <div className="step-item danger">
                                    <h4>Enviar Recordatorio General</h4>
                                    <p>Notificar a los empleados que aún no terminan su expediente.</p>
                                </div>
                                <div className="step-item success">
                                    <h4>Descarga Masiva de Datos</h4>
                                    <p>Exportar la base de datos actualizada para el reporte anual de RH.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="results-table-card">
                        <div className="card-header-flex">
                            <h3>Audit de Expediente Digital</h3>
                            <button className="btn-modern accent"><FaUsers /> Ver Todos</button>
                        </div>
                        <p className="audit-info">Actualmente hay <strong>{expedienteStats.completed}</strong> expedientes validados y <strong>{expedienteStats.pending}</strong> pendientes de revisión.</p>
                    </div>
                </>
            )}
            
            <style>{`
                .survey-admin-container { padding: 30px; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; gap: 20px; flex-wrap: wrap; }
                .header-text h1 { margin: 0; font-size: 2rem; font-weight: 800; color: #1e293b; }
                .header-text p { margin: 5px 0 0 0; color: #64748b; }
                
                .admin-controls { display: flex; gap: 15px; flex-wrap: wrap; }
                .toggle-group { display: flex; gap: 10px; flex-wrap: wrap; }
                
                .toggle-pill { 
                    display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid; font-weight: 800; font-size: 0.75rem; 
                }
                .toggle-pill.active { background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981; }
                .toggle-pill.inactive { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }
                
                .admin-tabs { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; overflow-x: auto; scrollbar-width: none; }
                .admin-tabs::-webkit-scrollbar { display: none; }
                .tab-btn { padding: 12px 20px; border: none; background: none; font-size: 0.9rem; font-weight: 500; color: #64748b; cursor: pointer; white-space: nowrap; transition: 0.2s; border-bottom: 3px solid transparent; display: flex; align-items: center; gap: 8px; }
                .tab-btn.active { color: #A7313A; border-bottom-color: #A7313A; font-weight: 800; }
                
                .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .kpi-card { background: white; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: all 0.2s; }
                .kpi-card:hover { transform: translateY(-3px); border-color: #A7313A; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
                .kpi-content p { margin: 0; font-size: 0.85rem; color: #858789; font-weight: 600; }
                .kpi-content h3 { margin: 5px 0 0 0; font-size: 1.8rem; font-weight: 800; color: #1e293b; }
                .kpi-content .date-kpi { font-size: 1.1rem; }
                .kpi-icon { font-size: 2.2rem; color: #A7313A; opacity: 0.15; }

                .charts-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
                .admin-card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
                .card-title { margin: 0 0 20px 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 10px; }
                .chart-container { height: 350px; width: 100%; }

                .results-table-card { margin-top: 30px; background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
                .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px; }
                .card-header-flex h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b; }

                .employees-table { width: 100%; border-collapse: collapse; }
                .employees-table th { text-align: left; padding: 15px; color: #64748b; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
                .employees-table td { padding: 15px; font-size: 0.9rem; color: #334155; }
                .employees-table tr:hover { background: #f8fafc; }
                .employees-table .bold { font-weight: 700; color: #1e293b; }
                .employees-table .accent-bold { font-weight: 800; color: #A7313A; }
                .badge-puesto { background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
                
                .btn-modern { cursor: pointer; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: 0.2s; font-size: 0.85rem; }
                .btn-modern.outline { background: white; border: 1px solid #e2e8f0; color: #64748b; }
                .btn-modern.accent { background: #A7313A; color: white; }
                .btn-modern:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

                .expediente-stats-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }
                .progress-big { text-align: center; margin: 30px 0; }
                .progress-big .percent { fontSize: 3.5rem; fontWeight: 900; color: #A7313A; line-height: 1; }
                .progress-big p { margin: 5px 0 0 0; color: #64748b; font-weight: 600; }
                
                .stats-breakdown { display: flex; flexDirection: column; gap: 10px; }
                .stat-row { display: flex; justify-content: space-between; padding: 12px 15px; background: #f8fafc; border-radius: 12px; font-size: 0.9rem; }
                .stat-row.ready { background: rgba(16, 185, 129, 0.05); color: #059669; }
                .stat-row.pending { background: rgba(239, 68, 68, 0.05); color: #dc2626; }
                
                .steps-stack { display: flex; flex-direction: column; gap: 15px; }
                .step-item { padding: 18px; border: 1px solid #e2e8f0; border-radius: 15px; border-left-width: 6px; }
                .step-item.danger { border-left-color: #A7313A; background: #fffafb; }
                .step-item.success { border-left-color: #10b981; background: #f9fffb; }
                .step-item h4 { margin: 0 0 5px 0; font-size: 1rem; color: #1e293b; }
                .step-item p { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }

                .empty-table { text-align: center; padding: 60px 20px !important; color: #94a3b8; }
                .empty-icon { font-size: 3rem; opacity: 0.2; margin-bottom: 10px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                    .charts-main-grid, .expediente-stats-grid { grid-template-columns: 1fr; }
                    .survey-admin-container { padding: 20px; }
                }

                @media (max-width: 768px) {
                    .admin-header { flex-direction: column; align-items: flex-start; }
                    .admin-controls, .toggle-group { width: 100%; }
                    .btn-modern, .toggle-pill { flex: 1; justify-content: center; }
                    
                    .employees-table thead { display: none; }
                    .employees-table tr { display: block; background: #fff; border: 1px solid #f1f5f9; border-radius: 15px; margin-bottom: 15px; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                    .employees-table td { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #f8fafc; text-align: right; }
                    .employees-table td:last-child { border-bottom: none; }
                    .employees-table td::before { content: attr(data-label); font-weight: 800; color: #94a3b8; text-transform: uppercase; font-size: 0.65rem; text-align: left; }
                    
                    .tab-btn span { display: block; }
                    .header-text h1 { font-size: 1.5rem; }
                }
            `}</style>
        </div>
    );
};

export default SurveyAdmin;
