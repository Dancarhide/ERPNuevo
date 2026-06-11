'use client';

import React, { useState, useEffect } from 'react';
import { Star, Send, Settings, BarChart2, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

interface Pregunta {
  id: number;
  pregunta: string;
  tipo_evaluacion: string;
}

interface Empleado {
  id: number;
  nombre_completo: string;
}

interface ResultadoEmpleado {
  promedio: number;
  respuestas: {
    pregunta: string;
    tipo: string;
    respuesta: string;
    valor_numerico: number | null;
  }[];
}

const TIPOS_EVAL = [
  { key: '360_grados', label: '360 Grados' },
  { key: 'auto_evaluacion', label: 'Auto-Evaluación' },
  { key: 'jefe_subordinado', label: 'Jefe → Subordinado' },
  { key: 'satisfaccion', label: 'Satisfacción General' },
];

export default function EvaluacionesPage() {
  const { user } = useAuth();
  const isAdmin = user?.permisos?.includes('configurar_evaluaciones') || false;

  const [tab, setTab] = useState<'evaluar' | 'configurar' | 'resultados'>('evaluar');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [tipoActivo, setTipoActivo] = useState('auto_evaluacion');

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoSelec, setEmpleadoSelec] = useState<number | ''>('');

  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Config tab
  const [newPregunta, setNewPregunta] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Resultados tab
  const [resultadoEmp, setResultadoEmp] = useState<ResultadoEmpleado | null>(null);
  const [loadingResultados, setLoadingResultados] = useState(false);

  const loadPreguntas = React.useCallback(async () => {
    try {
      const data = await fetchApi(`/evaluaciones-desempeno?tipo=${tipoActivo}`);
      setPreguntas(data || []);
    } catch (e) {
      console.error('Error fetching preguntas', e);
    }
  }, [tipoActivo]);

  const loadEmpleados = React.useCallback(async () => {
    try {
      const data = await fetchApi('/empleados?size=100'); // Fetch up to 100 for the dropdown
      setEmpleados(data.items || []);
    } catch (e) {
      console.error('Error fetching empleados', e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPreguntas();
  }, [tipoActivo, loadPreguntas]);

  useEffect(() => {
    if (tab === 'resultados' || tab === 'evaluar') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadEmpleados();
    }
  }, [tab, loadEmpleados]);

  const handleEnviar = async () => {
    const id_empleado = empleadoSelec || user?.id;
    if (!id_empleado) {
      alert('Selecciona un empleado para evaluar');
      return;
    }
    const lista = Object.entries(respuestas).map(([id_pregunta, respuesta]) => ({
      id_pregunta: parseInt(id_pregunta),
      respuesta,
    }));
    if (lista.length === 0) {
      alert('Completa al menos una respuesta');
      return;
    }

    setEnviando(true);
    try {
      await fetchApi('/evaluaciones-desempeno/respuestas', {
        method: 'POST',
        body: JSON.stringify({
          id_empleado: id_empleado,
          respuestas: lista,
        }),
      });
      setEnviado(true);
      setRespuestas({});
    } catch (e) {
      console.error(e);
      alert('Error al enviar evaluación');
    } finally {
      setEnviando(false);
    }
  };

  const handleCrearPregunta = async () => {
    if (!newPregunta.trim()) return;
    setLoadingConfig(true);
    try {
      await fetchApi('/evaluaciones-desempeno', {
        method: 'POST',
        body: JSON.stringify({
          pregunta: newPregunta,
          tipo_evaluacion: tipoActivo,
        }),
      });
      setNewPregunta('');
      loadPreguntas();
    } catch (e) {
      console.error(e);
      alert('Error al crear pregunta');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta pregunta? Se borrarán sus respuestas.')) return;
    try {
      await fetchApi(`/evaluaciones-desempeno/${id}`, { method: 'DELETE' });
      loadPreguntas();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar');
    }
  };

  const loadResultados = async (id: number) => {
    setLoadingResultados(true);
    setResultadoEmp(null);
    try {
      const data = await fetchApi(`/evaluaciones-desempeno/resultados/${id}`);
      setResultadoEmp(data);
    } catch (e) {
      console.error('Error', e);
    } finally {
      setLoadingResultados(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA] overflow-y-auto">
      {/* Header Premium */}
      <div className="bg-white border-b border-[#F3F4F6] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#A7313A] to-[#8a272f] rounded-2xl flex items-center justify-center shadow-lg shadow-[#A7313A]/20">
            <Star className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#44474A] tracking-tight">
              Evaluaciones de Desempeño
            </h1>
            <p className="text-sm text-[#858789] font-medium mt-1">
              Gestiona el progreso y las valoraciones del equipo
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#F8F9FA] p-1 rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => setTab('evaluar')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === 'evaluar'
                ? 'bg-white text-[#A7313A] shadow-sm'
                : 'text-[#858789] hover:text-[#44474A]'
            }`}
          >
            <Send size={16} /> Evaluar
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('configurar')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                tab === 'configurar'
                  ? 'bg-white text-[#A7313A] shadow-sm'
                  : 'text-[#858789] hover:text-[#44474A]'
              }`}
            >
              <Settings size={16} /> Configurar
            </button>
          )}
          <button
            onClick={() => setTab('resultados')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === 'resultados'
                ? 'bg-white text-[#A7313A] shadow-sm'
                : 'text-[#858789] hover:text-[#44474A]'
            }`}
          >
            <BarChart2 size={16} /> Resultados
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {/* Category Selector (Pills) */}
        {(tab === 'evaluar' || tab === 'configurar') && (
          <div className="mb-8 flex flex-wrap gap-2">
            {TIPOS_EVAL.map((t) => (
              <button
                key={t.key}
                onClick={() => setTipoActivo(t.key)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  tipoActivo === t.key
                    ? 'bg-[#A7313A] text-white shadow-md shadow-[#A7313A]/20 ring-2 ring-[#A7313A]/20 ring-offset-2'
                    : 'bg-white text-[#858789] border border-[#E5E7EB] hover:border-[#A7313A]/50 hover:text-[#A7313A]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* TAB: EVALUAR */}
        {tab === 'evaluar' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {enviado ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-[#44474A] mb-2">¡Evaluación Completada!</h2>
                <p className="text-[#858789] mb-8 text-center max-w-sm">
                  Tus respuestas han sido registradas y almacenadas de forma segura en el sistema.
                </p>
                <button
                  onClick={() => setEnviado(false)}
                  className="bg-[#A7313A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a272f] transition-all shadow-lg shadow-[#A7313A]/20"
                >
                  Realizar otra evaluación
                </button>
              </div>
            ) : (
              <>
                {isAdmin && (
                  <div className="mb-8 p-6 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
                    <label className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-2 block">
                      Selecciona a quién vas a evaluar:
                    </label>
                    <select
                      value={empleadoSelec}
                      onChange={(e) =>
                        setEmpleadoSelec(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full md:w-1/2 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 font-medium text-[#44474A]"
                    >
                      <option value="">Evaluación Propia (Yo)</option>
                      {empleados.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {preguntas.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#858789] font-medium text-lg">
                      No hay preguntas configuradas para esta categoría.
                    </p>
                    {isAdmin && (
                      <p className="text-[#A7313A] mt-2">
                        Ve a la pestaña &quot;Configurar&quot; para añadir algunas.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {preguntas.map((p, index) => (
                      <div key={p.id} className="group">
                        <h3 className="text-[#44474A] font-bold text-lg mb-4 flex gap-3">
                          <span className="text-[#A7313A]">{index + 1}.</span>
                          {p.pregunta}
                        </h3>
                        <div className="flex gap-3">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              onClick={() => setRespuestas({ ...respuestas, [p.id]: String(val) })}
                              className={`w-14 h-14 rounded-2xl font-bold text-lg flex items-center justify-center transition-all ${
                                respuestas[p.id] === String(val)
                                  ? 'bg-[#A7313A] text-white shadow-lg shadow-[#A7313A]/30 scale-110 ring-4 ring-[#A7313A]/10'
                                  : 'bg-[#F8F9FA] text-[#858789] border border-[#E5E7EB] hover:border-[#A7313A]/50 hover:bg-white hover:text-[#A7313A] group-hover:shadow-sm'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                          <div className="flex flex-col justify-center ml-4 text-xs font-semibold text-[#A0A2A4] uppercase tracking-wide">
                            <span>1 = Deficiente</span>
                            <span>5 = Excelente</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-8 mt-8 border-t border-[#F3F4F6] flex justify-end">
                      <button
                        onClick={handleEnviar}
                        disabled={enviando}
                        className="bg-[#A7313A] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#8a272f] transition-all shadow-lg shadow-[#A7313A]/20 flex items-center gap-2 disabled:opacity-70"
                      >
                        <Send size={18} /> {enviando ? 'Guardando...' : 'Enviar Evaluación'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: CONFIGURAR */}
        {tab === 'configurar' && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] p-8 mb-8">
              <h2 className="text-xl font-bold text-[#44474A] mb-6 flex items-center gap-2">
                <Plus className="text-[#A7313A]" /> Agregar Nueva Pregunta
              </h2>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Ej. ¿Cómo evalúas tu desempeño general este mes?"
                  value={newPregunta}
                  onChange={(e) => setNewPregunta(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCrearPregunta()}
                  className="flex-1 px-5 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 text-[#44474A] font-medium"
                />
                <button
                  onClick={handleCrearPregunta}
                  disabled={loadingConfig || !newPregunta.trim()}
                  className="bg-[#A7313A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a272f] transition-all shadow-md disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={18} /> Guardar Pregunta
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] overflow-hidden">
              <div className="px-8 py-5 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                <h2 className="text-lg font-bold text-[#44474A]">
                  Preguntas Actuales{' '}
                  <span className="text-[#858789] font-medium text-sm ml-2">
                    ({TIPOS_EVAL.find((t) => t.key === tipoActivo)?.label})
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {preguntas.length === 0 ? (
                  <div className="p-8 text-center text-[#858789] font-medium">
                    No hay preguntas registradas.
                  </div>
                ) : (
                  preguntas.map((p, i) => (
                    <div
                      key={p.id}
                      className="p-6 flex items-center justify-between gap-4 hover:bg-[#F8F9FA] transition-colors group"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-[#A7313A]/10 text-[#A7313A] flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <span className="text-[#44474A] font-medium text-lg">{p.pregunta}</span>
                      </div>
                      <button
                        onClick={() => handleEliminar(p.id)}
                        className="text-[#858789] hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: RESULTADOS */}
        {tab === 'resultados' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] p-8 mb-8">
              <label className="text-xs font-bold text-[#858789] uppercase tracking-wider mb-2 block">
                Selecciona un empleado para ver sus resultados:
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={empleadoSelec}
                  onChange={(e) => setEmpleadoSelec(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 max-w-md px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 font-medium text-[#44474A]"
                >
                  <option value="">-- Buscar empleado --</option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre_completo}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => empleadoSelec && loadResultados(Number(empleadoSelec))}
                  disabled={!empleadoSelec || loadingResultados}
                  className="bg-[#44474A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#2A2C2E] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <BarChart2 size={18} /> {loadingResultados ? 'Cargando...' : 'Ver Resultados'}
                </button>
              </div>
            </div>

            {resultadoEmp && !loadingResultados && (
              <div className="space-y-6">
                {/* Score Widget */}
                <div className="bg-gradient-to-br from-white to-[#F8F9FA] rounded-2xl shadow-sm border border-[#F3F4F6] p-8 flex items-center gap-8">
                  <div className="text-center min-w-[120px]">
                    <p className="text-xs font-bold text-[#858789] uppercase tracking-widest mb-2">
                      Promedio
                    </p>
                    <p className="text-5xl font-black text-[#A7313A] tracking-tighter">
                      {resultadoEmp.promedio}
                      <span className="text-2xl text-[#A0A2A4] font-medium">/5</span>
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-4 bg-[#E5E7EB] rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[#A7313A] to-[#f43f5e] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(resultadoEmp.promedio / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-3 text-xs font-bold text-[#A0A2A4] uppercase">
                      <span>Requiere Atención (1)</span>
                      <span>Excelente (5)</span>
                    </div>
                  </div>
                </div>

                {/* Answers List */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] overflow-hidden">
                  <div className="px-8 py-5 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                    <h2 className="text-lg font-bold text-[#44474A]">Desglose de Respuestas</h2>
                  </div>

                  {resultadoEmp.respuestas.length === 0 ? (
                    <div className="p-12 text-center text-[#858789] font-medium">
                      Este empleado aún no tiene evaluaciones registradas.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F3F4F6]">
                      {resultadoEmp.respuestas.map((r, i) => (
                        <div
                          key={i}
                          className="p-6 hover:bg-[#F8F9FA] transition-colors flex items-start gap-6"
                        >
                          {r.valor_numerico !== null ? (
                            <div className="w-14 h-14 rounded-2xl bg-[#A7313A]/10 border border-[#A7313A]/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl font-black text-[#A7313A]">
                                {r.valor_numerico}
                              </span>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                              <span className="text-xl font-bold text-[#A0A2A4]">-</span>
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-[#A7313A] uppercase tracking-wider mb-1">
                              {TIPOS_EVAL.find((t) => t.key === r.tipo)?.label || r.tipo}
                            </div>
                            <p className="text-[#44474A] font-medium text-lg leading-snug">
                              {r.pregunta}
                            </p>
                            {r.valor_numerico === null && (
                              <p className="mt-2 text-[#858789] italic">
                                &quot;{r.respuesta}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
