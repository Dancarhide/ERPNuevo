import React, { useState, useEffect, useCallback } from 'react';
import {
    FaBuilding, FaUserTag, FaPlus, FaEdit, FaTrash,
    FaSave, FaTimes, FaSpinner, FaUsers, FaLayerGroup
} from 'react-icons/fa';
import client from '../api/client';
import './styles/HRSetup.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Area {
    idarea:      number;
    nombre_area: string;
    _count?:     { empleados_empleados_idareaToareas: number };
}

interface Rol {
    idrol:           number;
    nombre_rol:      string;
    desc_rol:        string | null;
    hierarchy_level: number | null;
    is_system:       boolean;
    idarea:          number | null;
}

type ActiveTab = 'roles' | 'areas';

// ─── Component ────────────────────────────────────────────────────────────────

const HRSetup: React.FC = () => {
    const [tab, setTab]       = useState<ActiveTab>('roles');
    const [areas, setAreas]   = useState<Area[]>([]);
    const [roles, setRoles]   = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [toast, setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    // Modal state
    const [modal, setModal] = useState<{
        mode: 'none';
    } | {
        mode: 'area';
        editing: Area | null;
        nombre: string;
    } | {
        mode: 'rol';
        editing: Rol | null;
        nombre: string;
        desc: string;
        level: string;
        idarea: string;
    }>({ mode: 'none' });

    const showToast = (msg: string, type: 'ok' | 'err') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [rAreas, rRoles] = await Promise.all([
                client.get('/areas'),
                client.get('/roles'),
            ]);
            setAreas(rAreas.data);
            // Excluir el rol Admin del sistema (hierarchy_level = 0) de la gestión RH
            setRoles(rRoles.data.filter((r: Rol) => r.hierarchy_level !== 0));
        } catch {
            showToast('Error al cargar datos', 'err');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Áreas CRUD ──────────────────────────────────────────────────────────

    const openAreaModal = (area?: Area) => setModal({
        mode: 'area',
        editing: area ?? null,
        nombre: area?.nombre_area ?? '',
    });

    const saveArea = async () => {
        if (modal.mode !== 'area') return;
        if (!modal.nombre.trim()) { showToast('El nombre del área es obligatorio', 'err'); return; }
        setSaving(true);
        try {
            if (modal.editing) {
                await client.put(`/areas/${modal.editing.idarea}`, { nombre_area: modal.nombre });
                showToast('Área actualizada', 'ok');
            } else {
                await client.post('/areas', { nombre_area: modal.nombre });
                showToast('Área creada', 'ok');
            }
            setModal({ mode: 'none' });
            fetchAll();
        } catch {
            showToast('Error al guardar el área', 'err');
        } finally {
            setSaving(false);
        }
    };

    const deleteArea = async (area: Area) => {
        const count = area._count?.empleados_empleados_idareaToareas ?? 0;
        if (count > 0) { showToast(`No se puede eliminar: ${count} empleado(s) en esta área`, 'err'); return; }
        if (!confirm(`¿Eliminar el área "${area.nombre_area}"?`)) return;
        try {
            await client.delete(`/areas/${area.idarea}`);
            showToast('Área eliminada', 'ok');
            fetchAll();
        } catch { showToast('Error al eliminar', 'err'); }
    };

    // ── Roles CRUD ──────────────────────────────────────────────────────────

    const openRolModal = (rol?: Rol) => setModal({
        mode: 'rol',
        editing: rol ?? null,
        nombre: rol?.nombre_rol ?? '',
        desc:   rol?.desc_rol ?? '',
        level:  String(rol?.hierarchy_level ?? ''),
        idarea: String(rol?.idarea ?? ''),
    });

    const saveRol = async () => {
        if (modal.mode !== 'rol') return;
        if (!modal.nombre.trim()) { showToast('El nombre del puesto/rol es obligatorio', 'err'); return; }
        setSaving(true);
        try {
            const payload = {
                nombre_rol:      modal.nombre,
                desc_rol:        modal.desc || null,
                hierarchy_level: modal.level ? parseInt(modal.level) : 10,
                idarea:          modal.idarea ? parseInt(modal.idarea) : null,
            };
            if (modal.editing) {
                await client.put(`/roles/${modal.editing.idrol}`, payload);
                showToast('Puesto actualizado', 'ok');
            } else {
                await client.post('/roles', payload);
                showToast('Puesto creado', 'ok');
            }
            setModal({ mode: 'none' });
            fetchAll();
        } catch {
            showToast('Error al guardar el puesto', 'err');
        } finally {
            setSaving(false);
        }
    };

    const deleteRol = async (rol: Rol) => {
        if (rol.is_system) { showToast('Los roles del sistema no se pueden eliminar', 'err'); return; }
        if (!confirm(`¿Eliminar el puesto "${rol.nombre_rol}"?`)) return;
        try {
            await client.delete(`/roles/${rol.idrol}`);
            showToast('Puesto eliminado', 'ok');
            fetchAll();
        } catch (e: any) {
            showToast(e?.response?.data?.error ?? 'Error al eliminar', 'err');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="hrsetup-wrapper">

            {/* Toast */}
            {toast && (
                <div className={`hrsetup-toast ${toast.type === 'ok' ? 'toast-ok' : 'toast-err'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className="hrsetup-header">
                <div>
                    <h1><FaBuilding /> Configuración de Recursos Humanos</h1>
                    <p>Gestiona los puestos y áreas de la organización.</p>
                </div>
                <button
                    className="hrsetup-btn-primary"
                    onClick={() => tab === 'roles' ? openRolModal() : openAreaModal()}
                >
                    <FaPlus />
                    {tab === 'roles' ? 'Nuevo Puesto' : 'Nueva Área'}
                </button>
            </header>

            {/* Tabs */}
            <nav className="hrsetup-tabs">
                {([
                    { id: 'roles', label: 'Puestos / Roles', icon: <FaUserTag /> },
                    { id: 'areas', label: 'Áreas',           icon: <FaLayerGroup /> },
                ] as const).map(t => (
                    <button
                        key={t.id}
                        className={`hrsetup-tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </nav>

            {/* Content */}
            {loading ? (
                <div className="hrsetup-loading">
                    <FaSpinner className="spin" /> Cargando...
                </div>
            ) : (
                <div className="hrsetup-content">

                    {/* ── Tab: Puestos / Roles ─── */}
                    {tab === 'roles' && (
                        <div className="hrsetup-grid">
                            {roles.length === 0 && (
                                <div className="hrsetup-empty">
                                    <FaUserTag className="empty-icon" />
                                    <p>Aún no hay puestos. Crea el primero con el botón <strong>Nuevo Puesto</strong>.</p>
                                </div>
                            )}
                            {roles.map(rol => (
                                <div key={rol.idrol} className="hrsetup-card">
                                    <div className="card-top">
                                        <div className="card-avatar">
                                            {rol.nombre_rol.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="card-info">
                                            <h3>{rol.nombre_rol}</h3>
                                            <p>{rol.desc_rol || 'Sin descripción'}</p>
                                        </div>
                                    </div>
                                    <div className="card-meta">
                                        <span className="badge-level">Nivel {rol.hierarchy_level ?? '—'}</span>
                                        <span className="badge-area">
                                            {areas.find(a => a.idarea === rol.idarea)?.nombre_area ?? 'Sin área'}
                                        </span>
                                    </div>
                                    <div className="card-actions">
                                        <button className="btn-icon edit" onClick={() => openRolModal(rol)} title="Editar">
                                            <FaEdit />
                                        </button>
                                        {!rol.is_system && (
                                            <button className="btn-icon danger" onClick={() => deleteRol(rol)} title="Eliminar">
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Tab: Áreas ─── */}
                    {tab === 'areas' && (
                        <div className="hrsetup-grid">
                            {areas.length === 0 && (
                                <div className="hrsetup-empty">
                                    <FaBuilding className="empty-icon" />
                                    <p>Aún no hay áreas. Crea la primera con el botón <strong>Nueva Área</strong>.</p>
                                </div>
                            )}
                            {areas.map(area => (
                                <div key={area.idarea} className="hrsetup-card">
                                    <div className="card-top">
                                        <div className="card-avatar area-avatar">
                                            {area.nombre_area?.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="card-info">
                                            <h3>{area.nombre_area}</h3>
                                            <p>{area.nombre_area} — {area._count?.empleados_empleados_idareaToareas ?? 0} colaborador(es)</p>
                                        </div>
                                    </div>
                                    <div className="card-meta">
                                        <span className="badge-emp">
                                            <FaUsers style={{ marginRight: 5 }} />
                                            {area._count?.empleados_empleados_idareaToareas ?? 0} empleado(s)
                                        </span>
                                    </div>
                                    <div className="card-actions">
                                        <button className="btn-icon edit" onClick={() => openAreaModal(area)} title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button className="btn-icon danger" onClick={() => deleteArea(area)} title="Eliminar">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Modal: Área ───────────────────────────────────────────────── */}
            {modal.mode === 'area' && (
                <div className="hrsetup-overlay">
                    <div className="hrsetup-modal">
                        <div className="modal-head">
                            <h2>{modal.editing ? 'Editar Área' : 'Nueva Área'}</h2>
                            <button className="btn-close" onClick={() => setModal({ mode: 'none' })}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <label>Nombre del Área <span className="req">*</span></label>
                            <input
                                type="text"
                                placeholder="Ej. Recursos Humanos"
                                value={modal.nombre}
                                onChange={e => setModal({ ...modal, nombre: e.target.value })}
                            />
                        </div>
                        <div className="modal-foot">
                            <button className="btn-cancel" onClick={() => setModal({ mode: 'none' })}>Cancelar</button>
                            <button className="hrsetup-btn-primary" onClick={saveArea} disabled={saving}>
                                {saving ? <FaSpinner className="spin" /> : <FaSave />}
                                {modal.editing ? 'Actualizar' : 'Crear Área'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Rol ────────────────────────────────────────────────── */}
            {modal.mode === 'rol' && (
                <div className="hrsetup-overlay">
                    <div className="hrsetup-modal">
                        <div className="modal-head">
                            <h2>{modal.editing ? 'Editar Puesto' : 'Nuevo Puesto'}</h2>
                            <button className="btn-close" onClick={() => setModal({ mode: 'none' })}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <label>Nombre del Puesto <span className="req">*</span></label>
                            <input
                                type="text"
                                placeholder="Ej. Gerente de Ventas"
                                value={modal.nombre}
                                onChange={e => setModal({ ...modal, nombre: e.target.value })}
                            />
                            <label>Descripción / Responsabilidades</label>
                            <textarea
                                rows={3}
                                placeholder="Descripción del puesto…"
                                value={modal.desc}
                                onChange={e => setModal({ ...modal, desc: e.target.value })}
                            />
                            <div className="modal-row">
                                <div className="field-group">
                                    <label>Nivel Jerárquico</label>
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="1 = más alto"
                                        value={modal.level}
                                        onChange={e => setModal({ ...modal, level: e.target.value })}
                                    />
                                    <small>1 = Director. Números mayores = puestos operativos.</small>
                                </div>
                                <div className="field-group">
                                    <label>Área Asociada</label>
                                    <select
                                        value={modal.idarea}
                                        onChange={e => setModal({ ...modal, idarea: e.target.value })}
                                    >
                                        <option value="">Sin área específica</option>
                                        {areas.map(a => (
                                            <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button className="btn-cancel" onClick={() => setModal({ mode: 'none' })}>Cancelar</button>
                            <button className="hrsetup-btn-primary" onClick={saveRol} disabled={saving}>
                                {saving ? <FaSpinner className="spin" /> : <FaSave />}
                                {modal.editing ? 'Actualizar' : 'Crear Puesto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRSetup;
