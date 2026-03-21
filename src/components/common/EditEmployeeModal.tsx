import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import './styles/EditEmployeeModal.css';

interface Empleado {
  idempleado: number;
  nombre_completo_empleado: string;
  email_empleado: string | null;
  telefono_empleado: string | null;
  curp: string | null;
  rfc: string | null;
  direccion_empleado: string | null;
  estatus_empleado: string | null;
  puesto: string | null;
  idrol: number | null;
  idarea: number | null;
  idvacante?: number | null;
}

interface Vacante {
  idvacante: number;
  titulo: string;
  estatus: string;
  cantidad_solicitada: number;
  cantidad_contratada: number;
}

interface Role {
  idrol: number;
  nombre_rol: string;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (empleado: Empleado) => void;
  empleado: Empleado | null;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, onSave, empleado }) => {
  const [formData, setFormData] = useState<Empleado | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      fetchVacantes();
    }
    if (empleado) {
      setFormData({ ...empleado });
    } else if (isOpen) {
      // Initialize for new employee
      setFormData({
        idempleado: 0,
        nombre_completo_empleado: '',
        email_empleado: '',
        telefono_empleado: '',
        curp: '',
        rfc: '',
        direccion_empleado: '',
        estatus_empleado: 'Activo',
        puesto: '',
        idrol: 6, // Default to Empleado Normal
        idarea: null,
        idvacante: null
      });
    }
  }, [empleado, isOpen]);

  const fetchRoles = async () => {
    try {
      const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
      const token = sessionData?.token;
      const host = window.location.hostname;
      const res = await fetch(`http://${host}:4000/api/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchVacantes = async () => {
    try {
      const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
      const token = sessionData?.token;
      const host = window.location.hostname;
      const res = await fetch(`http://${host}:4000/api/vacantes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const activeVacantes = data.filter((v: any) => v.estatus === 'Abierta');
        setVacantes(activeVacantes);
      }
    } catch (error) {
      console.error('Error fetching vacantes:', error);
    }
  };


  // Bloquear el scroll del cuerpo cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Limpieza al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      setIsSubmitting(true);
      await onSave(formData);
      setIsSubmitting(false);
      onClose();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(formData.nombre_completo_empleado);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-header">
          <div className="header-title-clean">
            <h3>{formData.idempleado === 0 ? 'Registro de Nuevo Empleado' : 'Edición de Perfil'}</h3>
            <span className="id-badge">{formData.idempleado === 0 ? 'NUEVO' : `ID: #${formData.idempleado.toString().padStart(4, '0')}`}</span>
          </div>
          <button className="close-btn-clean" onClick={onClose}><FaTimes /></button>
        </div>


        <form onSubmit={handleSubmit} className="edit-modal-body-scroll">
          
          <div className="profile-photo-section">
            <div className="photo-circle">
                {initials}
            </div>
            <div className="photo-label">Avatar del Colaborador</div>
          </div>

          <div className="form-section">
            <h4 className="section-title"><span className="step-num">1</span> Datos Generales</h4>
            <div className="form-grid-clean">
              <div className="form-group-clean full-width">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  name="nombre_completo_empleado"
                  value={formData.nombre_completo_empleado}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group-clean">
                <label>Puesto</label>
                <input
                  type="text"
                  name="puesto"
                  value={formData.puesto || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-clean">
                <label>Estado</label>
                <select
                  name="estatus_empleado"
                  value={formData.estatus_empleado || 'Activo'}
                  onChange={handleChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Vacaciones">Vacaciones</option>
                </select>
              </div>

              <div className="form-group-clean">
                <label>Rol del Sistema</label>
                <select
                  name="idrol"
                  value={formData.idrol || 6}
                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, idrol: parseInt(e.target.value) }) : null)}
                >
                  {roles.map(r => (
                    <option key={r.idrol} value={r.idrol}>{r.nombre_rol}</option>
                  ))}
                </select>
              </div>

              {formData.idempleado === 0 && (
                <div className="form-group-clean">
                  <label>Vacante a Cubrir (Vincular)</label>
                  <select
                    name="idvacante"
                    value={formData.idvacante || ''}
                    onChange={(e) => setFormData(prev => prev ? ({ ...prev, idvacante: e.target.value ? parseInt(e.target.value) : null }) : null)}
                  >
                    <option value="">-- No vincular --</option>
                    {vacantes.map(v => (
                      <option key={v.idvacante} value={v.idvacante}>
                        {v.titulo} ({v.cantidad_contratada}/{v.cantidad_solicitada})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '4px', display: 'block' }}>
                    * Al vincular, se descontará una plaza de la vacante automáticamente.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title"><span className="step-num">2</span> Contacto y Ubicación</h4>
            <div className="form-grid-clean">
              <div className="form-group-clean">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  name="email_empleado"
                  value={formData.email_empleado || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-clean">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono_empleado"
                  value={formData.telefono_empleado || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-clean full-width">
                <label>Dirección</label>
                <input
                  type="text"
                  name="direccion_empleado"
                  value={formData.direccion_empleado || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title"><span className="step-num">3</span> Identificación Fiscal</h4>
            <div className="form-grid-clean">
              <div className="form-group-clean">
                <label>CURP</label>
                <input
                  type="text"
                  name="curp"
                  value={formData.curp || ''}
                  onChange={handleChange}
                  maxLength={18}
                />
              </div>

              <div className="form-group-clean">
                <label>RFC</label>
                <input
                  type="text"
                  name="rfc"
                  value={formData.rfc || ''}
                  onChange={handleChange}
                  maxLength={13}
                />
              </div>
            </div>
          </div>

          <div className="edit-modal-footer-fixed">
            <button type="button" className="btn-cancel-clean" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-save-clean" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : <><FaSave /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditEmployeeModal;
