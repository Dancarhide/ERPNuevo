import React, { useState, useEffect } from 'react';
import { 
    FaShieldAlt, FaCogs, FaCheckCircle, FaTimesCircle, 
    FaSave, FaSpinner, FaEye, FaPlus, FaPalette, FaGlobe, FaLock 
} from 'react-icons/fa';
import client from '../api/client';
import './styles/AdminConfig.css'; 

interface Permission {
    id: number;
    name: string;
    slug: string;
    action: string;
}

interface RoleWithPerms {
    idrol: number;
    nombre_rol: string;
    role_permissions: {
        permission_id: number;
    }[];
}

const AdminConfig: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'permissions' | 'system'>('permissions');
    const [roles, setRoles] = useState<RoleWithPerms[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [sysConfig, setSysConfig] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resRoles, resPerms, resSys] = await Promise.all([
                client.get('/admin/config/roles-permissions'),
                client.get('/admin/config/permissions-list'),
                client.get('/admin/config/system')
            ]);
            setRoles(resRoles.data);
            setAllPermissions(resPerms.data);
            setSysConfig(resSys.data);
        } catch (error) {
            console.error('Error fetching admin config:', error);
            showToast('Error al cargar la configuración', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const togglePermission = (roleId: number, permId: number) => {
        setRoles(prev => prev.map(role => {
            if (role.idrol !== roleId) return role;
            const hasIt = role.role_permissions.some(rp => rp.permission_id === permId);
            const newPerms = hasIt 
                ? role.role_permissions.filter(rp => rp.permission_id !== permId)
                : [...role.role_permissions, { permission_id: permId }];
            return { ...role, role_permissions: newPerms };
        }));
    };

    const saveRolePermissions = async (roleId: number) => {
        setSaving(true);
        try {
            const role = roles.find(r => r.idrol === roleId);
            if (!role) return;
            const permissionIds = role.role_permissions.map(rp => rp.permission_id);
            await client.post('/admin/config/permissions', { roleId, permissionIds });
            showToast(`Permisos de ${role.nombre_rol} actualizados`, 'success');
        } catch (error) {
            showToast('Error al guardar permisos', 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveSystemConfig = async () => {
        setSaving(true);
        try {
            await client.post('/admin/config/system', sysConfig);
            showToast('Configuracion global guardada', 'success');
        } catch (error) {
            showToast('Error al guardar configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleConfigChange = (key: string, value: any) => {
        setSysConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <FaSpinner className="spin" style={{ fontSize: '3rem', color: 'var(--color-accent)' }} />
            <p>Cargando panel maestro...</p>
        </div>
    );

    return (
        <div className="admin-config-container" style={{ padding: '20px' }}>
            {toast && (
                <div style={{ 
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    padding: '12px 24px', borderRadius: '12px', background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    animation: 'slideInRight 0.3s ease'
                }}>
                    {toast.msg}
                </div>
            )}

            <div className="header-strat" style={{ marginBottom: '30px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '2rem', color: 'var(--color-primary)' }}>
                    <FaShieldAlt style={{ color: 'var(--color-accent)' }} /> Configuración del Sistema
                </h1>
                <p style={{ color: '#64748b' }}>Panel administrativo para roles, permisos y parámetros globales del ERP.</p>
            </div>

            <div className="config-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <button 
                    className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('permissions')}
                    style={{ 
                        padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: activeTab === 'permissions' ? 'var(--color-accent)' : 'transparent',
                        color: activeTab === 'permissions' ? 'white' : '#64748b',
                        fontWeight: 700, transition: 'all 0.2s'
                    }}
                >
                    <FaLock style={{ marginRight: '8px' }} /> Permisos por Rol
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveTab('system')}
                    style={{ 
                        padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: activeTab === 'system' ? 'var(--color-accent)' : 'transparent',
                        color: activeTab === 'system' ? 'white' : '#64748b',
                        fontWeight: 700, transition: 'all 0.2s'
                    }}
                >
                    <FaCogs style={{ marginRight: '8px' }} /> Configuración Global
                </button>
            </div>

            {activeTab === 'permissions' ? (
                <div className="permissions-grid">
                    {roles.map(role => (
                        <div key={role.idrol} className="role-card" style={{ 
                            background: 'white', borderRadius: '20px', padding: '25px', marginBottom: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-primary)' }}>
                                    <span style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '8px', marginRight: '10px', fontSize: '0.9rem' }}>ID: {role.idrol}</span>
                                    {role.nombre_rol}
                                </h3>
                                <button 
                                    className="btn-primary-strat"
                                    disabled={saving}
                                    onClick={() => saveRolePermissions(role.idrol)}
                                >
                                    {saving ? <FaSpinner className="spin" /> : <FaSave />} Guardar Cambios
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                {allPermissions.filter(p => p.action === 'view').map(perm => {
                                    const hasPerm = role.role_permissions.some(rp => rp.permission_id === perm.id);
                                    return (
                                        <div 
                                            key={perm.id} 
                                            onClick={() => togglePermission(role.idrol, perm.id)}
                                            style={{ 
                                                padding: '12px 18px', borderRadius: '12px', border: '1px solid',
                                                borderColor: hasPerm ? '#bfdbfe' : '#e2e8f0',
                                                background: hasPerm ? '#eff6ff' : '#f8fafc',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: hasPerm ? '#1e40af' : '#64748b' }}>{perm.name}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{perm.slug}</span>
                                            </div>
                                            {hasPerm ? <FaCheckCircle style={{ color: '#3b82f6' }} /> : <FaTimesCircle style={{ color: '#cbd5e1' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="system-config" style={{ maxWidth: '800px' }}>
                    <div className="admin-card" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ margin: 0 }}><FaPalette /> Estética y Comportamiento</h3>
                            <button className="btn-primary-strat" onClick={saveSystemConfig} disabled={saving}>
                                {saving ? <FaSpinner className="spin" /> : <FaSave />} Guardar Configuración
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            <div className="config-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Nombre Comercial de la Empresa</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Se mostrará en el Header y Reportes.</p>
                                </div>
                                <input 
                                    type="text" 
                                    value={sysConfig.company_name || ''} 
                                    onChange={(e) => handleConfigChange('company_name', e.target.value)}
                                    style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '300px' }}
                                    placeholder="Nombre de tu empresa"
                                />
                            </div>

                            <div className="config-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Modo Mantenimiento Global</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Bloquea el acceso a todos excepto administradores.</p>
                                </div>
                                <button 
                                    onClick={() => handleConfigChange('maintenance_mode', sysConfig.maintenance_mode === 'true' ? 'false' : 'true')}
                                    style={{ 
                                        padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                        background: sysConfig.maintenance_mode === 'true' ? '#ef4444' : '#10b981', color: 'white', fontWeight: 800
                                    }}
                                >
                                    {sysConfig.maintenance_mode === 'true' ? 'ACTIVO' : 'DESACTIVADO'}
                                </button>
                            </div>

                            <div className="config-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Módulo de Clima Laboral</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Habilitar encuestas para todos los colaboradores.</p>
                                </div>
                                <button 
                                    onClick={() => handleConfigChange('clima_active', sysConfig.clima_active === 'true' ? 'false' : 'true')}
                                    style={{ 
                                        padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                        background: sysConfig.clima_active === 'true' ? '#10b981' : '#64748b', color: 'white', fontWeight: 800
                                    }}
                                >
                                    {sysConfig.clima_active === 'true' ? 'HABILITADO' : 'OCULTO'}
                                </button>
                            </div>
                            
                            {/* Color Picker Simulation */}
                            <div className="config-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Color Primario de Acento</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Personaliza el color de botones e indicadores.</p>
                                </div>
                                <input 
                                    type="color" 
                                    value={sysConfig.accent_color || '#A7313A'} 
                                    onChange={(e) => handleConfigChange('accent_color', e.target.value)}
                                    style={{ height: '45px', width: '80px', border: 'none', background: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminConfig;
