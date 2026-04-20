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
        <div className="vacations-container">
            <header className="vacations-header">
                <div className="header-text">
                    <h1>Administración de Eventos</h1>
                    <p>Gestiona el calendario corporativo con segmentación avanzada.</p>
                </div>
            </header>

            <div className="admin-grid" style={{ gridTemplateColumns: 'minmax(400px, 1fr) 1.5fr' }}>
                {/* Form Section */}
                <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaCalendarPlus style={{ color: 'var(--color-accent)' }} /> Nuevo Evento Personalizado
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group-clean">
                                <label>Fecha Inicio</label>
                                <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group-clean">
                                <label>Fecha Fin</label>
                                <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleFormChange} required />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group-clean">
                                <label>Hora Inicio (Opcional)</label>
                                <input type="time" name="hora_inicio" value={formData.hora_inicio} onChange={handleFormChange} />
                            </div>
                            <div className="form-group-clean">
                                <label>Hora Fin (Opcional)</label>
                                <input type="time" name="hora_fin" value={formData.hora_fin} onChange={handleFormChange} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
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
                                <input type="color" name="color" value={formData.color} onChange={handleFormChange} style={{ height: '42px', padding: '2px' }} />
                            </div>
                        </div>

                        {/* TARGETING SECTION */}
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>¿QUIÉN DEBE VER ESTE EVENTO?</label>
                            <div className="targeting-buttons" style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setFormData(f => ({...f, target_type:'TODOS'}))} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: formData.target_type === 'TODOS' ? '2px solid #A7313A' : '1px solid #ddd', background: formData.target_type === 'TODOS' ? 'white' : 'transparent', color: formData.target_type === 'TODOS' ? '#A7313A' : '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                                    <FaGlobe /> TODOS
                                </button>
                                <button type="button" onClick={() => setFormData(f => ({...f, target_type:'DEPARTAMENTO'}))} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: formData.target_type === 'DEPARTAMENTO' ? '2px solid #A7313A' : '1px solid #ddd', background: formData.target_type === 'DEPARTAMENTO' ? 'white' : 'transparent', color: formData.target_type === 'DEPARTAMENTO' ? '#A7313A' : '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                                    <FaBuilding /> DEPTO.
                                </button>
                                <button type="button" onClick={() => setFormData(f => ({...f, target_type:'INDIVIDUALES'}))} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: formData.target_type === 'INDIVIDUALES' ? '2px solid #A7313A' : '1px solid #ddd', background: formData.target_type === 'INDIVIDUALES' ? 'white' : 'transparent', color: formData.target_type === 'INDIVIDUALES' ? '#A7313A' : '#64748b', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                                    <FaUsers /> ESPECÍFICO
                                </button>
                            </div>

                            {formData.target_type === 'DEPARTAMENTO' && (
                                <div className="form-group-clean">
                                    <select name="idarea_target" value={formData.idarea_target} onChange={handleFormChange} required>
                                        <option value="">— Seleccionar Departamento —</option>
                                        {areas.map(a => <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>)}
                                    </select>
                                </div>
                            )}

                            {formData.target_type === 'INDIVIDUALES' && (
                                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #ddd' }}>
                                    {empleados.map(emp => (
                                        <div key={emp.idempleado} onClick={() => handleEmployeeToggle(emp.idempleado)} style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', background: formData.empleados_target.includes(emp.idempleado) ? '#fef2f2' : 'transparent' }}>
                                            {emp.nombre_completo_empleado}
                                            {formData.empleados_target.includes(emp.idempleado) && <span style={{ color: '#A7313A', fontWeight: 800 }}>✓</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="btn-primary-strat" 
                            style={{ marginTop: '5px', width: '100%', justifyContent: 'center', height: '50px' }}
                        >
                            {isSaving ? <FaSpinner className="spin" /> : <FaSave />} Publicar Evento
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="admin-card" style={{ background: 'white', padding: '0', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '30px', borderBottom: '1px solid #f1f5f9' }}>
                        <h3 style={{ margin: 0 }}>Eventos Programados</h3>
                    </div>
                    <div className="events-list-container" style={{ maxHeight: '800px', overflowY: 'auto', padding: '20px' }}>
                        {loading ? (
                            <div style={{ padding: '50px', textAlign: 'center' }}><FaSpinner className="spin" /> Cargando...</div>
                        ) : eventos.length === 0 ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#858789' }}>
                                <FaExclamationCircle style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '10px' }} />
                                <p>No hay eventos registrados.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {eventos.map(ev => {
                                    const areaName = ev.target_type === 'DEPARTAMENTO' ? areas.find(a => a.idarea === ev.idarea_target)?.nombre_area : null;
                                    return (
                                        <div key={ev.id} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            padding: '20px',
                                            background: '#f8fafc',
                                            borderRadius: '16px',
                                            borderLeft: `5px solid ${ev.color}`
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <h4 style={{ margin: 0, fontWeight: 700 }}>{ev.titulo}</h4>
                                                    <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.05)', color: '#64748b', padding: '2px 8px', borderRadius: '10px' }}>{ev.tipo}</span>
                                                    <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                                                        {ev.target_type === 'TODOS' ? '🌍 GLOBLAL' : ev.target_type === 'DEPARTAMENTO' ? `📂 ${areaName || 'Depto'}` : '👤 PRIVADO'}
                                                    </span>
                                                </div>
                                                <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                                                    📅 {new Date(ev.fecha_inicio).toLocaleDateString()} a {new Date(ev.fecha_fin).toLocaleDateString()}
                                                    {ev.hora_inicio && <span style={{ marginLeft: '10px', color: '#64748b' }}>⏰ {ev.hora_inicio}{ev.hora_fin ? ` - ${ev.hora_fin}` : ''}</span>}
                                                </p>
                                                {ev.descripcion && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>"{ev.descripcion}"</p>}
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(ev.id)}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', marginLeft: '15px' }}
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
        </div>
    );
};

export default EventAdmin;

