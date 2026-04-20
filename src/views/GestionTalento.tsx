import React, { useState, useEffect } from 'react';
import { 
    FaUserPlus, FaSitemap, FaPlus, FaRocket, FaTimes,
    FaUserTie, FaCheckCircle, FaTrash, FaEdit,
    FaMoneyBillWave, FaListUl, FaInfoCircle, FaSync
} from 'react-icons/fa';
import client from '../api/client';
import './styles/GestionTalento.css';

interface Puesto {
    idpuesto: number;
    nombre_puesto: string;
    descripcion: string | null;
    requisitos: string | null;
    beneficios: string | null;
    sueldo_min: number | null;
    sueldo_max: number | null;
    cupo_maximo: number;
    personal_actual: number;
    areas?: { nombre_area: string };
    idarea: number | null;
}

interface Vacante {
    idvacante: number;
    titulo: string;
    estatus: string;
    idpuesto: number | null;
    cantidad_solicitada: number;
    cantidad_contratada: number;
    puestos?: { nombre_puesto: string } | null;
    areas?: { nombre_area: string } | null;
}

interface Area {
    idarea: number;
    nombre_area: string | null;
}

interface Candidato {
    idcandidato: number;
    nombre_completo: string;
    email: string | null;
    telefono: string | null;
    cv_url?: string | null;
    estatus: string;
    notas: string | null;
    idvacante: number | null;
    idpuesto?: number | null;
    puestos?: { nombre_puesto: string } | null;
    vacantes?: { titulo: string } | null;
}

