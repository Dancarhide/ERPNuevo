import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaCommentAlt, FaPaperPlane } from 'react-icons/fa';
import client from '../../api/client';
import Modal from '../common/Modal';

interface Contact {
  id: number;
  nombre: string;
  puesto: string;
  area: string;
  rol: string;
}

interface Message {
  id: number;
  emisor_id: number;
  contenido: string;
  fecha_envio: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' | 'confirm' = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  // Get current user ID
  const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
  const currentUser = sessionData?.user || sessionData;
  const currentUserId = currentUser?.id || 1;

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
      const interval = setInterval(() => fetchMessages(selectedContact.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await client.get(`/chat/contacts?userId=${currentUserId}`);
      setContacts(res.data.contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      showModal('Error', 'No se pudieron cargar los contactos.', 'error');
    }
  };

  const fetchMessages = async (otherId: number) => {
    try {
      const res = await client.get(`/chat/conversations/${otherId}?userId=${currentUserId}`);
      setMessages(res.data.conversation);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newMessage.trim()) return;

    try {
      setLoading(true);
      await client.post(`/chat/messages?userId=${currentUserId}`, {
        toId: selectedContact.id,
        message: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedContact.id);
    } catch (error) {
      console.error('Error sending message:', error);
      showModal('Error', 'No se pudo enviar el mensaje.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        
        <div className="drawer-header">
          <h2 className="drawer-title">
            <FaCommentAlt /> {selectedContact ? selectedContact.nombre : 'Chat Empresarial'}
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedContact && (
              <button className="drawer-close-btn" onClick={() => setSelectedContact(null)} title="Volver a contactos">
                 <FaCommentAlt style={{ transform: 'scaleX(-1)', fontSize: '0.9rem' }} />
              </button>
            )}
            <button className="drawer-close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="drawer-content" style={{ padding: selectedContact ? '0' : '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {!selectedContact ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
               <div className="chat-placeholder" style={{ margin: '2rem 0', textAlign: 'center' }}>
                <FaCommentAlt size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>Selecciona un contacto para iniciar una conversación.</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                {contacts.map(contact => (
                  <div key={contact.id} className="chat-item" onClick={() => setSelectedContact(contact)}>
                    <div className="chat-avatar">{contact.nombre.substring(0, 2).toUpperCase()}</div>
                    <div className="todo-info">
                      <p className="todo-title">{contact.nombre}</p>
                      <p className="todo-desc">{contact.puesto} · {contact.area}</p>
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px', fontSize: '0.9rem' }}>
                    No se encontraron otros empleados disponibles.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '10px' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.emisor_id === currentUserId ? 'mine' : 'theirs'}`}>
                    {msg.contenido}
                    <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>
                      {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', padding: '1.2rem', backgroundColor: 'var(--color-bg-white)', borderTop: '1px solid var(--color-border)' }}>
                 <input 
                    type="text" 
                    className="drawer-input" 
                    placeholder="Escribe un mensaje..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={loading}
                 />
                 <button type="submit" className="drawer-btn" disabled={loading || !newMessage.trim()}>
                    <FaPaperPlane />
                 </button>
              </form>
            </>
          )}
        </div>

      </div>

      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>,
    document.body
  );
};

export default ChatDrawer;
