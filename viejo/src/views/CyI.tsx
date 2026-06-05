import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
    FaClipboardList, FaSync, FaSearch,
    FaBriefcase, FaLayerGroup, FaArrowRight,
    FaCalendarCheck, FaComments, FaUserTie
} from 'react-icons/fa';
import client from '../api/client';
import './styles/CyI.css';
import './styles/CyiStats.css';

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    comment: string;
}

interface Step {
    id: string;
    etapa_id: string;
    title: string;
    subtitle: string;
    description: string;
    status: 'approved' | 'skipped' | 'rejected' | 'in_progress' | 'pending';
    items: ChecklistItem[];
    notas: string;
}

const normalizeStepStatus = (raw: string | undefined): Step['status'] => {
    if (!raw) return 'pending';
    const legacy: Record<string, Step['status']> = {
        success: 'approved',
        warning: 'skipped',
        failed: 'rejected',
        active: 'in_progress',
        pending: 'pending'
    };
    if (legacy[raw]) return legacy[raw];
    if (['approved', 'skipped', 'rejected', 'in_progress', 'pending'].includes(raw)) {
        return raw as Step['status'];
    }
    return 'pending';
};

interface Candidate {
    idcandidato: number;
    nombre_completo: string;
    email: string | null;
    estatus: string;
    idpuesto: number | null;
    puestos?: { nombre_puesto: string } | null;
    idvacante: number | null;
    vacantes?: { titulo: string } | null;
}

const INITIAL_STEPS: Step[] = [
    {
        id: 'perfil_puesto',
        etapa_id: 'perfil_puesto',
        title: 'Perfil del Puesto',
        subtitle: 'Alineacion inicial',
        description: 'Validar perfil objetivo, competencias y rango de compensacion antes de avanzar.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'pp1', text: 'Perfil y competencias definidos', completed: false, comment: '' },
            { id: 'pp2', text: 'Rango salarial validado', completed: false, comment: '' }
        ]
    },
    {
        id: 'publicacion',
        etapa_id: 'publicacion',
        title: 'Publicacion',
        subtitle: 'Difusion vacante',
        description: 'Publicar la vacante y activar canales de atraccion de talento.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'pu1', text: 'Vacante publicada en portales', completed: false, comment: '' },
            { id: 'pu2', text: 'Difusion interna y externa', completed: false, comment: '' }
        ]
    },
    {
        id: 'filtro_cv',
        etapa_id: 'filtro_cv',
        title: 'Filtro CV',
        subtitle: 'Preseleccion',
        description: 'Filtrar candidatos de acuerdo con la matriz de requisitos.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'fc1', text: 'Revision curricular inicial', completed: false, comment: '' },
            { id: 'fc2', text: 'Preseleccion por requisitos', completed: false, comment: '' }
        ]
    },
    {
        id: 'entrevista_rh',
        etapa_id: 'entrevista_rh',
        title: 'Entrevista RH',
        subtitle: 'Primer contacto',
        description: 'Evaluar ajuste cultural y validar expectativas del candidato.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'er1', text: 'Entrevista inicial RH', completed: false, comment: '' },
            { id: 'er2', text: 'Validacion de expectativas', completed: false, comment: '' }
        ]
    },
    {
        id: 'evaluacion_tecnica',
        etapa_id: 'evaluacion_tecnica',
        title: 'Evaluacion Tecnica',
        subtitle: 'Validacion hard skills',
        description: 'Aplicar evaluaciones tecnicas y documentar resultados.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'et1', text: 'Prueba tecnica aplicada', completed: false, comment: '' },
            { id: 'et2', text: 'Resultado documentado', completed: false, comment: '' }
        ]
    },
    {
        id: 'entrevista_final',
        etapa_id: 'entrevista_final',
        title: 'Entrevista Final',
        subtitle: 'Decision area',
        description: 'Entrevista final con lider para confirmar la seleccion.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'ef1', text: 'Entrevista con lider del area', completed: false, comment: '' },
            { id: 'ef2', text: 'Retroalimentacion registrada', completed: false, comment: '' }
        ]
    },
    {
        id: 'oferta',
        etapa_id: 'oferta',
        title: 'Oferta',
        subtitle: 'Propuesta formal',
        description: 'Generar oferta economica y registrar respuesta del candidato.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'of1', text: 'Oferta economica emitida', completed: false, comment: '' },
            { id: 'of2', text: 'Aceptacion o negociacion registrada', completed: false, comment: '' }
        ]
    },
    {
        id: 'onboarding',
        etapa_id: 'onboarding',
        title: 'Onboarding',
        subtitle: 'Ingreso',
        description: 'Completar alta documental e induccion del nuevo ingreso.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'ob1', text: 'Documentos de ingreso completos', completed: false, comment: '' },
            { id: 'ob2', text: 'Plan de induccion programado', completed: false, comment: '' }
        ]
    }
];

