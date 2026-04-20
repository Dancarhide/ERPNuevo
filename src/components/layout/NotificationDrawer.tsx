import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaCheck, FaInfoCircle, FaBirthdayCake, FaMoneyBillWave, FaRocket } from 'react-icons/fa';
import './styles/Layout.css';

interface Notification {
    idnotificacion: number;
    titulo: string;
    mensaje: string;
    tipo: 'nomina' | 'cumpleaños' | 'cyi' | 'sistema';
    leida: boolean;
    fecha_creacion: string;
    link?: string;
}

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

import { createPortal } from 'react-dom';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const host = window.location.hostname;
            await fetch(`http://${host}:4000/api/notificaciones/generate-alerts`, { method: 'POST' });
            const response = await fetch(`http://${host}:4000/api/notificaciones`);
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const markAsRead = async (id: number) => {
        try {
            const host = window.location.hostname;
            await fetch(`http://${host}:4000/api/notificaciones/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.map(n => n.idnotificacion === id ? { ...n, leida: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'cumpleaños': return <FaBirthdayCake className="notif-icon bday" />;
            case 'nomina': return <FaMoneyBillWave className="notif-icon payroll" />;
            case 'cyi': return <FaRocket className="notif-icon cyi" />;
            default: return <FaInfoCircle className="notif-icon info" />;
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-panel" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <h2 className="drawer-title">
                        <FaBell /> Centro de Alertas RRHH
                    </h2>
                    <button className="drawer-close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="drawer-content">
                    {loading ? (
                        <div className="loading-state" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                            Cargando alertas...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <FaBell size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p>No tienes notificaciones pendientes.</p>
                        </div>
                    ) : (
                        <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {notifications.map((n) => (
                                <div key={n.idnotificacion} className={`notification-card ${n.leida ? 'read' : 'unread'}`}>
                                    <div className="notification-icon-wrapper">
                                        {getIcon(n.tipo)}
                                    </div>
                                    <div className="notification-details">
                                        <div className="notification-header">
                                            <span className="notification-title">{n.titulo}</span>
                                            {!n.leida && (
                                                <button className="mark-read-btn" title="Marcar como leída" onClick={() => markAsRead(n.idnotificacion)}>
                                                    <FaCheck />
                                                </button>
                                            )}
                                        </div>
                                        <p className="notification-message">{n.mensaje}</p>
                                        {n.link && (
                                            <a href={n.link} className="notification-link" onClick={onClose}>Ver detalles</a>
                                        )}
                                        <span className="notification-time">
                                            {new Date(n.fecha_creacion).toLocaleDateString()} {new Date(n.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default NotificationDrawer;
