import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaHome, FaUsers, FaChartBar, FaTimes, FaCalendarAlt, FaSitemap,
    FaInfoCircle, FaMoneyBillWave, FaFileInvoiceDollar, FaShieldAlt,
    FaExclamationTriangle, FaLayerGroup, FaUserEdit, FaPoll, FaCogs, FaSpinner,
    FaBuilding, FaUserCircle, FaSignOutAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import './styles/Layout.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    permission: string | 'ALL'; // Map to DB slug
}

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
    const navigate = useNavigate();
    const [myPermissions, setMyPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const navItems: NavItem[] = [
        { path: '/home', label: 'Tablero Principal', icon: <FaHome />, permission: 'ALL' },
        { path: '/empleados', label: 'Capital Humano', icon: <FaUsers />, permission: 'empleados.view' },
        { path: '/hr-config', label: 'Config. Recursos Humanos', icon: <FaBuilding />, permission: 'areas.manage' },
        { path: '/vacaciones', label: 'Vacaciones Calendario', icon: <FaCalendarAlt />, permission: 'vacaciones.view' },
        { path: '/organigrama', label: 'Estructura Organizacional', icon: <FaSitemap />, permission: 'ALL' },
        { path: '/quienes-somos', label: 'Quienes Somos', icon: <FaInfoCircle />, permission: 'ALL' },
        { path: '/reports', label: 'KPIS & Reportes', icon: <FaChartBar />, permission: 'kpis.view' },
        { path: '/my-payroll', label: 'Mis Comprobantes', icon: <FaFileInvoiceDollar />, permission: 'ALL' },
        { path: '/payroll-admin', label: 'Control Nómina', icon: <FaMoneyBillWave />, permission: 'nominas.view' },
        { path: '/payroll-batches', label: 'Dispersión Lotes', icon: <FaLayerGroup />, permission: 'nominas.view' },
        { path: '/estructura', label: 'Gestión Talento', icon: <FaShieldAlt />, permission: 'cyi.manage' },
        { path: '/incidencias', label: 'Inicidencias', icon: <FaExclamationTriangle />, permission: 'reportes.view' },
        { path: '/hr-inventory', label: 'Inventario de RH', icon: <FaUserEdit />, permission: 'ALL' },
        { path: '/clima-laboral', label: 'Clima Laboral', icon: <FaPoll />, permission: 'ALL' },
        { path: '/admin-encuestas', label: 'Control Encuestas', icon: <FaChartBar />, permission: 'evaluations.view' },
        { path: '/admin-eventos', label: 'Crear Eventos', icon: <FaCalendarAlt />, permission: 'calendario.view' },
        { path: '/admin-config', label: 'Ajustes Maestros', icon: <FaCogs />, permission: 'ajustes.view' },
    ];

    useEffect(() => {
        const fetchPerms = async () => {
            try {
                const res = await client.get('/admin/config/my-permissions');
                setMyPermissions(res.data);
            } catch (error) {
                console.error('Error fetching perms:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerms();
    }, []);

    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const isAdmin = userData?.rol === 'Admin';

    const allowedItems = navItems.filter(item => {
        if (item.permission === 'ALL') return true;
        // Admins bypass everything if lists are empty, but we check if the slug is allowed
        return myPermissions.includes(item.permission) || isAdmin;
    });

    const userName = userData?.nombre || 'Administrador';
    const userRole = userData?.rol || 'Admin. de Sistema';
    const initials = userName.substring(0, 2).toUpperCase();

    const handleLogout = () => {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const navigateToProfile = () => {
        closeSidebar();
        navigate('/mi-perfil');
    };

    return (
        <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-close-btn-container">
                <button className="sidebar-close-btn" onClick={closeSidebar}>
                    <FaTimes />
                </button>
            </div>

            <ul className="sidebar-menu">
                {loading ? (
                    <li style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>
                        <FaSpinner className="spin" />
                    </li>
                ) : (
                    allowedItems.map((item, index) => (
                        <li className="sidebar-item" key={index}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                                onClick={closeSidebar}
                            >
                                <span className="menu-icon">{item.icon}</span>
                                <span className="menu-label">{item.label}</span>
                            </NavLink>
                        </li>
                    ))
                )}
            </ul>

            <div className="sidebar-footer">
                <div className="sidebar-user-info">
                    <div className="user-avatar-mini" style={{ background: 'var(--color-accent)', color: 'white' }}>
                        {initials}
                    </div>
                    <div className="user-details-mini">
                        <span className="user-name-mini">{userName}</span>
                        <span className="user-role-mini">{userRole}</span>
                    </div>
                </div>
                <div className="sidebar-user-actions">
                    <button className="sidebar-user-action" onClick={navigateToProfile}>
                        <FaUserCircle /> <span>Perfil</span>
                    </button>
                    {isAdmin && (
                        <button className="sidebar-user-action" onClick={() => { closeSidebar(); navigate('/roles'); }}>
                            <FaCogs /> <span>Ajustes</span>
                        </button>
                    )}
                    <button className="sidebar-user-action danger" onClick={handleLogout}>
                        <FaSignOutAlt /> <span>Salir</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

