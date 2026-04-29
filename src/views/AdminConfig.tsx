import React, { useState, useEffect } from 'react';
import {
    FaShieldAlt, FaCogs, FaCheckCircle, FaTimesCircle,
    FaSave, FaSpinner, FaPalette, FaLock, FaSync
} from 'react-icons/fa';
import client from '../api/client';
import { useSysConfig } from '../contexts/SysConfigContext';
import './styles/AdminConfig.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission {
    id:          number;
    name:        string;
    slug:        string;
    action:      string;
    resource_id: number | null;
    resources:   { key: string; name: string } | null;
}

interface RoleWithPerms {
    idrol:            number;
    nombre_rol:       string;
    hierarchy_level:  number | null;
    role_permissions: { permission_id: number }[];
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AdminConfig: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'permissions' | 'system'>('permissions');
    const [roles, setRoles]               = useState<RoleWithPerms[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [sysConfig, setSysConfigLocal]  = useState<any>({});
    const [loading, setLoading]           = useState(true);
    const [saving, setSaving]             = useState(false);
    const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const { config: globalConfig, setConfig: applyGlobalConfig, refresh: refreshGlobal } = useSysConfig();

    useEffect(() => { fetchData(); }, []);

    // Sincronizar el formulario con el contexto global cuando carga
    useEffect(() => {
        setSysConfigLocal((prev: Record<string, any>) => ({ ...prev, ...globalConfig }));
    }, [globalConfig]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resRoles, resPerms] = await Promise.all([
                client.get('/admin/config/roles-permissions'),
                client.get('/admin/config/permissions-list'),
            ]);
            // Filtrar para no mostrar el rol de Administrador en el editor de permisos
            setRoles(resRoles.data.filter((r: RoleWithPerms) => r.hierarchy_level !== 0));
            setAllPermissions(resPerms.data);
        } catch {
            showToast('Error al cargar la configuración', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Permisos ──────────────────────────────────────────────────────────────

    const togglePermission = (roleId: number, permId: number) => {
        setRoles(prev => prev.map(role => {
            if (role.idrol !== roleId) return role;
            const has    = role.role_permissions.some(rp => rp.permission_id === permId);
            const newPerms = has
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
            showToast(`Permisos de "${role.nombre_rol}" actualizados`, 'success');
        } catch {
            showToast('Error al guardar permisos', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Agrupar permisos por nombre del recurso
    const permsByResource = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
        const key = perm.resources?.name ?? 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(perm);
        return acc;
    }, {});

    // ── Configuración del sistema ──────────────────────────────────────────────

    const handleConfigChange = (key: string, value: any) => {
        setSysConfigLocal((prev: any) => ({ ...prev, [key]: value }));
        // Aplicar en tiempo real si es el color de acento
        if (key === 'accent_color') {
            applyGlobalConfig({ accent_color: value });
        }
        if (key === 'company_name') {
            applyGlobalConfig({ company_name: value });
        }
    };

    const saveSystemConfig = async () => {
        setSaving(true);
        try {
            await client.post('/admin/config/system', sysConfig);
            applyGlobalConfig(sysConfig);   // actualiza contexto global inmediatamente
            refreshGlobal();                // re-fetch para confirmar
            showToast('Configuración global guardada', 'success');
        } catch {
            showToast('Error al guardar configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <FaSpinner className="spin" style={{ fontSize: '3rem', color: 'var(--color-accent)' }} />
            <p>Cargando panel maestro...</p>
        </div>
    );

    return (
        <div className="admin-config-container" style={{ padding: '20px' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    padding: '12px 24px', borderRadius: '12px',
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.75rem', color: 'var(--color-primary)', margin: 0 }}>
                    <FaShieldAlt style={{ color: 'var(--color-accent)' }} />
                    Configuración del Sistema
                </h1>
                <p style={{ color: '#64748b', margin: '6px 0 0' }}>
                    Panel administrativo para roles, permisos y parámetros globales del ERP.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                {([
                    { id: 'permissions', label: 'Permisos por Rol', icon: <FaLock /> },
                    { id: 'system',      label: 'Configuración Global', icon: <FaCogs /> },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Permisos por Rol ─────────────────────────────────────────── */}
            {activeTab === 'permissions' && (
                <div>
                    {roles.map(role => (
                        <div key={role.idrol} style={{
                            background: 'white', borderRadius: '16px', padding: '22px',
                            marginBottom: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                            border: '1px solid #f1f5f9',
                        }}>
                            {/* Role header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        padding: '3px 10px', background: 'var(--color-accent)', color: 'white',
                                        borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                                    }}>
                                        Nivel {role.hierarchy_level ?? '—'}
                                    </span>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
                                        {role.nombre_rol}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                                        ({role.role_permissions.length} permisos activos)
                                    </span>
                                </div>
                                <button
                                    className="btn-primary-strat"
                                    disabled={saving}
                                    onClick={() => saveRolePermissions(role.idrol)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {saving ? <FaSpinner className="spin" /> : <FaSave />} Guardar
                                </button>
                            </div>

                            {/* Permisos agrupados por recurso */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Object.entries(permsByResource).map(([resourceName, perms]) => (
                                    <div key={resourceName}>
                                        <p style={{
                                            margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 800,
                                            color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            {resourceName}
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {perms.map(perm => {
                                                const active = role.role_permissions.some(rp => rp.permission_id === perm.id);
                                                return (
                                                    <div
                                                        key={perm.id}
                                                        onClick={() => togglePermission(role.idrol, perm.id)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            padding: '6px 12px', borderRadius: '8px',
                                                            border: `1px solid ${active ? 'var(--color-accent)' : '#e2e8f0'}`,
                                                            background: active ? 'rgba(167,49,58,0.06)' : '#f8fafc',
                                                            cursor: 'pointer', transition: 'all 0.15s',
                                                            userSelect: 'none',
                                                        }}
                                                    >
                                                        {active
                                                            ? <FaCheckCircle style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }} />
                                                            : <FaTimesCircle style={{ color: '#cbd5e1', fontSize: '0.8rem' }} />
                                                        }
                                                        <div>
                                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: active ? '#1e293b' : '#64748b' }}>
                                                                {perm.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                                                                {perm.slug}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab: Configuración Global ─────────────────────────────────────── */}
            {activeTab === 'system' && (
                <div style={{ maxWidth: '780px' }}>
                    <div style={{
                        background: 'white', padding: '28px', borderRadius: '20px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaPalette style={{ color: 'var(--color-accent)' }} /> Estética y Comportamiento
                            </h3>
                            <button
                                className="btn-primary-strat"
                                onClick={saveSystemConfig}
                                disabled={saving}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {saving ? <FaSpinner className="spin" /> : <FaSave />} Guardar Configuración
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                            {/* Nombre de empresa */}
                            <ConfigRow
                                title="Nombre Comercial de la Empresa"
                                subtitle="Se mostrará en el título del navegador y reportes."
                            >
                                <input
                                    type="text"
                                    value={sysConfig.company_name || ''}
                                    onChange={e => handleConfigChange('company_name', e.target.value)}
                                    placeholder="Nombre de tu empresa"
                                    style={inputStyle}
                                />
                            </ConfigRow>

                            {/* Color de acento */}
                            <ConfigRow
                                title="Color de Acento"
                                subtitle="Actualiza botones, badges e indicadores en toda la app en tiempo real."
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="color"
                                        value={sysConfig.accent_color || '#A7313A'}
                                        onChange={e => handleConfigChange('accent_color', e.target.value)}
                                        style={{ height: '44px', width: '70px', border: 'none', background: 'none', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={sysConfig.accent_color || '#A7313A'}
                                        onChange={e => handleConfigChange('accent_color', e.target.value)}
                                        style={{ ...inputStyle, width: '120px', fontFamily: 'monospace' }}
                                        placeholder="#A7313A"
                                    />
                                    <button
                                        onClick={() => handleConfigChange('accent_color', '#A7313A')}
                                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.78rem', color: '#64748b' }}
                                    >
                                        <FaSync style={{ marginRight: 4 }} /> Reset
                                    </button>
                                </div>
                            </ConfigRow>

                            {/* Modo mantenimiento */}
                            <ConfigRow
                                title="Modo Mantenimiento"
                                subtitle="Bloquea el acceso a todos excepto administradores."
                            >
                                <ToggleBtn
                                    active={sysConfig.maintenance_mode === 'true'}
                                    onLabel="ACTIVO"
                                    offLabel="DESACTIVADO"
                                    activeColor="#ef4444"
                                    offColor="#10b981"
                                    onClick={() => handleConfigChange('maintenance_mode', sysConfig.maintenance_mode === 'true' ? 'false' : 'true')}
                                />
                            </ConfigRow>

                            {/* Módulo clima laboral */}
                            <ConfigRow
                                title="Módulo de Clima Laboral"
                                subtitle="Habilita encuestas de clima para todos los colaboradores."
                            >
                                <ToggleBtn
                                    active={sysConfig.clima_active === 'true'}
                                    onLabel="HABILITADO"
                                    offLabel="OCULTO"
                                    activeColor="#10b981"
                                    offColor="#64748b"
                                    onClick={() => handleConfigChange('clima_active', sysConfig.clima_active === 'true' ? 'false' : 'true')}
                                />
                            </ConfigRow>

                            {/* Footer de Quienes Somos */}
                            <ConfigRow
                                title="Footer 'Quiénes Somos' - Texto"
                                subtitle="Texto principal que aparece en el pie de página institucional."
                            >
                                <input
                                    type="text"
                                    value={sysConfig.about_footer_text || ''}
                                    onChange={e => handleConfigChange('about_footer_text', e.target.value)}
                                    placeholder="Nombre del Sistema | Departamento"
                                    style={inputStyle}
                                />
                            </ConfigRow>

                            <ConfigRow
                                title="Footer 'Quiénes Somos' - Versión"
                                subtitle="Etiqueta de versión o build que aparece debajo del texto."
                            >
                                <input
                                    type="text"
                                    value={sysConfig.about_footer_version || ''}
                                    onChange={e => handleConfigChange('about_footer_version', e.target.value)}
                                    placeholder="Build vX.X.X"
                                    style={inputStyle}
                                />
                            </ConfigRow>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const ConfigRow: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '380px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>{title}</h4>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{subtitle}</p>
        </div>
        <div>{children}</div>
    </div>
);

const ToggleBtn: React.FC<{ active: boolean; onLabel: string; offLabel: string; activeColor: string; offColor: string; onClick: () => void }> = ({ active, onLabel, offLabel, activeColor, offColor, onClick }) => (
    <button
        onClick={onClick}
        style={{
            padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: active ? activeColor : offColor,
            color: 'white', fontWeight: 800, fontSize: '0.82rem',
            minWidth: 110, transition: 'background 0.2s',
        }}
    >
        {active ? onLabel : offLabel}
    </button>
);

const inputStyle: React.CSSProperties = {
    padding: '9px 14px', borderRadius: '10px',
    border: '1px solid #e2e8f0', fontSize: '0.9rem',
    width: '280px', outline: 'none',
};

export default AdminConfig;
