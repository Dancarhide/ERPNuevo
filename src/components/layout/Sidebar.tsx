import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaChartBar, FaCog, FaTimes, FaCalendarAlt, FaSitemap, FaInfoCircle, FaMoneyBillWave, FaFileInvoiceDollar, FaClipboardList, FaArchive, FaUserPlus, FaBriefcase } from 'react-icons/fa';
import './styles/Layout.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    roles: string[]; // Role-Based Access Control (RBAC) definition
}

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
    
    const navItems: NavItem[] = [
        { path: '/home', label: 'Dashboard Resumen', icon: <FaHome />, roles: ['ALL'] },
        { path: '/empleados', label: 'Recursos Humanos', icon: <FaUsers />, roles: ['Admin', 'RH'] },
        { path: '/vacaciones', label: 'Vacaciones', icon: <FaCalendarAlt />, roles: ['ALL'] }, // Everyone can see/request, RH/Admin manage inside
        { path: '/organigrama', label: 'Organigrama', icon: <FaSitemap />, roles: ['Admin', 'RH', 'Directivo', 'Jefe de Area'] },
        { path: '/quienes-somos', label: 'Quiénes Somos', icon: <FaInfoCircle />, roles: ['ALL'] },
        { path: '/reports', label: 'Reportes y KPIS', icon: <FaChartBar />, roles: ['Admin', 'Directivo', 'Contador', 'Empleado Normal'] },
        { path: '/settings', label: 'Configuración', icon: <FaCog />, roles: ['Admin'] },
        { path: '/my-payroll', label: 'Mis Recibos', icon: <FaFileInvoiceDollar />, roles: ['ALL'] },
        { path: '/payroll-admin', label: 'Nóminas', icon: <FaMoneyBillWave />, roles: ['Admin', 'Contador'] },
        { path: '/payroll-concepts', label: 'Conceptos Nómina', icon: <FaClipboardList />, roles: ['Admin', 'Contador'] },
        { path: '/payroll-history', label: 'Historial Nóminas', icon: <FaArchive />, roles: ['Admin', 'Contador'] },
        { path: '/cyi', label: 'Captación e Inducción', icon: <FaUserPlus />, roles: ['Admin', 'RH'] },
        { path: '/vacantes', label: 'Gestión de Vacantes', icon: <FaBriefcase />, roles: ['Admin', 'RH'] },
    ];

    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const currentUserRole = userData?.rol || 'Empleado Normal';

    const allowedItems = navItems.filter(item => 
        item.roles.includes('ALL') || item.roles.includes(currentUserRole)
    );


    return (
        <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
            
            <div className="sidebar-close-btn-container">
                <button className="sidebar-close-btn" onClick={closeSidebar}>
                    <FaTimes />
                </button>
            </div>

            <ul className="sidebar-menu">
                {allowedItems.map((item, index) => (
                    <li className="sidebar-item" key={index}>
                        <NavLink 
                            to={item.path} 
                            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
                            onClick={closeSidebar} // Closes menu on mobile when navigating
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span className="menu-label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
