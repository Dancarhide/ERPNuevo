import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaSearch, FaEnvelope, FaPhone, FaUsers, FaCheckCircle, FaPlane, FaExclamationTriangle, FaTh, FaList, FaEdit, FaTrash, FaEye, FaDownload } from 'react-icons/fa';
import './styles/Dashboard.css'; 
import './styles/EmployeesLegacy.css'; 
import './styles/Employees.css';
import EditEmployeeModal from '../components/common/EditEmployeeModal';

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
  roles: { nombre_rol: string | null } | null;
  areas_empleados_idareaToareas: { nombre_area: string | null } | null;
}

const Employees: React.FC = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit');
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState<boolean>(false);
  const [generatedCreds, setGeneratedCreds] = useState<{username: string, password: string} | null>(null);

  // Simulando obtención del rol del usuario
  const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
  const userData = sessionData?.user || sessionData;
  const currentRole = userData?.rol || sessionData?.rol || 'Empleado Normal';
  
  // Restricted to Admin and RH as per requirements
  const canRegister = currentRole === 'Admin' || currentRole === 'RH';

  const token = sessionData?.token;


  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/empleados`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmpleados(data);
      }

    } catch (error) {
      console.error('Error de red al obtener empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (emp: Empleado) => {
    setSelectedEmpleado(emp);
    setModalMode('edit');
    setIsEditModalOpen(true);
  };

  const handleViewClick = (emp: Empleado) => {
    setSelectedEmpleado(emp);
    setModalMode('view');
    setIsEditModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedEmpleado(null); // Explicit null means new employee
    setModalMode('edit');
    setIsEditModalOpen(true);
  };


  const handleExportCSV = () => {
    if (empleados.length === 0) return;
    
    // Headers
    const headers = ["ID", "Nombre Completo", "Puesto", "Email", "Telefono", "Estatus", "Rol", "Area"];
    const rows = empleados.map(emp => [
      emp.idempleado,
      emp.nombre_completo_empleado,
      emp.puesto || "",
      emp.email_empleado || "",
      emp.telefono_empleado || "",
      emp.estatus_empleado || "",
      emp.roles?.nombre_rol || "",
      emp.areas_empleados_idareaToareas?.nombre_area || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Empleados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEmployee = async (updatedEmp: any) => {
    try {
      const host = window.location.hostname;
      const isNew = !updatedEmp.idempleado;
      const url = isNew 
        ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/empleados` 
        : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/empleados/${updatedEmp.idempleado}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedEmp),
      });


      if (response.ok) {
        const responseData = await response.json();
        if (isNew && responseData._credencialesGeneradas) {
            setGeneratedCreds(responseData._credencialesGeneradas);
            setIsCredsModalOpen(true);
        }
        fetchEmpleados(); // Refresh the list
      } else {
        alert('Error al actualizar el empleado');
      }
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      alert('Error de conexión al actualizar el empleado');
    }
  };

  const handleDeleteEmpleado = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea dar de baja (eliminar) a este empleado? Esta acción no se puede deshacer.')) return;
    try {
      const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const token = userDataStr ? JSON.parse(userDataStr)?.token : null;
      const url = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/empleados/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchEmpleados();
      } else {
        const errorData = await response.json().catch(() => null);
        alert(errorData?.error || 'Error al eliminar el empleado');
      }
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      alert('Error de conexión al eliminar el empleado');
    }
  };

  const filteredEmpleados = empleados.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      emp.nombre_completo_empleado.toLowerCase().includes(term) ||
      (emp.email_empleado && emp.email_empleado.toLowerCase().includes(term)) ||
      (emp.puesto && emp.puesto.toLowerCase().includes(term)) ||
      (emp.roles?.nombre_rol && emp.roles.nombre_rol.toLowerCase().includes(term));
    
    const matchesStatus = filterStatus === 'all' || 
      (emp.estatus_empleado && emp.estatus_empleado.toLowerCase() === filterStatus.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // KPIs calculations
  const totalEmpleados = empleados.length;
  const activos = empleados.filter(e => e.estatus_empleado === 'Activo').length;
  const deVacaciones = empleados.filter(e => e.estatus_empleado === 'Vacaciones').length;
  const inactivos = totalEmpleados - activos - deVacaciones;

  return (
    <div className="empleados-container">
      <div className="empleados-header">
        <div className="empleados-header-text">
          <h1>Directorio de Empleados</h1>
          <p>Gestión de capital humano y accesos corporativos</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-modern outline" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid #e2e8f0', color: '#64748b' }}>
            <FaDownload /> Descargar CSV
          </button>
          {canRegister && (
            <button className="btn-primary" onClick={handleCreateClick}>
              <FaUserPlus /> Nuevo Empleado
            </button>
          )}
        </div>

      </div>

      {/* KPIs Grid */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-content">
            <p>Total Plantilla</p>
            <h3>{totalEmpleados}</h3>
          </div>
          <div className="kpi-icon"><FaUsers /></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-content">
            <p>Personal Activo</p>
            <h3>{activos}</h3>
          </div>
          <div className="kpi-icon"><FaCheckCircle /></div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-content">
            <p>En Vacaciones</p>
            <h3>{deVacaciones}</h3>
          </div>
          <div className="kpi-icon"><FaPlane /></div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-content">
            <p>Bajas / Inactivos</p>
            <h3>{inactivos}</h3>
          </div>
          <div className="kpi-icon"><FaExclamationTriangle /></div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <FaSearch style={{ color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email, puesto o rol..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="inactivo">Inactivo / Baja</option>
          </select>
        </div>
        <div className="view-toggles">
          <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
            <FaList />
          </button>
          <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <FaTh />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{border: '1px dashed var(--color-border)', borderRadius: '12px', padding: '60px 40px', textAlign: 'center'}}>
          <div className="spinner" style={{borderColor: 'transparent', borderLeftColor: 'var(--color-primary)', animation: 'spin 1s linear infinite', width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 20px'}}></div>
          <p>Cargando directorio...</p>
        </div>
      ) : filteredEmpleados.length === 0 ? (
        <div className="empty-state" style={{border: '1px dashed var(--color-border)', borderRadius: '12px', padding: '60px 40px', textAlign: 'center'}}>
          <FaSearch style={{fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '15px'}} />
          <h3>No hay resultados</h3>
          <p>Intenta con otra búsqueda o filtro.</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="employees-table-container">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Contacto</th>
                    <th>Puesto / Área</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmpleados.map((emp) => (
                    <tr key={emp.idempleado}>
                      <td data-label="Empleado">
                        <div className="employee-name-cell">
                          <div className="employee-avatar">
                            {getInitials(emp.nombre_completo_empleado)}
                          </div>
                          <div className="employee-info-text">
                            <span className="emp-name">{emp.nombre_completo_empleado}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Contacto">
                        <div className="employee-info-text">
                          <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaEnvelope style={{ color:'var(--color-primary)' }}/> {emp.email_empleado || 'N/A'}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <FaPhone /> {emp.telefono_empleado || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td data-label="Puesto / Área">
                        <div className="employee-info-text">
                           <span className="emp-name">{emp.roles?.nombre_rol || emp.puesto || 'No asignado'}</span>
                           <span className="emp-email">{emp.areas_empleados_idareaToareas?.nombre_area || 'Sin área'}</span>
                        </div>
                      </td>
                      <td data-label="Estado">
                        <span className={`badge ${emp.estatus_empleado === 'Activo' ? 'badge-active' : emp.estatus_empleado === 'Vacaciones' ? 'badge-role' : 'badge-inactive'}`}>
                          {emp.estatus_empleado || 'Desconocido'}
                        </span>
                      </td>
                      <td data-label="Acciones">
                         <div style={{display: 'flex', gap: '8px'}}>
                            <button 
                              onClick={() => handleViewClick(emp)}
                              title="Ver Información"
                              style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', padding: '6px 10px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                            >
                              <FaEye />
                            </button>
                            {canRegister && (
                              <>
                               <button 
                                 onClick={() => handleEditClick(emp)}
                                 title="Editar"
                                 style={{background: 'rgba(167, 49, 58, 0.1)', border: '1px solid rgba(167, 49, 58, 0.3)', borderRadius: '6px', padding: '6px 10px', color: '#A7313A', cursor: 'pointer', display: 'flex', alignItems: 'center'}}
                               >
                                 <FaEdit />
                               </button>
                               <button onClick={() => handleDeleteEmpleado(emp.idempleado)} title="Dar de Baja" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '6px 10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center'}}><FaTrash /></button>
                              </>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empleados-grid">
              {filteredEmpleados.map((emp) => (
                <div key={emp.idempleado} className="empleado-card">
                  <div className="avatar-container">
                    {getInitials(emp.nombre_completo_empleado)}
                  </div>
                  <div className="card-body">
                    <h3>{emp.nombre_completo_empleado}</h3>
                    <div className="role">{emp.roles?.nombre_rol || emp.puesto || 'Sin Puesto'}</div>
                    <div className="area">
                      {emp.areas_empleados_idareaToareas?.nombre_area || 'Sin Área asignada'}
                    </div>
                  </div>
                  
                  <div className="card-status">
                     <span className={`badge ${emp.estatus_empleado === 'Activo' ? 'badge-active' : emp.estatus_empleado === 'Vacaciones' ? 'badge-role' : 'badge-inactive'}`}>
                        {emp.estatus_empleado || 'Sin Estado'}
                     </span>
                  </div>

                  <div className="card-contact">
                    <div className="card-contact-item">
                       <FaEnvelope /> <span>{emp.email_empleado || 'N/A'}</span>
                    </div>
                    <div className="card-contact-item">
                       <FaPhone /> <span>{emp.telefono_empleado || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {canRegister && (
                    <div className="card-actions">
                      <button className="view-btn" onClick={() => handleViewClick(emp)} title="Ver Expediente" style={{ flex: 1, backgroundColor: '#eff6ff', border: '1px solid #dbeafe', color: '#1e40af' }}>
                        <FaEye /> 
                      </button>
                      {canRegister && (
                        <>
                          <button className="edit-btn" onClick={() => handleEditClick(emp)} title="Editar Colaborador" style={{ flex: 1 }}>
                            <FaEdit /> 
                          </button>
                          <button onClick={() => handleDeleteEmpleado(emp.idempleado)} className="delete-btn" title="Dar de Baja" style={{ flex: 1, color: '#ef4444' }}>
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <EditEmployeeModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleSaveEmployee}
        empleado={selectedEmpleado}
        initialMode={modalMode}
      />

      {isCredsModalOpen && generatedCreds && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}}>
          <div className="modal-content" style={{background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'}}>
            <FaCheckCircle style={{fontSize: '3.5rem', color: '#10b981', margin: '0 auto 15px'}} />
            <h2 style={{margin: '0 0 10px 0', color: '#1e293b'}}>Empleado Registrado</h2>
            <p style={{marginBottom: '20px', color: '#64748b', fontSize: '0.95rem'}}>Se han generado las siguientes credenciales para el nuevo empleado. Por favor guárdalas o envíaselas, ya que no se volverán a mostrar.</p>
            
            <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left', border: '1px solid #e2e8f0'}}>
              <p style={{margin: '0 0 10px 0', color: '#334155'}}><strong>Usuario:</strong> {generatedCreds.username}</p>
              <p style={{margin: 0, color: '#334155'}}><strong>Contraseña:</strong> {generatedCreds.password}</p>
            </div>

            <button 
              className="btn-modern outline" 
              style={{width: '100%', marginBottom: '10px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe'}}
              onClick={() => {
                navigator.clipboard.writeText(`Usuario: ${generatedCreds.username}\nContraseña: ${generatedCreds.password}`);
                alert('¡Credenciales copiadas al portapapeles!');
              }}
            >
              Copiar Credenciales
            </button>
            <button 
              className="btn-modern" 
              style={{width: '100%', background: '#A7313A', color: 'white', border: 'none'}}
              onClick={() => setIsCredsModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
