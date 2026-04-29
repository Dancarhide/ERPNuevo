import React, { useEffect, useState, useCallback } from 'react';
import { FaShieldAlt, FaPlus, FaEdit, FaTrash, FaTimes, FaCheck, FaKey, FaLock } from 'react-icons/fa';
import client from '../api/client';
import './styles/Roles.css';

interface Rol {
    idrol: number;
    nombre_rol: string | null;
    desc_rol: string | null;
    idarea: number | null;
    hierarchy_level: number | null;
    is_system: boolean | null;
    _count?: { empleados: number };
}

interface Area {
    idarea: number;
    nombre_area: string | null;
}

interface Permission {
    id: number;
    slug: string;
    name: string;
    action: string;
}

interface Resource {
    id: number;
    key: string;
    name: string;
    permissions: Permission[];
}

interface ModalData {
    nombre_rol: string;
    desc_rol: string;
    idarea: string;
    hierarchy_level: string;
}

const emptyForm = (): ModalData => ({
    nombre_rol: '',
    desc_rol: '',
    idarea: '',
    hierarchy_level: '10'
});

const Roles: React.FC = () => {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRol, setEditingRol] = useState<Rol | null>(null);
    const [formData, setFormData] = useState<ModalData>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Permissions state
    const [permModalOpen, setPermModalOpen] = useState(false);
    const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [activePermIds, setActivePermIds] = useState<number[]>([]);
    const [updatingPerms, setUpdatingPerms] = useState(false);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const fetchRoles = useCallback(async () => {
        try {
            setLoading(true);
            const [rolesRes, areasRes] = await Promise.all([
                client.get('/roles'),
                client.get('/areas')
            ]);
            // Filtrar para no mostrar roles de sistema (Admin) en la gestión
            setRoles(rolesRes.data.filter((r: Rol) => !r.is_system));
            setAreas(areasRes.data);
        } catch {
            setError('Error al cargar los roles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const openCreate = () => {
        setEditingRol(null);
        setFormData(emptyForm());
        setModalOpen(true);
    };

    const openEdit = (rol: Rol) => {
        setEditingRol(rol);
        setFormData({
            nombre_rol: rol.nombre_rol || '',
            desc_rol: rol.desc_rol || '',
            idarea: rol.idarea?.toString() || '',
            hierarchy_level: rol.hierarchy_level?.toString() || '10'
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.nombre_rol.trim()) { setError('El nombre del rol es requerido'); return; }
        setSaving(true);
        setError('');
        try {
            if (editingRol) {
                await client.put(`/roles/${editingRol.idrol}`, formData);
                showSuccess('Rol actualizado correctamente');
            } else {
                await client.post('/roles', formData);
                showSuccess('Rol creado correctamente');
            }
            setModalOpen(false);
            fetchRoles();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al guardar el rol');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenPermissions = async (rol: Rol) => {
        setSelectedRol(rol);
        setError('');
        try {
            setLoading(true);
            const res = await client.get(`/roles/${rol.idrol}/permissions`);
            setAllResources(res.data.catalog);
            setActivePermIds(res.data.activeIds);
            setPermModalOpen(true);
        } catch {
            setError('Error al cargar catálogo de permisos');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (id: number) => {
        setActivePermIds(current => 
            current.includes(id) 
                ? current.filter(pid => pid !== id) 
                : [...current, id]
        );
    };

    const handleUpdatePermissions = async () => {
        if (!selectedRol) return;
        setUpdatingPerms(true);
        try {
            await client.post(`/roles/${selectedRol.idrol}/permissions`, {
                permissionIds: activePermIds
            });
            showSuccess('Permisos actualizados correctamente');
            setPermModalOpen(false);
        } catch {
            setError('Error al guardar permisos');
        } finally {
            setUpdatingPerms(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await client.delete(`/roles/${id}`);
            setDeleteConfirm(null);
            showSuccess('Rol eliminado');
            fetchRoles();
        } catch (e: any) {
            setError(e.response?.data?.error || 'Error al eliminar el rol');
            setDeleteConfirm(null);
        }
    };

    const getAreaNombre = (id: number | null) =>
        areas.find(a => a.idarea === id)?.nombre_area || '—';

    return (
        <div className="roles-container">
            <div className="roles-header">
                <div>
                    <h1><FaShieldAlt /> Gestión de Roles</h1>
                    <p>Administra los roles del sistema y sus permisos de acceso.</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>
                    <FaPlus /> Nuevo Rol
                </button>
            </div>

            {success && <div className="roles-toast success"><FaCheck /> {success}</div>}
            {error && <div className="roles-toast error"><FaTimes /> {error}</div>}

            {loading ? (
                <div className="roles-loading"><div className="spinner" /><p>Cargando roles...</p></div>
            ) : (
                <div className="roles-table-wrap">
                    <table className="roles-table">
                        <thead>
                            <tr>
                                <th>Nombre del Rol</th>
                                <th>Descripción</th>
                                <th>Área</th>
                                <th>Nivel Jerárquico</th>
                                <th>Sistema</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(rol => (
                                <tr key={rol.idrol}>
                                    <td>
                                        <span className="rol-nombre">{rol.nombre_rol || '—'}</span>
                                    </td>
                                    <td className="rol-desc">{rol.desc_rol || <span style={{ color: 'var(--color-text-muted)' }}>Sin descripción</span>}</td>
                                    <td>{getAreaNombre(rol.idarea)}</td>
                                    <td><span className="level-badge">{rol.hierarchy_level ?? '—'}</span></td>
                                    <td>
                                        {rol.is_system
                                            ? <span className="badge-system">Sistema</span>
                                            : <span className="badge-custom">Personalizado</span>}
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            {!rol.is_system && (
                                                <button
                                                    className="action-btn permissions"
                                                    onClick={() => handleOpenPermissions(rol)}
                                                    title="Gestionar Permisos"
                                                >
                                                    <FaKey />
                                                </button>
                                            )}
                                            <button
                                                className="action-btn edit"
                                                onClick={() => openEdit(rol)}
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                            {!rol.is_system && (
                                                deleteConfirm === rol.idrol ? (
                                                    <div className="delete-confirm">
                                                        <span>¿Eliminar?</span>
                                                        <button className="action-btn confirm-yes" onClick={() => handleDelete(rol.idrol)}>Sí</button>
                                                        <button className="action-btn confirm-no" onClick={() => setDeleteConfirm(null)}>No</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => setDeleteConfirm(rol.idrol)}
                                                        title="Eliminar"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="roles-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{editingRol ? 'Editar Rol' : 'Nuevo Rol'}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre del Rol *</label>
                                <input
                                    type="text"
                                    value={formData.nombre_rol}
                                    onChange={e => setFormData(f => ({ ...f, nombre_rol: e.target.value }))}
                                    placeholder="Ej. Contador, Jefe de Área..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={formData.desc_rol}
                                    onChange={e => setFormData(f => ({ ...f, desc_rol: e.target.value }))}
                                    placeholder="Describe las responsabilidades de este rol..."
                                    rows={3}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Área</label>
                                    <select
                                        value={formData.idarea}
                                        onChange={e => setFormData(f => ({ ...f, idarea: e.target.value }))}
                                    >
                                        <option value="">— Sin área —</option>
                                        {areas.map(a => (
                                            <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Nivel Jerárquico</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={formData.hierarchy_level}
                                        onChange={e => setFormData(f => ({ ...f, hierarchy_level: e.target.value }))}
                                    />
                                </div>
                            </div>
                            {error && <p className="form-error">{error}</p>}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : editingRol ? 'Guardar Cambios' : 'Crear Rol'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Permisos */}
            {permModalOpen && (
                <div className="modal-overlay" onClick={() => setPermModalOpen(false)}>
                    <div className="permissions-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2><FaLock /> Permisos: {selectedRol?.nombre_rol}</h2>
                            <button className="modal-close" onClick={() => setPermModalOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body scrollable">
                            <p className="perm-info">Marca los módulos y acciones a los que este rol tendrá acceso.</p>
                            <div className="permissions-grid">
                                {allResources.map(res => (
                                    <div key={res.id} className="resource-block">
                                        <h3>{res.name}</h3>
                                        <div className="perms-list">
                                            {res.permissions.map(perm => (
                                                <label key={perm.id} className="perm-item">
                                                    <input 
                                                        type="checkbox"
                                                        checked={activePermIds.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                    />
                                                    <span className="checkmark"></span>
                                                    <div className="perm-text">
                                                        <span className="perm-name">{perm.name}</span>
                                                        <span className="perm-slug">{perm.slug}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setPermModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleUpdatePermissions} disabled={updatingPerms}>
                                {updatingPerms ? 'Guardando...' : 'Actualizar Permisos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
