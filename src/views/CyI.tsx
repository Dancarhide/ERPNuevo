import React, { useState, useEffect, useCallback } from 'react';
import { 
    FaUserPlus, FaCalendarCheck, FaComments, FaCheckCircle, 
    FaExclamationTriangle, FaTimesCircle, FaHourglassHalf,
    FaClipboardList, FaSave, FaSync
} from 'react-icons/fa';
import client from '../api/client';
import './styles/CyI.css';

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    comment: string;
}

interface Step {
    id: string;
    etapa_id: string; // Map to DB etapa_id
    title: string;
    subtitle: string;
    description: string;
    status: 'success' | 'warning' | 'failed' | 'active' | 'pending';
    items: ChecklistItem[];
    notas: string;
}

const INITIAL_STEPS: Step[] = [
    {
        id: 'publicacion',
        etapa_id: 'publicacion',
        title: 'Publicación',
        subtitle: 'Inicio de vacante',
        description: 'Definición del perfil y publicación en los diferentes portales de reclutamiento.',
        status: 'success',
        notas: '',
        items: [
            { id: 'p1', text: 'Definición de Job Description', completed: true, comment: '' },
            { id: 'p2', text: 'Aprobación de presupuesto', completed: true, comment: '' },
            { id: 'p3', text: 'Publicación en LinkedIn/Indeed', completed: true, comment: '' },
            { id: 'p4', text: 'Filtro inicial de CVs', completed: true, comment: '' }
        ]
    },
    {
        id: 'entrevistas',
        etapa_id: 'entrevistas',
        title: 'Entrevistas',
        subtitle: 'Evaluación técnica',
        description: 'Rondas de entrevistas iniciales, técnicas y con el área solicitante.',
        status: 'active',
        notas: '',
        items: [
            { id: 'e1', text: 'Primera llamada (Screening)', completed: true, comment: 'Candidatos filtrados con éxito' },
            { id: 'e2', text: 'Entrevista técnica', completed: false, comment: '' },
            { id: 'e3', text: 'Evaluación psicométrica', completed: false, comment: '' },
            { id: 'e4', text: 'Entrevista con Jefe de Área', completed: false, comment: '' }
        ]
    },
    {
        id: 'seleccion',
        etapa_id: 'seleccion',
        title: 'Selección',
        subtitle: 'Decisión final',
        description: 'Comparativa de candidatos y selección del perfil idóneo para la posición.',
        status: 'pending',
        notas: '',
        items: [
            { id: 's1', text: 'Revisión de referencias laborales', completed: false, comment: '' },
            { id: 's2', text: 'Comparativa de terna', completed: false, comment: '' },
            { id: 's3', text: 'Aprobación de contratación', completed: false, comment: '' }
        ]
    },
    {
        id: 'contratacion',
        etapa_id: 'contratacion',
        title: 'Contratación',
        subtitle: 'Formalización',
        description: 'Envío de oferta, recolección de documentos y firma de contrato.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'c1', text: 'Envío de carta oferta', completed: false, comment: '' },
            { id: 'c2', text: 'Recepción de documentos personales', completed: false, comment: '' },
            { id: 'c3', text: 'Firma de contrato masivo/individual', completed: false, comment: '' },
            { id: 'c4', text: 'Alta en IMSS / Seguro', completed: false, comment: '' }
        ]
    },
    {
        id: 'induccion',
        etapa_id: 'induccion',
        title: 'Inducción',
        subtitle: 'Onboarding',
        description: 'Bienvenida del empleado, entrega de herramientas y capacitación inicial.',
        status: 'pending',
        notas: '',
        items: [
            { id: 'i1', text: 'Bienvenida institucional', completed: false, comment: '' },
            { id: 'i2', text: 'Entrega de equipo (PC/Accesos)', completed: false, comment: '' },
            { id: 'i3', text: 'Capacitación en procesos internos', completed: false, comment: '' },
            { id: 'i4', text: 'Asignación de mentor especial', completed: false, comment: '' }
        ]
    }
];

