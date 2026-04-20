import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import './styles/Layout.css';
import ChatDrawer from './ChatDrawer';
import ToDoDrawer from './ToDoDrawer';
import NotificationDrawer from './NotificationDrawer';
import { FaSignOutAlt, FaChevronDown, FaUserCircle, FaBars, FaCommentAlt, FaClipboardList, FaCog, FaBell } from 'react-icons/fa';

interface NavbarProps {
    toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isTodoOpen, setIsTodoOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const host = window.location.hostname;
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/notificaciones`);
                const data = await response.json();
                setUnreadCount(data.filter((n: any) => !n.leida).length);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);
    
    // Attempt to get user from local/session storage to display name/role dynamically
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    
    // Fallback info if nothing is available
    const userName = userData?.nombre || 'Administrador';
    const userRole = userData?.rol || 'Admin. de Sistema'; 
    
    // Initials for avatar
    const initials = userName.substring(0, 2).toUpperCase();

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        navigate('/');
    };

    const navigateToProfile = () => {
        setDropdownOpen(false);
        navigate('/mi-perfil');
    };

    return (
        <>
            <header className="navbar-container">
                <div className="navbar-brand">
                    <button className="mobile-menu-btn" onClick={toggleSidebar}>
                        <FaBars />
                    </button>
                    <img src={logo} alt="Logo" className="navbar-logo" />
                </div>
                
                <div className="navbar-actions" ref={dropdownRef}>
                    <button className="logout-btn" onClick={() => setIsTodoOpen(true)} title="Tareas">
                        <FaClipboardList />
                    </button>
                    
                    <button className="logout-btn" onClick={() => setIsNotifOpen(true)} title="Notificaciones">
                        <FaBell />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>

                    <button className="logout-btn" onClick={() => setIsChatOpen(true)} title="Mensajería">
                        <FaCommentAlt />
                    </button>

                    <div 
                        className={`profile-dropdown-wrapper ${dropdownOpen ? 'open' : ''}`}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="user-info">
                            <span className="user-name">{userName}</span>
                            <span className="user-role">{userRole}</span>
                        </div>
                        <div className="user-avatar" style={{ background: 'var(--color-accent)', color: 'white', fontWeight: 700 }}>
                            {initials}
                        </div>
                        <FaChevronDown className="profile-chevron" />
                        
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <button className="dropdown-item" onClick={navigateToProfile}>
                                    <FaUserCircle /> Mi Perfil
                                </button>
                                
                                {userData?.rol === 'Admin' && (
                                    <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/roles'); }}>
                                        <FaCog /> Configuración
                                    </button>
                                )}

                                <div className="dropdown-divider"></div>

                                <button className="dropdown-item danger" onClick={handleLogout}>
                                    <FaSignOutAlt /> Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            <ToDoDrawer isOpen={isTodoOpen} onClose={() => setIsTodoOpen(false)} />
            <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </>
    );
};

export default Navbar;