const GestionTalento: React.FC = () => {
    const [puestos, setPuestos] = useState<Puesto[]>([]);
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [activeTab, setActiveTab] = useState<'estructura' | 'reclutamiento' | 'candidatos'>('estructura');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    
    // Modals state
    const [showVacancyModal, setShowVacancyModal] = useState(false);
    const [showPuestoModal, setShowPuestoModal] = useState(false);
    const [showCandidatoModal, setShowCandidatoModal] = useState(false);
    const [showNuevoPuestoModal, setShowNuevoPuestoModal] = useState(false);

    // Form states
    const [newVacante, setNewVacante] = useState({ titulo: '', idpuesto: '', cantidad_solicitada: 1, descripcion: '' });
    const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
    const [newCandidato, setNewCandidato] = useState({
        nombre_completo: '',
        email: '',
        telefono: '',
        cv_url: '',
        notas: '',
        idvacante: '',
        idpuesto: ''
    });
    const [newPuestoForm, setNewPuestoForm] = useState({
        nombre_puesto: '',
        descripcion: '',
        idarea: '',
        cupo_maximo: 1,
        sueldo_min: '' as string | number,
        sueldo_max: '' as string | number
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pRes, vRes, cRes, aRes] = await Promise.all([
                client.get('/puestos'),
                client.get('/vacantes'),
                client.get('/candidatos'),
                client.get('/areas')
            ]);
            setPuestos(pRes.data);
            setVacantes(vRes.data);
            setCandidatos(cRes.data);
            setAreas(aRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateVacancy = (puesto: Puesto) => {
        setNewVacante({
            titulo: `Reclutamiento: ${puesto.nombre_puesto}`,
            idpuesto: puesto.idpuesto.toString(),
            cantidad_solicitada: Math.max(1, puesto.cupo_maximo - puesto.personal_actual),
            descripcion: `Búsqueda de talento para cubrir el puesto de ${puesto.nombre_puesto}.`
        });
        setShowVacancyModal(true);
    };

    const submitNewVacancy = async () => {
        try {
            const puesto = puestos.find(p => p.idpuesto === parseInt(newVacante.idpuesto));
            await client.post('/vacantes', {
                ...newVacante,
                idarea: puesto?.idarea
            });
            setShowVacancyModal(false);
            setActiveTab('reclutamiento');
            fetchData();
        } catch (error) {
            alert('Error al crear vacante');
        }
    };

    const handleEditPuesto = (puesto: Puesto) => {
        setSelectedPuesto(puesto);
        setShowPuestoModal(true);
    };

    const savePuestoProfile = async () => {
        if (!selectedPuesto) return;
        try {
            await client.put(`/puestos/${selectedPuesto.idpuesto}`, selectedPuesto);
            setShowPuestoModal(false);
            fetchData();
        } catch (error) {
            alert('Error al guardar perfil de puesto');
        }
    };

    const handleAddCandidato = (idvacante?: number) => {
        setNewCandidato({ 
            nombre_completo: '', 
            email: '', 
            telefono: '', 
            cv_url: '',
            notas: '', 
            idvacante: idvacante ? idvacante.toString() : '',
            idpuesto: ''
        });
        setShowCandidatoModal(true);
    };

    const submitCandidato = async () => {
        if (!newCandidato.nombre_completo.trim()) {
            alert('Indique el nombre del candidato.');
            return;
        }
        if (!newCandidato.idvacante && !newCandidato.idpuesto) {
            alert('Seleccione una vacante abierta o un puesto de la estructura.');
            return;
        }
        try {
            const idVac = newCandidato.idvacante ? parseInt(newCandidato.idvacante, 10) : null;
            const idPueDirect = newCandidato.idpuesto ? parseInt(newCandidato.idpuesto, 10) : null;
            const idPuestoFromVac = idVac
                ? vacantes.find(v => v.idvacante === idVac)?.idpuesto ?? null
                : null;
            await client.post('/candidatos', {
                nombre_completo: newCandidato.nombre_completo,
                email: newCandidato.email || null,
                telefono: newCandidato.telefono || null,
                cv_url: newCandidato.cv_url || null,
                notas: newCandidato.notas || null,
                idvacante: idVac,
                idpuesto: idPuestoFromVac ?? idPueDirect
            });
            setShowCandidatoModal(false);
            fetchData();
            setActiveTab('candidatos');
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            alert(msg || 'Error al registrar candidato');
        }
    };

    const submitNuevoPuesto = async () => {
        if (!newPuestoForm.nombre_puesto.trim()) {
            alert('Indique el nombre del puesto.');
            return;
        }
        try {
            await client.post('/puestos', {
                nombre_puesto: newPuestoForm.nombre_puesto,
                descripcion: newPuestoForm.descripcion || null,
                cupo_maximo: newPuestoForm.cupo_maximo,
                sueldo_min: newPuestoForm.sueldo_min === '' ? null : Number(newPuestoForm.sueldo_min),
                sueldo_max: newPuestoForm.sueldo_max === '' ? null : Number(newPuestoForm.sueldo_max),
                idarea: newPuestoForm.idarea ? parseInt(newPuestoForm.idarea, 10) : null
            });
            setShowNuevoPuestoModal(false);
            setNewPuestoForm({
                nombre_puesto: '',
                descripcion: '',
                idarea: '',
                cupo_maximo: 1,
                sueldo_min: '',
                sueldo_max: ''
            });
            fetchData();
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            alert(msg || 'Error al crear puesto');
        }
    };

    const handleSyncPlantilla = async () => {
        try {
            setSyncing(true);
            await client.post('/puestos/sync');
            await fetchData();
        } catch {
            alert('No se pudo sincronizar la plantilla por puesto');
        } finally {
            setSyncing(false);
        }
    };

    const deleteCandidato = async (id: number) => {
        if (!window.confirm('¿Eliminar este candidato y todo su proceso C y I? Esta acción no se puede deshacer.')) return;
        try {
            await client.delete(`/candidatos/${id}`);
            fetchData();
        } catch {
            alert('Error al eliminar candidato');
        }
    };

    const updateCandidatoStatus = async (id: number, estatus: string) => {
        try {
            await client.put(`/candidatos/${id}/status`, { estatus });
            fetchData();
        } catch (error) {
            alert('Error al actualizar estado');
        }
    };

    const getCapacityStatus = (p: Puesto) => {
        const ratio = p.personal_actual / p.cupo_maximo;
        if (ratio >= 1) return { label: 'Cubierta', class: 'success', badge: 'filled' };
        if (ratio >= 0.7) return { label: 'Al Límite', class: 'warning', badge: 'active' };
        return { label: 'Déficit', class: 'danger', badge: 'deficit' };
    };

    if (loading) return <div className="gestion-talento-container"><div className="loading-spinner">Cargando gestión de talento...</div></div>;

    return (
        <div className="gestion-talento-container">
            <header className="gestion-talento-header">
                    <div className="gestion-talento-title-block">
                        <h1>Gestión de Talento Estratégica</h1>
                        <p>Plataforma integral de arquitectura organizacional y captación de capital humano.</p>
                    </div>
                    <div className="gestion-talento-toolbar" role="toolbar" aria-label="Acciones de talento">
                        <button type="button" className="action-btn primary" onClick={() => setShowNuevoPuestoModal(true)}>
                            <FaPlus aria-hidden /> <span>Nuevo puesto</span>
                        </button>
                        <button
                            type="button"
                            className="action-btn"
                            disabled={syncing}
                            onClick={handleSyncPlantilla}
                            title="Recalcula ocupación por puesto según empleados asignados"
                        >
                            <FaSync aria-hidden className={syncing ? 'icon-spin' : ''} />
                            <span className="toolbar-label-full">{syncing ? 'Sincronizando…' : 'Sincronizar plantilla'}</span>
                            <span className="toolbar-label-short">{syncing ? '…' : 'Sincronizar'}</span>
                        </button>
                        <button type="button" className="action-btn" onClick={() => handleAddCandidato()}>
                            <FaUserPlus aria-hidden /> <span>Nuevo candidato</span>
                        </button>
                    </div>
            </header>

            <nav className="talento-tabs">
                <button className={`tab-btn ${activeTab === 'estructura' ? 'active' : ''}`} onClick={() => setActiveTab('estructura')}>
                    <FaSitemap /> Estructura de Puestos
                </button>
                <button className={`tab-btn ${activeTab === 'reclutamiento' ? 'active' : ''}`} onClick={() => setActiveTab('reclutamiento')}>
                    <FaRocket /> Procesos C y I
                </button>
                <button className={`tab-btn ${activeTab === 'candidatos' ? 'active' : ''}`} onClick={() => setActiveTab('candidatos')}>
                    <FaUserTie /> Pool de Candidatos
                </button>
            </nav>

            <div className="talento-table-container">
                <div className="talento-table-scroll">
                {activeTab === 'estructura' && (
                    <table className="talento-table">
                        <thead>
                            <tr>
                                <th>Puesto / Área</th>
                                <th style={{ width: '150px' }}>Capacidad</th>
                                <th style={{ width: '120px' }}>Estado</th>
                                <th style={{ width: '150px' }}>Sueldo Sugerido</th>
                                <th style={{ width: '120px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {puestos.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="talento-empty-cell">
                                        <div className="talento-empty-inner">
                                            <FaSitemap className="talento-empty-icon" aria-hidden />
                                            <p>No hay puestos en la estructura. Use <strong>Nuevo puesto</strong> para crear el primero.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {puestos.map(p => {
                                const status = getCapacityStatus(p);
                                return (
                                    <tr key={p.idpuesto}>
                                        <td>
                                            <div className="puesto-cell">
                                                <span className="puesto-name">{p.nombre_puesto}</span>
                                                <span className="puesto-area">{p.areas?.nombre_area || 'Corporativo'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="capacity-cell">
                                                <div className="capacity-text">{p.personal_actual} / {p.cupo_maximo}</div>
                                                <div className="capacity-bar-bg">
                                                    <div className={`capacity-bar-fill ${status.class}`} style={{ width: `${Math.min((p.personal_actual/p.cupo_maximo)*100, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`status-badge ${status.badge}`}>{status.label}</span></td>
                                        <td><span className="salary-text">${p.sueldo_min || '---'} - ${p.sueldo_max || '---'}</span></td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="action-btn primary" title="Activar Reclutamiento" onClick={() => handleActivateVacancy(p)}>
                                                    <FaPlus />
                                                </button>
                                                <button className="action-btn" title="Perfil de Puesto" onClick={() => handleEditPuesto(p)}>
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {activeTab === 'reclutamiento' && (
                    <table className="talento-table">
                        <thead>
                            <tr>
                                <th>Vacante Activa</th>
                                <th>Requeridos</th>
                                <th>Progreso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vacantes.filter(v => v.estatus === 'Abierta').length === 0 && (
                                <tr>
                                    <td colSpan={4} className="talento-empty-cell">
                                        <div className="talento-empty-inner">
                                            <FaRocket className="talento-empty-icon" aria-hidden />
                                            <p>No hay vacantes abiertas. En <strong>Estructura de Puestos</strong> active un reclutamiento para generar una vacante.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {vacantes.filter(v => v.estatus === 'Abierta').map(v => (
                                <tr key={v.idvacante}>
                                    <td>
                                        <div className="puesto-cell">
                                            <span className="puesto-name">{v.titulo}</span>
                                            <span className="puesto-area">{v.puestos?.nombre_puesto || '—'} · {v.areas?.nombre_area || 'Área general'}</span>
                                        </div>
                                    </td>
                                    <td><strong>{v.cantidad_solicitada} personas</strong></td>
                                    <td>
                                        <div className="progress-mini">
                                            <span>{v.cantidad_contratada} contratados</span>
                                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                {candidatos.filter(c => c.idvacante === v.idvacante).length} candidato(s) en proceso
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn primary" onClick={() => (window.location.href = '/cyi')}>
                                                <FaRocket /> Pasos C y I
                                            </button>
                                            <button className="action-btn" onClick={() => handleAddCandidato(v.idvacante)}>
                                                <FaUserPlus /> Candidato
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'candidatos' && (
                    <table className="talento-table">
                        <thead>
                            <tr>
                                <th>Candidato</th>
                                <th style={{ width: '220px' }}>Vacante / Puesto</th>
                                <th style={{ width: '160px' }}>Estado</th>
                                <th style={{ width: '120px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidatos.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="talento-empty-cell">
                                        <div className="talento-empty-inner">
                                            <FaUserTie className="talento-empty-icon" aria-hidden />
                                            <p>No hay candidatos. Use <strong>Nuevo candidato</strong> o desde una vacante abierta.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {candidatos.map(c => (
                                <tr key={c.idcandidato}>
                                    <td>
                                        <div className="puesto-cell">
                                            <span className="puesto-name">{c.nombre_completo}</span>
                                            <span className="puesto-area">{c.email || '—'} · {c.telefono || '—'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {c.idvacante
                                            ? vacantes.find(v => v.idvacante === c.idvacante)?.titulo
                                            : (c.puestos?.nombre_puesto || 'Vinculado solo a puesto')}
                                    </td>
                                    <td>
                                        <select 
                                            value={c.estatus} 
                                            className={`status-select ${c.estatus}`}
                                            onChange={(e) => updateCandidatoStatus(c.idcandidato, e.target.value)}
                                        >
                                            <option value="Postulado">Postulado</option>
                                            <option value="En Entrevista">En Entrevista</option>
                                            <option value="Seleccionado">Seleccionado</option>
                                            <option value="Rechazado">Rechazado</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn primary" title="Ver Pasos C y I (Proceso)" onClick={() => (window.location.href = `/cyi?idcandidato=${c.idcandidato}`)}>
                                                <FaRocket />
                                            </button>
                                            <button type="button" className="action-btn danger" title="Eliminar Candidato" onClick={() => deleteCandidato(c.idcandidato)}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {/* Modals Implementation (Simplified for briefness) */}
            {showPuestoModal && selectedPuesto && (
                <div className="modal-overlay-fused">
                    <div className="modal-content-fused" style={{ maxWidth: '850px' }}>
                        <div className="modal-header">
                            <h3><FaInfoCircle /> Perfil de Puesto: {selectedPuesto.nombre_puesto}</h3>
                            <button className="close-btn" onClick={() => setShowPuestoModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body profile-editor-grid">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombre del puesto</label>
                                    <input
                                        type="text"
                                        value={selectedPuesto.nombre_puesto}
                                        onChange={e => setSelectedPuesto({ ...selectedPuesto, nombre_puesto: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Área</label>
                                    <select
                                        value={selectedPuesto.idarea ?? ''}
                                        onChange={e =>
                                            setSelectedPuesto({
                                                ...selectedPuesto,
                                                idarea: e.target.value ? parseInt(e.target.value, 10) : null
                                            })
                                        }
                                    >
                                        <option value="">Corporativo / sin área</option>
                                        {areas.map(a => (
                                            <option key={a.idarea} value={a.idarea}>{a.nombre_area || `Área ${a.idarea}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-section">
                                <label><FaListUl /> Requisitos y Competencias</label>
                                <textarea rows={5} value={selectedPuesto.requisitos || ''} onChange={e => setSelectedPuesto({...selectedPuesto, requisitos: e.target.value})} />
                            </div>
                            <div className="form-section">
                                <label><FaCheckCircle /> Beneficios del Puesto</label>
                                <textarea rows={5} value={selectedPuesto.beneficios || ''} onChange={e => setSelectedPuesto({...selectedPuesto, beneficios: e.target.value})} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label><FaMoneyBillWave /> Sueldo Mínimo</label>
                                    <div className="input-with-icon">
                                        <span className="currency-prefix">$</span>
                                        <input type="number" value={selectedPuesto.sueldo_min || 0} onChange={e => setSelectedPuesto({...selectedPuesto, sueldo_min: parseFloat(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><FaMoneyBillWave /> Sueldo Máximo</label>
                                    <div className="input-with-icon">
                                        <span className="currency-prefix">$</span>
                                        <input type="number" value={selectedPuesto.sueldo_max || 0} onChange={e => setSelectedPuesto({...selectedPuesto, sueldo_max: parseFloat(e.target.value)})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn-large primary" onClick={savePuestoProfile}>
                                <FaCheckCircle /> Actualizar Perfil Profesional
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Candidate Modal */}
            {showCandidatoModal && (
                <div className="modal-overlay-fused">
                    <div className="modal-content-fused">
                        <div className="modal-header">
                            <h3>Registrar Nuevo Candidato</h3>
                            <button className="close-btn" onClick={() => setShowCandidatoModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <div className="talento-form-section">
                                <span className="talento-form-section-label">Información de Contacto</span>
                                <div className="form-group">
                                    <label><FaUserTie /> Nombre completo</label>
                                    <input type="text" placeholder="Ej. Juan Pérez García" value={newCandidato.nombre_completo} onChange={e => setNewCandidato({...newCandidato, nombre_completo: e.target.value})} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label><FaListUl /> Correo electrónico</label>
                                        <input type="email" placeholder="correo@empresa.com" value={newCandidato.email} onChange={e => setNewCandidato({...newCandidato, email: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label><FaSync /> Teléfono</label>
                                        <input type="text" placeholder="55 1234 5678" value={newCandidato.telefono} onChange={e => setNewCandidato({...newCandidato, telefono: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="talento-form-section">
                                <span className="talento-form-section-label">Vinculación Organizacional</span>
                                <div className="form-group">
                                    <label>Vincular a vacante abierta (Recomendado)</label>
                                    <select
                                        value={newCandidato.idvacante}
                                        onChange={e =>
                                            setNewCandidato({
                                                ...newCandidato,
                                                idvacante: e.target.value,
                                                idpuesto: e.target.value ? '' : newCandidato.idpuesto
                                            })
                                        }
                                    >
                                        <option value="">— Seleccione vacante —</option>
                                        {vacantes.filter(v => v.estatus === 'Abierta').map(v => (
                                            <option key={v.idvacante} value={v.idvacante}>{v.titulo}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>O vincular solo a puesto (Sin vacante activa)</label>
                                    <select
                                        value={newCandidato.idpuesto}
                                        disabled={!!newCandidato.idvacante}
                                        onChange={e => setNewCandidato({ ...newCandidato, idpuesto: e.target.value })}
                                    >
                                        <option value="">— Seleccione puesto —</option>
                                        {puestos.map(p => (
                                            <option key={p.idpuesto} value={p.idpuesto}>{p.nombre_puesto}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="form-help-text">
                                    Al guardar se creará automáticamente el expediente C y I con sus 8 etapas de evaluación.
                                </p>
                            </div>
                            
                            <div className="talento-form-section">
                                <span className="talento-form-section-label">Adicional</span>
                                <div className="form-group">
                                    <label>Notas internas / Comentarios iniciales</label>
                                    <textarea rows={2} placeholder="Observaciones sobre la fuente o perfil…" value={newCandidato.notas} onChange={e => setNewCandidato({...newCandidato, notas: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn-large primary" onClick={submitCandidato}>
                                <FaUserPlus /> Añadir al Pool de Talento
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Vacancy Modal reuse ... */}
            {showVacancyModal && (
                <div className="modal-overlay-fused">
                    <div className="modal-content-fused" style={{ maxWidth: '560px' }}>
                        <div className="modal-header">
                            <h3>Activar Proceso de Reclutamiento</h3>
                            <button className="close-btn" onClick={() => setShowVacancyModal(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Título de la Vacante</label>
                                <input type="text" value={newVacante.titulo} onChange={e => setNewVacante({...newVacante, titulo: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Cantidad a Contratar</label>
                                <input type="number" value={newVacante.cantidad_solicitada} onChange={e => setNewVacante({...newVacante, cantidad_solicitada: parseInt(e.target.value)})} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn-large primary" onClick={submitNewVacancy}>
                                <FaRocket /> Iniciar Proceso C y I
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNuevoPuestoModal && (
                <div className="modal-overlay-fused">
                    <div className="modal-content-fused modal-nuevo-puesto" role="dialog" aria-labelledby="modal-nuevo-puesto-title">
                        <div className="modal-header modal-header--enterprise">
                            <div className="modal-header-lead">
                                <div className="modal-header-icon" aria-hidden>
                                    <FaSitemap />
                                </div>
                                <div>
                                    <h3 id="modal-nuevo-puesto-title">Nuevo puesto en la estructura</h3>
                                    <p className="modal-header-desc">Complete los datos del puesto para incorporarlo al organigrama y a los procesos de reclutamiento.</p>
                                </div>
                            </div>
                            <button type="button" className="close-btn" onClick={() => setShowNuevoPuestoModal(false)} aria-label="Cerrar"><FaTimes /></button>
                        </div>
                        <div className="modal-body modal-body--enterprise">
                            <div className="talento-form-section">
                                <span className="talento-form-section-label">Identificación</span>
                                <div className="form-group">
                                    <label htmlFor="np-nombre">Nombre del puesto</label>
                                    <input
                                        id="np-nombre"
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Ej. Analista de procesos"
                                        value={newPuestoForm.nombre_puesto}
                                        onChange={e => setNewPuestoForm({ ...newPuestoForm, nombre_puesto: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="np-area">Área organizacional</label>
                                    <select
                                        id="np-area"
                                        value={newPuestoForm.idarea}
                                        onChange={e => setNewPuestoForm({ ...newPuestoForm, idarea: e.target.value })}
                                    >
                                        <option value="">Corporativo / sin área</option>
                                        {areas.map(a => (
                                            <option key={a.idarea} value={a.idarea}>{a.nombre_area || `Área ${a.idarea}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="talento-form-section">
                                <span className="talento-form-section-label">Detalle</span>
                                <div className="form-group">
                                    <label htmlFor="np-desc">Descripción breve</label>
                                    <textarea
                                        id="np-desc"
                                        rows={3}
                                        placeholder="Responsabilidades principales o contexto del rol…"
                                        value={newPuestoForm.descripcion}
                                        onChange={e => setNewPuestoForm({ ...newPuestoForm, descripcion: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="talento-form-section">
                                <span className="talento-form-section-label">Capacidad y compensación</span>
                                <div className="form-group form-group--cupo-inline">
                                    <label htmlFor="np-cupo">Cupo máximo (headcount)</label>
                                    <input
                                        id="np-cupo"
                                        type="number"
                                        min={1}
                                        className="input-cupo"
                                        value={newPuestoForm.cupo_maximo}
                                        onChange={e => setNewPuestoForm({ ...newPuestoForm, cupo_maximo: parseInt(e.target.value, 10) || 1 })}
                                    />
                                </div>
                                <div className="form-group form-group--salary-pair">
                                    <span className="form-label-row" id="np-sueldo-label">Rango de sueldo sugerido</span>
                                    <div className="salary-inputs" role="group" aria-labelledby="np-sueldo-label">
                                        <div className="salary-field">
                                            <label htmlFor="np-smin" className="salary-sublabel">Mínimo</label>
                                            <input
                                                id="np-smin"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="0.00"
                                                value={newPuestoForm.sueldo_min}
                                                onChange={e => setNewPuestoForm({ ...newPuestoForm, sueldo_min: e.target.value })}
                                            />
                                        </div>
                                        <div className="salary-field">
                                            <label htmlFor="np-smax" className="salary-sublabel">Máximo</label>
                                            <input
                                                id="np-smax"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="0.00"
                                                value={newPuestoForm.sueldo_max}
                                                onChange={e => setNewPuestoForm({ ...newPuestoForm, sueldo_max: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer modal-footer--enterprise">
                            <button type="button" className="modal-btn modal-btn--secondary" onClick={() => setShowNuevoPuestoModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="modal-btn modal-btn--primary" onClick={submitNuevoPuesto}>
                                Crear puesto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionTalento;
