import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaUserEdit, FaIdBadge, FaBalanceScale, FaUserShield, FaStethoscope, FaPhone, FaMapMarkerAlt, FaEnvelope, FaAddressBook, FaArrowRight, FaArrowLeft, FaSave, FaEye, FaFilePdf } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import { validarRFC, validarCURP, calcularDiasVacaciones } from '../../utils/PayrollUtils';
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
  sueldo?: number | string;
  sueldo_fiscal?: number | string;
  infonavit_mensual?: number | string;
  vales_despensa_pct?: number | string;
  fondo_ahorro_pct?: number | string;
  fecha_ingreso?: string;
  familiar?: {
    nombre: string;
    telefono: string;
    parentesco: string;
  };
  salud?: {
    nss: string;
    tipo_sangre: string;
    discapacidad: boolean;
  };
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
  initialMode?: 'view' | 'edit';
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, onSave, empleado, initialMode = 'edit' }) => {
  const [formData, setFormData] = useState<Empleado | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (empleado) {
        setFormData({ ...empleado });
        setIsEditing(initialMode === 'edit');
      } else {
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
          idrol: 6,
          idarea: null,
          idvacante: null,
          sueldo: 0,
          sueldo_fiscal: 0,
          infonavit_mensual: 0,
          vales_despensa_pct: 0,
          fondo_ahorro_pct: 0,
          fecha_ingreso: new Date().toISOString().split('T')[0],
          familiar: { nombre: '', telefono: '', parentesco: '' },
          salud: { nss: '', tipo_sangre: '', discapacidad: false }
        });
        setIsEditing(true);
        setCurrentStep(1);
      }

      const fetchRoles = async () => {
        try {
          const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
          const token = userDataStr ? JSON.parse(userDataStr)?.token : null;
          const host = window.location.hostname;
          const res = await fetch(`http://${host}:4000/api/roles`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) setRoles(await res.json());
        } catch (e) { console.error(e); }
      };
      fetchRoles();
    }
  }, [empleado, isOpen, initialMode]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (name.startsWith('familiar.')) {
        const field = name.split('.')[1];
        setFormData(p => p ? ({ ...p, familiar: { ...p.familiar, [field]: value } as any }) : null);
    } else if (name.startsWith('salud.')) {
        const field = name.split('.')[1];
        const val = type === 'checkbox' ? (e.target as any).checked : value;
        setFormData(p => p ? ({ ...p, salud: { ...p.salud, [field]: val } as any }) : null);
    } else {
        setFormData(p => p ? ({ ...p, [name]: value }) : null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const renderViewField = (label: string, value: string | number | null | undefined) => (
    <div className="view-field-item">
      <span className="view-field-label">{label}</span>
      <span className="view-field-value">{value || 'No registrado'}</span>
    </div>
  );

  const handleDownloadPDF = () => {
    if (!formData) return;

    const doc = new jsPDF();
    const primaryColor = '#A7313A';
    const textColor = '#1e293b';
    const lightText = '#64748b';

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPEDIENTE DIGITAL', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 20, 30);

    // Body
    doc.setTextColor(textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(formData.nombre_completo_empleado.toUpperCase(), 20, 55);

    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text(formData.puesto?.toUpperCase() || 'COLABORADOR', 20, 62);

    // Section 1: Personal
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 70, 190, 70);
    
    doc.setTextColor(textColor);
    doc.setFontSize(12);
    doc.text('DATOS DE IDENTIDAD', 20, 80);
    
    doc.setFontSize(10);
    doc.setTextColor(lightText); doc.text('CORREO:', 20, 90); doc.setTextColor(textColor); doc.text(formData.email_empleado || 'N/A', 60, 90);
    doc.setTextColor(lightText); doc.text('TELÉFONO:', 20, 97); doc.setTextColor(textColor); doc.text(formData.telefono_empleado || 'N/A', 60, 97);
    doc.setTextColor(lightText); doc.text('DIRECCIÓN:', 20, 104); doc.setTextColor(textColor); doc.text(formData.direccion_empleado || 'N/A', 60, 104);

    // Section 2: Fiscal
    doc.setTextColor(textColor);
    doc.setFontSize(12);
    doc.text('INFORMACIÓN FISCAL Y NÓMINA', 20, 118);
    doc.setFontSize(10);
    doc.setTextColor(lightText); doc.text('CURP:', 20, 128); doc.setTextColor(textColor); doc.text(formData.curp || 'N/A', 60, 128);
    doc.setTextColor(lightText); doc.text('RFC:', 20, 135); doc.setTextColor(textColor); doc.text(formData.rfc || 'N/A', 60, 135);
    doc.setTextColor(lightText); doc.text('SUELDO REAL:', 20, 142); doc.setTextColor(textColor); doc.text(`$${formData.sueldo || '0.00'}`, 60, 142);
    doc.setTextColor(lightText); doc.text('SUELDO IMSS:', 20, 149); doc.setTextColor(textColor); doc.text(`$${formData.sueldo_fiscal || '0.00'}`, 60, 149);

    // Section 3: Salud y Emergencias
    doc.setTextColor(textColor);
    doc.setFontSize(12);
    doc.text('SALUD Y EMERGENCIAS', 20, 163);
    doc.setFontSize(10);
    doc.setTextColor(lightText); doc.text('NSS:', 20, 173); doc.setTextColor(textColor); doc.text(formData.salud?.nss || 'N/A', 60, 173);
    doc.setTextColor(lightText); doc.text('TIPO SANGRE:', 20, 180); doc.setTextColor(textColor); doc.text(formData.salud?.tipo_sangre || 'N/A', 60, 180);
    doc.setTextColor(lightText); doc.text('FAMILIAR:', 20, 187); doc.setTextColor(textColor); doc.text(formData.familiar?.nombre || 'N/A', 60, 187);
    doc.setTextColor(lightText); doc.text('TEL. EMERGENCIA:', 20, 194); doc.setTextColor(textColor); doc.text(formData.familiar?.telefono || 'N/A', 60, 194);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(lightText);
    doc.text('Documento generado automáticamente por el Sistema ERP Corporativo.', 105, 280, { align: 'center' });

    doc.save(`Expediente_${formData.nombre_completo_empleado.replace(/\s+/g, '_')}.pdf`);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-header">
          <div className="header-title-clean">
            <div className="title-with-badge">
              <h3>{formData.idempleado === 0 ? 'Alta de Colaborador' : isEditing ? 'Editando Expediente' : 'Expediente Digital'}</h3>
            </div>
          </div>
          <button className="close-btn-clean" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}><FaTimes /></button>
        </div>

        <div className="edit-modal-main-layout">
          {isEditing && (
            <div className="modal-sidebar-wizard">
              {[
                { s: 1, l: 'Identidad', i: <FaIdBadge /> },
                { s: 2, l: 'Fiscal', i: <FaBalanceScale /> },
                { s: 3, l: 'Emergencias', i: <FaUserShield /> },
                { s: 4, l: 'Salud', i: <FaStethoscope /> }
              ].map(step => (
                <div key={step.s} className={`wizard-step-item ${currentStep === step.s ? 'active' : ''} ${currentStep > step.s ? 'completed' : ''}`} onClick={() => setCurrentStep(step.s)}>
                  <div className="step-number">{currentStep > step.s ? <FaCheckCircle /> : step.s}</div>
                  <div className="step-label">{step.l}</div>
                </div>
              ))}
            </div>
          )}

          <div className="edit-modal-body-content">
            <div className="edit-modal-scroll-area">
              {!isEditing ? (
                <div className="profile-view-dashboard step-content-fade">
                   <div className="view-profile-header">
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #A7313A, #8F2930)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', boxShadow: '0 8px 16px rgba(167, 49, 58, 0.2)' }}>{getInitials(formData.nombre_completo_empleado)}</div>
                      <div className="view-profile-main-info" style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>{formData.nombre_completo_empleado}</h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
                           <span className="badge-role" style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid #dbeafe' }}>
                             {roles.find(r => r.idrol === formData.idrol)?.nombre_rol || 'Empleado'}
                           </span>
                           <span className={`badge-status status-${formData.estatus_empleado?.toLowerCase()}`} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                             {formData.estatus_empleado}
                           </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-modern outline" onClick={handleDownloadPDF} title="Descargar Expediente PDF">
                          <FaFilePdf style={{ color: '#ef4444' }} /> PDF
                        </button>
                        <button className="btn-modern outline" onClick={() => setIsEditing(true)}>
                          <FaUserEdit /> Editar Expediente
                        </button>
                      </div>
                   </div>
                   
                   <div className="view-grid">
                      <div className="view-card">
                         <h4><FaIdBadge /> Identidad y Puesto</h4>
                         {renderViewField('Nombre Completo', formData.nombre_completo_empleado)}
                         {renderViewField('Puesto', formData.puesto)}
                         {renderViewField('Correo', formData.email_empleado)}
                         {renderViewField('Teléfono', formData.telefono_empleado)}
                      </div>
                      <div className="view-card">
                         <h4><FaBalanceScale /> Nómina y Fiscal</h4>
                         {renderViewField('CURP', formData.curp)}
                         {renderViewField('RFC', formData.rfc)}
                         {renderViewField('Sueldo Real', `$${formData.sueldo}`)}
                         {renderViewField('Sueldo Fiscal', `$${formData.sueldo_fiscal}`)}
                      </div>
                      <div className="view-card">
                         <h4><FaUserShield /> Emergencias</h4>
                         {renderViewField('Nombre Familiar', formData.familiar?.nombre)}
                         {renderViewField('Parentesco', formData.familiar?.parentesco)}
                         {renderViewField('Teléfono', formData.familiar?.telefono)}
                      </div>
                      <div className="view-card">
                         <h4><FaStethoscope /> Información Médica</h4>
                         {renderViewField('NSS', formData.salud?.nss)}
                         {renderViewField('Tipo Sangre', formData.salud?.tipo_sangre)}
                         {renderViewField('Discapacidad', formData.salud?.discapacidad ? 'Sí' : 'No')}
                      </div>
                      <div className="view-card" style={{ gridColumn: 'span 2' }}>
                         <h4><FaMapMarkerAlt /> Domicilio</h4>
                         {renderViewField('Dirección Completa', formData.direccion_empleado)}
                      </div>
                   </div>
                </div>
              ) : (
                <form id="edit-form" onSubmit={async (e) => { e.preventDefault(); setIsSubmitting(true); await onSave(formData); setIsSubmitting(false); onClose(); }}>
                  {currentStep === 1 && (
                    <div className="form-section-modern step-content-fade">
                       <h4 className="section-title-modern">1. Identidad</h4>
                       <div className="form-grid-clean">
                          <div className="form-group-clean full-width"><label>Nombre Completo</label><input type="text" name="nombre_completo_empleado" value={formData.nombre_completo_empleado} onChange={handleChange} required /></div>
                          <div className="form-group-clean"><label>Puesto</label><input type="text" name="puesto" value={formData.puesto || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean">
                             <label>Rol de Acceso</label>
                             <select name="idrol" value={formData.idrol || 6} onChange={(e) => setFormData(p => p ? ({ ...p, idrol: parseInt(e.target.value) }) : null)}>
                               {roles.map(r => <option key={r.idrol} value={r.idrol}>{r.nombre_rol}</option>)}
                             </select>
                          </div>
                          <div className="form-group-clean"><label>Email</label><input type="email" name="email_empleado" value={formData.email_empleado || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean"><label>Teléfono</label><input type="text" name="telefono_empleado" value={formData.telefono_empleado || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean full-width"><label>Dirección Domiciliaria</label><input type="text" name="direccion_empleado" value={formData.direccion_empleado || ''} onChange={handleChange} /></div>
                       </div>
                    </div>
                  )}
                  {currentStep === 2 && (
                    <div className="form-section-modern step-content-fade">
                       <h4 className="section-title-modern">2. Nómina y Fiscal</h4>
                       <div className="form-grid-clean">
                          <div className="form-group-clean"><label>CURP</label><input type="text" name="curp" value={formData.curp || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean"><label>RFC</label><input type="text" name="rfc" value={formData.rfc || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean"><label>Sueldo Real ($)</label><input type="number" name="sueldo" value={formData.sueldo || 0} onChange={handleChange} /></div>
                          <div className="form-group-clean"><label>Sueldo Fiscal ($)</label><input type="number" name="sueldo_fiscal" value={formData.sueldo_fiscal || 0} onChange={handleChange} /></div>
                       </div>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="form-section-modern step-content-fade">
                       <h4 className="section-title-modern">3. Emergencias</h4>
                       <div className="form-grid-clean">
                          <div className="form-group-clean full-width"><label>Familiar Responsable</label><input type="text" name="familiar.nombre" value={formData.familiar?.nombre || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean"><label>Parentesco</label><input type="text" name="familiar.parentesco" value={formData.familiar?.parentesco || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean"><label>Teléfono Emergencia</label><input type="text" name="familiar.telefono" value={formData.familiar?.telefono || ''} onChange={handleChange} /></div>
                       </div>
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div className="form-section-modern step-content-fade">
                       <h4 className="section-title-modern">4. Salud</h4>
                       <div className="form-grid-clean">
                          <div className="form-group-clean"><label>NSS</label><input type="text" name="salud.nss" value={formData.salud?.nss || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean"><label>Tipo Sangre</label><input type="text" name="salud.tipo_sangre" value={formData.salud?.tipo_sangre || ''} onChange={handleChange} /></div>
                          <div className="form-group-clean full-width checkbox-group-modern">
                            <input type="checkbox" id="modal-dis" name="salud.discapacidad" checked={formData.salud?.discapacidad || false} onChange={handleChange} />
                            <label htmlFor="modal-dis">¿Presenta alguna discapacidad?</label>
                          </div>
                       </div>
                    </div>
                  )}
                </form>
              )}
            </div>
            
            <div className="edit-modal-footer">
               <div className="footer-actions-left">
                  {isEditing && currentStep > 1 && <button type="button" className="btn-modern outline" onClick={() => setCurrentStep(currentStep-1)}><FaArrowLeft /> Anterior</button>}
                  {!isEditing && <span className="footer-status-text">Visualizando Expediente Corporativo</span>}
               </div>
               <div className="footer-actions-right">
                {isEditing ? (
                  currentStep < 4 ? (
                    <button type="button" className="btn-modern primary" onClick={() => setCurrentStep(currentStep+1)}>Siguiente <FaArrowRight /></button>
                  ) : (
                    <button type="submit" form="edit-form" className="btn-modern primary" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Finalizar'}</button>
                  )
                ) : (
                  <button type="button" className="btn-modern primary" onClick={() => setIsEditing(true)}>Entrar a Modo Edición</button>
                )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditEmployeeModal;
