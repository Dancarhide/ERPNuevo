import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaClipboardList, FaPlus, FaCheckCircle, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import client from '../../api/client';
import Modal from '../common/Modal';

interface Tarea {
  idtarea: number;
  titulo: string;
  descripcion: string;
  completada: boolean;
  fecha_vencimiento: string | null;
  prioridad: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ToDoDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' | 'confirm' = 'info', onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  // Get current user ID with multiple fallbacks
  const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
  const currentUser = sessionData?.user || sessionData;
  const currentUserId = currentUser?.id || currentUser?.idempleado || currentUser?.id_empleado;

  useEffect(() => {
    console.log('ToDoDrawer montado. ID de usuario:', currentUserId);
    console.log('Datos de sesión actual:', currentUser);
    
    if (isOpen) {
      if (currentUserId) {
        fetchTareas();
      } else {
        console.error('ToDoDrawer: Error Crítico - No se encontró ID de usuario en la sesión.', { sessionData });
      }
    }
  }, [isOpen, currentUserId]);

  const fetchTareas = async () => {
    try {
      if (!currentUserId) return;
      console.log(`Llamando API para tareas del usuario: ${currentUserId}`);
      setLoading(true);
      const res = await client.get(`/tareas/${currentUserId}`);
      console.log('Respuesta de la API de tareas:', res.data);
      setTareas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      showModal('Error', 'No se pudieron cargar las tareas. Intente de nuevo más tarde.', 'error');
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setLoading(true);
      await client.post('/tareas', {
        idempleado: currentUserId,
        titulo: newTaskTitle.trim(),
        descripcion: '',
        prioridad: 'Media',
        fecha_vencimiento: newTaskDate || null,
        asignado_por: currentUserId
      });
      setNewTaskTitle('');
      setNewTaskDate('');
      fetchTareas();
      // Optional: showModal('Éxito', 'Tarea creada correctamente', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      showModal('Error', 'Hubo un problema al crear la tarea.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (id: number) => {
    try {
      await client.patch(`/tareas/${id}/toggle`);
      setTareas(prev => prev.map(t => t.idtarea === id ? { ...t, completada: !t.completada } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
      showModal('Error', 'No se pudo actualizar el estado de la tarea.', 'error');
    }
  };

  const handleDeleteTask = async (id: number) => {
    showModal(
        'Confirmar eliminación', 
        '¿Estás seguro de que deseas eliminar esta tarea permanentemente?', 
        'confirm', 
        async () => {
            try {
                await client.delete(`/tareas/${id}`);
                setTareas(prev => prev.filter(t => t.idtarea !== id));
            } catch (error) {
                console.error('Error deleting task:', error);
                showModal('Error', 'No se pudo eliminar la tarea.', 'error');
            }
        }
    );
  };

  if (!isOpen) return null;

  const activeTasks = tareas.filter(t => !t.completada);
  const completedTasks = tareas.filter(t => t.completada);

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        
        <div className="drawer-header">
          <h2 className="drawer-title">
            <FaClipboardList /> Tareas Pendientes
          </h2>
          <button className="drawer-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="drawer-content">
            
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--color-bg-white)', padding: '15px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <input 
                type="text" 
                className="drawer-input" 
                placeholder="¿Qué hay que hacer?" 
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                disabled={loading}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                 <input 
                    type="date" 
                    className="drawer-input" 
                    value={newTaskDate}
                    onChange={e => setNewTaskDate(e.target.value)}
                    disabled={loading}
                 />
                 <button type="submit" className="drawer-btn" style={{ whiteSpace: 'nowrap' }} disabled={loading || !newTaskTitle.trim()}>
                    <FaPlus /> Agregar
                 </button>
              </div>
          </form>

          {activeTasks.length > 0 && (
            <>
              <h3 style={{ margin: '10px 0 5px 0', fontSize: '1rem', color: 'var(--color-primary)' }}>Por hacer ({activeTasks.length})</h3>
              {activeTasks.map(t => (
                <div key={t.idtarea} className="todo-card">
                    <FaCheckCircle 
                      color="#e1dfe0" 
                      size={20} 
                      style={{ cursor: 'pointer', marginTop: '2px' }} 
                      onClick={() => handleToggleTask(t.idtarea)}
                    />
                    <div className="todo-info">
                        <p className="todo-title">{t.titulo}</p>
                        {t.fecha_vencimiento && (
                          <p className="todo-desc" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px', color: '#A7313A', fontWeight: 'bold' }}>
                              <FaCalendarAlt /> {new Date(t.fecha_vencimiento).toLocaleDateString()}
                          </p>
                        )}
                    </div>
                    <FaTrash size={14} color="var(--color-text-muted)" style={{ cursor: 'pointer' }} onClick={() => handleDeleteTask(t.idtarea)} />
                </div>
              ))}
            </>
          )}

          {completedTasks.length > 0 && (
            <>
              <h3 style={{ margin: '15px 0 5px 0', fontSize: '1rem', color: 'var(--color-text-muted)' }}>Completadas</h3>
              {completedTasks.map(t => (
                <div key={t.idtarea} className="todo-card completed">
                    <FaCheckCircle 
                      color="#2ecc71" 
                      size={20} 
                      style={{ cursor: 'pointer', marginTop: '2px' }} 
                      onClick={() => handleToggleTask(t.idtarea)}
                    />
                    <div className="todo-info">
                        <p className="todo-title">{t.titulo}</p>
                    </div>
                    <FaTrash size={14} color="var(--color-text-muted)" style={{ cursor: 'pointer' }} onClick={() => handleDeleteTask(t.idtarea)} />
                </div>
              ))}
            </>
          )}

          {tareas.length === 0 && (
            <div className="chat-placeholder" style={{ marginTop: '3rem' }}>
              <FaClipboardList size={40} style={{ opacity: 0.1 }} />
              <p>No tienes tareas pendientes.</p>
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
        onConfirm={modalConfig.onConfirm}
      />
    </div>,
    document.body
  );
};

export default ToDoDrawer;
