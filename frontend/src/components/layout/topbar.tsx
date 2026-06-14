'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { notificacionesApi, chatApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ChatDrawer } from './chat-drawer';
import { ToDoDrawer } from './todo-drawer';
import {
  LogOut,
  Bell,
  UserCircle,
  Menu,
  MessageSquare,
  ClipboardList,
  Settings,
  ChevronDown,
} from 'lucide-react';

interface Notification {
  id: number;
  leida?: boolean;
  mensaje?: string;
  titulo?: string;
  fecha?: string;
  [key: string]: unknown;
}

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { subscribe } = useWebSocket();

  let userName = 'Administrador';
  if (user?.nombre_completo) {
    const parts = user.nombre_completo.split(' ').filter(Boolean);
    if (parts.length > 0) {
      userName = parts[0];
    }
  } else if (user?.email) {
    userName = user.email.split('@')[0];
  }
  const userRole = (user as { is_superuser?: boolean })?.is_superuser
    ? 'Súper Administrador'
    : 'Empleado';
  const initials = userName.substring(0, 2).toUpperCase();

  useEffect(() => {
    // Cargar historial de notificaciones y chats sin leer al inicio
    if (user) {
      notificacionesApi
        .getAll()
        .then((data) => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(console.error);

      chatApi
        .getUnread()
        .then((data: unknown) => {
          if (Array.isArray(data) && data.length > 0) {
            setHasUnreadChat(true);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type === 'notification') {
        const payload = message.payload as Notification;
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === payload.id);
          if (exists) {
            return prev.map((n) => (n.id === payload.id ? { ...n, ...payload } : n));
          }
          return [payload, ...prev];
        });
      } else if (message.type === 'chat') {
        const payload = message.payload as { emisor_id?: number };
        if (payload.emisor_id && payload.emisor_id !== user?.id && !chatOpen) {
          setHasUnreadChat(true);
        }
      }
    });

    return unsubscribe;
  }, [user?.id, chatOpen, subscribe]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const handleMarkAsRead = async (id: number) => {
    await notificacionesApi.marcarLeida(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  };

  return (
    <header className="h-[70px] bg-white border-b border-[#A4A4A4] flex items-center justify-between px-8 shadow-[0_2px_10px_rgba(0,0,0,0.05)] fixed top-0 left-0 right-0 z-[100]">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-[#44474A] p-1">
          <Menu size={24} />
        </button>
        <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-5" ref={dropdownRef}>
        <button
          onClick={() => setTodoOpen(true)}
          className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#858789] hover:text-[#A7313A] hover:bg-white hover:border-[#A7313A] hover:shadow-[0_4px_12px_rgba(167,49,58,0.12)] transition-all"
        >
          <ClipboardList size={20} />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#858789] hover:text-[#A7313A] hover:bg-white hover:border-[#A7313A] hover:shadow-[0_4px_12px_rgba(167,49,58,0.12)] transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A7313A] text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 mt-2.5 bg-white border border-[#A4A4A4] rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] w-[320px] max-h-[400px] overflow-y-auto py-2 z-[1000] flex flex-col">
              <div className="px-4 py-2 border-b border-[#F3F4F6] flex justify-between items-center sticky top-0 bg-white">
                <span className="font-bold text-[#44474A]">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      await notificacionesApi.marcarTodasLeidas();
                      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
                    }}
                    className="text-[0.75rem] text-[#A7313A] hover:underline"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-[#858789] text-[0.85rem]">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.leida && handleMarkAsRead(n.id)}
                    className={`p-3 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F8F9FA] cursor-pointer transition-colors ${!n.leida ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-[0.85rem] ${!n.leida ? 'font-bold text-[#44474A]' : 'font-medium text-[#858789]'}`}
                      >
                        {n.titulo}
                      </span>
                      {!n.leida && (
                        <span className="w-2 h-2 rounded-full bg-[#A7313A] shrink-0 mt-1"></span>
                      )}
                    </div>
                    <p className="text-[0.75rem] text-[#858789] line-clamp-2">{n.mensaje}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setChatOpen(true);
            setHasUnreadChat(false);
          }}
          className="relative flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#858789] hover:text-[#A7313A] hover:bg-white hover:border-[#A7313A] hover:shadow-[0_4px_12px_rgba(167,49,58,0.12)] transition-all"
        >
          <MessageSquare size={20} />
          {hasUnreadChat && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#A7313A] border-2 border-white"></span>
          )}
        </button>

        <div className="relative flex items-center gap-2 ml-2">
          <div
            className="flex items-center gap-2 p-1.5 rounded-lg cursor-pointer hover:bg-[#E1DFE0] transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[0.95rem] font-bold text-[#44474A] truncate max-w-[150px]">
                {userName}
              </span>
              <span className="text-[0.75rem] text-[#858789]">{userRole}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#A7313A] text-white flex items-center justify-center font-bold text-[1.1rem]">
              {initials}
            </div>
            <ChevronDown
              size={16}
              className={`text-[#858789] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2.5 bg-white border border-[#A4A4A4] rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] min-w-[200px] py-2.5 z-[1000] flex flex-col">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(false);
                  router.push('/dashboard/mi-perfil');
                }}
                className="flex items-center gap-3 px-5 py-2.5 text-[0.95rem] font-medium text-[#44474A] hover:bg-[#E1DFE0] hover:text-[#A7313A] transition-colors w-full text-left"
              >
                <UserCircle size={18} /> Mi Perfil
              </button>
              {(user as { is_superuser?: boolean })?.is_superuser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    router.push('/dashboard/roles');
                  }}
                  className="flex items-center gap-3 px-5 py-2.5 text-[0.95rem] font-medium text-[#44474A] hover:bg-[#E1DFE0] hover:text-[#A7313A] transition-colors w-full text-left"
                >
                  <Settings size={18} /> Configuración
                </button>
              )}
              <div className="h-px bg-[#E1DFE0] my-2" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-5 py-2.5 text-[0.95rem] font-medium text-[#A7313A] hover:bg-[#A7313A]/5 transition-colors w-full text-left"
              >
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ToDoDrawer isOpen={todoOpen} onClose={() => setTodoOpen(false)} />
    </header>
  );
}