const CyI: React.FC = () => {
    const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
    const [activeStepId, setActiveStepId] = useState(INITIAL_STEPS[1].id);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch data from DB
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await client.get('/cyi');
            const dbProgress = response.data;

            if (dbProgress && dbProgress.length > 0) {
                const mergedSteps = INITIAL_STEPS.map(initialStep => {
                    const dbStep = dbProgress.find((s: any) => s.etapa_id === initialStep.etapa_id);
                    if (dbStep) {
                        return {
                            ...initialStep,
                            status: dbStep.status,
                            items: dbStep.items as ChecklistItem[],
                            notas: dbStep.notas || ''
                        };
                    }
                    return initialStep;
                });
                setSteps(mergedSteps);
            }
        } catch (error) {
            console.error('Error loading CyI data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

    // Sync specific step to DB
    const syncStep = async (step: Step) => {
        try {
            setSaving(true);
            await client.post('/cyi/update', {
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

    const handleCommentBlur = (itemId: string) => {
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
        const updatedSteps = steps.map(step => {
            if (step.id !== activeStepId) return step;
            const updatedStep = { ...step, status };
            syncStep(updatedStep);
            return updatedStep;
        });
        setSteps(updatedSteps);
    };

    if (loading) {
        return (
            <div className="cyi-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
                <p style={{ marginLeft: '15px' }}>Cargando progreso desde la base de datos...</p>
            </div>
        );
    }

    return (
        <div className="cyi-container">
            <div className="cyi-header">
                <div className="cyi-header-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1>Captación e Inducción</h1>
                        {saving && <span className="saving-label"><FaSync className="spin" /> Guardando...</span>}
                    </div>
                    <p>Gestiona el ciclo de vida del reclutamiento con persistencia en tiempo real.</p>
                </div>
            </div>

            <div className="cyi-content">
                {/* Timeline Sidebar */}
                <div className="cyi-sidebar">
                    <div className="timeline-list">
                        {steps.map((step, index) => (
                            <div 
                                key={step.id} 
                                className={`timeline-item ${step.id === activeStepId ? 'active' : ''}`}
                                onClick={() => setActiveStepId(step.id)}
                            >
                                <div className={`timeline-marker ${step.status}`}>
                                    {step.status === 'success' ? <FaCheckCircle /> : index + 1}
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
                    <div className="detail-header">
                        <div className="detail-icon-wrapper">
                            <FaUserPlus className="detail-icon" />
                        </div>
                        <div className="detail-title-block">
                            <h2 className="detail-title">{activeStep.title}</h2>
                            <div className="detail-meta-row">
                                <span className="meta-item">
                                    <FaCalendarCheck className="meta-icon" /> Etapa {steps.indexOf(activeStep) + 1} de {steps.length}
                                </span>
                                <span className={`status-badge ${activeStep.status}`}>
                                    {activeStep.status.replace(/^active$/, 'En proceso').toUpperCase()}
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
                                            onBlur={() => handleCommentBlur(item.id)}
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
                                className={`action-btn btn-success ${activeStep.status === 'success' ? 'active' : ''}`}
                                onClick={() => handleStatusChange('success')}
                            >
                                <FaCheckCircle /> Completado
                            </button>
                            <button 
                                className={`action-btn btn-warning ${activeStep.status === 'warning' ? 'active' : ''}`}
                                onClick={() => handleStatusChange('warning')}
                            >
                                <FaExclamationTriangle /> En Pausa
                            </button>
                            <button 
                                className={`action-btn btn-failed ${activeStep.status === 'failed' ? 'active' : ''}`}
                                onClick={() => handleStatusChange('failed')}
                            >
                                <FaTimesCircle /> Cancelado
                            </button>
                            <button 
                                className={`action-btn btn-active ${activeStep.status === 'active' ? 'active' : ''}`}
                                onClick={() => handleStatusChange('active')}
                            >
                                <FaHourglassHalf /> En Proceso
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CyI;
