import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaHistory, FaCheckCircle, FaSave, FaPlus, FaClock, FaTimes, FaPlane, FaComments, FaLayerGroup } from 'react-icons/fa';
import client from '../api/client';
import './styles/Vacations.css';

interface Vacacion {
    idvacacion: number;
    fecha_inicio: string;
    fecha_fin: string;
    estatus_vacacion: string;
    motivo: string | null;
    tipo_solicitud: string;
}

const Vacations: React.FC = () => {
    const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
    const [allVacaciones, setAllVacaciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventos, setEventos] = useState<any[]>([]);
    const [festivos, setFestivos] = useState<any[]>([]);
    const [stats, setStats] = useState({ available: 0, pending: 0, taken: 0 });
    const [currentStep, setCurrentStep] = useState(1);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: Date, events: any[], vacations: any[] } | null>(null);
    const [formData, setFormData] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        motivo: '',
        tipo_solicitud: 'Vacaciones'
    });

    // Sesión y Rol
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const idEmpleado = userData?.idempleado || 1;
    const userRole = userData?.rol || sessionData?.user?.rol || sessionData?.rol || 'Empleado Normal';

    // Only Admin and RH can manage other's vacations
    const isAdmin = userRole === 'Admin' || userRole === 'RH';




    // Rejection state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedVacationId, setSelectedVacationId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
        fetchEventos();
        fetchAllVacations();
    }, [idEmpleado]);

    const fetchEventos = async () => {
        try {
            const [resEv, resFest] = await Promise.all([
                client.get('/eventos'),
                client.get('/festivos')
            ]);
            setEventos(resEv.data);
            setFestivos(resFest.data);
        } catch (error) {
            console.error('Error fetching eventos/festivos:', error);
        }
    };


    // Bloquear scroll de fondo cuando el modal está activo
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalOpen]);

    const fetchData = async () => {
        try {
            const res = await client.get(`/vacaciones?idempleado=${idEmpleado}`);
            const data = res.data;
            setVacaciones(data);

            // Fetch current employee info to get latest available days
            const empRes = await client.get(`/empleados/${idEmpleado}`);
            const currentEmployee = empRes.data;

            // Calculate stats
            const pedingList = data.filter((v: any) => v.estatus_vacacion === 'Pendiente');
            const approved = data.filter((v: any) => v.estatus_vacacion === 'Aprobado');
            let totalTaken = 0;
            approved.forEach((v: any) => {
                const d1 = new Date(v.fecha_inicio);
                const d2 = new Date(v.fecha_fin);
                const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                totalTaken += diff;
            });

            setStats({
                available: currentEmployee?.dias_vacaciones_disponibles ?? 12,
                pending: pedingList.length,
                taken: totalTaken
            });
        } catch (error) {
            console.error('Error fetching vacations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllVacations = async () => {
        try {
            const res = await client.get('/vacaciones');
            setAllVacaciones(res.data);
        } catch (error) {
            console.error('Error fetching all vacations:', error);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        const parts = name.split(' ').filter(n => n.length > 0);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const handleStatusUpdate = async (id: number, status: string, reason?: string) => {
        try {
            // If approving, we need to subtract the days from the employee's available balance
            if (status === 'Aprobado') {
                const vacationRequest = allVacaciones.find(v => v.idvacacion === id);
                if (vacationRequest) {
                    const days = calculateDays(vacationRequest.fecha_inicio, vacationRequest.fecha_fin);
                    const employeeId = vacationRequest.idempleado;

                    // 1. Fetch current employee data to get current days
                    const empRes = await client.get(`/empleados/${employeeId}`);
                    const currentDays = empRes.data.dias_vacaciones_disponibles || 0;
                    const newDays = Math.max(0, currentDays - days);

                    // 2. Update employee available days
                    await client.put(`/empleados/${employeeId}`, {
                        ...empRes.data,
                        dias_vacaciones_disponibles: newDays
                    });

                    console.log(`Updated employee ${employeeId} balance: ${currentDays} -> ${newDays}`);
                }
            }

            await client.patch(`/vacaciones/${id}/status`, {
                estatus_vacacion: status,
                motivo_rechazo: reason
            });

            setRejectModalOpen(false);
            setRejectionReason('');
            fetchData();
            fetchAllVacations();
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(error.response?.data?.error || 'Error al actualizar estatus');
        }
    };

    const openRejectModal = (id: number) => {
        setSelectedVacationId(id);
        setRejectModalOpen(true);
    };

    const confirmRejection = () => {
        if (selectedVacationId && rejectionReason.trim()) {
            handleStatusUpdate(selectedVacationId, 'Rechazado', rejectionReason);
        } else {
            alert('Por favor, ingresa un motivo para el rechazo');
        }
    };

    const handleDayClick = (date: Date, events: any[], vacations: any[], festivos: any[]) => {
        if (window.innerWidth <= 768) {
            setSelectedDayInfo({ date, events, vacations, festivos });
        }
    };


    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNextStep = () => {
        const requestedDays = calculateDays(formData.fecha_inicio, formData.fecha_fin);
        
        if (currentStep === 2) {
            if (!formData.fecha_inicio || !formData.fecha_fin) {
                alert('Por favor selecciona ambas fechas.');
                return;
            }
            if (new Date(formData.fecha_inicio) > new Date(formData.fecha_fin)) {
                alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
                return;
            }
            if (formData.tipo_solicitud === 'Vacaciones' && requestedDays > stats.available) {
                alert(`No tienes suficientes días disponibles. Tienes ${stats.available} y estás solicitando ${requestedDays}.`);
                return;
            }
            if (requestedDays <= 0) {
                alert('El periodo seleccionado no es válido.');
                return;
            }
        }
        
        console.log('Moving from step', currentStep, 'to', currentStep + 1);
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handlePrevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent submission if not on the last step
        if (currentStep < 3) {
            handleNextStep();
            return;
        }

        console.log('Submitting vacation request:', formData);
        setIsSubmitting(true);
        try {
            const payload = {
                idempleado: idEmpleado,
                ...formData
            };
            console.log('Sending payload:', payload);
            await client.post('/vacaciones', payload);

            setIsModalOpen(false);
            setFormData({ fecha_inicio: '', fecha_fin: '', motivo: '', tipo_solicitud: 'Vacaciones' });
            setCurrentStep(1);
            fetchData();
            if (isAdmin) fetchAllVacations();
        } catch (error) {
            console.error('Error submitting vacation request:', error);
            alert('Error al enviar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const d1 = new Date(start);
        const d2 = new Date(end);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
        const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    };

    return (
        <div className="vacations-container">
            <header className="vacations-header">
                <div className="header-text">
                    <h1>Vacaciones Calendario</h1>
                    <p>Calendario integral de descansos y eventos corporativos.</p>
                </div>
                <button className="btn-primary-strat" onClick={() => { setCurrentStep(1); setIsModalOpen(true); }}>
                    <FaPlus /> Nueva Solicitud
                </button>
            </header>

            {/* KPIs Grid */}
            <div className="kpi-grid">
                <div className="kpi-card available">
                    <div className="kpi-content">
                        <p>Días Disponibles</p>
                        <h3>{stats.available}</h3>
                    </div>
                    <div className="kpi-icon"><FaPlane /></div>
                </div>
                <div className="kpi-card pending">
                    <div className="kpi-content">
                        <p>Solicitudes Pendientes</p>
                        <h3>{stats.pending}</h3>
                    </div>
                    <div className="kpi-icon"><FaClock /></div>
                </div>
                <div className="kpi-card taken">
                    <div className="kpi-content">
                        <p>Días Gozados</p>
                        <h3>{stats.taken}</h3>
                    </div>
                    <div className="kpi-icon"><FaCheckCircle /></div>
                </div>
            </div>

            {/* Calendar Section */}
            <div className="admin-card calendar-main-card">
                <div className="calendar-header-flex">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '12px', background: 'rgba(167, 49, 58, 0.1)', borderRadius: '14px' }}>
                            <FaCalendarAlt style={{ color: 'var(--color-accent)', fontSize: '1.4rem' }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Estatus de la Empresa</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#858789' }}>Visualización mensual de asistencia y eventos.</p>
                        </div>
                    </div>

                    <div className="calendar-controls">
                        {/* Legend */}
                        <div className="calendar-legend">
                            <div className="legend-item"><div className="dot vacation"></div> Vacaciones</div>
                            <div className="legend-item"><div className="dot festivo"></div> Festivos</div>
                            <div className="legend-item"><div className="dot event"></div> Eventos</div>
                        </div>

                        <div className="calendar-nav-wrapper">
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                className="nav-btn"
                            >
                                <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>➤</span>
                            </button>
                            <span className="current-month-label">
                                {currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()}
                            </span>
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                className="nav-btn"
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>

                <div className="calendar-view-selector" style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content', margin: '0 auto 20px' }}>
                    <button onClick={() => setView('month')} className={`view-btn ${view === 'month' ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: view === 'month' ? 'white' : 'transparent', boxShadow: view === 'month' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: view === 'month' ? '#A7313A' : '#64748b' }}>Mes</button>
                    <button onClick={() => setView('week')} className={`view-btn ${view === 'week' ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: view === 'week' ? 'white' : 'transparent', boxShadow: view === 'week' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: view === 'week' ? '#A7313A' : '#64748b' }}>Semana</button>
                    <button onClick={() => setView('day')} className={`view-btn ${view === 'day' ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: view === 'day' ? 'white' : 'transparent', boxShadow: view === 'day' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: view === 'day' ? '#A7313A' : '#64748b' }}>Día</button>
                </div>

                {view === 'month' ? (
                    <div className="calendar-grid-strat">
                        {['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(d => (
                            <div key={d} className="calendar-day-header">{d}</div>
                        ))}

                        {(() => {
                            const days = [];
                            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                            const totalDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                            for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="cal-day empty" style={{ background: 'transparent' }}></div>);
                            for (let d = 1; d <= totalDays; d++) {
                                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                                const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                const dayEvents = eventos.filter(e => {
                                    const start = e.fecha_inicio.split('T')[0];
                                    const end = e.fecha_fin.split('T')[0];
                                    return localDateStr >= start && localDateStr <= end;
                                });
                                const dayFestivos = festivos.filter(f => {
                                    const dateStr = f.fecha.split('T')[0];
                                    return localDateStr === dateStr;
                                });
                                const myVacs = (allVacaciones.length > 0 ? allVacaciones : vacaciones).filter(v => {
                                    if (v.estatus_vacacion !== 'Aprobado') return false;
                                    const start = v.fecha_inicio.split('T')[0];
                                    const end = v.fecha_fin.split('T')[0];
                                    return localDateStr >= start && localDateStr <= end;
                                });
                                const isToday = new Date().toISOString().split('T')[0] === localDateStr;
                                days.push(
                                    <div key={d} className={`cal-day ${isToday ? 'today' : ''}`} onClick={() => handleDayClick(date, dayEvents, myVacs, dayFestivos)}>
                                        <div className="day-number-wrapper">
                                            {d} {isToday && <span className="today-badge">HOY</span>}
                                        </div>
                                        <div className="day-dots-container">
                                            {myVacs.length > 0 && <div className="dot-indicator vacation"></div>}
                                            {dayFestivos.length > 0 && <div className="dot-indicator festivo" style={{ background: '#A7313A' }}></div>}
                                            {dayEvents.slice(0, 3).map((e, i) => (
                                                <div key={i} className="dot-indicator generic" style={{ background: e.color || '#A7313A' }}></div>
                                            ))}
                                            {dayEvents.length > 3 && <div className="dot-indicator more"></div>}
                                        </div>
                                        <div className="day-events-stack">
                                            {myVacs.map((v, i) => (
                                                <div key={i} className="event-tag vacation" title={v.empleados?.nombre_completo_empleado}>
                                                    <span className="event-title">VAC: {getInitials(v.empleados?.nombre_completo_empleado)}</span>
                                                </div>
                                            ))}
                                            {dayFestivos.map((f, i) => (
                                                <div key={i} className="event-tag festivo" title={f.nombre} style={{ background: '#A7313A', borderLeft: '3px solid #ffd700' }}>
                                                    <span className="event-title">⭐ {f.nombre}</span>
                                                </div>
                                            ))}
                                            {dayEvents.map((e, i) => (
                                                <div key={i} title={`${e.titulo}${e.hora_inicio ? ` (${e.hora_inicio})` : ''}`} className="event-tag generic" style={{ background: e.color || '#A7313A' }}>
                                                    <span className="event-title">{e.titulo}</span>
                                                    {e.hora_inicio && <span className="event-time">{e.hora_inicio}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return days;
                        })()}
                    </div>
                ) : view === 'week' ? (
                    <div className="calendar-week-view" style={{ display: 'flex', background: '#f8fafc', borderRadius: '20px', padding: '10px', overflowX: 'auto' }}>
                        <div className="time-column" style={{ width: '60px', flexShrink: 0, paddingTop: '50px' }}>
                            {Array.from({ length: 13 }).map((_, i) => (
                                <div key={i} style={{ height: '60px', fontSize: '0.75rem', color: '#64748b', textAlign: 'right', paddingRight: '10px' }}>{8 + i}:00</div>
                            ))}
                        </div>
                        <div className="week-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, minWidth: '700px' }}>
                            {(() => {
                                const days = [];
                                const startOfWeek = new Date(currentMonth);
                                startOfWeek.setDate(currentMonth.getDate() - currentMonth.getDay());
                                for (let i = 0; i < 7; i++) {
                                    const date = new Date(startOfWeek);
                                    date.setDate(startOfWeek.getDate() + i);
                                    const localDateStr = date.toISOString().split('T')[0];
                                    const isToday = new Date().toISOString().split('T')[0] === localDateStr;
                                    days.push(
                                        <div key={i} style={{ borderLeft: '1px solid #e2e8f0' }}>
                                            <div style={{ textAlign: 'center', padding: '10px', background: isToday ? 'rgba(167, 49, 58, 0.05)' : 'transparent' }}>
                                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>{['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][i]}</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isToday ? '#A7313A' : '#1e293b' }}>{date.getDate()}</div>
                                            </div>
                                            <div style={{ position: 'relative', height: `${13 * 60}px`, background: 'white' }}>
                                                {Array.from({ length: 13 }).map((_, h) => (
                                                    <div key={h} style={{ height: '60px', borderTop: '1px solid #f1f5f9' }}></div>
                                                ))}
                                                {eventos.filter(e => e.fecha_inicio.split('T')[0] === localDateStr).map((e, ei) => {
                                                    const startHour = parseInt(e.hora_inicio?.split(':')[0] || '8');
                                                    if (startHour < 8 || startHour > 20) return null;
                                                    return (
                                                        <div key={ei} style={{ position: 'absolute', top: `${(startHour - 8) * 60}px`, left: '4px', right: '4px', background: e.color, color: 'white', padding: '4px', borderRadius: '6px', fontSize: '9px', fontWeight: 600, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                            {e.titulo}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }
                                return days;
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="calendar-day-view" style={{ background: 'white', borderRadius: '24px', padding: '20px', border: '1px solid #eef2f6' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#A7313A' }}>{currentMonth.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                        </div>
                        <div className="day-grid" style={{ position: 'relative' }}>
                            {Array.from({ length: 13 }).map((_, i) => {
                                const hour = 8 + i;
                                const localDateStr = currentMonth.toISOString().split('T')[0];
                                const hourlyEvents = eventos.filter(e => e.fecha_inicio.split('T')[0] === localDateStr && e.hora_inicio?.startsWith(String(hour).padStart(2, '0')));
                                return (
                                    <div key={i} style={{ display: 'flex', height: '80px', borderTop: '1px solid #f1f5f9' }}>
                                        <div style={{ width: '70px', fontSize: '0.8rem', color: '#64748b', paddingTop: '10px' }}>{hour}:00</div>
                                        <div style={{ flex: 1, padding: '5px', display: 'flex', gap: '10px' }}>
                                            {hourlyEvents.map((e, ei) => (
                                                <div key={ei} style={{ background: '#f8fafc', borderLeft: `5px solid ${e.color}`, padding: '10px', borderRadius: '10px', flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.titulo}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{e.hora_inicio} - {e.hora_fin || '...'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>


            <div className="employees-table-container">
                <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontSize: '1.25rem', fontWeight: 700 }}>
                    Historial Personal
                </div>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '15px', color: 'var(--color-text-muted)' }}>Cargando historial...</p>
                    </div>
                ) : vacaciones.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <FaHistory style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.2 }} />
                        <p>No tienes solicitudes registradas.</p>
                    </div>
                ) : (
                    <table className="employees-table">
                        <thead>
                            <tr>
                                <th>Periodo</th>
                                <th>Días</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vacaciones.map((req) => (
                                <tr key={req.idvacacion}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                            {formatDate(req.fecha_inicio)} al {formatDate(req.fecha_fin)}
                                        </div>
                                    </td>
                                    <td>{calculateDays(req.fecha_inicio, req.fecha_fin)} días</td>
                                    <td>{req.tipo_solicitud}</td>
                                    <td>
                                        <span className={`badge ${req.estatus_vacacion === 'Aprobado' ? 'badge-active' : req.estatus_vacacion === 'Pendiente' ? 'badge-pending' : 'badge-inactive'}`}>
                                            {req.estatus_vacacion}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isAdmin && (
                <div className="admin-management-section">
                    <div className="section-header-premium">
                        <div className="header-title-group">
                            <h2 className="premium-title">Gestión de Solicitudes Pendientes</h2>
                            <p className="premium-subtitle">Revisión y autorización de ausencias corporativas.</p>
                        </div>
                        <div className="pending-counter-badge">
                            {allVacaciones.filter(v => v.estatus_vacacion === 'Pendiente').length} Pendientes
                        </div>
                    </div>

                    {allVacaciones.filter(v => v.estatus_vacacion === 'Pendiente').length === 0 ? (
                        <div className="empty-state-card">
                            <FaCheckCircle className="empty-icon" />
                            <p>No hay solicitudes pendientes en este momento.</p>
                        </div>
                    ) : (
                        <div className="admin-requests-grid">
                            {allVacaciones.filter(v => v.estatus_vacacion === 'Pendiente').map((req) => (
                                <div key={req.idvacacion} className="premium-request-card">
                                    <div className="request-card-header">
                                        <div className="user-info-group">
                                            <div className="avatar-circle">
                                                {getInitials(req.empleados?.nombre_completo_empleado)}
                                            </div>
                                            <div className="name-puesto">
                                                <h4>{req.empleados?.nombre_completo_empleado}</h4>
                                                <span>{req.empleados?.puesto || 'Puesto no asignado'}</span>
                                            </div>
                                        </div>
                                        <div className="type-badge">{req.tipo_solicitud}</div>
                                    </div>
                                    
                                    <div className="request-details-box">
                                        <div className="detail-item">
                                            <FaCalendarAlt />
                                            <span>{formatDate(req.fecha_inicio)} - {formatDate(req.fecha_fin)}</span>
                                        </div>
                                        <div className="detail-item highlight">
                                            <FaClock />
                                            <span><strong>{calculateDays(req.fecha_inicio, req.fecha_fin)}</strong> días hábiles</span>
                                        </div>
                                        <div className="detail-item">
                                            <FaPlane />
                                            <span>Disponibles: {req.empleados?.dias_vacaciones_disponibles} días</span>
                                        </div>
                                    </div>

                                    <div className="justification-block">
                                        <p>"{req.motivo || 'Sin motivo especificado'}"</p>
                                    </div>

                                    <div className="action-buttons-group">
                                        <button
                                            className="btn-action-premium approve"
                                            onClick={() => handleStatusUpdate(req.idvacacion, 'Aprobado')}
                                        >
                                            Aprobar Solicitud
                                        </button>
                                        <button
                                            className="btn-action-premium reject"
                                            onClick={() => openRejectModal(req.idvacacion)}
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Request Modal - Matching EditEmployeeModal requirements */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }} style={{ zIndex: 2000 }}>
                    <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
                        <div className="edit-modal-header">
                            <div className="header-title-clean">
                                <div className="title-with-badge">
                                    <h3>Nueva Solicitud de Ausencia</h3>
                                </div>
                            </div>
                            <button className="close-btn-clean" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        </div>

                        <div className="edit-modal-main-layout">
                            <div className="modal-sidebar-wizard">
                                {[
                                    { s: 1, l: 'Categoría', i: <FaLayerGroup /> },
                                    { s: 2, l: 'Fechas', i: <FaCalendarAlt /> },
                                    { s: 3, l: 'Detalles', i: <FaComments /> }
                                ].map(step => (
                                    <div 
                                        key={step.s} 
                                        className={`wizard-step-item ${currentStep === step.s ? 'active' : ''} ${currentStep > step.s ? 'completed' : ''}`}
                                        onClick={() => setCurrentStep(step.s)}
                                    >
                                        <div className="step-number">{currentStep > step.s ? <FaCheckCircle /> : step.s}</div>
                                        <div className="step-label">{step.l}</div>
                                    </div>
                                ))}
                            </div>

                                <div className="edit-modal-body-content">
                                <div className="edit-modal-scroll-area">
                                    <form 
                                        id="vacation-form" 
                                        onSubmit={handleSubmit}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                                                e.preventDefault();
                                                handleNextStep();
                                            }
                                        }}
                                    >
                                        {currentStep === 1 && (
                                            <div className="form-section-modern step-content-fade">
                                                <div className="vacation-request-preview-card">
                                                    <div className="preview-stat">
                                                        <span className="preview-label">Disponibles</span>
                                                        <span className="preview-value">{stats.available}</span>
                                                    </div>
                                                    <div className="preview-divider"></div>
                                                    <div className="preview-stat">
                                                        <span className="preview-label">Días a Solicitar</span>
                                                        <span className="preview-value highlight">
                                                            {formData.fecha_inicio && formData.fecha_fin 
                                                                ? calculateDays(formData.fecha_inicio, formData.fecha_fin) 
                                                                : 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h4 className="section-title-modern">1. Tipo de Ausencia</h4>
                                                <div className="form-grid-clean">
                                                    <div className="form-group-clean full-width">
                                                        <label>Categoría del Permiso</label>
                                                        <select name="tipo_solicitud" value={formData.tipo_solicitud} onChange={handleFormChange}>
                                                            <option value="Vacaciones">Vacaciones Anuales</option>
                                                            <option value="Permiso Personal">Permiso Personal</option>
                                                            <option value="Incapacidad">Incapacidad Médica</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {currentStep === 2 && (
                                            <div className="form-section-modern step-content-fade">
                                                <h4 className="section-title-modern">2. Periodo Solicitado</h4>
                                                <div className="form-grid-clean">
                                                    <div className="form-group-clean">
                                                        <label>Fecha Inicio</label>
                                                        <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleFormChange} required />
                                                    </div>
                                                    <div className="form-group-clean">
                                                        <label>Fecha Fin</label>
                                                        <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleFormChange} required />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {currentStep === 3 && (
                                            <div className="form-section-modern step-content-fade">
                                                <h4 className="section-title-modern">3. Justificación</h4>
                                                <div className="form-grid-clean">
                                                    <div className="form-group-clean full-width">
                                                        <label>Motivo de la ausencia</label>
                                                        <textarea
                                                            name="motivo"
                                                            value={formData.motivo}
                                                            onChange={handleFormChange}
                                                            style={{
                                                                width: '100%',
                                                                minHeight: '150px',
                                                                padding: '14px 18px',
                                                                borderRadius: '12px',
                                                                border: '1px solid #E1DFE0',
                                                                backgroundColor: '#F8F9FA',
                                                                fontFamily: 'inherit',
                                                                fontSize: '0.95rem'
                                                            }}
                                                            placeholder="Explica brevemente el motivo de tu solicitud..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>

                                <div className="edit-modal-footer">
                                    <div className="footer-actions-left">
                                        {currentStep > 1 && (
                                            <button type="button" className="btn-modern outline" onClick={handlePrevStep}>
                                                Anterior
                                            </button>
                                        )}
                                    </div>
                                    <div className="footer-actions-right">
                                        {currentStep < 3 ? (
                                            <button type="button" className="btn-modern primary" onClick={handleNextStep}>
                                                Siguiente
                                            </button>
                                        ) : (
                                            <button type="submit" form="vacation-form" className="btn-modern primary" disabled={isSubmitting}>
                                                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRejectModalOpen(false); }} style={{ zIndex: 2001 }}>
                    <div className="edit-modal-container" style={{ maxWidth: '600px', height: 'auto', maxHeight: '90vh' }}>
                        <div className="edit-modal-header" style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                            <div className="header-title-clean">
                                <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FaTimes /> Rechazar Solicitud
                                </h3>
                            </div>
                            <button className="close-btn-clean" onClick={() => setRejectModalOpen(false)}><FaTimes /></button>
                        </div>
                        
                        <div className="edit-modal-scroll-area" style={{ padding: '20px 40px 40px' }}>
                            <div className="rejection-warning">
                                <p>Esta acción notificará al empleado y cancelará el periodo solicitado.</p>
                            </div>
                            
                            <div className="form-group-clean full-width" style={{ marginTop: '20px' }}>
                                <label style={{ color: '#ef4444', fontWeight: 800 }}>Motivo del Rechazo</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explica detalladamente por qué se rechaza la solicitud..."
                                    style={{
                                        width: '100%',
                                        minHeight: '150px',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '2px solid #fee2e2',
                                        background: '#fff5f5',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="edit-modal-footer">
                            <button className="btn-modern outline" onClick={() => setRejectModalOpen(false)}>Cancelar</button>
                            <button className="btn-modern primary" onClick={confirmRejection} style={{ background: '#ef4444' }}>
                                Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Selected Day Info Modal for Mobile */}
            {selectedDayInfo && (
                <div className="modal-overlay" onClick={() => setSelectedDayInfo(null)} style={{ zIndex: 3000 }}>
                    <div className="edit-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="edit-modal-header">
                            <div className="header-title-clean">
                                <h3>{selectedDayInfo.date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                                <span className="id-badge">DETALLES</span>
                            </div>
                            <button className="close-btn-clean" onClick={() => setSelectedDayInfo(null)}><FaTimes /></button>
                        </div>
                        <div className="edit-modal-body-scroll" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {selectedDayInfo.festivos && selectedDayInfo.festivos.length > 0 && (
                                            <div style={{ background: 'rgba(167, 49, 58, 0.1)', padding: '15px', borderRadius: '15px', border: '1px solid var(--color-accent)' }}>
                                                <h4 style={{ margin: '0 0 5px 0', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>⭐ Festivos</h4>
                                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    {selectedDayInfo.festivos.map((f: any, idx: number) => (
                                                        <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                                                            • {f.nombre} ({f.tipo_ley})
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedDayInfo.events.length === 0 && selectedDayInfo.vacations.length === 0 && (!selectedDayInfo.festivos || selectedDayInfo.festivos.length === 0) ? (
                                            <div style={{ textAlign: 'center', padding: '30px', color: '#858789' }}>
                                                <p>No hay eventos programados para este día.</p>
                                            </div>
                                        ) : (
                                            selectedDayInfo.events.map((e, idx) => (
                                        <div key={idx} style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', borderLeft: `5px solid ${e.color || '#A7313A'}` }}>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{e.titulo}</div>
                                            {e.hora_inicio && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}><FaClock style={{ fontSize: '0.7rem' }} /> {e.hora_inicio} - {e.hora_fin || '...'}</div>}
                                            {e.descripcion && <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>{e.descripcion}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="edit-modal-footer-fixed">
                            <button className="btn-save-clean" onClick={() => setSelectedDayInfo(null)} style={{ background: 'var(--color-accent)', width: '100%' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .calendar-main-card { margin-bottom: 30px; }
                .calendar-controls { display: flex; gap: 20px; alignItems: center; }
                .calendar-legend { display: flex; gap: 15px; margin-right: 20px; font-size: 0.75rem; font-weight: 600; }
                .legend-item { display: flex; align-items: center; gap: 5px; }
                .dot { width: 10px; height: 10px; border-radius: 3px; }
                .dot.vacation { background: #10b981; }
                .dot.festivo { background: #A7313A; border: 1px solid #ffd700; }
                .dot.event { background: #A7313A; }
                
                .calendar-nav-wrapper { display: flex; align-items: center; background: #f1f5f9; padding: 5px; borderRadius: 12px; }
                .nav-btn { padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .current-month-label { font-weight: 800; min-width: 160px; text-align: center; font-size: 0.9rem; color: #1e293b; }
                
                .calendar-day-header { text-align: center; font-weight: 700; padding: 10px 0; color: #64748b; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; }
                .day-number-wrapper { font-weight: 800; margin-bottom: 8px; font-size: 1rem; color: #1e293b; display: flex; justify-content: space-between; align-items: center; width: 100%; }
                .cal-day.today .day-number-wrapper { color: #A7313A; }
                .today-badge { font-size: 0.6rem; background: #A7313A; color: white; padding: 2px 6px; borderRadius: 10px; }
                .day-events-stack { display: flex; flex-direction: column; gap: 4px; }
                
                .event-tag { color: white; font-size: 9px; padding: 4px 8px; border-radius: 6px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
                .event-tag.vacation { background: linear-gradient(90deg, #10b981, #059669); font-weight: 700; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2); }
                .event-title { overflow: hidden; text-overflow: ellipsis; }
                .event-time { font-size: 7px; opacity: 0.9; margin-left: 4px; flex-shrink: 0; }

                @media (max-width: 768px) {
                    .calendar-controls { flex-direction: column; width: 100%; }
                    .calendar-legend { margin-right: 0; justify-content: center; width: 100%; margin-bottom: 15px; }
                    .calendar-nav-wrapper { width: 100%; justify-content: space-between; }
                    .current-month-label { min-width: auto; flex: 1; font-size: 0.8rem; }
                    .calendar-view-selector { width: 100%; justify-content: center; }
                    .calendar-view-selector button { flex: 1; }
                }
            `}</style>
        </div>
    );
};

export default Vacations;