const ManagerDashboard: React.FC<{ vacantes: any[], candidates: Candidate[] }> = ({ vacantes, candidates }) => {
    // Simple Gap Analysis: Vacantes vs Contratados
    return (
        <div className="manager-dashboard">
            <h2>Análisis Gerencial de Reclutamiento</h2>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Posiciones Requeridas</span>
                        <FaBriefcase className="stat-icon" />
                    </div>
                    <div className="stat-value">{vacantes.reduce((acc: number, v: any) => acc + v.cantidad_solicitada, 0)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Contrataciones Exitosas</span>
                        <FaCheckCircle className="stat-icon" />
                    </div>
                    <div className="stat-value">{vacantes.reduce((acc: number, v: any) => acc + v.cantidad_contratada, 0)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Candidatos Activos</span>
                        <FaUserTie className="stat-icon" />
                    </div>
                    <div className="stat-value">{candidates.filter(c => c.estatus !== 'Rechazado').length}</div>
                </div>
            </div>

            <div className="gap-analysis-section">
                <h3>Análisis de Gaps por Puesto</h3>
                <table className="gap-table">
                    <thead>
                        <tr>
                            <th>Puesto / Vacante</th>
                            <th>Área</th>
                            <th>Avance</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacantes.map(v => {
                            const pendientes = v.cantidad_solicitada - v.cantidad_contratada;
                            const progress = (v.cantidad_contratada / v.cantidad_solicitada) * 100;
                            return (
                                <tr key={v.idvacante}>
                                    <td><strong>{v.titulo}</strong></td>
                                    <td>{v.areas?.nombre_area || 'General'}</td>
                                    <td>
                                        <span>{v.cantidad_contratada} de {v.cantidad_solicitada}</span>
                                        <div className="gap-progress-bar">
                                            <div className="gap-progress-fill" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </td>
                                    <td>
                                        {pendientes > 0 ? (
                                            <span className="gap-status missing">Faltan {pendientes}</span>
                                        ) : (
                                            <span className="gap-status filled">Cubierta</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CyI: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
    const [activeStepId, setActiveStepId] = useState(INITIAL_STEPS[0].id);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'individual' | 'manager'>('individual');
    const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);
    const [vacantes, setVacantes] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [candidateRes, vacRes] = await Promise.all([
                    client.get('/candidatos'),
                    client.get('/vacantes')
                ]);
                setCandidates(candidateRes.data);
                setVacantes(vacRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const fetchProgress = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const response = await client.get(`/cyi?idcandidato=${id}`);
            const dbProgress = response.data;

            const mergedSteps = INITIAL_STEPS.map(initialStep => {
                const dbStep = dbProgress.find((s: any) => s.etapa_id === initialStep.etapa_id);
                if (dbStep) {
                    return {
                        ...initialStep,
                        status: normalizeStepStatus(dbStep.status),
                        items: (dbStep.items as ChecklistItem[])?.length
                            ? (dbStep.items as ChecklistItem[])
                            : initialStep.items,
                        notas: dbStep.notas || ''
                    };
                }
                return { ...initialStep, status: 'pending' as Step['status'] };
            });
            setSteps(mergedSteps);

            const lastCompletedIndex = mergedSteps.reduce((acc: number, step: Step, idx: number) => 
                step.status === 'approved' || step.status === 'skipped' ? idx : acc, -1
            );
            setMaxReachedStepIndex(lastCompletedIndex + 1);
        } catch (error) {
            console.error('Error loading CyI data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedId) {
            fetchProgress(selectedId);
        } else {
            setSteps(INITIAL_STEPS);
            setMaxReachedStepIndex(0);
        }
    }, [selectedId, fetchProgress]);

    const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
    const selectedCandidate = candidates.find(c => c.idcandidato === selectedId);

    // Sync specific step to DB
    const syncStep = async (step: Step) => {
        if (!selectedId) return;
        try {
            setSaving(true);
            await client.post('/cyi/update', {
                idcandidato: selectedId,
                idpuesto: selectedCandidate?.idpuesto,
                idvacante: selectedCandidate?.idvacante,
                etapa_id: step.etapa_id,
                status: step.status,
                items: step.items,
                notas: step.notas
            });
        } catch (error) {
            console.error('Error syncing step:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleItem = (itemId: string) => {
        const updatedSteps = steps.map(step => {
            if (step.id !== activeStepId) return step;
            const updatedStep = {
                ...step,
                items: step.items.map(item =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                )
            };
            syncStep(updatedStep);
            return updatedStep;
        });
        setSteps(updatedSteps);
    };

    const handleCommentChange = (itemId: string, comment: string) => {
        setSteps(prev => prev.map(step => {
            if (step.id !== activeStepId) return step;
            return {
                ...step,
                items: step.items.map(item =>
                    item.id === itemId ? { ...item, comment } : item
                )
            };
        }));
    };

    const handleCommentBlur = () => {
        const step = steps.find(s => s.id === activeStepId);
        if (step) syncStep(step);
    };

    const handleNotesChange = (notas: string) => {
        setSteps(prev => prev.map(step =>
            step.id === activeStepId ? { ...step, notas } : step
        ));
    };

    const handleNotesBlur = () => {
        const step = steps.find(s => s.id === activeStepId);
        if (step) syncStep(step);
    };

    const handleStatusChange = (status: Step['status']) => {
        const step = steps.find(s => s.id === activeStepId);
        if (!step) return;

        if (status === 'approved') {
            const allCompleted = step.items.every(item => item.completed);
            if (!allCompleted) {
                alert('No se puede completar la etapa hasta que todos los puntos de la lista estén verificados.');
                return;
            }
        }

        const updatedSteps = steps.map(s => {
            if (s.id !== activeStepId) return s;
            const updatedStep = { ...s, status };
            syncStep(updatedStep);
            return updatedStep;
        });
        
        setSteps(updatedSteps);

        if (status === 'approved' || status === 'skipped') {
            const currentIndex = steps.findIndex(s => s.id === activeStepId);
            setMaxReachedStepIndex(prev => Math.max(prev, currentIndex + 1));
        }
    };

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c =>
            c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.puestos?.nombre_puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.vacantes?.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [candidates, searchTerm]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const idcandidato = params.get('idcandidato');
        if (idcandidato) setSelectedId(parseInt(idcandidato));
    }, []);

    return (
        <div className="cyi-container">
            <div className="cyi-header">
                <div className="cyi-header-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1>Proceso de Reclutamiento</h1>
                            <p>Estrategia de contratación y búsqueda de talento por posición.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className="view-toggle">
                                <button 
                                    className={viewMode === 'individual' ? 'active' : ''} 
                                    onClick={() => setViewMode('individual')}
                                >
                                    Por Candidato
                                </button>
                                <button 
                                    className={viewMode === 'manager' ? 'active' : ''} 
                                    onClick={() => setViewMode('manager')}
                                >
                                    Análisis Gerencial
                                </button>
                            </div>
                            {saving && <span className="saving-label"><FaSync className="spin" /> Guardando...</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="cyi-content">
                {viewMode === 'manager' ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <ManagerDashboard vacantes={vacantes} candidates={candidates} />
                    </div>
                ) : (
                    <>
                        {/* Timeline Sidebar with Search */}
                        <div className="cyi-sidebar">
                    <div className="employee-search-container">
                        <div className="search-box-cyi">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Buscar candidato, puesto o vacante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {searchTerm && (
                            <div className="search-results-dropdown">
                                {filteredCandidates.map(c => (
                                    <div
                                        key={c.idcandidato}
                                        className="search-result-item"
                                        onClick={() => {
                                            setSelectedId(c.idcandidato);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <FaUserTie />
                                        <div className="res-info">
                                            <span className="res-name">{c.nombre_completo}</span>
                                            <span className="res-puesto">{c.puestos?.nombre_puesto || c.vacantes?.titulo || 'Sin puesto'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedCandidate ? (
                        <div className="selected-employee-card">
                            <div className="emp-avatar"><FaUserTie /></div>
                            <div className="emp-details">
                                <span className="emp-name">{selectedCandidate.nombre_completo}</span>
                                <span className="emp-badge">{selectedCandidate.puestos?.nombre_puesto || selectedCandidate.vacantes?.titulo || 'Sin puesto asignado'}</span>
                            </div>
                            <button className="change-btn" onClick={() => setSelectedId(null)}>
                                <FaLayerGroup style={{ marginRight: '5px' }} /> Cambiar
                            </button>
                        </div>
                    ) : (
                        <div className="empty-selection-msg">
                            <FaUserTie />
                            <p>Selecciona un candidato para gestionar su C y I</p>
                        </div>
                    )}

                    <div className="timeline-list">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`timeline-item ${step.id === activeStepId ? 'active' : ''} ${(!selectedId || index > maxReachedStepIndex) ? 'disabled' : ''}`}
                                onClick={() => selectedId && index <= maxReachedStepIndex && setActiveStepId(step.id)}
                            >
                                <div className={`timeline-marker ${step.status}`}>
                                    {step.status === 'approved' ? <FaCheckCircle /> : index + 1}
                                </div>
                                <div className="timeline-text">
                                    <span className="timeline-title">{step.title}</span>
                                    <span className="timeline-subtitle">{step.subtitle}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Detail Panel */}
                <div className="cyi-main-panel">
                    {selectedId ? (
                        <>
                            {loading ? (
                                <div className="panel-loading">
                                    <div className="spinner"></div>
                                    <p>Cargando datos de {selectedCandidate?.nombre_completo}...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="detail-header">
                                        <div className="detail-icon-wrapper">
                                            <FaBriefcase className="detail-icon" />
                                        </div>
                                        <div className="detail-title-block">
                                            <h2 className="detail-title">{activeStep.title}</h2>
                                            <div className="detail-meta-row">
                                                <span className="meta-item">
                                                    <FaCalendarCheck className="meta-icon" /> Etapa {steps.indexOf(activeStep) + 1} de {steps.length}
                                                </span>
                                                <span className={`status-badge ${activeStep.status}`}>
                                                    {activeStep.status === 'approved' && 'APROBADO'}
                                                    {activeStep.status === 'skipped' && 'OMITIDO'}
                                                    {activeStep.status === 'rejected' && 'RECHAZADO'}
                                                    {activeStep.status === 'in_progress' && 'EN PROCESO'}
                                                    {activeStep.status === 'pending' && 'PENDIENTE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="detail-description">{activeStep.description}</p>

                                    <div className="checklist-section">
                                        <h3><FaClipboardList style={{ marginRight: '10px' }} /> Lista de Verificación</h3>
                                        <div className="checklist-list">
                                            {activeStep.items.map(item => (
                                                <div key={item.id} className="checklist-item">
                                                    <div className="item-main">
                                                        <label className="custom-checkbox-container">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.completed}
                                                                onChange={() => handleToggleItem(item.id)}
                                                            />
                                                            <span className="checkmark"></span>
                                                            <span className="item-text">{item.text}</span>
                                                        </label>
                                                    </div>
                                                    <div className="item-comment-section">
                                                        <textarea
                                                            placeholder="Añadir comentario o nota técnica..."
                                                            value={item.comment}
                                                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                                            onBlur={() => handleCommentBlur()}
                                                            className="item-comment-input"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="notes-section">
                                        <h3><FaComments style={{ marginRight: '10px' }} /> Notas Generales de la Etapa</h3>
                                        <textarea
                                            className="notes-area"
                                            placeholder="Anotaciones generales sobre el avance de esta etapa..."
                                            value={activeStep.notas}
                                            onChange={(e) => handleNotesChange(e.target.value)}
                                            onBlur={handleNotesBlur}
                                        />
                                    </div>

                                    <div className="step-actions">
                                        <span className="actions-label">Cambiar Estado de Etapa:</span>
                                        <div className="actions-buttons">
                                            <button
                                                className={`action-btn btn-success ${activeStep.status === 'approved' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('approved')}
                                            >
                                                <FaCheckCircle /> Aprobar
                                            </button>
                                            <button
                                                className={`action-btn btn-warning ${activeStep.status === 'skipped' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('skipped')}
                                            >
                                                <FaExclamationTriangle /> Omitir
                                            </button>
                                            <button
                                                className={`action-btn btn-failed ${activeStep.status === 'rejected' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('rejected')}
                                            >
                                                <FaTimesCircle /> Rechazar
                                            </button>
                                            <button
                                                className={`action-btn btn-active ${activeStep.status === 'in_progress' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('in_progress')}
                                            >
                                                <FaArrowRight /> En Proceso
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="no-selection-placeholder">
                            <FaBriefcase size={64} style={{ color: '#e0e0e0', marginBottom: '20px' }} />
                            <h2>Gestión de Reclutamiento</h2>
                            <p>Utiliza el buscador de la izquierda para seleccionar un candidato y gestionar su flujo de C y I.</p>
                            <div className="placeholder-tips">
                                <span>1. Busca por nombre o puesto</span>
                                <span>2. Visualiza el progreso en tiempo real</span>
                                <span>3. Documenta cada etapa para el expediente digital</span>
                            </div>
                        </div>
                    )}
                </div>
                </>
                )}
            </div>
        </div>
    );
};

export default CyI;
