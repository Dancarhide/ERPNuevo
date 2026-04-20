import React, { useState } from 'react';
import { 
    FaPollH, FaArrowRight, FaArrowLeft, FaCheckCircle, 
    FaSpinner, FaPaperPlane, FaLock, FaGlobe, FaCubes, 
    FaUserTie, FaCommentDots, FaUsers, FaMedal, FaVolumeUp
} from 'react-icons/fa';
import './styles/Dashboard.css';

interface Question {
    id: string;
    text: string;
}

interface Category {
    id: string;
    title: string;
    icon: React.ReactNode;
    questions: Question[];
}

const climateCategories: Category[] = [
    {
        id: 'orientacion_org',
        title: 'Orientación Organizacional',
        icon: <FaGlobe />,
        questions: [
            { id: 'q1', text: 'Al ingresar a la institución se me brindó la información relativa a la Misión, Visión, Principios y Valores de la entidad.' },
            { id: 'q2', text: 'Cuento con los recursos necesarios para realizar mi trabajo eficientemente' },
            { id: 'q3', text: 'En mi área de trabajo están definidos los procedimientos y estos garantizan la efectividad de las acciones que se realizan' },
            { id: 'q4', text: 'Conozco mis funciones, están claramente determinadas' }
        ]
    },
    {
        id: 'admin_talento',
        title: 'Administración de Talento',
        icon: <FaCubes />,
        questions: [
            { id: 'q5', text: 'Entiendo claramente mi papel dentro del área de trabajo a la que pertenezco' },
            { id: 'q6', text: 'Estoy ubicado en el cargo que desempeño, acorde con mis conocimientos y habilidades' },
            { id: 'q7', text: 'La persona que se vincula a la institución recibe un entrenamiento adecuado para realizar su trabajo.' },
            { id: 'q8', text: 'Participo en las actividades de bienestar que se realizan' }
        ]
    },
    {
        id: 'estilo_direccion',
        title: 'Estilo de Dirección',
        icon: <FaUserTie />,
        questions: [
            { id: 'q9', text: 'La institución otorga los reconocimientos a las personas que los merecen' },
            { id: 'q10', text: 'Mi superior tiene los conocimientos y destrezas para dirigir el área de trabajo.' },
            { id: 'q11', text: 'El trato que recibo de mis superiores es respetuoso' },
            { id: 'q12', text: 'Mi superior tiene en cuenta las sugerencias que formulo.' }
        ]
    },
    {
        id: 'comunicacion_int',
        title: 'Comunicación e Integración',
        icon: <FaCommentDots />,
        questions: [
            { id: 'q13', text: 'Existe un nivel de comunicación con mis compañeros que facilita el logro de resultados' },
            { id: 'q14', text: 'Me entero de lo que ocurre por comunicaciones oficiales más que por informales.' },
            { id: 'q15', text: 'Existe un nivel adecuado de comunicación entre las diferentes áreas.' },
            { id: 'q16', text: 'Estoy satisfecho con la forma en que me comunico en general de la institución' }
        ]
    },
    {
        id: 'trabajo_equipo',
        title: 'Trabajo en Equipo',
        icon: <FaUsers />,
        questions: [
            { id: 'q17', text: 'Los objetivos de los equipos de trabajo son compartidos por todos sus integrantes' },
            { id: 'q18', text: 'Tengo las habilidades requeridas para realizar mi trabajo' },
            { id: 'q19', text: 'En mi trabajo hago una buena utilización de mis conocimientos' },
            { id: 'q20', text: 'Manejo adecuadamente mi carga de trabajo' }
        ]
    },
    {
        id: 'capacidad_prof',
        title: 'Capacidad Profesional',
        icon: <FaMedal />,
        questions: [
            { id: 'q21', text: 'Estoy dispuesto a hacer un esfuerzo extra cuando sea necesario por la entidad.' },
            { id: 'q22', text: 'Me siento motivado para ayudar en el mejoramiento de los procesos.' },
            { id: 'q23', text: 'Estoy satisfecho con el trabajo que realizo' },
            { id: 'q24', text: 'Mi área de trabajo permanece ordenada' }
        ]
    }
];

