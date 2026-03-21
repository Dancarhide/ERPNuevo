import React from 'react';
import { FaEnvelope, FaIdCard, FaPhone, FaMapMarkerAlt, FaBriefcase, FaEdit } from 'react-icons/fa';
import './styles/Dashboard.css';
import EditEmployeeModal from '../components/common/EditEmployeeModal';
import { useState } from 'react';

const Profile: React.FC = () => {
  // Simulating getting user data from storage
  const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
  const userData = sessionData?.user || sessionData;
  
  // Using actual data structure from Prisma/Backend
  const userName = (userData?.nombre || '').trim() || 'Usuario Desconocido';
  const userRole = (userData?.rol || '').trim() || 'Sin Rol Asignado';
  const userEmail = (userData?.email || '').trim() || 'No especificado';
  const userPhone = (userData?.telefono || '').trim() || 'No especificado';
  const userAddress = (userData?.direccion || '').trim() || 'No especificada';
  const userCurp = (userData?.curp || '').trim() || 'No especificada';
  const userRfc = (userData?.rfc || '').trim() || 'No especificado';
  const idEmpleado = userData?.idempleado || 0;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(userData);

  const handleUpdateProfile = async (updatedEmp: any) => {
    try {
      const host = window.location.hostname;
      const response = await fetch(`http://${host}:4000/api/empleados/${idEmpleado}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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

  const initials = getInitials(userName);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1>Mi Perfil</h1>
            <p>Información detallada de tu cuenta y datos personales</p>
        </div>
        <button 
            onClick={() => setIsEditModalOpen(true)}
            style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 10px rgba(167, 49, 58, 0.2)'
            }}
        >
            <FaEdit /> Editar Mi Perfil
        </button>
      </div>

      <div className="dashboard-content-grid profile-layout">
        {/* Profile Card */}
        <div className="dashboard-panel" style={{ textAlign: 'center' }}>
            <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: 'bold',
                margin: '0 auto 20px auto',
                boxShadow: '0 4px 10px rgba(167, 49, 58, 0.3)'
            }}>
                {initials}
            </div>
            <h2 style={{ marginBottom: '5px', fontSize: '1.4rem' }}>{userName}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px', fontWeight: '500' }}>{userRole}</p>
            
            <div style={{ display: 'inline-flex', padding: '5px 15px', backgroundColor: '#e2f5e9', color: '#1f854b', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                Cuenta Activa
            </div>
        </div>

        {/* Details Panel */}
        <div className="dashboard-panel">
            <h2 style={{ borderBottom: '1px solid var(--color-bg-light)', paddingBottom: '15px' }}>Información de Contacto y Laboral</h2>
            
            <div className="profile-details-grid">
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginTop: '3px' }}><FaEnvelope /></div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Correo Electrónico</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{userEmail}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginTop: '3px' }}><FaPhone /></div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Teléfono</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{userPhone}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginTop: '3px' }}><FaIdCard /></div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>CURP</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{userCurp}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginTop: '3px' }}><FaIdCard /></div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>RFC</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{userRfc}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', gridColumn: '1 / -1' }}>
                    <div style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginTop: '3px' }}><FaMapMarkerAlt /></div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Dirección Registrada</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{userAddress}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', gridColumn: '1 / -1' }}>
                    <div style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginTop: '3px' }}><FaBriefcase /></div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Rol en el Sistema</p>
                        <p style={{ margin: 0, fontWeight: '500' }}>{userRole}</p>
                    </div>
                </div>

            </div>
        </div>
      </div>

      <EditEmployeeModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateProfile}
        empleado={{
            idempleado: idEmpleado,
            nombre_completo_empleado: userName,
            email_empleado: userEmail === 'No especificado' ? '' : userEmail,
            telefono_empleado: userPhone === 'No especificado' ? '' : userPhone,
            curp: userCurp === 'No especificada' ? '' : userCurp,
            rfc: userRfc === 'No especificado' ? '' : userRfc,
            direccion_empleado: userAddress === 'No especificada' ? '' : userAddress,
            estatus_empleado: 'Activo',
            puesto: userRole,
            idrol: userData?.idrol || 6
        }}
      />
    </div>
  );
};

export default Profile;
