import React, { useState, useEffect } from 'react';
import { FiStar, FiPlus, FiTrash2, FiSend, FiBarChart2, FiEdit3, FiCheck } from 'react-icons/fi';
import client from '../api/client';
import './styles/Incidencias.css'; // reutilizamos base styles

interface Pregunta {
    idquestion: number;
    pregunta: string;
    evaluation_type: string;
    create_time?: string;
}

interface Empleado {
    idempleado: number;
    nombre_completo_empleado: string;
    idarea: number | null;
}

interface ResultadoEmpleado {
    respuestas: { pregunta: string; tipo: string; respuesta: string; valor_numerico: number | null }[];
    promedio: number;
}

const TIPOS_EVAL = [
    { key: '360_grados', label: '360 Grados' },
    { key: 'auto_evaluacion', label: 'Auto-Evaluación' },
    { key: 'jefe_subordinado', label: 'Jefe → Subordinado' },
    { key: 'satisfaccion', label: 'Satisfacción General' }
];

const EvaluacionesDesempeno: React.FC = () => {
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const isAdmin = userData?.rol === 'Admin' || userData?.rol === 'Administrador del Sistema' || userData?.rol === 'RH';

    const [tab, setTab] = useState<'evaluar' | 'configurar' | 'resultados'>('evaluar');
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [tipoActivo, setTipoActivo] = useState('auto_evaluacion');
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [empleadoSelec, setEmpleadoSelec] = useState<number | ''>('');
    const [respuestas, setRespuestas] = useState<Record<number, string>>({});
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    // Config tab
    const [newPregunta, setNewPregunta] = useState({ pregunta: '', evaluation_type: 'auto_evaluacion' });
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Resultados tab
    const [resultadoEmp, setResultadoEmp] = useState<ResultadoEmpleado | null>(null);
    const [loadingResultados, setLoadingResultados] = useState(false);

    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPreguntas = async () => {
        try {
            const res = await client.get('/evaluaciones-desempeno', { params: { tipo: tipoActivo } });
            setPreguntas(res.data);
        } catch { showToast('Error al cargar preguntas', false); }
    };

    const fetchEmpleados = async () => {
        try {
            const res = await client.get('/empleados');
            setEmpleados(res.data);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchPreguntas();
    }, [tipoActivo]);

    useEffect(() => {
        if (tab === 'resultados' || tab === 'evaluar') fetchEmpleados();
    }, [tab]);

    // Enviar respuestas
    const handleEnviar = async () => {
        const id_empleado = empleadoSelec || userData?.id;
        if (!id_empleado) { showToast('Selecciona un empleado', false); return; }
        const lista = Object.entries(respuestas).map(([id_pregunta, respuesta]) => ({
            id_pregunta: parseInt(id_pregunta),
            respuesta
        }));
        if (lista.length === 0) { showToast('Completa al menos una respuesta', false); return; }
        setEnviando(true);
        try {
            await client.post('/evaluaciones-desempeno/respuestas', { id_empleado, respuestas: lista });
            setEnviado(true);
            showToast('Evaluación guardada correctamente', true);
            setRespuestas({});
        } catch { showToast('Error al enviar respuestas', false); }
        finally { setEnviando(false); }
    };

    // Crear pregunta
    const handleCrearPregunta = async () => {
        if (!newPregunta.pregunta.trim()) { showToast('Escribe el texto de la pregunta', false); return; }
        setLoadingConfig(true);
        try {
            await client.post('/evaluaciones-desempeno', newPregunta);
            setNewPregunta({ pregunta: '', evaluation_type: tipoActivo });
            fetchPreguntas();
            showToast('Pregunta creada', true);
        } catch { showToast('Error al crear pregunta', false); }
        finally { setLoadingConfig(false); }
    };

    // Eliminar pregunta
    const handleEliminar = async (id: number) => {
        if (!confirm('¿Eliminar esta pregunta y todas sus respuestas?')) return;
        try {
            await client.delete(`/evaluaciones-desempeno/${id}`);
            fetchPreguntas();
            showToast('Pregunta eliminada', true);
        } catch { showToast('Error al eliminar pregunta', false); }
    };

    // Ver resultados
    const fetchResultadosEmpleado = async (id: number) => {
        setLoadingResultados(true);
        setResultadoEmp(null);
        try {
            const res = await client.get(`/evaluaciones-desempeno/resultados/${id}`);
            setResultadoEmp(res.data);
        } catch { showToast('Error al obtener resultados', false); }
        finally { setLoadingResultados(false); }
    };

    const preguntasFiltradas = preguntas.filter(p => p.evaluation_type === tipoActivo);

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <FiStar size={28} color="#A7313A" />
                <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: '#1e293b' }}>
                    Evaluaciones de Desempeño
                </h1>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                {[
                    { key: 'evaluar', label: 'Evaluar', icon: <FiSend size={15} /> },
                    ...(isAdmin ? [{ key: 'configurar', label: 'Configurar', icon: <FiEdit3 size={15} /> }] : []),
                    { key: 'resultados', label: 'Resultados', icon: <FiBarChart2 size={15} /> }
                ].map(t => (
                    <button
                        key={t.key}
                        id={`tab-eval-${t.key}`}
                        onClick={() => setTab(t.key as any)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.9rem',
                            background: tab === t.key ? '#fff' : 'transparent',
                            color: tab === t.key ? '#A7313A' : '#64748b',
                            boxShadow: tab === t.key ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Filtro de tipo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {TIPOS_EVAL.map(t => (
                    <button
                        key={t.key}
                        id={`tipo-eval-${t.key}`}
                        onClick={() => setTipoActivo(t.key)}
                        style={{
                            padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
                            borderColor: tipoActivo === t.key ? '#A7313A' : '#e2e8f0',
                            background: tipoActivo === t.key ? '#A7313A' : '#fff',
                            color: tipoActivo === t.key ? '#fff' : '#475569',
                            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: EVALUAR ─────────────────────────────────────────────── */}
            {tab === 'evaluar' && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    {enviado ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <FiCheck size={56} color="#22c55e" />
                            <h2 style={{ color: '#16a34a', margin: '16px 0 8px' }}>¡Evaluación Completada!</h2>
                            <p style={{ color: '#64748b' }}>Las respuestas han sido guardadas exitosamente.</p>
                            <button
                                onClick={() => { setEnviado(false); fetchPreguntas(); }}
                                style={{ marginTop: 16, padding: '10px 24px', background: '#A7313A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                            >
                                Nueva Evaluación
                            </button>
                        </div>
                    ) : (
                        <>
                            {isAdmin && (
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
                                        Evaluar a:
                                    </label>
                                    <select
                                        id="select-empleado-eval"
                                        value={empleadoSelec}
                                        onChange={e => setEmpleadoSelec(e.target.value ? parseInt(e.target.value) : '')}
                                        style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', width: '100%', maxWidth: 340 }}
                                    >
                                        <option value="">Mi propia evaluación</option>
                                        {empleados.map(e => (
                                            <option key={e.idempleado} value={e.idempleado}>
                                                {e.nombre_completo_empleado}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {preguntasFiltradas.length === 0 ? (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
                                    No hay preguntas configuradas para este tipo de evaluación.
                                    {isAdmin && ' Ve a "Configurar" para agregar preguntas.'}
                                </p>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {preguntasFiltradas.map((p, i) => (
                                            <div key={p.idquestion} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 18 }}>
                                                <label style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', display: 'block', marginBottom: 10 }}>
                                                    {i + 1}. {p.pregunta}
                                                </label>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {[1, 2, 3, 4, 5].map(v => (
                                                        <button
                                                            key={v}
                                                            id={`resp-${p.idquestion}-${v}`}
                                                            onClick={() => setRespuestas(prev => ({ ...prev, [p.idquestion]: String(v) }))}
                                                            style={{
                                                                width: 44, height: 44, borderRadius: '50%', border: '2px solid',
                                                                borderColor: respuestas[p.idquestion] === String(v) ? '#A7313A' : '#e2e8f0',
                                                                background: respuestas[p.idquestion] === String(v) ? '#A7313A' : '#fff',
                                                                color: respuestas[p.idquestion] === String(v) ? '#fff' : '#475569',
                                                                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                transform: respuestas[p.idquestion] === String(v) ? 'scale(1.15)' : 'scale(1)'
                                                            }}
                                                        >
                                                            {v}
                                                        </button>
                                                    ))}
                                                    <span style={{ alignSelf: 'center', fontSize: '0.78rem', color: '#94a3b8', marginLeft: 4 }}>
                                                        1=Deficiente • 5=Excelente
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        id="btn-enviar-evaluacion"
                                        onClick={handleEnviar}
                                        disabled={enviando}
                                        style={{
                                            marginTop: 24, padding: '12px 28px',
                                            background: '#A7313A', color: '#fff', border: 'none',
                                            borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            opacity: enviando ? 0.7 : 1
                                        }}
                                    >
                                        <FiSend /> {enviando ? 'Enviando...' : 'Enviar Evaluación'}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── TAB: CONFIGURAR ───────────────────────────────────────── */}
            {tab === 'configurar' && isAdmin && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Nueva Pregunta</h3>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
                        <input
                            id="input-nueva-pregunta"
                            type="text"
                            placeholder="Escribe la pregunta..."
                            value={newPregunta.pregunta}
                            onChange={e => setNewPregunta(p => ({ ...p, pregunta: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleCrearPregunta()}
                            style={{ flex: 1, minWidth: 260, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem' }}
                        />
                        <select
                            id="select-tipo-nueva-pregunta"
                            value={newPregunta.evaluation_type}
                            onChange={e => setNewPregunta(p => ({ ...p, evaluation_type: e.target.value }))}
                            style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem' }}
                        >
                            {TIPOS_EVAL.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                        <button
                            id="btn-agregar-pregunta"
                            onClick={handleCrearPregunta}
                            disabled={loadingConfig}
                            style={{ padding: '10px 18px', background: '#A7313A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <FiPlus /> Agregar
                        </button>
                    </div>

                    <h3 style={{ margin: '0 0 12px', color: '#1e293b' }}>
                        Preguntas — {TIPOS_EVAL.find(t => t.key === tipoActivo)?.label}
                    </h3>
                    {preguntasFiltradas.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>Sin preguntas en este tipo todavía.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {preguntasFiltradas.map((p, i) => (
                                <div key={p.idquestion} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontWeight: 700, color: '#A7313A', minWidth: 24 }}>{i + 1}.</span>
                                    <span style={{ flex: 1, color: '#334155', fontSize: '0.9rem' }}>{p.pregunta}</span>
                                    <button
                                        id={`btn-del-pregunta-${p.idquestion}`}
                                        onClick={() => handleEliminar(p.idquestion)}
                                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: RESULTADOS ───────────────────────────────────────── */}
            {tab === 'resultados' && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: 6 }}>
                                Ver resultados de:
                            </label>
                            <select
                                id="select-empleado-resultados"
                                value={empleadoSelec}
                                onChange={e => setEmpleadoSelec(e.target.value ? parseInt(e.target.value) : '')}
                                style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: '100%', maxWidth: 340 }}
                            >
                                <option value="">-- Selecciona empleado --</option>
                                {empleados.map(e => (
                                    <option key={e.idempleado} value={e.idempleado}>{e.nombre_completo_empleado}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            id="btn-ver-resultados"
                            onClick={() => empleadoSelec && fetchResultadosEmpleado(Number(empleadoSelec))}
                            disabled={!empleadoSelec || loadingResultados}
                            style={{ padding: '10px 20px', background: '#A7313A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <FiBarChart2 /> Ver
                        </button>
                    </div>

                    {loadingResultados && <p style={{ color: '#94a3b8' }}>Cargando resultados...</p>}

                    {resultadoEmp && !loadingResultados && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px 20px', background: '#fff7ed', borderRadius: 12, border: '1.5px solid #fed7aa' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Promedio General</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
                                        {resultadoEmp.promedio}/5
                                    </div>
                                </div>
                                <div style={{ flex: 1, background: '#fef3c7', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: '#f59e0b', width: `${(resultadoEmp.promedio / 5) * 100}%`, borderRadius: 8, transition: 'width 0.5s' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {resultadoEmp.respuestas.map((r, i) => (
                                    <div key={i} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: 8 }}>{r.pregunta}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {r.valor_numerico !== null ? (
                                                <>
                                                    {[1,2,3,4,5].map(v => (
                                                        <div key={v} style={{
                                                            width: 32, height: 32, borderRadius: '50%',
                                                            background: v <= r.valor_numerico! ? '#A7313A' : '#e2e8f0',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: v <= r.valor_numerico! ? '#fff' : '#94a3b8',
                                                            fontWeight: 700, fontSize: '0.85rem'
                                                        }}>{v}</div>
                                                    ))}
                                                    <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: 4 }}>— {r.respuesta}/5</span>
                                                </>
                                            ) : (
                                                <span style={{ color: '#64748b', fontStyle: 'italic' }}>"{r.respuesta}"</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {resultadoEmp && resultadoEmp.respuestas.length === 0 && (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>
                            Este empleado aún no ha respondido ninguna evaluación.
                        </p>
                    )}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, padding: '12px 20px',
                    background: '#1e293b', color: '#fff', borderRadius: 10,
                    fontWeight: 500, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999,
                    borderLeft: `4px solid ${toast.ok ? '#22c55e' : '#ef4444'}`,
                    animation: 'slideIn 0.3s ease'
                }}>
                    {toast.ok ? '✓' : '✗'} {toast.msg}
                </div>
            )}
        </div>
    );
};

export default EvaluacionesDesempeno;
