import React, { useState, useEffect } from 'react';
import { FaCalendarPlus, FaTrash, FaSpinner, FaSave, FaExclamationCircle, FaUsers, FaBuilding, FaGlobe } from 'react-icons/fa';
import client from '../api/client';
import './styles/Vacations.css';

interface Evento {
    id: number;
    titulo: string;
    descripcion: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    hora_inicio: string | null;
    hora_fin: string | null;
    tipo: string;
    color: string;
    target_type: string | null;
    idarea_target: number | null;
}

interface Area {
    idarea: number;
    nombre_area: string;
}

interface Empleado {
    idempleado: number;
    nombre_completo_empleado: string;
}

const EventAdmin: React.FC = () => {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        hora_inicio: '',
        hora_fin: '',
        tipo: 'Evento',
        color: '#A7313A',
        target_type: 'TODOS',
        idarea_target: '',
        empleados_target: [] as number[]
    });

    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [resEv, resAr, resEmp] = await Promise.all([
                client.get('/eventos'),
                client.get('/areas'),
                client.get('/empleados')
            ]);
            setEventos(resEv.data);
            setAreas(resAr.data);
            setEmpleados(resEmp.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmployeeToggle = (id: number) => {
        setFormData(prev => {
            const current = [...prev.empleados_target];
            if (current.includes(id)) {
                return { ...prev, empleados_target: current.filter(cid => cid !== id) };
            } else {
                return { ...prev, empleados_target: [...current, id] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await client.post('/eventos', {
                ...formData,
                creado_por: userData?.idempleado
            });
            setFormData({
                titulo: '',
                descripcion: '',
                fecha_inicio: '',
                fecha_fin: '',
                hora_inicio: '',
                hora_fin: '',
                tipo: 'Evento',
                color: '#A7313A',
                target_type: 'TODOS',
                idarea_target: '',
                empleados_target: []
            });
            const res = await client.get('/eventos');
            setEventos(res.data);
        } catch (error) {
            console.error('Error creating evento:', error);
            alert('Error al crear el evento');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
        try {
            await client.delete(`/eventos/${id}`);
            const res = await client.get('/eventos');
            setEventos(res.data);
        } catch (error) {
            console.error('Error deleting evento:', error);
            alert('Error al eliminar');
        }
    };

    return (
        <div className="vacations-container event-admin-page">
            <header className="vacations-header">
                <div className="header-text">
                    <h1>Administración de Eventos</h1>
                    <p>Gestiona el calendario corporativo con segmentación avanzada.</p>
                </div>
            </header>

            <div className="admin-grid">
                {/* Form Section */}
                <div className="admin-card form-card">
                    <h3 className="card-title">
                        <FaCalendarPlus style={{ color: 'var(--color-accent)' }} /> Nuevo Evento
                    </h3>
                    <form onSubmit={handleSubmit} className="admin-form-clean">
                        <div className="form-group-clean">
                            <label>Título del Evento</label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleFormChange}
                                required
                                placeholder="Ej: Junta de Capacitación"
                            />
                        </div>

                        <div className="form-row-2col">
                            <div className="form-group-clean">
                                <label>Fecha Inicio</label>
                                <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group-clean">
                                <label>Fecha Fin</label>
                                <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleFormChange} required />
                            </div>
                        </div>

                        <div className="form-row-2col">
                            <div className="form-group-clean">
                                <label>Hora Inicio</label>
                                <input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleFormChange} />
                            </div>
                            <div className="form-group-clean">
                                <label>Hora Fin</label>
                                <input type="time" name="hora_fin" value={formData.hora_fin} onChange={handleFormChange} />
                            </div>
                        </div>

                        <div className="form-row-2col special-border">
                            <div className="form-group-clean">
                                <label>Tipo</label>
                                <select name="tipo" value={formData.tipo} onChange={handleFormChange}>
                                    <option value="Evento">Evento General</option>
                                    <option value="Junta">Junta/Reunión</option>
                                    <option value="Capacitación">Capacitación</option>
                                    <option value="Festejo">Festejo</option>
                                    <option value="Feriado">Feriado</option>
                                </select>
                            </div>
                            <div className="form-group-clean">
                                <label>Color</label>
                                <input type="color" name="color" value={formData.color} onChange={handleFormChange} className="color-input" />
                            </div>
                        </div>

                        {/* TARGETING SECTION */}
                        <div className="targeting-section">
                            <label className="section-label">¿QUIÉN DEBE VER ESTE EVENTO?</label>
                            <div className="targeting-buttons">
                                <button
                                    type="button"
                                    onClick={() => setFormData(f => ({ ...f, target_type: 'TODOS' }))}
                                    className={`target-btn ${formData.target_type === 'TODOS' ? 'active' : ''}`}
                                >
                                    <FaGlobe /> TODOS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(f => ({ ...f, target_type: 'DEPARTAMENTO' }))}
                                    className={`target-btn ${formData.target_type === 'DEPARTAMENTO' ? 'active' : ''}`}
                                >
                                    <FaBuilding /> DEPTO.
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(f => ({ ...f, target_type: 'INDIVIDUALES' }))}
                                    className={`target-btn ${formData.target_type === 'INDIVIDUALES' ? 'active' : ''}`}
                                >
                                    <FaUsers /> ESPECÍFICO
                                </button>
                            </div>

                            {formData.target_type === 'DEPARTAMENTO' && (
                                <div className="form-group-clean mt-10">
                                    <select name="idarea_target" value={formData.idarea_target} onChange={handleFormChange} required>
                                        <option value="">— Seleccionar Departamento —</option>
                                        {areas.map(a => <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>)}
                                    </select>
                                </div>
                            )}

                            {formData.target_type === 'INDIVIDUALES' && (
                                <div className="employee-selector">
                                    {empleados.map(emp => (
                                        <div
                                            key={emp.idempleado}
                                            onClick={() => handleEmployeeToggle(emp.idempleado)}
                                            className={`emp-item ${formData.empleados_target.includes(emp.idempleado) ? 'selected' : ''}`}
                                        >
                                            {emp.nombre_completo_empleado}
                                            {formData.empleados_target.includes(emp.idempleado) && <span className="check">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary-strat submit-btn"
                        >
                            {isSaving ? <FaSpinner className="spin" /> : <FaSave />} Publicar Evento
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="admin-card list-card">
                    <div className="list-header">
                        <h3>Eventos Programados</h3>
                    </div>
                    <div className="events-list-container">
                        {loading ? (
                            <div className="list-loading"><FaSpinner className="spin" /> Cargando...</div>
                        ) : eventos.length === 0 ? (
                            <div className="empty-state">
                                <FaExclamationCircle className="empty-icon" />
                                <p>No hay eventos registrados.</p>
                            </div>
                        ) : (
                            <div className="events-stack">
                                {eventos.map(ev => {
                                    const areaName = ev.target_type === 'DEPARTAMENTO' ? areas.find(a => a.idarea === ev.idarea_target)?.nombre_area : null;
                                    return (
                                        <div key={ev.id} className="event-item-card" style={{ borderLeft: `5px solid ${ev.color}` }}>
                                            <div className="event-info">
                                                <div className="event-title-row">
                                                    <h4 className="event-title">{ev.titulo}</h4>
                                                    <div className="badge-row">
                                                        <span className="badge-type">{ev.tipo}</span>
                                                        <span className="badge-target">
                                                            {ev.target_type === 'TODOS' ? '🌍 GLOBAL' : ev.target_type === 'DEPARTAMENTO' ? `📂 ${areaName || 'Depto'}` : '👤 PRIVADO'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="event-meta">
                                                    <span className="meta-date">📅 {new Date(ev.fecha_inicio).toLocaleDateString()} al {new Date(ev.fecha_fin).toLocaleDateString()}</span>
                                                    {ev.hora_inicio && <span className="meta-time">⏰ {ev.hora_inicio}{ev.hora_fin ? ` - ${ev.hora_fin}` : ''}</span>}
                                                </div>
                                                {ev.descripcion && <p className="event-desc">"{ev.descripcion}"</p>}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(ev.id)}
                                                className="btn-delete-event"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .event-admin-page { padding: 30px; }
                .admin-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; }
                .admin-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
                .card-title { padding: 25px 25px 0 25px; margin: 0; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 10px; color: #1e293b; }
                
                .admin-form-clean { padding: 25px; display: flex; flex-direction: column; gap: 20px; }
                .form-group-clean { display: flex; flex-direction: column; gap: 8px; }
                .form-group-clean label { font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                .form-group-clean input, .form-group-clean select, .form-group-clean textarea { padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 0.95rem; background: #f8fafc; transition: all 0.2s; }
                .form-group-clean input:focus { outline: none; border-color: var(--color-accent); background: white; }
                
                .form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .color-input { height: 45px; padding: 5px !important; cursor: pointer; }
                
                .targeting-section { background: #f8fafc; padding: 15px; border-radius: 15px; border: 1px solid #e2e8f0; }
                .section-label { display: block; font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-bottom: 12px; }
                .targeting-buttons { display: flex; gap: 10px; }
                .target-btn { flex: 1; padding: 12px 8px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 700; font-size: 0.7rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.2s; }
                .target-btn.active { border-color: var(--color-accent); color: var(--color-accent); background: white; box-shadow: 0 4px 12px rgba(167, 49, 58, 0.1); border-width: 2px; }
                
                .mt-10 { margin-top: 10px; }
                .employee-selector { margin-top: 10px; max-height: 180px; overflow-y: auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
                .emp-item { padding: 10px 15px; font-size: 0.85rem; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
                .emp-item.selected { background: rgba(167, 49, 58, 0.05); color: var(--color-accent); font-weight: 700; }
                .emp-item .check { color: var(--color-accent); font-weight: 900; }
                
                .submit-btn { width: 100%; height: 55px; border-radius: 15px; font-size: 1rem; justify-content: center; margin-top: 10px; }
                
                .list-header { padding: 25px; border-bottom: 1px solid #f1f5f9; }
                .list-header h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b; }
                .events-list-container { padding: 20px; max-height: 800px; overflow-y: auto; }
                
                .events-stack { display: flex; flex-direction: column; gap: 15px; }
                .event-item-card { background: white; padding: 15px; border-radius: 15px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: all 0.2s; }
                .event-item-card:hover { transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
                
                .event-info { flex: 1; }
                .event-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
                .event-title { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
                .badge-row { display: flex; gap: 6px; }
                .badge-type, .badge-target { font-size: 0.65rem; padding: 3px 8px; border-radius: 8px; font-weight: 700; text-transform: uppercase; }
                .badge-type { background: #f1f5f9; color: #64748b; }
                .badge-target { background: #e0f2fe; color: #0369a1; }
                
                .event-meta { font-size: 0.8rem; color: #475569; display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 5px; }
                .event-desc { margin: 5px 0 0 0; font-size: 0.8rem; color: #64748b; font-style: italic; }
                
                .btn-delete-event { background: #fff1f2; color: #e11d48; border: none; width: 45px; height: 45px; border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
                .btn-delete-event:hover { background: #e11d48; color: white; transform: scale(1.1); }
                
                .list-loading, .empty-state { padding: 60px; text-align: center; color: #94a3b8; }
                .empty-icon { font-size: 3rem; opacity: 0.2; margin-bottom: 15px; }
                
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                    .admin-grid { grid-template-columns: 1fr; }
                    .event-admin-page { padding: 20px; }
                }

                @media (max-width: 640px) {
                    .form-row-2col { grid-template-columns: 1fr; gap: 20px; }
                    .header-text h1 { font-size: 1.5rem; }
                    .event-title-row { flex-direction: column; align-items: flex-start; }
                    .event-item-card { flex-direction: column; align-items: flex-start; }
                    .btn-delete-event { width: 100%; margin-top: 10px; }
                    .targeting-buttons { flex-direction: column; }
                }
            `}</style>
        </div>
    );
};

export default EventAdmin;

