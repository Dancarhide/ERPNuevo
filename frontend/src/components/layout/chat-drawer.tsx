/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Search, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { chatApi, empleadosApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/components/auth-provider';

type Empleado = {
  id: number;
  nombre_completo: string;
};

type Mensaje = {
  id: number;
  conversacion_id: number;
  emisor_id: number | null;
  contenido: string;
  leido: boolean;
  creado_en: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ChatDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [activeContact, setActiveContact] = useState<Empleado | null>(null);

  const [contacts, setContacts] = useState<Empleado[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadContacts, setUnreadContacts] = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function fetchContacts() {
    try {
      setLoadingContacts(true);
      const res = await empleadosApi.getAll(1, 100);
      if (res && res.items) {
        setContacts(res.items.filter((emp: Empleado) => emp.id !== user?.id));
      }
    } catch (e) {
      console.error('Error fetching contacts', e);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function fetchMensajes(destinatario_id: number) {
    try {
      setLoadingMessages(true);
      const data = await chatApi.getMensajes(destinatario_id);
      setMensajes(data);
    } catch (e) {
      console.error('Error fetching messages', e);
    } finally {
      setLoadingMessages(false);
    }
  }

  // Fetch contacts
  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      chatApi
        .getUnread()
        .then((data) => {
          if (Array.isArray(data)) {
            setUnreadContacts(new Set(data));
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // Load conversation when a contact is selected
  useEffect(() => {
    if (activeContact) {
      fetchMensajes(activeContact.id);
      // Remove from unread when opening
      setUnreadContacts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(activeContact.id);
        return newSet;
      });
    }
  }, [activeContact]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Handle incoming websocket messages
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type === 'chat') {
        const payload = message.payload as Mensaje;
        // If the message is from the active contact, append it
        if (activeContact && payload.emisor_id === activeContact.id) {
          setMensajes((prev) => [...prev, payload]);
        } else if (payload.emisor_id) {
          // Show unread badge on the contact list
          setUnreadContacts((prev) => new Set(prev).add(payload.emisor_id as number));
        }
      }
    });

    return unsubscribe;
  }, [activeContact, subscribe]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeContact || sending) return;

    const currentMsg = inputMessage;
    setInputMessage(''); // optimistic clear
    setSending(true);

    // Optimistic append
    const optMsg: Mensaje = {
      id: Date.now(),
      conversacion_id: 0,
      emisor_id: user?.id || 0,
      contenido: currentMsg,
      leido: false,
      creado_en: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, optMsg]);

    try {
      const res = await chatApi.sendMensaje({
        destinatario_id: activeContact.id,
        contenido: currentMsg,
      });
      // Replace optimistic message with actual db message (to get real ID)
      setMensajes((prev) => prev.map((m) => (m.id === optMsg.id ? res : m)));
    } catch (e) {
      console.error('Error sending message', e);
      // Remove optimistic message if failed
      setMensajes((prev) => prev.filter((m) => m.id !== optMsg.id));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) =>
    c.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-[400px] bg-white h-full shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col transform transition-transform duration-300">
        {/* State 1: Contact List */}
        {!activeContact ? (
          <>
            <div className="flex items-center justify-between p-6 border-b border-[#F3F4F6] shrink-0">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#44474A]">
                <MessageSquare className="text-[#A7313A]" /> Chat Empresarial
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[#858789] hover:bg-[#F3F4F6] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-[#F3F4F6]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A4A4A4]"
                />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  className="w-full h-10 pl-10 pr-4 bg-[#F8F9FA] border border-[#E1DFE0] rounded-full text-sm focus:outline-none focus:border-[#A7313A]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingContacts ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-[#A7313A]" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-[#858789]">
                  No se encontraron colaboradores.
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      className="flex items-center gap-4 p-4 border-b border-[#F3F4F6] hover:bg-[#F8F9FA] transition-colors text-left"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#A7313A] text-white flex items-center justify-center font-bold shrink-0">
                          {contact.nombre_completo.substring(0, 2).toUpperCase()}
                        </div>
                        {unreadContacts.has(contact.id) && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 truncate flex items-center justify-between">
                        <p
                          className={`font-bold truncate ${unreadContacts.has(contact.id) ? 'text-[#A7313A]' : 'text-[#44474A]'}`}
                        >
                          {contact.nombre_completo}
                        </p>
                        {unreadContacts.has(contact.id) && (
                          <span className="text-xs font-bold text-[#A7313A] bg-[#A7313A]/10 px-2 py-0.5 rounded-full">
                            Nuevo
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* State 2: Active Conversation */
          <>
            <div className="flex items-center gap-3 p-4 border-b border-[#F3F4F6] shrink-0 bg-white shadow-sm z-10">
              <button
                onClick={() => setActiveContact(null)}
                className="p-2 rounded-full text-[#858789] hover:bg-[#F3F4F6] transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#A7313A] text-white flex items-center justify-center font-bold shrink-0">
                  {activeContact.nombre_completo.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-[#44474A] leading-tight">
                    {activeContact.nombre_completo}
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] flex flex-col gap-4">
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-[#A7313A]" />
                </div>
              ) : mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#858789] opacity-50">
                  <MessageSquare size={48} className="mb-4" />
                  <p>Inicia la conversación</p>
                </div>
              ) : (
                mensajes.map((msg) => {
                  const isMine = msg.emisor_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl ${
                          isMine
                            ? 'bg-[#A7313A] text-white rounded-tr-sm'
                            : 'bg-white text-[#44474A] border border-[#E1DFE0] rounded-tl-sm shadow-sm'
                        }`}
                      >
                        <p className="text-[0.9rem] leading-snug">{msg.contenido}</p>
                        <span
                          className={`text-[0.65rem] mt-1 block text-right ${isMine ? 'text-white/70' : 'text-[#A4A4A4]'}`}
                        >
                          {new Date(msg.creado_en).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#F3F4F6] shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full h-12 pl-4 pr-12 bg-[#F8F9FA] border border-[#E1DFE0] rounded-full focus:outline-none focus:border-[#A7313A]"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="absolute right-2 w-8 h-8 rounded-full bg-[#A7313A] text-white flex items-center justify-center hover:bg-[#8a272f] transition-colors disabled:opacity-50"
                >
                  <Send size={16} className="-ml-0.5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
