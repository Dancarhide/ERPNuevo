import React, { useState, useEffect } from 'react';
import { 
    FaUserEdit, FaSave, FaSpinner, FaCheckCircle, FaVolumeUp, 
    FaArrowRight, FaArrowLeft, FaMale, FaFemale, FaGenderless,
    FaHome, FaPhone, FaUserShield, FaGraduationCap, FaMapMarkerAlt,
    FaHeart, FaBaby, FaRegIdCard, FaUsers, FaLock
} from 'react-icons/fa';
import './styles/Dashboard.css';

const HRInventory: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [currentStep, setCurrentStep] = useState(0);
    
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const userPayload = userDataStr ? JSON.parse(userDataStr) : null;
    const user = userPayload?.user || userPayload; // Path varies by how it's stored

    const [formData, setFormData] = useState({
        sexo: user?.sexo || '',
        fecha_nacimiento: user?.fecha_nacimiento ? new Date(user.fecha_nacimiento).toISOString().split('T')[0] : '',
        lugar_nacimiento: user?.lugar_nacimiento || '',
        entidad_federativa: user?.entidad_federativa || '',
        ciudad: user?.ciudad || '',
        colonia: user?.colonia || '',
        direccion_completa: user?.direccion_empleado || '',
        cp: user?.cp || '',
        estado_civil: user?.estado_civil || '',
        ultimo_grado_escolar: user?.ultimo_grado_escolar || '',
        aspiraciones_profesionales: user?.aspiraciones_profesionales || '',
        cartilla_militar: user?.cartilla_militar ? 'Si' : 'No'
    });

    const [isActive, setIsActive] = useState<boolean | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const host = window.location.hostname;
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/config`, {
                    headers: { 'Authorization': `Bearer ${userPayload?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsActive(data.expediente_active);
                }
            } catch (e) {
                setIsActive(false);
            }
        };
        checkStatus();
    }, [userPayload?.token]);

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setStatus('saving');
        try {
            const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
            const sessionData = userRaw ? JSON.parse(userRaw) : null;
            const userData = sessionData?.user || sessionData;
            const finalId = userData?.idempleado || userData?.id || sessionData?.idempleado;
            
            console.log('DEBUG - Enviando inventario para ID:', finalId, 'Data:', sessionData);
            const host = window.location.hostname;

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/encuestas/hr-inventory`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userPayload?.token}`
                },
                body: JSON.stringify({ ...formData, idempleado: finalId })
            });

            if (res.ok) setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('idle');
        }
    };

    const steps = [
        {
            title: 'Bienvenido',
            icon: <FaUserEdit />,
            description: 'Vamos a completar tu expediente. Si no sabes leer bien, presiona el botón de sonido 🔊.',
            type: 'intro'
        },
        {
            title: 'Tu Género',
            field: 'sexo',
            type: 'choice',
            options: [
                { value: 'Masculino', label: 'Hombre', icon: <FaMale /> },
                { value: 'Femenino', label: 'Mujer', icon: <FaFemale /> },
                { value: 'Otro', label: 'Otro', icon: <FaGenderless /> }
            ]
        },
        {
            title: 'Estado Civil',
            field: 'estado_civil',
            type: 'choice',
            options: [
                { value: 'Soltero', label: 'Soltero', icon: <FaHeart style={{color: '#aaa'}}/> },
                { value: 'Casado', label: 'Casado', icon: <FaHeart style={{color: '#e74c3c'}}/> },
                { value: 'Union Libre', label: 'Unión Libre', icon: <FaUsers /> }
            ]
        },
        {
            title: 'Nacimiento',
            description: '¿Cuándo naciste?',
            type: 'input',
            fields: [
                { name: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date' },
                { name: 'lugar_nacimiento', label: 'Ciudad donde naciste', type: 'text' }
            ]
        },
        {
            title: 'Domicilio',
            description: '¿Dónde vives actualmente?',
            type: 'input',
            fields: [
                { name: 'entidad_federativa', label: 'Estado', type: 'text' },
                { name: 'ciudad', label: 'Ciudad', type: 'text' },
                { name: 'colonia', label: 'Colonia', type: 'text' },
                { name: 'direccion_completa', label: 'Calle y Número', type: 'text' },
                { name: 'cp', label: 'Código Postal', type: 'number' }
            ]
        },
        {
            title: 'Educación',
            field: 'ultimo_grado_escolar',
            type: 'choice',
            options: [
                { value: 'Sin estudios', label: 'Sin estudios', icon: <FaUserShield /> },
                { value: 'Primaria', label: 'Primaria', icon: <FaGraduationCap /> },
                { value: 'Secundaria', label: 'Secundaria', icon: <FaGraduationCap /> },
                { value: 'Bachillerato', label: 'Bachillerato / Prepa', icon: <FaGraduationCap /> },
                { value: 'Licenciatura', label: 'Universidad', icon: <FaGraduationCap /> }
            ]
        }
    ];

    const currentStepData = steps[currentStep] || steps[0];

    return (
        <div className="survey-corporate-layout">
            <div className="survey-main-frame">
                {isActive === false ? (
                    <div className="corp-card inventory-card-modern" style={{ borderTop: '4px solid #A7313A' }}>
                        <div className="inventory-header">
                            <div className="inv-progress-bar">
                                <div className="inv-fill" style={{ width: '0%', background: '#cbd5e1' }}></div>
                            </div>
                            <div className="inv-step-info">Acceso Restringido</div>
                        </div>

                        <div className="inv-content">
                            <div className="inv-title-area">
                                <div className="inv-icon-circle" style={{ background: 'rgba(68, 71, 74, 0.05)', color: '#64748b' }}>
                                    <FaUserShield />
                                </div>
                                <div className="inv-texts">
                                    <h2 style={{ color: '#64748b' }}>Expediente no disponible</h2>
                                    <p>La campaña de actualización de datos no está activa actualmente.</p>
                                </div>
                            </div>

                            <div className="inv-body-area">
                                <div className="user-prefill-badge" style={{ borderLeftColor: '#cbd5e1' }}>
                                    <FaLock style={{ color: '#858789' }} /> Hola, <strong>{user?.nombre_completo_empleado || 'Compañero'}</strong>.
                                </div>
                                <p style={{ fontSize: '1.2rem', color: '#64748b' }}>
                                    Recursos Humanos notificará cuando se abra un nuevo periodo para completar tu información.
                                </p>
                            </div>

                            <div className="inv-footer" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => window.location.href = '/home'} className="btn-corp-primary-lg" style={{ background: '#44474A' }}>
                                    Volver al Inicio <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : status === 'success' ? (
                    <div className="corp-card inventory-card-modern" style={{ borderTop: '4px solid #10b981' }}>
                        <div className="inventory-header">
                            <div className="inv-progress-bar">
                                <div className="inv-fill" style={{ width: '100%', background: '#10b981' }}></div>
                            </div>
                            <div className="inv-step-info">¡Proceso Completado!</div>
                        </div>

                        <div className="inv-content">
                            <div className="inv-title-area">
                                <div className="inv-icon-circle" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <FaCheckCircle />
                                </div>
                                <div className="inv-texts">
                                    <h2 style={{ color: '#1e293b' }}>¡Datos Guardados!</h2>
                                    <p>Tu expediente digital ha sido actualizado con éxito.</p>
                                </div>
                            </div>

                            <div className="inv-body-area">
                                <div className="user-prefill-badge" style={{ borderLeftColor: '#10b981', background: '#f0fdf4' }}>
                                    <FaCheckCircle style={{ color: '#10b981' }} /> Hola, <strong>{user?.nombre_completo_empleado || 'Compañero'}</strong>.
                                </div>
                                <p style={{ fontSize: '1.2rem', color: '#64748b' }}>
                                    Toda tu información ha sido verificada y almacenada de forma segura en el sistema institucional.
                                </p>
                            </div>

                            <div className="inv-footer" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => window.location.href = '/home'} className="btn-corp-accent-lg">
                                    Finalizar y Salir <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="corp-card inventory-card-modern">
                        <div className="inventory-header">
                            <div className="inv-progress-bar">
                                <div className="inv-fill" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>
                            </div>
                            <div className="inv-step-info">Paso {currentStep + 1} de {steps.length}</div>
                        </div>

                        <div className="inv-content">
                            <div className="inv-title-area">
                                <div className="inv-icon-circle">{currentStepData.icon}</div>
                                <div className="inv-texts">
                                    <h2>{currentStepData.title}</h2>
                                    {currentStepData.description && <p>{currentStepData.description}</p>}
                                </div>
                                <button className="btn-tts-inv" onClick={() => speakText(`${currentStepData.title}. ${currentStepData.description || ''}`)}>
                                    <FaVolumeUp /> Escuchar
                                </button>
                            </div>

                            <div className="inv-body-area">
                                {currentStepData.type === 'intro' && (
                                    <div className="inv-intro-body">
                                        <div className="user-prefill-badge">
                                            <FaRegIdCard /> Hola, <strong>{user?.nombre_completo_empleado || 'Compañero'}</strong>.
                                        </div>
                                        <p style={{fontSize: '1.2rem', color: '#44474A'}}>Vamos a verificar que toda tu información sea correcta en el sistema.</p>
                                    </div>
                                )}

                                {currentStepData.type === 'choice' && (
                                    <div className="inv-choice-grid">
                                        {currentStepData.options?.map(opt => (
                                            <button 
                                                key={opt.value} 
                                                className={`inv-choice-tile ${formData[currentStepData.field as keyof typeof formData] === opt.value ? 'active' : ''}`}
                                                onClick={() => {
                                                    handleChange(currentStepData.field!, opt.value);
                                                    speakText(opt.label);
                                                }}
                                            >
                                                <div className="tile-icon-lg">{opt.icon}</div>
                                                <div className="tile-label-lg">{opt.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {currentStepData.type === 'input' && (
                                    <div className="inv-input-stack">
                                        {currentStepData.fields?.map(f => (
                                            <div key={f.name} className="inv-input-group">
                                                <label>{f.label}</label>
                                                <input 
                                                    type={f.type} 
                                                    value={formData[f.name as keyof typeof formData]} 
                                                    onChange={(e) => handleChange(f.name, e.target.value)}
                                                    className="inv-form-control"
                                                    placeholder={`Tu ${f.label.toLowerCase()}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="inv-footer">
                                <button disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)} className="btn-corp-text">
                                    <FaArrowLeft /> Atrás
                                </button>
                                
                                {currentStep === steps.length - 1 ? (
                                    <button onClick={handleSubmit} disabled={status === 'saving'} className="btn-corp-accent-lg">
                                        {status === 'saving' ? <FaSpinner className="spin" /> : <FaSave />} Finalizar
                                    </button>
                                ) : (
                                    <button onClick={() => setCurrentStep(currentStep + 1)} className="btn-corp-primary-lg">
                                        {currentStep === 0 ? 'Comenzar' : 'Siguiente'} <FaArrowRight />
                                    </button>
                                )}
                            </div>
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

                .survey-main-frame { width: 100%; max-width: 850px; }
                .corp-card { background: white; border-radius: 12px; padding: 50px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
                
                .inventory-header { margin-bottom: 40px; }
                .inv-progress-bar { height: 6px; background: #eee; border-radius: 3px; margin-bottom: 10px; overflow: hidden; }
                .inv-fill { height: 100%; background: #A7313A; transition: width 0.4s ease; }
                .inv-step-info { font-size: 0.8rem; font-weight: 800; color: #858789; text-transform: uppercase; }

                .inv-title-area { display: flex; align-items: center; gap: 20px; margin-bottom: 50px; }
                .inv-icon-circle { width: 70px; height: 70px; background: rgba(167, 49, 58, 0.05); color: #A7313A; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
                .inv-texts h2 { margin: 0; font-size: 2.2rem; color: #44474A; font-weight: 800; }
                .inv-texts p { margin: 5px 0 0 0; color: #858789; font-size: 1.1rem; }

                .btn-tts-inv {
                    margin-left: auto; background: rgba(167, 49, 58, 0.05); border: 1px solid rgba(167, 49, 58, 0.1); 
                    padding: 10px 20px; border-radius: 50px; color: #A7313A; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 10px; transition: all 0.2s;
                }
                .btn-tts-inv:hover { transform: scale(1.05); background: rgba(167, 49, 58, 0.1); }

                .user-prefill-badge {
                    background: #f8fafc; padding: 25px; border-radius: 15px; border-left: 5px solid #A7313A; margin-bottom: 30px;
                    font-size: 1.4rem; color: #44474A; display: flex; align-items: center; gap: 15px;
                }

                .inv-choice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 25px; }
                .inv-choice-tile {
                    background: white; border: 2px solid #f1f5f9; padding: 40px 20px; border-radius: 24px;
                    cursor: pointer; transition: 0.3s; text-align: center;
                }
                .inv-choice-tile:hover { transform: translateY(-5px); border-color: #A7313A; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
                .inv-choice-tile.active { background: #A7313A; color: white; border-color: #A7313A; box-shadow: 0 10px 20px rgba(167,49,58,0.3); }

                .tile-icon-lg { font-size: 4rem; margin-bottom: 20px; }
                .tile-label-lg { font-weight: 800; font-size: 1.3rem; }

                .inv-input-group label { display: block; font-weight: 700; margin-bottom: 12px; color: #44474A; font-size: 1.1rem; }
                .inv-form-control {
                    width: 100%; padding: 18px; border: 2px solid #e1e7ec; border-radius: 12px;
                    font-size: 1.1rem; background: #fff; transition: all 0.2s;
                }
                .inv-form-control:focus { border-color: #A7313A; outline: none; box-shadow: 0 0 0 4px rgba(167,49,58,0.1); }

                .inv-footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: center; }
                
                .btn-corp-primary-lg {
                    background: #44474A; color: white; border: none; padding: 18px 45px;
                    border-radius: 12px; font-weight: 800; font-size: 1.1rem; cursor: pointer;
                    display: flex; align-items: center; gap: 12px; transition: all 0.2s;
                }
                .btn-corp-primary-lg:hover { background: #1e1f21; transform: translateY(-2px); }

                .btn-corp-text {
                    background: rgba(68, 71, 74, 0.05); border: 1px solid #e2e8f0; padding: 12px 25px;
                    border-radius: 12px; color: #44474A; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 10px; transition: all 0.2s;
                }
                .btn-corp-text:disabled { opacity: 0.1; cursor: not-allowed; }
                .btn-corp-text:hover:not(:disabled) { background: #f1f5f9; transform: translateX(-3px); }

                .btn-corp-accent-lg {
                    background: #10b981; color: white; border: none; padding: 18px 50px;
                    border-radius: 12px; font-weight: 800; font-size: 1.2rem; cursor: pointer;
                    display: flex; align-items: center; gap: 12px;
                }

                .corp-icon-success { font-size: 6rem; color: #10b981; margin-bottom: 30px; }
                .corporate-finish-card { background: white; padding: 80px; border-radius: 24px; text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.1); }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default HRInventory;