const ClimateSurvey: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [viewMode, setViewMode] = useState<'intro' | 'demos' | 'questions'>('intro');
    const [currentStep, setCurrentStep] = useState(0);
    const [demographics, setDemographics] = useState({
        nivel_jerarquico: '',
        ubicacion: '',
        antiguedad: ''
    });

    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isActive, setIsActive] = useState<boolean | null>(null);

    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const token = sessionData?.token;
    const host = window.location.hostname;

    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/config`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsActive(data.clima_active);
                }
            } catch (e) {
                setIsActive(false);
            }
        };
        checkStatus();
    }, [token, host]);

    const allQuestionsFlat = climateCategories.flatMap(cat => cat.questions.map(q => ({...q, categoryId: cat.id})));
    const totalQuestions = allQuestionsFlat.length;

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel current audio
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleNext = () => {
        if (currentStep < totalQuestions - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            setViewMode('demos');
        }
    };

    const handleSubmit = async () => {
        setStatus('saving');
        try {
            const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            const token = userDataStr ? JSON.parse(userDataStr).token : '';
            const host = window.location.hostname;

            const groupedResponses: any = {};
            allQuestionsFlat.forEach(q => {
                if (!groupedResponses[q.categoryId]) groupedResponses[q.categoryId] = {};
                groupedResponses[q.categoryId][q.id] = responses[q.id];
            });

            const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
            const sessionData = userRaw ? JSON.parse(userRaw) : null;
            const userData = sessionData?.user || sessionData;
            const finalId = userData?.idempleado || userData?.id || sessionData?.idempleado;

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/climate-survey`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    idempleado: finalId,
                    ...demographics,
                    ...groupedResponses
                })
            });

            if (res.ok) setStatus('success');
        } catch (error) {
            console.error('Error:', error);
            setStatus('idle');
        }
    };

    return (
        <div className="survey-corporate-layout">
            <div className="survey-main-frame">
                {isActive === false ? (
                    <div className="corp-card intro-card" style={{ borderTop: '4px solid #A7313A', textAlign: 'left', padding: '50px' }}>
                        <div className="inventory-header" style={{ marginBottom: '30px' }}>
                            <div className="inv-progress-bar">
                                <div className="inv-fill" style={{ width: '0%', background: '#cbd5e1' }}></div>
                            </div>
                            <div className="inv-step-info">Acceso Restringido</div>
                        </div>

                        <div className="inv-title-area" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                            <div className="inv-icon-circle" style={{ width: '70px', height: '70px', background: 'rgba(68, 71, 74, 0.05)', color: '#64748b', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                                <FaLock />
                            </div>
                            <div className="inv-texts">
                                <h1 style={{ fontSize: '2.2rem', color: '#44474A', margin: 0, fontWeight: 800 }}>Encuesta no disponible</h1>
                                <p style={{ color: '#858789', fontSize: '1.1rem', margin: '5px 0 0 0' }}>La campaña de clima laboral no está activa actualmente.</p>
                            </div>
                        </div>

                        <div className="inv-body-area">
                            <div className="user-prefill-badge" style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #cbd5e1', marginBottom: '30px', fontSize: '1.4rem', color: '#44474A', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <FaLock style={{ color: '#858789' }} /> Hola, <strong>{sessionData?.user?.nombre_completo_empleado || 'Compañero'}</strong>.
                            </div>
                            <p style={{ fontSize: '1.2rem', color: '#64748b' }}>
                                Tu participación es vital para nosotros, te avisaremos cuando se abra un nuevo ciclo de evaluación.
                            </p>
                        </div>

                        <div className="corp-divider" style={{ height: '1px', background: '#eee', margin: '30px 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => window.location.href = '/home'} className="btn-corp-primary-lg" style={{ margin: 0, padding: '15px 35px' }}>
                                Volver al Inicio <FaArrowRight />
                            </button>
                        </div>
                    </div>
                ) : status === 'success' ? (
                    <div className="corp-card intro-card" style={{ borderTop: '4px solid #10b981', textAlign: 'left', padding: '50px' }}>
                        <div className="inventory-header" style={{ marginBottom: '30px' }}>
                            <div className="inv-progress-bar">
                                <div className="inv-fill" style={{ width: '100%', background: '#10b981' }}></div>
                            </div>
                            <div className="inv-step-info">¡Encuesta Enviada!</div>
                        </div>

                        <div className="inv-title-area" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                            <div className="inv-icon-circle" style={{ width: '70px', height: '70px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                                <FaCheckCircle />
                            </div>
                            <div className="inv-texts">
                                <h1 style={{ fontSize: '2.2rem', color: '#44474A', margin: 0, fontWeight: 800 }}>¡Muchas Gracias!</h1>
                                <p style={{ color: '#858789', fontSize: '1.1rem', margin: '5px 0 0 0' }}>Tus respuestas se procesaron de forma segura.</p>
                            </div>
                        </div>

                        <div className="inv-body-area">
                            <div className="user-prefill-badge" style={{ background: '#f0fdf4', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #10b981', marginBottom: '30px', fontSize: '1.4rem', color: '#44474A', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <FaCheckCircle style={{ color: '#10b981' }} /> Hola, <strong>{sessionData?.user?.nombre_completo_empleado || 'Compañero'}</strong>.
                            </div>
                            <p style={{ fontSize: '1.2rem', color: '#64748b' }}>
                                Tu opinión es fundamental para mejorar nuestra cultura organizacional. Tus respuestas son 100% anónimas y privadas.
                            </p>
                        </div>

                        <div className="corp-divider" style={{ height: '1px', background: '#eee', margin: '30px 0' }}></div>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button 
                                onClick={() => {
                                    setStatus('idle');
                                    setViewMode('intro');
                                    setCurrentStep(0);
                                    setResponses({});
                                }} 
                                className="btn-corp-primary"
                                style={{ padding: '12px 30px' }}
                            >
                                Hacer otra
                            </button>
                            <button onClick={() => window.location.href = '/home'} className="btn-corp-text" style={{ padding: '12px 30px' }}>
                                Volver al Inicio
                            </button>
                        </div>
                    </div>
                ) : viewMode === 'intro' ? (
                    <div className="corp-card intro-card">
                        <div className="corp-logo-top"><FaPollH /></div>
                        <h1>Encuesta de Clima Laboral</h1>
                        <p>Tu opinión es muy importante. No es necesario saber leer mucho, puedes usar el botón de sonido 🔊 para escuchar las preguntas.</p>
                        <div className="corp-divider"></div>
                        <button onClick={() => { speakText("Encuesta de Clima Laboral. Por favor responde honestamente."); setViewMode('demos'); }} className="btn-corp-primary-lg">Comenzar <FaArrowRight /></button>
                    </div>
                ) : viewMode === 'demos' ? (
                    <div className="corp-card">
                        <div className="card-top-header">
                            <span className="step-tag">Paso 1 de 2</span>
                            <h2>Información</h2>
                        </div>
                        <p className="card-subtitle">Selecciona las opciones que te correspondan:</p>

                        <div className="corp-form-stack">
                            <div className="corp-form-group">
                                <label>1. ¿En qué trabajas?</label>
                                <div className="corp-options">
                                    {['Gerencial', 'Administrativo', 'Operativo'].map(opt => (
                                        <button key={opt} className={`corp-pill ${demographics.nivel_jerarquico === opt ? 'active' : ''}`} onClick={() => setDemographics({...demographics, nivel_jerarquico: opt})}>{opt}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="corp-form-group">
                                <label>2. ¿En dónde trabajas?</label>
                                <div className="corp-options">
                                    {['Sucursal', 'Corporativo'].map(opt => (
                                        <button key={opt} className={`corp-pill ${demographics.ubicacion === opt ? 'active' : ''}`} onClick={() => setDemographics({...demographics, ubicacion: opt})}>{opt}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="card-footer-actions">
                            <button 
                                disabled={!demographics.nivel_jerarquico || !demographics.ubicacion}
                                onClick={() => setViewMode('questions')} 
                                className="btn-corp-primary"
                            >
                                Continuar <FaArrowRight />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="corp-card question-view">
                        <div className="survey-progress-header">
                            <div className="progress-text">Pregunta {currentStep + 1} de {totalQuestions}</div>
                            <div className="progress-bar-container">
                                <div className="progress-bar-fill" style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="category-indicator">
                            {climateCategories.find(c => c.id === allQuestionsFlat[currentStep].categoryId)?.icon}
                            <span>{climateCategories.find(c => c.id === allQuestionsFlat[currentStep].categoryId)?.title}</span>
                        </div>

                        <div className="question-text-wrapper">
                            <h2 className="main-question-text">{allQuestionsFlat[currentStep].text}</h2>
                            <button className="btn-tts" title="Leer en voz alta" onClick={() => speakText(allQuestionsFlat[currentStep].text)}>
                                <FaVolumeUp /> Escuchar
                            </button>
                        </div>
                        
                        <div className="corp-likert-grid">
                            {[
                                {v: 1, l: 'Total desacuerdo', e: '😞'},
                                {v: 2, l: 'En desacuerdo', e: '😐'},
                                {v: 3, l: 'De acuerdo', e: '🙂'},
                                {v: 4, l: 'Total acuerdo', e: '😄'}
                            ].map(opt => {
                                const qId = allQuestionsFlat[currentStep].id;
                                return (
                                    <button 
                                        key={opt.v}
                                        className={`corp-tile tile-${opt.v} ${responses[qId] === opt.v ? 'active' : ''}`}
                                        onClick={() => {
                                            setResponses({...responses, [qId]: opt.v});
                                        }}
                                    >
                                        <div className="tile-emoji">{opt.e}</div>
                                        <div className="tile-content">
                                            <div className="tile-num">{opt.v}</div>
                                            <div className="tile-label">{opt.l}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="card-footer-actions">
                            <button onClick={handleBack} className="btn-corp-text"><FaArrowLeft /> Atrás</button>
                            
                            {currentStep < totalQuestions - 1 && responses[allQuestionsFlat[currentStep].id] && (
                                <button onClick={() => setCurrentStep(prev => prev + 1)} className="btn-corp-primary">
                                    Siguiente <FaArrowRight />
                                </button>
                            )}

                            {currentStep === totalQuestions - 1 && responses[allQuestionsFlat[currentStep].id] && (
                                <button disabled={status === 'saving'} onClick={handleSubmit} className="btn-corp-accent">
                                    {status === 'saving' ? <FaSpinner className="spin" /> : <FaPaperPlane />} Enviar
                                </button>
                            )}
                            <div className="corp-hint"><FaLock /> Tu respuesta es privada</div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .survey-corporate-layout {
                    min-height: 100vh;
                    width: 100%;
                    background-color: #E1DFE0;
                    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.08'%3E%3Ccircle cx='50' cy='50' r='14' fill='%23A7313A'/%3E%3Crect x='14' y='14' width='14' height='14' fill='%23A7313A'/%3E%3Crect x='72' y='14' width='14' height='14' fill='%23A7313A'/%3E%3Crect x='14' y='72' width='14' height='14' fill='%23A7313A'/%3E%3Crect x='72' y='72' width='14' height='14' fill='%23A7313A'/%3E%3Cpath d='M50 15v14.5M34.5 29.5h31M50 85V70.5M34.5 70.5h31M15 50h14.5M29.5 34.5v31M85 50H70.5M70.5 34.5v31' fill='none' stroke='%2344474A' stroke-width='3.5'/%3E%3C/g%3E%3C/svg%3E");
                    background-size: 150px 150px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    font-family: 'Inter', sans-serif;
                }

                .survey-main-frame { width: 100%; max-width: 850px; z-index: 5; }
                .corp-card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .intro-card { text-align: center; }
                .corp-logo-top { font-size: 3rem; color: #A7313A; margin-bottom: 20px; }
                .corp-card h1 { font-size: 2rem; color: #44474A; margin-bottom: 15px; }
                .corp-divider { height: 1px; background: #eee; margin: 30px 0; }
                
                .btn-corp-primary-lg {
                    background: #A7313A; color: white; border: none; padding: 18px 45px;
                    border-radius: 8px; font-size: 1.2rem; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 15px; margin: 0 auto;
                }

                .corp-form-stack { margin: 30px 0; display: flex; flex-direction: column; gap: 25px; }
                .corp-pill {
                    border: 2px solid #ddd; padding: 12px 20px; border-radius: 8px; background: white;
                    font-weight: 600; cursor: pointer; transition: 0.2s;
                }
                .corp-pill.active { background: #A7313A; color: white; border-color: #A7313A; }

                .question-text-wrapper { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 40px; }
                .main-question-text { font-size: 1.8rem; line-height: 1.2; color: #44474A; margin: 0; font-weight: 800; }
                
                .btn-tts {
                    background: rgba(167, 49, 58, 0.05); border: 1px solid rgba(167, 49, 58, 0.1); padding: 10px 15px; border-radius: 8px;
                    font-weight: 700; color: #A7313A; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    white-space: nowrap; transition: all 0.2s;
                }
                .btn-tts:hover { background: rgba(167, 49, 58, 0.1); transform: scale(1.05); }

                .btn-corp-text { 
                    background: rgba(68, 71, 74, 0.05); 
                    border: 1px solid #e2e8f0; 
                    padding: 10px 20px;
                    border-radius: 8px;
                    color: #44474A; 
                    font-weight: 700; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }
                .btn-corp-text:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                    transform: translateX(-3px);
                }

                .corp-likert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .corp-tile {
                    background: #f8fafc; border: 2px solid #f1f5f9; padding: 20px; border-radius: 12px;
                    display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s;
                }
                .tile-emoji { font-size: 2.5rem; }
                .tile-content { text-align: left; }
                .tile-num { font-weight: 900; color: #858789; font-size: 0.8rem; }
                .tile-label { font-weight: 700; color: #44474A; }

                .corp-tile:hover { transform: translateY(-2px); border-color: #A7313A; }
                .tile-1.active { border-color: #ef4444; background: #fef2f2; }
                .tile-2.active { border-color: #f59e0b; background: #fffbeb; }
                .tile-3.active { border-color: #84cc16; background: #f7fee7; }
                .tile-4.active { border-color: #10b981; background: #ecfdf5; }
                
                .card-footer-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; }
                .btn-corp-primary { background: #44474A; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; }
                .btn-corp-accent { background: #10b981; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; }
                
                .survey-progress-header { margin-bottom: 30px; }
                .progress-bar-container { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
                .progress-bar-fill { height: 100%; background: #A7313A; transition: 0.3s; }

                @media (max-width: 600px) {
                    .corp-likert-grid { grid-template-columns: 1fr; }
                    .main-question-text { font-size: 1.4rem; }
                }
            `}</style>
        </div>
    );
};

export default ClimateSurvey;
