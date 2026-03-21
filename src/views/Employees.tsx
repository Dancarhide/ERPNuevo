import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaSearch, FaEnvelope, FaPhone, FaUsers, FaCheckCircle, FaPlane, FaExclamationTriangle, FaTh, FaList, FaEdit, FaTrash } from 'react-icons/fa';
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
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);

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
      const response = await fetch(`http://${host}:4000/api/empleados`, {
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
    setIsEditModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedEmpleado(null); // Explicit null means new employee
    setIsEditModalOpen(true);
  };


  const handleSaveEmployee = async (updatedEmp: any) => {
    try {
      const host = window.location.hostname;
      const isNew = !updatedEmp.idempleado;
      const url = isNew 
        ? `http://${host}:4000/api/empleados` 
        : `http://${host}:4000/api/empleados/${updatedEmp.idempleado}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedEmp),
      });


      if (response.ok) {
        fetchEmpleados(); // Refresh the list
      } else {
        alert('Error al actualizar el empleado');
      }
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      alert('Error de conexión al actualizar el empleado');
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
        {canRegister && (
          <button className="btn-primary" onClick={handleCreateClick}>
            <FaUserPlus /> Nuevo Empleado
          </button>
        )}

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
                            <span className="emp-email">ID: #{emp.idempleado.toString().padStart(4, '0')}</span>
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
                           <span className="emp-name">{emp.puesto || 'No asignado'}</span>
                           <span className="emp-email">{emp.areas_empleados_idareaToareas?.nombre_area || 'Sin área'}</span>
                        </div>
                      </td>
                      <td data-label="Estado">
                        <span className={`badge ${emp.estatus_empleado === 'Activo' ? 'badge-active' : emp.estatus_empleado === 'Vacaciones' ? 'badge-role' : 'badge-inactive'}`}>
                          {emp.estatus_empleado || 'Desconocido'}
                        </span>
                      </td>
                      <td data-label="Acciones">
                         {canRegister && (
                            <div style={{display: 'flex', gap: '8px'}}>
                               <button 
                                 onClick={() => handleEditClick(emp)}
                                 style={{background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-text-main)', cursor: 'pointer'}}
                               >
                                 <FaEdit />
                               </button>
                               <button style={{background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 10px', color: '#ef4444', cursor: 'pointer'}}><FaTrash /></button>
                            </div>
                         )}
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
                    <div className="role">{emp.puesto || 'Sin Puesto'}</div>
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
                      <button className="edit-btn" onClick={() => handleEditClick(emp)}>
                        <FaEdit /> 
                      </button>
                      <button className="delete-btn">
                        <FaTrash />
                      </button>
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
      />
    </div>
  );
};

export default Employees;
