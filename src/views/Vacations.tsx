import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaHistory, FaCheckCircle, FaSave, FaPlus, FaClock, FaTimes, FaPlane } from 'react-icons/fa';
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
    const [stats, setStats] = useState({ available: 0, pending: 0, taken: 0 });
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        if (isAdmin) fetchAllVacations();
    }, [isAdmin]);


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
                available: userData?.dias_vacaciones_disponibles || 12,
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
            await client.patch(`/vacaciones/${id}/status`, { 
                estatus_vacacion: status,
                motivo_rechazo: reason
            });

            setRejectModalOpen(false);
            setRejectionReason('');
            fetchData();
            if (isAdmin) fetchAllVacations();
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


    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await client.post('/vacaciones', {
                idempleado: idEmpleado,
                ...formData
            });

            setIsModalOpen(false);
            setFormData({ fecha_inicio: '', fecha_fin: '', motivo: '', tipo_solicitud: 'Vacaciones' });
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
        const d1 = new Date(start);
        const d2 = new Date(end);
        return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <div className="vacations-container">
            <header className="vacations-header">
                <div className="header-text">
                    <h1>Mis Vacaciones</h1>
                    <p>Gestión de días de descanso y ausencias oficiales.</p>
                </div>
                <button className="btn-primary-strat" onClick={() => setIsModalOpen(true)}>
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
                <div style={{ marginTop: '4rem' }}>
                    <div className="header-text" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestión de Solicitudes Pendientes</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Autorización de ausencias para el equipo.</p>
                    </div>
                    
                    {allVacaciones.filter(v => v.estatus_vacacion === 'Pendiente').length === 0 ? (
                        <div style={{ padding: '40px', background: 'white', borderRadius: '24px', border: '1px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <FaCheckCircle style={{ color: '#10b981', fontSize: '2rem', marginBottom: '10px' }} />
                            <p>Sin solicitudes pendientes por revisar.</p>
                        </div>
                    ) : (
                        <div className="admin-grid">
                            {allVacaciones.filter(v => v.estatus_vacacion === 'Pendiente').map((req) => (
                                <div key={req.idvacacion} className="pending-request-card">
                                    <div className="mini-avatar-strat">
                                        {getInitials(req.empleados?.nombre_completo_empleado)}
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{req.empleados?.nombre_completo_empleado}</h4>
                                        <p style={{ margin: 0, color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.85rem' }}>{req.empleados?.puesto || 'Puesto no asignado'}</p>
                                    </div>
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                        <p style={{ margin: '0 0 5px 0' }}><strong>Días:</strong> {calculateDays(req.fecha_inicio, req.fecha_fin)} hábil(es)</p>
                                        <p style={{ margin: '0 0 5px 0' }}><strong>Periodo:</strong> {formatDate(req.fecha_inicio)} al {formatDate(req.fecha_fin)}</p>
                                        <p style={{ margin: 0, fontStyle: 'italic', color: '#666' }}>"{req.motivo || 'Sin motivo especificado'}"</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleStatusUpdate(req.idvacacion, 'Aprobado')}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--color-accent)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Aprobar
                                        </button>
                                        <button 
                                            onClick={() => openRejectModal(req.idvacacion)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'white', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
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
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{ zIndex: 2000 }}>
                    <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
                        <div className="edit-modal-header">
                            <div className="header-title-clean">
                                <h3>Nueva Solicitud</h3>
                                <span className="id-badge">STRATIA ERP</span>
                            </div>
                            <button className="close-btn-clean" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="edit-modal-body-scroll">
                            
                            <div className="profile-photo-section">
                                <div className="photo-circle" style={{ borderRadius: '15px' }}>
                                    <FaCalendarAlt />
                                </div>
                                <div className="photo-label">Gestión de Ausencias</div>
                            </div>

                            <div className="form-section">
                                <h4 className="section-title"><span className="step-num">1</span> Tipo de Ausencia</h4>
                                <div className="form-grid-clean">
                                    <div className="form-group-clean full-width">
                                        <label>Categoría</label>
                                        <select name="tipo_solicitud" value={formData.tipo_solicitud} onChange={handleFormChange}>
                                            <option value="Vacaciones">Vacaciones Anuales</option>
                                            <option value="Permiso Personal">Permiso Personal</option>
                                            <option value="Incapacidad">Incapacidad Médica</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="section-title"><span className="step-num">2</span> Periodo Solicitado</h4>
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

                            <div className="form-section">
                                <h4 className="section-title"><span className="step-num">3</span> Justificación</h4>
                                <div className="form-grid-clean">
                                    <div className="form-group-clean full-width">
                                        <label>Motivo</label>
                                        <textarea 
                                            name="motivo" 
                                            value={formData.motivo} 
                                            onChange={handleFormChange}
                                            style={{ 
                                                width: '100%', 
                                                minHeight: '120px', 
                                                padding: '14px 18px', 
                                                borderRadius: '12px', 
                                                border: '1px solid #E1DFE0', 
                                                backgroundColor: '#F8F9FA',
                                                fontFamily: 'inherit',
                                                fontSize: '0.95rem'
                                            }}
                                            placeholder="Explica brevemente el motivo..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="edit-modal-footer-fixed">
                                <button type="button" className="btn-cancel-clean" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save-clean" disabled={isSubmitting} style={{ background: 'var(--color-accent)' }}>
                                    {isSubmitting ? 'Enviando...' : <><FaSave /> Confirmar Solicitud</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="modal-overlay" onClick={() => setRejectModalOpen(false)} style={{ zIndex: 2001 }}>
                    <div className="edit-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="edit-modal-header">
                            <div className="header-title-clean">
                                <h3>Motivo de Rechazo</h3>
                                <span className="id-badge" style={{ background: '#ef4444' }}>RECHAZO</span>
                            </div>
                            <button className="close-btn-clean" onClick={() => setRejectModalOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="edit-modal-body-scroll" style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '15px', color: 'var(--color-text-muted)' }}>
                                Por favor indica la razón por la cual se está rechazando esta solicitud de vacaciones.
                            </p>
                            <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    minHeight: '120px', 
                                    padding: '14px 18px', 
                                    borderRadius: '12px', 
                                    border: '1px solid #E1DFE0', 
                                    backgroundColor: '#F8F9FA,',
                                    fontFamily: 'inherit',
                                    fontSize: '0.95rem'
                                }}
                                placeholder="Escribe aquí el motivo..."
                                autoFocus
                            />
                        </div>
                        <div className="edit-modal-footer-fixed" style={{ marginTop: '0' }}>
                            <button className="btn-cancel-clean" onClick={() => setRejectModalOpen(false)}>Cancelar</button>
                            <button 
                                className="btn-save-clean" 
                                onClick={confirmRejection}
                                style={{ background: '#ef4444' }}
                            >
                                <FaTimes /> Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Vacations;
