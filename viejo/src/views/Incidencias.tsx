import React, { useEffect, useState, useCallback } from 'react';
import {
    FaExclamationTriangle, FaPlus, FaTimes, FaCheck,
    FaFilter, FaChevronDown, FaUser, FaHeading, FaInfoCircle, FaLayerGroup, FaExclamationCircle, FaSave
} from 'react-icons/fa';
import client from '../api/client';
import './styles/Incidencias.css';

interface Empleado {
    idempleado: number;
    nombre_completo_empleado: string;
    puesto?: string | null;
}

interface Incidencia {
    idincidencia: number;
    titulo: string | null;
    descripcion: string | null;
    tipo: string | null;
    gravedad: string | null;
    estatus: string | null;
    fecha_incidencia: string | null;
    fecha_registro: string | null;
    empleados_incidencias_id_empleado_reportadoToempleados: { nombre_completo_empleado: string; puesto: string | null } | null;
    empleados_incidencias_id_reportanteToempleados: { nombre_completo_empleado: string } | null;
}

const TIPO_OPTIONS = ['General', 'Conducta', 'Puntualidad', 'Desempeño', 'Acoso', 'Seguridad', 'Otro'];
const GRAVEDAD_OPTIONS = ['Leve', 'Moderada', 'Grave', 'Crítica'];
const ESTATUS_OPTIONS = ['Pendiente', 'En Revisión', 'Resuelto', 'Archivado'];

const gravedadStyle = (g: string | null) => {
    const map: Record<string, { bg: string; color: string }> = {
        'Leve':     { bg: '#d1fae5', color: '#065f46' },
        'Moderada': { bg: '#fef3c7', color: '#92400e' },
        'Grave':    { bg: '#fee2e2', color: '#991b1b' },
        'Crítica':  { bg: '#fce7f3', color: '#9d174d' },
    };
    return map[g || ''] || { bg: '#f3f4f6', color: '#374151' };
};

const estatusStyle = (s: string | null) => {
    const map: Record<string, { bg: string; color: string }> = {
        'Pendiente':   { bg: '#fef3c7', color: '#b45309' },
        'En Revisión': { bg: '#e0e7ff', color: '#4338ca' },
        'Resuelto':    { bg: '#d1fae5', color: '#065f46' },
        'Archivado':   { bg: '#f3f4f6', color: '#6b7280' },
    };
    return map[s || ''] || { bg: '#f3f4f6', color: '#374151' };
};

