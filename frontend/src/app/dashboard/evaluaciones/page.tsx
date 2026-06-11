'use client';

import React, { useState, useEffect } from 'react';
import { Star, Send, Settings, BarChart2, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

interface Pregunta {
  id: number;
  pregunta: string;
  tipo_evaluacion: string;
}

interface Empleado {
  id: number;
  nombre_completo: string;
}

interface Campania {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
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

  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [campaniaSelec, setCampaniaSelec] = useState<number | ''>('');

  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Config tab
  const [newPregunta, setNewPregunta] = useState('');
  const [newCampaniaNombre, setNewCampaniaNombre] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Resultados tab
  const [resultadoEmp, setResultadoEmp] = useState<ResultadoEmpleado | null>(null);
  const [loadingResultados, setLoadingResultados] = useState(false);

  const loadCampanias = React.useCallback(async () => {
    try {
      const data = await fetchApi('/evaluaciones-desempeno/campanias');
      setCampanias(data || []);
    } catch (e) {
      console.error('Error fetching campanias', e);
    }
  }, []);

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
      const campaniaActiva = campanias.find((c) => c.activa);
      const url = campaniaActiva
        ? `/evaluaciones-desempeno/objetivos?tipo=${tipoActivo}&campania_id=${campaniaActiva.id}`
        : `/evaluaciones-desempeno/objetivos?tipo=${tipoActivo}`;
      const data = await fetchApi(url);
      setEmpleados(data || []);
    } catch (e) {
      console.error('Error fetching empleados', e);
    }
  }, [tipoActivo, campanias]);

  const loadResultados = React.useCallback(async () => {
    setLoadingResultados(true);
    setResultadoEmp(null);
    try {
      const url = campaniaSelec
        ? `/evaluaciones-desempeno/resultados-globales?campania_id=${campaniaSelec}`
        : `/evaluaciones-desempeno/resultados-globales`;
      const data = await fetchApi(url);
      setResultadoEmp(data);
    } catch (e) {
      console.error('Error', e);
    } finally {
      setLoadingResultados(false);
    }
  }, [campaniaSelec]);

  useEffect(() => {
    const run = async () => await loadPreguntas();
    run();
  }, [tipoActivo, loadPreguntas]);

  useEffect(() => {
    const run = async () => await loadCampanias();
    run();
  }, [loadCampanias]);

  useEffect(() => {
    const run = async () => {
      if (tab === 'resultados') {
        await loadResultados();
      } else if (tab === 'evaluar') {
        await loadEmpleados();
      }
    };
    run();
  }, [tab, loadEmpleados, loadResultados, campaniaSelec]);

  useEffect(() => {
    setTimeout(() => {
      setEnviado(false);
      setEmpleadoSelec('');
      setRespuestas({});
    }, 0);
  }, [tab, tipoActivo, campanias]);

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

    const campaniaActiva = campanias.find((c) => c.activa);

    setEnviando(true);
    try {
      await fetchApi('/evaluaciones-desempeno/respuestas', {
        method: 'POST',
        body: JSON.stringify({
          id_empleado: id_empleado,
          evaluador_id: user?.id,
          campania_id: campaniaActiva?.id,
          respuestas: lista,
        }),
      });
      await loadEmpleados();
      setEnviado(true);
      setRespuestas({});
    } catch (e) {
      console.error(e);
      alert('Error al enviar evaluación');
    } finally {
      setEnviando(false);
    }
  };

  const handleCrearCampania = async () => {
    if (!newCampaniaNombre.trim()) return;
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const fin = new Date();
      fin.setMonth(fin.getMonth() + 1);

      await fetchApi('/evaluaciones-desempeno/campanias', {
        method: 'POST',
        body: JSON.stringify({
          nombre: newCampaniaNombre,
          fecha_inicio: hoy,
          fecha_fin: fin.toISOString().split('T')[0],
          activa: true,
        }),
      });
      setNewCampaniaNombre('');
      loadCampanias();
    } catch (e) {
      console.error(e);
      alert('Error al crear campaña');
    }
  };

  const handleCerrarCampania = async (id: number) => {
    if (!confirm('¿Cerrar esta campaña? Ya no se recibirán respuestas.')) return;
    try {
      await fetchApi(`/evaluaciones-desempeno/campanias/${id}/cerrar`, { method: 'PUT' });
      loadCampanias();
    } catch (e) {
      console.error(e);
      alert('Error al cerrar campaña');
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

  const getChartsData = () => {
    if (!resultadoEmp) return {};
    const groupedByType: Record<string, Record<string, { suma: number; count: number }>> = {};

    resultadoEmp.respuestas.forEach((r) => {
      if (r.valor_numerico) {
        if (!groupedByType[r.tipo]) groupedByType[r.tipo] = {};
        if (!groupedByType[r.tipo][r.pregunta])
          groupedByType[r.tipo][r.pregunta] = { suma: 0, count: 0 };
        groupedByType[r.tipo][r.pregunta].suma += r.valor_numerico;
        groupedByType[r.tipo][r.pregunta].count += 1;
      }
    });

    const chartsData: Record<
      string,
      { name: string; preguntaCompleta: string; Puntaje: number }[]
    > = {};
    Object.entries(groupedByType).forEach(([tipo, agrupado]) => {
      chartsData[tipo] = Object.entries(agrupado).map(([pregunta, stats]) => ({
        name: pregunta.length > 20 ? pregunta.substring(0, 20) + '...' : pregunta,
        preguntaCompleta: pregunta,
        Puntaje: Number((stats.suma / stats.count).toFixed(2)),
      }));
    });

    return chartsData;
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
            {(() => {
              const campaniaActiva = campanias.find((c) => c.activa);
              if (!campaniaActiva) {
                return (
                  <div className="text-center py-16">
                    <p className="text-[#858789] font-medium text-lg">
                      No hay ningún ciclo de evaluación activo en este momento.
                    </p>
                  </div>
                );
              }
              return (
                <>
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-900 uppercase">Ciclo Activo</p>
                      <p className="text-blue-800">{campaniaActiva.nombre}</p>
                    </div>
                  </div>

                  {empleados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in duration-500">
                      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <CheckCircle2 size={48} className="text-blue-500 drop-shadow-md" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#44474A] mb-2">¡Todo listo!</h2>
                      <p className="text-[#858789] text-center max-w-md px-4">
                        No tienes evaluaciones pendientes en esta categoría para el ciclo actual.
                        {tipoActivo === 'jefe_subordinado' && (
                          <span className="block mt-2 text-sm">
                            (Solo verás objetivos aquí si tienes personal a tu cargo en el
                            organigrama).
                          </span>
                        )}
                        {tipoActivo === '360_grados' && (
                          <span className="block mt-2 text-sm">
                            (Solo verás objetivos aquí si tienes compañeros que comparten tu mismo
                            jefe directo).
                          </span>
                        )}
                      </p>
                    </div>
                  ) : enviado ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} className="text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-[#44474A] mb-2">
                        ¡Evaluación Enviada!
                      </h2>
                      <p className="text-[#858789] mb-8 text-center max-w-sm">
                        Tus respuestas han sido registradas para este ciclo. Puedes continuar
                        evaluando si tienes más objetivos.
                      </p>
                      <button
                        onClick={() => {
                          setEnviado(false);
                          setEmpleadoSelec('');
                        }}
                        className="bg-[#A7313A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a272f] transition-all shadow-lg shadow-[#A7313A]/20"
                      >
                        Continuar evaluando
                      </button>
                    </div>
                  ) : (
                    <>
                      {tipoActivo !== 'auto_evaluacion' && tipoActivo !== 'satisfaccion' && (
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
                            <option value="">-- Seleccionar Empleado --</option>
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
                            No hay preguntas configuradas para este tipo de evaluación.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {preguntas.map((p, idx) => (
                            <div
                              key={p.id}
                              className="p-6 bg-white border border-[#F3F4F6] rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                              <p className="text-lg font-medium text-[#44474A] mb-4">
                                {idx + 1}. {p.pregunta}
                              </p>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((val) => (
                                  <button
                                    key={val}
                                    onClick={() =>
                                      setRespuestas((prev) => ({ ...prev, [p.id]: String(val) }))
                                    }
                                    className={`w-14 h-14 rounded-2xl font-bold text-lg flex items-center justify-center transition-all border-2
                                      ${
                                        respuestas[p.id] === String(val)
                                          ? 'border-[#A7313A] bg-[#A7313A] text-white shadow-md scale-110'
                                          : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#858789] hover:border-[#A7313A] hover:bg-white hover:text-[#A7313A]'
                                      }
                                    `}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                              <div className="flex flex-col justify-center text-xs font-semibold text-[#A0A2A4] uppercase tracking-wide mt-4">
                                <span>1 = Deficiente</span>
                                <span>5 = Excelente</span>
                              </div>
                            </div>
                          ))}
                          <div className="pt-6 flex justify-end border-t border-[#F3F4F6]">
                            <button
                              onClick={handleEnviar}
                              disabled={enviando || Object.keys(respuestas).length === 0}
                              className="bg-[#A7313A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a272f] transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                              <CheckCircle2 size={18} />
                              {enviando ? 'Enviando...' : 'Enviar Evaluación'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* TAB: CONFIGURAR */}
        {tab === 'configurar' && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Ciclos de Evaluación */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] p-8">
              <h2 className="text-xl font-bold text-[#44474A] mb-6 flex items-center gap-2">
                <Settings className="text-[#A7313A]" /> Ciclos de Evaluación
              </h2>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Ej. Q1 2026, Evaluación Semestral..."
                  value={newCampaniaNombre}
                  onChange={(e) => setNewCampaniaNombre(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCrearCampania()}
                  className="flex-1 px-5 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 text-[#44474A] font-medium"
                />
                <button
                  onClick={handleCrearCampania}
                  disabled={!newCampaniaNombre.trim()}
                  className="bg-[#A7313A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#8a272f] transition-all shadow-md disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={18} /> Iniciar Ciclo
                </button>
              </div>
              <div className="space-y-4">
                {campanias.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center p-4 border border-[#E5E7EB] rounded-xl bg-[#F8F9FA]"
                  >
                    <div>
                      <p className="font-bold text-[#44474A]">{c.nombre}</p>
                      <p className="text-sm text-[#858789]">
                        Del {c.fecha_inicio} al {c.fecha_fin}
                      </p>
                    </div>
                    {c.activa ? (
                      <button
                        onClick={() => handleCerrarCampania(c.id)}
                        className="text-sm px-4 py-2 bg-white border border-[#E5E7EB] text-[#858789] hover:text-red-500 font-bold rounded-lg transition-colors"
                      >
                        Cerrar Ciclo
                      </button>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 bg-gray-200 text-gray-600 rounded-lg">
                        CERRADO
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] p-8">
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
                Selecciona el ciclo de evaluación:
              </label>
              <select
                value={campaniaSelec}
                onChange={(e) => setCampaniaSelec(e.target.value ? Number(e.target.value) : '')}
                className="w-full md:w-1/2 px-4 py-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 font-medium text-[#44474A]"
              >
                <option value="">-- Todos los ciclos --</option>
                {campanias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.activa ? '(Activo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {loadingResultados ? (
              <div className="text-center py-20 text-[#858789]">Cargando métricas globales...</div>
            ) : resultadoEmp ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-white to-[#F8F9FA] rounded-2xl shadow-sm border border-[#F3F4F6] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-[#44474A] mb-2">
                      Panel de Resultados Globales
                    </h2>
                    <p className="text-[#858789]">
                      Métricas consolidadas de todas las evaluaciones en la empresa.
                    </p>
                  </div>
                  <div className="text-center min-w-[120px]">
                    <p className="text-xs font-bold text-[#858789] uppercase tracking-widest mb-2">
                      Promedio Global
                    </p>
                    <p className="text-5xl font-black text-[#A7313A] tracking-tighter">
                      {resultadoEmp.promedio}
                      <span className="text-2xl text-[#A0A2A4] font-medium">/5</span>
                    </p>
                  </div>
                </div>

                {Object.keys(getChartsData()).length > 0 ? (
                  Object.entries(getChartsData()).map(([tipo, data]) => (
                    <div
                      key={tipo}
                      className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] p-8"
                    >
                      <h3 className="font-bold text-[#44474A] mb-6">
                        Resultados: {TIPOS_EVAL.find((t) => t.key === tipo)?.label || tipo}
                      </h3>
                      <div className="h-80">
                        {data.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={data}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#F3F4F6"
                              />
                              <XAxis
                                dataKey="name"
                                tick={{ fill: '#858789', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[0, 5]}
                                tick={{ fill: '#858789', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  borderRadius: '12px',
                                  border: '1px solid #E5E7EB',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                cursor={{ fill: '#F8F9FA' }}
                                formatter={(value) => [`${value} / 5`, 'Puntaje Promedio']}
                                labelFormatter={(label, payload) => {
                                  if (payload && payload.length > 0) {
                                    return payload[0].payload.preguntaCompleta;
                                  }
                                  return label;
                                }}
                              />
                              <Bar
                                dataKey="Puntaje"
                                fill="#A7313A"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={50}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#858789]">
                            No hay datos para graficar en esta categoría
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-[#F3F4F6] p-8 text-center text-[#858789]">
                    No hay datos para graficar en este ciclo.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-[#858789]">
                No hay resultados disponibles en este momento.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
