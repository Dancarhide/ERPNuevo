import React, { useState, useEffect } from 'react';
import { FaBriefcase, FaPlus, FaUsers, FaChartLine, FaBuilding, FaUserTie, FaCheckCircle, FaExclamationTriangle, FaPlusCircle, FaSearch } from 'react-icons/fa';
import client from '../api/client';
import './styles/Vacantes.css';

interface Vacante {
    idvacante: number;
    titulo: string;
    cantidad_solicitada: number;
    cantidad_contratada: number;
    descripcion: string | null;
    estatus: string;
    fecha_creacion: string;
    idarea: number | null;
    idrol: number | null;
    areas?: { nombre_area: string };
    roles?: { nombre_rol: string };
}

const Vacantes: React.FC = () => {
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAreaModal, setShowAreaModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    
    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // New Vacancy Form State
    const [newVacante, setNewVacante] = useState({
        titulo: '',
        idarea: '',
        idrol: '',
        cantidad_solicitada: '',
        descripcion: ''
    });

    const [newArea, setNewArea] = useState({ nombre_area: '' });
    const [newRole, setNewRole] = useState({ nombre_rol: '', idarea: '', desc_rol: '' });

    useEffect(() => {
        fetchVacantes();
        fetchMetadata();
    }, []);

    const fetchVacantes = async () => {
        try {
            setLoading(true);
            const response = await client.get('/vacantes');
            setVacantes(response.data);
        } catch (error) {
            console.error('Error fetching vacantes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const rolesRes = await client.get('/roles');
            const areasRes = await client.get('/areas'); // Use the new endpoint
            setRoles(rolesRes.data);
            setAreas(areasRes.data);
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    const handleCreateVacante = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post('/vacantes', newVacante);
            setShowModal(false);
            setNewVacante({ titulo: '', idarea: '', idrol: '', cantidad_solicitada: '', descripcion: '' });
            fetchVacantes();
        } catch (error) {
            console.error('Error creating vacante:', error);
        }
    };

    const handleCreateArea = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post('/areas', newArea);
            setShowAreaModal(false);
            setNewArea({ nombre_area: '' });
            fetchMetadata();
        } catch (error) {
            console.error('Error creating area:', error);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post('/roles', newRole);
            setShowRoleModal(false);
            setNewRole({ nombre_rol: '', idarea: '', desc_rol: '' });
            fetchMetadata();
        } catch (error) {
            console.error('Error creating role:', error);
        }
    };

    // KPI Calculations
    const totalSolicitados = vacantes.reduce((acc: number, v: any) => acc + v.cantidad_solicitada, 0);
    const totalContratados = vacantes.reduce((acc: number, v: any) => acc + v.cantidad_contratada, 0);
    const vacantesAbiertas = vacantes.filter((v: any) => v.estatus === 'Abierta').length;

    // Filter Logic
    const filteredVacantes = vacantes.filter((v: any) => {
        const matchesSearch = v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             v.areas?.nombre_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             v.roles?.nombre_rol.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || v.estatus.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="vacantes-container">
            <div className="vacantes-header">
                <div className="vacantes-header-text">
                    <h1>Gestión de Vacantes</h1>
                    <p>Seguimiento de requerimientos de personal por departamento</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setShowAreaModal(true)}>
                        <FaPlusCircle /> Nueva Área
                    </button>
                    <button className="btn-secondary" onClick={() => setShowRoleModal(true)}>
                        <FaPlusCircle /> Nuevo Puesto
                    </button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nueva Vacante
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-content">
                        <p>Total Requeridos</p>
                        <h3>{totalSolicitados}</h3>
                    </div>
                    <div className="kpi-icon"><FaUsers /></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-content">
                        <p>Total Contratados</p>
                        <h3>{totalContratados}</h3>
                    </div>
                    <div className="kpi-icon"><FaCheckCircle /></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-content">
                        <p>Vacantes Activas</p>
                        <h3>{vacantesAbiertas}</h3>
                    </div>
                    <div className="kpi-icon"><FaBriefcase /></div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="controls-bar">
                <div className="search-box">
                    <FaSearch style={{ color: '#858789' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por título, área o puesto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">Todos los estados</option>
                        <option value="abierta">Abiertas</option>
                        <option value="pausada">Pausadas</option>
                        <option value="cubierta">Cubiertas</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="spinner-container" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="vacantes-grid">
                    {filteredVacantes.map(v => {
                        const progress = (v.cantidad_contratada / v.cantidad_solicitada) * 100;
                        return (
                            <div key={v.idvacante} className="vacante-card">
                                <div className="vacante-card-header">
                                    <span className={`vacante-badge-status ${v.estatus.toLowerCase()}`}>
                                        {v.estatus}
                                    </span>
                                    <FaChartLine style={{ color: 'var(--color-border)' }} />
                                </div>
                                <h2 className="vacante-title">{v.titulo}</h2>
                                <span className="vacante-area">
                                    <FaBuilding style={{ marginRight: '5px' }} /> {v.areas?.nombre_area || 'Sin Área asignada'}
                                </span>
                                
                                <div className="progress-container">
                                    <div className="progress-labels">
                                        <span>Avance de contratación</span>
                                        <span>{v.cantidad_contratada} / {v.cantidad_solicitada}</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div 
                                            className="progress-bar-fill" 
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="vacante-meta">
                                    <div className="meta-item">
                                        <FaUserTie /> {v.roles?.nombre_rol || 'Puesto general'}
                                    </div>
                                    <div className="meta-item">
                                        <FaExclamationTriangle /> {v.cantidad_solicitada - v.cantidad_contratada} pendientes
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal para Nueva Vacante (Premium Refactored) */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="edit-modal-container">
                        <div className="edit-modal-header">
                            <div className="header-title-clean">
                                <h3>Crear Nueva Vacante</h3>
                                <span className="id-badge">NUEVA REQUISICIÓN</span>
                            </div>
                            <button className="close-btn-clean" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className="edit-modal-body-scroll">
                            <div className="profile-photo-section">
                                <div className="photo-circle">
                                    <FaBriefcase />
                                </div>
                                <span className="photo-label">Posición de Trabajo</span>
                            </div>

                            <div className="form-section">
                                <div className="section-title">
                                    <span className="step-num">1</span>
                                    Detalles de la Posición
                                </div>
                                <div className="form-grid-clean">
                                    <div className="form-group-clean full-width">
                                        <label>Título de la Vacante</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Carpintero Industrial" 
                                            value={newVacante.titulo}
                                            onChange={e => setNewVacante({...newVacante, titulo: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-clean">
                                        <label>Área / Departamento</label>
                                        <select 
                                            value={newVacante.idarea}
                                            onChange={e => {
                                                const areaId = e.target.value;
                                                setNewVacante({...newVacante, idarea: areaId, idrol: ''});
                                            }}
                                            required
                                        >
                                            <option value="">Seleccionar área...</option>
                                            {areas.map((a: any) => (
                                                <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group-clean">
                                        <label>Puesto Específico (Rol)</label>
                                        <select 
                                            value={newVacante.idrol}
                                            onChange={e => setNewVacante({...newVacante, idrol: e.target.value})}
                                            disabled={!newVacante.idarea}
                                        >
                                            <option value="">Seleccionar puesto...</option>
                                            {roles.filter((r: any) => !newVacante.idarea || r.idarea === parseInt(newVacante.idarea)).map((r: any) => (
                                                <option key={r.idrol} value={r.idrol}>{r.nombre_rol}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group-clean full-width">
                                        <label>Cantidad Necesaria</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            placeholder="Número de personas"
                                            value={newVacante.cantidad_solicitada}
                                            onChange={e => setNewVacante({...newVacante, cantidad_solicitada: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-title">
                                    <span className="step-num">2</span>
                                    Descripción / Observaciones
                                </div>
                                <div className="form-group-clean full-width">
                                    <label>Notas Adicionales</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Detalles sobre el perfil buscado o responsabilidades..."
                                        value={newVacante.descripcion}
                                        onChange={e => setNewVacante({...newVacante, descripcion: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="edit-modal-footer-fixed">
                            <button type="button" className="btn-cancel-clean" onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="btn-save-clean" onClick={handleCreateVacante}>
                                Crear Vacante
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal para Nueva Área (Premium) */}
            {showAreaModal && (
                <div className="modal-overlay">
                    <div className="edit-modal-container" style={{maxWidth: '500px'}}>
                        <div className="edit-modal-header">
                            <div className="header-title-clean">
                                <h3>Crear Nueva Área</h3>
                                <span className="id-badge">ORGANIZACIÓN</span>
                            </div>
                            <button className="close-btn-clean" onClick={() => setShowAreaModal(false)}>✕</button>
                        </div>
                        <div className="edit-modal-body-scroll">
                            <div className="profile-photo-section">
                                <div className="photo-circle">
                                    <FaBuilding />
                                </div>
                                <span className="photo-label">Departamento / Área</span>
                            </div>
                            <div className="form-section">
                                <div className="form-group-clean full-width">
                                    <label>Nombre del Área</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Producción, Logística..." 
                                        value={newArea.nombre_area}
                                        onChange={e => setNewArea({ nombre_area: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="edit-modal-footer-fixed">
                            <button className="btn-cancel-clean" onClick={() => setShowAreaModal(false)}>Cancelar</button>
                            <button className="btn-save-clean" onClick={handleCreateArea}>Guardar Área</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Nuevo Puesto (Premium) */}
            {showRoleModal && (
                <div className="modal-overlay">
                    <div className="edit-modal-container" style={{maxWidth: '550px'}}>
                        <div className="edit-modal-header">
                            <div className="header-title-clean">
                                <h3>Crear Nuevo Puesto</h3>
                                <span className="id-badge">ESTRUCTURA</span>
                            </div>
                            <button className="close-btn-clean" onClick={() => setShowRoleModal(false)}>✕</button>
                        </div>
                        <div className="edit-modal-body-scroll">
                            <div className="profile-photo-section">
                                <div className="photo-circle">
                                    <FaUserTie />
                                </div>
                                <span className="photo-label">Rol Desempeñado</span>
                            </div>
                            <div className="form-section">
                                <div className="form-grid-clean">
                                    <div className="form-group-clean full-width">
                                        <label>Nombre del Puesto</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Supervisor de Turno, Auxiliar..." 
                                            value={newRole.nombre_rol}
                                            onChange={e => setNewRole({ ...newRole, nombre_rol: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-clean full-width">
                                        <label>Área Responsable</label>
                                        <select 
                                            value={newRole.idarea}
                                            onChange={e => setNewRole({ ...newRole, idarea: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccionar área...</option>
                                            {areas.map((a: any) => (
                                                <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group-clean full-width">
                                        <label>Descripción breve</label>
                                        <input 
                                            type="text" 
                                            placeholder="Notas sobre las funciones..."
                                            value={newRole.desc_rol}
                                            onChange={e => setNewRole({ ...newRole, desc_rol: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="edit-modal-footer-fixed">
                            <button className="btn-cancel-clean" onClick={() => setShowRoleModal(false)}>Cancelar</button>
                            <button className="btn-save-clean" onClick={handleCreateRole}>Guardar Puesto</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vacantes;
