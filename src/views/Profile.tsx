import { FaUserEdit, FaIdBadge, FaBalanceScale, FaUserShield, FaStethoscope } from 'react-icons/fa';
import './styles/Profile.css';
import EditEmployeeModal from '../components/common/EditEmployeeModal';
import { useState, useEffect } from 'react';

const Profile: React.FC = () => {
  const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
  const initialUserData = sessionData?.user || sessionData;
  const idEmpleado = initialUserData?.idempleado || 0;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [idEmpleado]);

  const fetchUserData = async () => {
    console.log('Fetching user data for ID:', idEmpleado);
    if (!idEmpleado) {
        console.warn('No idEmpleado found in session');
        setLoading(false);
        // Fallback to what we have in session if possible
        if (initialUserData) {
            // Map legacy fields if necessary
            const mappedUser = {
                ...initialUserData,
                nombre_completo_empleado: initialUserData.nombre_completo_empleado || initialUserData.nombre || 'Usuario',
                email_empleado: initialUserData.email_empleado || initialUserData.email,
                telefono_empleado: initialUserData.telefono_empleado || initialUserData.telefono,
                direccion_empleado: initialUserData.direccion_empleado || initialUserData.direccion
            };
            setCurrentUser(mappedUser);
        }
        return;
    }

    try {
        const host = window.location.hostname;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
        const token = sessionData?.token;

        const response = await fetch(`http://${host}:4000/api/empleados/${idEmpleado}`, {
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            console.log('Profile data fetched successfully:', data);
            setCurrentUser(data);
        } else {
            console.error('Profile fetch failed with status:', response.status);
            if (initialUserData) {
                const mappedUser = {
                    ...initialUserData,
                    nombre_completo_empleado: initialUserData.nombre_completo_empleado || initialUserData.nombre || 'Usuario',
                    email_empleado: initialUserData.email_empleado || initialUserData.email,
                    telefono_empleado: initialUserData.telefono_empleado || initialUserData.telefono,
                    direccion_empleado: initialUserData.direccion_empleado || initialUserData.direccion
                };
                setCurrentUser(mappedUser);
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('Profile fetch timed out');
        } else {
            console.error('Error fetching profile:', error);
        }
        
        if (initialUserData) {
             const mappedUser = {
                ...initialUserData,
                nombre_completo_empleado: initialUserData.nombre_completo_empleado || initialUserData.nombre || 'Usuario',
                email_empleado: initialUserData.email_empleado || initialUserData.email,
                telefono_empleado: initialUserData.telefono_empleado || initialUserData.telefono,
                direccion_empleado: initialUserData.direccion_empleado || initialUserData.direccion
            };
            setCurrentUser(mappedUser);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedEmp: any) => {
    try {
      const host = window.location.hostname;
      const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
      const token = sessionData?.token;

      const response = await fetch(`http://${host}:4000/api/empleados/${idEmpleado}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedEmp),
      });

      if (response.ok) {
        // Update local state and storage
        const newUser = { ...currentUser, ...updatedEmp };
        setCurrentUser(newUser);
        
        // Update storage so changes persist on reload
        const sessionDataRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (sessionDataRaw) {
             const data = JSON.parse(sessionDataRaw);
             if (data.user) {
                 data.user = { ...data.user, ...updatedEmp };
             } else {
                 data.nombre = updatedEmp.nombre_completo_empleado;
                 data.email = updatedEmp.email_empleado;
                 // Add other fields as needed
             }
             if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(data));
             if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(data));
        }
        
        window.location.reload(); // Refresh to reflect changes everywhere
      } else {
        alert('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error de conexión');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const initials = currentUser ? getInitials(currentUser.nombre_completo_empleado) : '??';

  if (loading) return (
    <div className="profile-dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '20px', color: '#64748b' }}>Cargando expediente digital...</p>
        <button 
            onClick={() => setLoading(false)} 
            style={{ marginTop: '20px', background: 'transparent', border: '1px solid #cbd5e1', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
            Omitir espera y usar datos locales
        </button>
    </div>
  );
  if (!currentUser) return <div className="profile-dashboard-wrapper">No se encontró información del perfil.</div>;

  return (
    <div className="profile-dashboard-wrapper">
      <div className="profile-cv-paper step-content-fade">
        <header className="cv-header">
            <div className="cv-avatar">{initials}</div>
            <div className="cv-name-block">
                <h1>{currentUser.nombre_completo_empleado}</h1>
                <p className="cv-title">{currentUser.puesto || 'Colaborador'}</p>
                <div className="cv-contact-bar">
                    <span>{currentUser.email_empleado || 'No registrado'}</span>
                    <span className="dot">•</span>
                    <span>{currentUser.telefono_empleado || 'No registrado'}</span>
                    <span className="dot">•</span>
                    <span>{currentUser.estatus_empleado || 'Activo'}</span>
                </div>
            </div>
            <button className="btn-cv-edit" onClick={() => setIsEditModalOpen(true)}>
                <FaUserEdit /> Editar Expediente
            </button>
        </header>

        <div className="cv-body">
            {/* Sección: Identidad */}
            <section className="cv-section">
                <h2 className="cv-section-title"><FaIdBadge /> Datos de Identidad</h2>
                <div className="cv-data-row">
                    <div className="cv-field">
                        <span className="field-label">Dirección Completa</span>
                        <span className="field-value">{currentUser.direccion_empleado || 'No registrada'}</span>
                    </div>
                </div>
            </section>

            {/* Sección: Fiscal y Laboral */}
            <section className="cv-section">
                <h2 className="cv-section-title"><FaBalanceScale /> Información Fiscal y Laboral</h2>
                <div className="cv-grid">
                    <div className="cv-field">
                        <span className="field-label">CURP</span>
                        <span className="field-value">{currentUser.curp || 'N/A'}</span>
                    </div>
                    <div className="cv-field">
                        <span className="field-label">RFC</span>
                        <span className="field-value">{currentUser.rfc || 'N/A'}</span>
                    </div>
                    <div className="cv-field">
                        <span className="field-label">Sueldo Bruto Mensual</span>
                        <span className="field-value">${currentUser.sueldo?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="cv-field">
                        <span className="field-label">Sueldo Registrado (IMSS)</span>
                        <span className="field-value">${currentUser.sueldo_fiscal?.toLocaleString() || '0'}</span>
                    </div>
                </div>
            </section>

            {/* Sección: Emergencias */}
            <section className="cv-section">
                <h2 className="cv-section-title"><FaUserShield /> Contacto de Emergencia</h2>
                <div className="cv-grid">
                    <div className="cv-field big">
                        <span className="field-label">Nombre del Familiar</span>
                        <span className="field-value">{currentUser.familiar?.nombre || 'No registrado'}</span>
                    </div>
                    <div className="cv-field">
                        <span className="field-label">Parentesco</span>
                        <span className="field-value">{currentUser.familiar?.parentesco || 'N/A'}</span>
                    </div>
                    <div className="cv-field">
                        <span className="field-label">Teléfono</span>
                        <span className="field-value">{currentUser.familiar?.telefono || 'N/A'}</span>
                    </div>
                </div>
            </section>

            {/* Sección: Salud */}
            <section className="cv-section">
                <h2 className="cv-section-title"><FaStethoscope /> Seguridad y Salud</h2>
                <div className="cv-grid">
                    <div className="cv-field">
                        <span className="field-label">NSS (IMSS)</span>
                        <span className="field-value">{currentUser.salud?.nss || 'Por asignar'}</span>
                    </div>
                    <div className="cv-field">
                        <span className="field-label">Tipo de Sangre</span>
                        <span className="field-value">{currentUser.salud?.tipo_sangre || 'N/A'}</span>
                    </div>
                    <div className="cv-field">
                        <span className="field-label">Condiciones Especiales</span>
                        <span className="field-value">{currentUser.salud?.discapacidad ? 'Discapacidad registrada' : 'Ninguna'}</span>
                    </div>
                </div>
            </section>
        </div>
      </div>

      <EditEmployeeModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(data) => {
            handleUpdateProfile(data);
            fetchUserData();
        }}
        empleado={currentUser}
      />
    </div>
  );
};

export default Profile;