const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Incidencias: React.FC = () => {
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const userRol = userData?.rol || '';
    const isAdmin = ['Admin', 'RH', 'Administrador', 'Recursos Humanos'].includes(userRol);

    const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Filters
    const [filtroEstatus, setFiltroEstatus] = useState('');
    const [filtroGravedad, setFiltroGravedad] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');

    // Modals & Saving
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Incidencia | null>(null);
    const [form, setForm] = useState({
        id_empleado_reportado: '',
        titulo: '',
        descripcion: '',
        tipo: 'General',
        gravedad: 'Leve'
    });

    // Status change dropdown
    const [statusDropdown, setStatusDropdown] = useState<number | null>(null);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [incRes, empRes] = await Promise.all([
                client.get('/incidencias'),
                client.get('/empleados')
            ]);
            setIncidencias(incRes.data);
            setEmpleados(empRes.data);
        } catch {
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = incidencias.filter(i => {
        if (filtroEstatus && i.estatus !== filtroEstatus) return false;
        if (filtroGravedad && i.gravedad !== filtroGravedad) return false;
        if (filtroTipo && i.tipo !== filtroTipo) return false;
        return true;
    });

    const handleCreate = async () => {
        if (!form.id_empleado_reportado || !form.titulo.trim()) {
            setError('Empleado reportado y título son requeridos');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await client.post('/incidencias', form);
            setModalOpen(false);
            setForm({ id_empleado_reportado: '', titulo: '', descripcion: '', tipo: 'General', gravedad: 'Leve' });
            showSuccess('Incidencia registrada correctamente');
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al registrar');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (id: number, estatus: string) => {
        try {
            await client.patch(`/incidencias/${id}/status`, { estatus });
            setStatusDropdown(null);
            showSuccess('Estatus actualizado');
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al actualizar estatus');
        }
    };

    const handleDelete = (inc: Incidencia) => {
        setItemToDelete(inc);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await client.delete(`/incidencias/${itemToDelete.idincidencia}`);
            setDeleteModalOpen(false);
            setItemToDelete(null);
            showSuccess('Incidencia eliminada');
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al eliminar');
        }
    };

    return (
        <div className="inc-container">
            <div className="inc-header">
                <div>
                    <h1><FaExclamationTriangle /> Incidencias</h1>
                    <p>Registro y seguimiento de incidencias laborales.</p>
                </div>
                <button className="btn-primary" onClick={() => setModalOpen(true)}>
                    <FaPlus /> Nueva Incidencia
                </button>
            </div>

            {success && <div className="inc-toast success"><FaCheck /> {success}</div>}
            {error && <div className="inc-toast error"><FaTimes /> {error}</div>}

            {/* Filters */}
            <div className="inc-filters">
                <FaFilter style={{ color: 'var(--color-text-muted)' }} />
                <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}>
                    <option value="">Todos los estatus</option>
                    {ESTATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filtroGravedad} onChange={e => setFiltroGravedad(e.target.value)}>
                    <option value="">Todas las gravedades</option>
                    {GRAVEDAD_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                    <option value="">Todos los tipos</option>
                    {TIPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {(filtroEstatus || filtroGravedad || filtroTipo) && (
                    <button className="btn-clear-filter" onClick={() => { setFiltroEstatus(''); setFiltroGravedad(''); setFiltroTipo(''); }}>
                        <FaTimes /> Limpiar
                    </button>
                )}
                <span className="inc-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
                <div className="inc-loading"><div className="spinner" /><p>Cargando incidencias...</p></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><FaExclamationTriangle /></div>
                    <h3>Sin incidencias</h3>
                    <p>No hay registros que coincidan con los filtros aplicados.</p>
                </div>
            ) : (
                <div className="inc-table-wrap">
                    <table className="inc-table">
                        <thead>
                            <tr>
                                <th>Empleado Reportado</th>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Gravedad</th>
                                <th>Estatus</th>
                                <th>Fecha</th>
                                <th>Reportante</th>
                                {isAdmin && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(inc => {
                                const gStyle = gravedadStyle(inc.gravedad);
                                const eStyle = estatusStyle(inc.estatus);
                                return (
                                    <tr key={inc.idincidencia}>
                                        <td data-label="Empleado Reportado">
                                            <div className="inc-emp-cell">
                                                <div className="inc-avatar">
                                                    {inc.empleados_incidencias_id_empleado_reportadoToempleados?.nombre_completo_empleado?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <div className="inc-name">{inc.empleados_incidencias_id_empleado_reportadoToempleados?.nombre_completo_empleado || '—'}</div>
                                                    <div className="inc-puesto">{inc.empleados_incidencias_id_empleado_reportadoToempleados?.puesto || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Título" className="inc-titulo">{inc.titulo || '—'}</td>
                                        <td data-label="Tipo"><span className="inc-tipo-badge">{inc.tipo || '—'}</span></td>
                                        <td data-label="Gravedad">
                                            <span className="badge-pill" style={{ background: gStyle.bg, color: gStyle.color }}>
                                                {inc.gravedad || '—'}
                                            </span>
                                        </td>
                                        <td data-label="Estatus">
                                            {isAdmin ? (
                                                <div className="status-dropdown-wrap">
                                                    <button
                                                        className="status-btn"
                                                        style={{ background: eStyle.bg, color: eStyle.color }}
                                                        onClick={() => setStatusDropdown(statusDropdown === inc.idincidencia ? null : inc.idincidencia)}
                                                    >
                                                        {inc.estatus} <FaChevronDown style={{ fontSize: '0.7rem' }} />
                                                    </button>
                                                    {statusDropdown === inc.idincidencia && (
                                                        <div className="status-menu" onClick={e => e.stopPropagation()}>
                                                            {ESTATUS_OPTIONS.map(s => (
                                                                <button
                                                                    key={s}
                                                                    className={`status-menu-item ${inc.estatus === s ? 'active' : ''}`}
                                                                    onClick={() => handleStatusChange(inc.idincidencia, s)}
                                                                >
                                                                    {inc.estatus === s && <FaCheck style={{ marginRight: 6 }} />}
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="badge-pill" style={{ background: eStyle.bg, color: eStyle.color }}>
                                                    {inc.estatus}
                                                </span>
                                            )}
                                        </td>
                                        <td data-label="Fecha" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                            {formatDate(inc.fecha_registro || inc.fecha_incidencia)}
                                        </td>
                                        <td data-label="Reportante" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            {inc.empleados_incidencias_id_reportanteToempleados?.nombre_completo_empleado || '—'}
                                        </td>
                                        {isAdmin && (
                                            <td data-label="Acciones">
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(inc)}
                                                    title="Eliminar"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="inc-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="header-title-clean">
                                <h3><FaExclamationTriangle style={{ color: 'var(--color-accent)' }} /> Registrar Incidencia</h3>
                                <span className="id-badge">STRATIA ERP</span>
                            </div>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><FaTimes /></button>
                        </div>
                        
                        <div className="modal-body-scroll">
                            <div className="form-intro-banner">
                                <FaExclamationCircle className="banner-icon" />
                                <div className="banner-text">
                                    <strong>Reporte Disciplinario</strong>
                                    <p>Por favor, complete todos los campos obligatorios (*) para procesar el reporte correctamente.</p>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="section-title"><span className="step-num">1</span> Información del Empleado</h4>
                                <div className="form-group-clean">
                                    <label><FaUser className="input-icon" /> Empleado Reportado *</label>
                                    <select
                                        value={form.id_empleado_reportado}
                                        onChange={e => setForm(f => ({ ...f, id_empleado_reportado: e.target.value }))}
                                        className="modern-select"
                                    >
                                        <option value="">— Seleccionar empleado —</option>
                                        {empleados.map(e => (
                                            <option key={e.idempleado} value={e.idempleado}>
                                                {e.nombre_completo_empleado} {e.puesto ? `(${e.puesto})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="section-title"><span className="step-num">2</span> Detalle de la Incidencia</h4>
                                <div className="form-grid-clean">
                                    <div className="form-group-clean full-width">
                                        <label><FaHeading className="input-icon" /> Título o Asunto *</label>
                                        <input
                                            type="text"
                                            value={form.titulo}
                                            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                            placeholder="Ej. Llegada tarde reiterada, Incumplimiento de políticas..."
                                            className="modern-input"
                                        />
                                    </div>
                                    <div className="form-group-clean full-width">
                                        <label><FaInfoCircle className="input-icon" /> Descripción Detallada</label>
                                        <textarea
                                            value={form.descripcion}
                                            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                            placeholder="Describa el detalle de la incidencia, hechos, fechas y cualquier información relevante..."
                                            rows={4}
                                            className="modern-textarea"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="section-title"><span className="step-num">3</span> Clasificación</h4>
                                <div className="form-grid-clean">
                                    <div className="form-group-clean">
                                        <label><FaLayerGroup className="input-icon" /> Tipo de Incidencia</label>
                                        <select 
                                            value={form.tipo} 
                                            onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                            className="modern-select"
                                        >
                                            {TIPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group-clean">
                                        <label><FaExclamationTriangle className="input-icon" /> Nivel de Gravedad</label>
                                        <select 
                                            value={form.gravedad} 
                                            onChange={e => setForm(f => ({ ...f, gravedad: e.target.value }))}
                                            className="modern-select"
                                        >
                                            {GRAVEDAD_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {error && <div className="form-error-banner"><FaTimes /> {error}</div>}
                        </div>

                        <div className="modal-footer-fixed">
                            <button className="btn-cancel-clean" onClick={() => setModalOpen(false)}>Cancelar</button>
                            <button className="btn-save-clean" onClick={handleCreate} disabled={saving}>
                                {saving ? (
                                    <span className="btn-loading"><div className="btn-spinner" /> Procesando...</span>
                                ) : (
                                    <><FaSave /> Registrar Incidencia</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
                    <div className="inc-modal delete-confirm" onClick={e => e.stopPropagation()}>
                        <div className="modal-body-clean">
                            <div className="delete-icon-wrapper">
                                <FaExclamationTriangle />
                            </div>
                            <h3>¿Eliminar Incidencia?</h3>
                            <p>Esta acción no se puede deshacer. Se eliminará el reporte de:</p>
                            <div className="delete-target-info">
                                <strong>{itemToDelete?.empleados_incidencias_id_empleado_reportadoToempleados?.nombre_completo_empleado}</strong>
                                <span>{itemToDelete?.titulo}</span>
                            </div>
                        </div>
                        <div className="modal-footer-clean">
                            <button className="btn-cancel-clean" onClick={() => setDeleteModalOpen(false)}>No, cancelar</button>
                            <button className="btn-delete-confirm" onClick={confirmDelete}>Sí, eliminar ahora</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Incidencias;
