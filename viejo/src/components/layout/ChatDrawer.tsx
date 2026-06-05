import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaCommentAlt, FaPaperPlane, FaSearch, FaArrowLeft, FaUserTie, FaSmile } from 'react-icons/fa';
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
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.focus();
      return () => clearInterval(interval);
    } else {
      setMessages([]);
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

  const filteredContacts = contacts.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (name: string) => {
    const colors = ['#A7313A', '#44474A', '#2D3436', '#636E72', '#0984E3', '#6C5CE7', '#D63031', '#E84393'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.fecha_envio).toLocaleDateString('es-ES', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (!isOpen) return null;

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        
        <div className="drawer-header chat-header-modern">
          {selectedContact ? (
            <div className="chat-active-contact">
              <button className="chat-back-btn" onClick={() => setSelectedContact(null)}>
                <FaArrowLeft />
              </button>
              <div className="chat-avatar-small" style={{ background: getAvatarColor(selectedContact.nombre) }}>
                {selectedContact.nombre.substring(0, 2).toUpperCase()}
              </div>
              <div className="chat-header-info">
                <span className="chat-header-name">{selectedContact.nombre}</span>
              </div>
            </div>
          ) : (
            <h2 className="drawer-title">
              <FaCommentAlt /> Chat Empresarial
            </h2>
          )}
          <button className="drawer-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="drawer-content chat-content-modern">
          {!selectedContact ? (
            <div className="chat-list-container">
              <div className="chat-search-wrapper">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar colegas..." 
                  className="chat-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="chat-contacts-scroll">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <div key={contact.id} className="chat-item-modern" onClick={() => setSelectedContact(contact)}>
                      <div className="chat-avatar-modern" style={{ backgroundColor: `${getAvatarColor(contact.nombre)}15`, color: getAvatarColor(contact.nombre) }}>
                        {contact.nombre.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="chat-item-info">
                        <div className="chat-item-top">
                          <span className="chat-item-name">{contact.nombre}</span>
                          <span className="chat-item-time">{contact.area}</span>
                        </div>
                        <p className="chat-item-desc">{contact.puesto}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="chat-empty-state">
                    <FaUserTie size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                    <p>No se encontraron contactos</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="chat-conversation-container">
              <div className="chat-messages-area">
                {messages.length === 0 ? (
                  <div className="chat-empty-convo">
                     <div className="welcome-chat-info">
                        <div className="chat-avatar-welcome" style={{ background: getAvatarColor(selectedContact.nombre) }}>
                           {selectedContact.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <h3>{selectedContact.nombre}</h3>
                        <p>{selectedContact.puesto} · {selectedContact.area}</p>
                        <span className="security-note">Las conversaciones están protegidas y son para uso interno.</span>
                     </div>
                  </div>
                ) : (
                  Object.entries(messageGroups).map(([date, msgs]) => (
                    <React.Fragment key={date}>
                      <div className="chat-date-separator">
                        <span>{date}</span>
                      </div>
                      {msgs.map((msg, idx) => {
                        const isMine = msg.emisor_id === currentUserId;
                        const nextMsg = msgs[idx + 1];
                        const isLastInSequence = !nextMsg || nextMsg.emisor_id !== msg.emisor_id;
                        
                        return (
                          <div key={msg.id} className={`chat-msg-wrapper ${isMine ? 'mine' : 'theirs'} ${isLastInSequence ? 'last-in-sequence' : ''}`}>
                            <div className="chat-msg-bubble">
                              {msg.contenido}
                              <span className="chat-msg-time">
                                {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMine && <span className="read-status"> ✓✓</span>}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-area-improved">
                <div className="chat-input-wrapper-inner">
                  <button type="button" className="chat-tool-btn" title="Emojis"><FaSmile /></button>
                  <input 
                    ref={inputRef}
                    type="text" 
                    className="chat-input-field-new" 
                    placeholder="Escribe un mensaje..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={loading}
                  />
                  <button type="submit" className="chat-send-btn-new" disabled={loading || !newMessage.trim()}>
                    <FaPaperPlane />
                  </button>
                </div>
              </form>
            </div>
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
