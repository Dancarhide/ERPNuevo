'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { fetchApi } from '@/lib/api';
import {
  BarChart3,
  Settings,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Trash2,
  Plus,
  RefreshCw,
  ClipboardList,
  Save,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

type Campania = {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
};
type Pregunta = { id: number; categoria: string; pregunta: string };
type EstadoEncuesta = {
  activa: boolean;
  completada: boolean;
  campania_id: number | null;
  nombre_campania?: string;
};

export default function ClimaLaboralPage() {
  const { user } = useAuth();

  // Use permissions configured previously or fallback
  const canConfig = user?.permisos?.includes('configurar_evaluaciones') || false;
  const canSeeResults = user?.permisos?.includes('ver_resultados_evaluaciones') || false;
  const isAdmin = canConfig || canSeeResults;

  const [tab, setTab] = useState<'encuesta' | 'resultados' | 'configuracion'>('encuesta');

  // --- ENCUESTA STATE ---
  const [estado, setEstado] = useState<EstadoEncuesta | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [step, setStep] = useState(0); // 0: intro, 1: demographics, 2...n: categories

  const [demographics, setDemographics] = useState({ nivel_jerarquico: '', ubicacion: '' });
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);

  // Group questions by category for the wizard
  const groupedPreguntas = preguntas.reduce(
    (acc, q) => {
      if (!acc[q.categoria]) acc[q.categoria] = [];
      acc[q.categoria].push(q);
      return acc;
    },
    {} as Record<string, Pregunta[]>
  );
  const categorias = Object.keys(groupedPreguntas);

  // --- CONFIG STATE ---
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [newCampania, setNewCampania] = useState({ nombre: '', fecha_inicio: '', fecha_fin: '' });
  const [newPregunta, setNewPregunta] = useState({ categoria: '', pregunta: '' });

  // --- RESULTADOS STATE ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [campaniaSelec, setCampaniaSelec] = useState<number | ''>('');
  const [loadingStats, setLoadingStats] = useState(false);

  const loadInitialData = React.useCallback(async () => {
    try {
      const [est, pregs] = await Promise.all([
        fetchApi('/clima/estado'),
        fetchApi('/clima/preguntas'),
      ]);
      setEstado(est);
      setPreguntas(pregs || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadConfigData = React.useCallback(async () => {
    try {
      const camps = await fetchApi('/clima/campanias');
      setCampanias(camps || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadStats = React.useCallback(async (campId: number) => {
    setLoadingStats(true);
    try {
      const data = await fetchApi(`/clima/stats/${campId}`);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (tab === 'configuracion') {
        await loadConfigData();
      } else if (tab === 'resultados') {
        await loadConfigData();
        // Only set the default if not already set, avoiding the loop
        setCampaniaSelec((prev) => {
          if (!prev && campanias.length > 0) {
            // We can't safely call loadStats during render loop, so we defer it
            setTimeout(() => {
              if (active) loadStats(campanias[0].id);
            }, 0);
            return campanias[0].id;
          }
          return prev;
        });
      }
    };
    run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loadConfigData, loadStats, campanias.length]);

  // --- HANDLERS: ENCUESTA ---
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmitEncuesta = async () => {
    if (!estado?.campania_id) return;
    setEnviando(true);
    try {
      await fetchApi('/clima/responder', {
        method: 'POST',
        body: JSON.stringify({
          campania_id: estado.campania_id,
          ...demographics,
          respuestas,
        }),
      });
      setEstado({ ...estado, completada: true });
    } catch (error) {
      console.error(error);
      alert('Error enviando encuesta');
    } finally {
      setEnviando(false);
    }
  };

  // --- HANDLERS: CONFIGURACION ---
  const handleCreateCampania = async () => {
    if (!newCampania.nombre || !newCampania.fecha_inicio || !newCampania.fecha_fin) return;
    try {
      await fetchApi('/clima/campanias', {
        method: 'POST',
        body: JSON.stringify(newCampania),
      });
      setNewCampania({ nombre: '', fecha_inicio: '', fecha_fin: '' });
      loadConfigData();
      loadInitialData(); // Update status if needed
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePregunta = async () => {
    if (!newPregunta.categoria || !newPregunta.pregunta) return;
    try {
      await fetchApi('/clima/preguntas', {
        method: 'POST',
        body: JSON.stringify(newPregunta),
      });
      setNewPregunta({ categoria: '', pregunta: '' });
      loadInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePregunta = async (id: number) => {
    if (!confirm('¿Eliminar pregunta?')) return;
    try {
      await fetchApi(`/clima/preguntas/${id}`, { method: 'DELETE' });
      loadInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  // --- CHARTS DATA ---

  const barData =
    stats?.promedios_por_categoria?.map((p: { categoria: string; promedio: number }) => ({
      name: p.categoria,
      Puntaje: p.promedio,
    })) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clima Laboral</h1>
          <p className="text-slate-500 mt-1">Mide el pulso de la organización y satisfacción.</p>
        </div>

        {isAdmin && (
          <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-auto overflow-hidden">
            <button
              onClick={() => setTab('encuesta')}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'encuesta'
                  ? 'bg-white shadow-sm text-red-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mi Encuesta
            </button>
            <button
              onClick={() => setTab('resultados')}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'resultados'
                  ? 'bg-white shadow-sm text-red-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resultados
            </button>
            <button
              onClick={() => setTab('configuracion')}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'configuracion'
                  ? 'bg-white shadow-sm text-red-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Configuración
            </button>
          </div>
        )}
      </div>

      {/* --- TAB: ENCUESTA --- */}
      {tab === 'encuesta' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative">
          {!estado ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="animate-spin text-slate-400" size={32} />
            </div>
          ) : !estado.activa ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-transparent p-6 rounded-full mb-6">
                <ClipboardList size={48} className="text-slate-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">No hay encuestas activas</h2>
              <p className="text-slate-500 max-w-md">
                Por el momento no hay ninguna campaña de clima laboral en curso. Te avisaremos
                cuando haya una nueva.
              </p>
            </div>
          ) : estado.completada ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-emerald-50/30">
              <div className="bg-emerald-100 p-6 rounded-full mb-6">
                <CheckCircle size={48} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Gracias por participar!</h2>
              <p className="text-slate-600 max-w-md">
                Hemos recibido tus respuestas para la campaña{' '}
                <strong>{estado.nombre_campania}</strong>. Tus respuestas son anónimas y nos ayudan
                a mejorar.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Wizard Header */}
              <div className="bg-transparent border-b border-slate-100 px-8 py-4 flex justify-between items-center">
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Campaña: {estado.nombre_campania}
                </div>
                <div className="text-sm font-medium text-slate-400">
                  {step === 0
                    ? 'Introducción'
                    : step === 1
                      ? 'Demográficos'
                      : `Categoría ${step - 1} de ${categorias.length}`}
                </div>
              </div>

              {/* Wizard Content */}
              <div className="flex-1 p-8 overflow-y-auto max-h-[600px] custom-scrollbar">
                {step === 0 && (
                  <div className="max-w-2xl mx-auto text-center space-y-6 pt-10">
                    <h2 className="text-3xl font-extrabold text-slate-900">
                      Encuesta de Clima Laboral
                    </h2>
                    <p className="text-lg text-slate-600">
                      Tu opinión es fundamental para mejorar nuestra cultura organizacional. A
                      continuación, te haremos una serie de preguntas. Recuerda que puedes usar el
                      botón de <Volume2 className="inline text-slate-400" size={18} /> para escuchar
                      las preguntas.
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="bg-red-700 hover:bg-red-800 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mx-auto block mt-8"
                    >
                      Comenzar
                    </button>
                  </div>
                )}

                {step === 1 && (
                  <div className="max-w-xl mx-auto space-y-8 pt-4">
                    <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">
                      Información General
                    </h3>

                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-slate-700">
                        1. ¿En qué nivel trabajas?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['Gerencial', 'Administrativo', 'Operativo'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() =>
                              setDemographics({ ...demographics, nivel_jerarquico: opt })
                            }
                            className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                              demographics.nivel_jerarquico === opt
                                ? 'border-red-700 bg-red-50 text-red-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-slate-700">
                        2. ¿Dónde trabajas?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['Corporativo', 'Sucursal'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setDemographics({ ...demographics, ubicacion: opt })}
                            className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                              demographics.ubicacion === opt
                                ? 'border-red-700 bg-red-50 text-red-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 flex justify-between">
                      <button
                        onClick={() => setStep(0)}
                        className="text-slate-500 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg"
                      >
                        Atrás
                      </button>
                      <button
                        disabled={!demographics.nivel_jerarquico || !demographics.ubicacion}
                        onClick={() => setStep(2)}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}

                {step > 1 && (
                  <div className="max-w-3xl mx-auto space-y-10">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-slate-800">{categorias[step - 2]}</h3>
                      <p className="text-slate-500 mt-2">
                        Por favor, responde honestamente a las siguientes afirmaciones.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {groupedPreguntas[categorias[step - 2]].map((q, idx) => (
                        <div
                          key={q.id}
                          className="bg-white border border-slate-200 shadow-sm rounded-xl p-6"
                        >
                          <div className="flex justify-between items-start gap-4 mb-6">
                            <h4 className="text-lg font-semibold text-slate-800 leading-tight">
                              {idx + 1}. {q.pregunta}
                            </h4>
                            <button
                              onClick={() => speakText(q.pregunta)}
                              className="text-slate-400 hover:text-slate-600 shrink-0"
                            >
                              <Volume2 size={20} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                            {[
                              { v: 1, l: 'Total desacuerdo', e: '😞' },
                              { v: 2, l: 'En desacuerdo', e: '😐' },
                              { v: 3, l: 'De acuerdo', e: '🙂' },
                              { v: 4, l: 'Total acuerdo', e: '😄' },
                            ].map((opt) => (
                              <button
                                key={opt.v}
                                onClick={() => setRespuestas({ ...respuestas, [q.id]: opt.v })}
                                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all ${
                                  respuestas[q.id] === opt.v
                                    ? opt.v <= 2
                                      ? 'border-amber-500 bg-amber-50'
                                      : 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-100 hover:border-slate-300 bg-transparent hover:bg-slate-100'
                                }`}
                              >
                                <span className="text-3xl mb-2 grayscale-[0.2]">{opt.e}</span>
                                <span
                                  className={`text-xs font-semibold text-center ${respuestas[q.id] === opt.v ? 'text-slate-900' : 'text-slate-500'}`}
                                >
                                  {opt.l}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 flex justify-between border-t border-slate-100">
                      <button
                        onClick={() => setStep(step - 1)}
                        className="text-slate-500 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                      >
                        <ChevronLeft size={18} /> Atrás
                      </button>

                      {step - 1 < categorias.length ? (
                        <button
                          disabled={groupedPreguntas[categorias[step - 2]].some(
                            (q) => !respuestas[q.id]
                          )}
                          onClick={() => setStep(step + 1)}
                          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                          Siguiente <ChevronRight size={18} />
                        </button>
                      ) : (
                        <button
                          disabled={
                            groupedPreguntas[categorias[step - 2]].some((q) => !respuestas[q.id]) ||
                            enviando
                          }
                          onClick={handleSubmitEncuesta}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                          {enviando ? (
                            <RefreshCw size={18} className="animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                          Enviar Encuesta
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: RESULTADOS --- */}
      {tab === 'resultados' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Panel Analítico</h2>
              <p className="text-sm text-slate-500">
                Selecciona una campaña para ver los resultados globales.
              </p>
            </div>
            <select
              value={campaniaSelec}
              onChange={(e) => {
                const val = e.target.value;
                setCampaniaSelec(val ? Number(val) : '');
                if (val) loadStats(Number(val));
              }}
              className="border-slate-300 rounded-lg focus:ring-red-500 focus:border-red-500 font-medium"
            >
              <option value="">-- Seleccionar Campaña --</option>
              {campanias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {loadingStats ? (
            <div className="py-20 text-center">
              <RefreshCw size={40} className="animate-spin text-slate-300 mx-auto" />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Respuestas Totales
                  </p>
                  <p className="text-4xl font-black text-slate-900 mt-2">
                    {stats.total_respuestas}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                  <h3 className="font-bold text-slate-800 mb-4">Métricas por Categoría</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis domain={[0, 4]} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="Puntaje" fill="#b91c1c" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Promedios por Categoría (Max 4.0)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 4]} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{ fill: '#475569', fontSize: 13 }}
                      />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="Puntaje" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">Detalle de Participantes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-transparent text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Empleado</th>
                        <th className="px-6 py-4">Nivel</th>
                        <th className="px-6 py-4">Ubicación</th>
                        <th className="px-6 py-4">Promedio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.respuestas_individuales.map(
                        (
                          r: {
                            fecha_respuesta: string;
                            empleado_nombre: string;
                            nivel_jerarquico: string;
                            ubicacion: string;
                            promedio_general: number;
                          },
                          i: number
                        ) => (
                          <tr key={i} className="hover:bg-transparent">
                            <td className="px-6 py-4">{r.fecha_respuesta}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {r.empleado_nombre}
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                {r.nivel_jerarquico}
                              </span>
                            </td>
                            <td className="px-6 py-4">{r.ubicacion}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              {r.promedio_general.toFixed(2)}
                            </td>
                          </tr>
                        )
                      )}
                      {stats.respuestas_individuales.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                            Sin respuestas aún
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
              <p>Selecciona una campaña para ver analíticas</p>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: CONFIGURACION --- */}
      {tab === 'configuracion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaigns */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Settings size={20} /> Ciclos de Evaluación
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Nombre Campaña
                  </label>
                  <input
                    type="text"
                    className="w-full border-slate-200 rounded-lg text-sm"
                    placeholder="Ej. Clima Q1 2026"
                    value={newCampania.nombre}
                    onChange={(e) => setNewCampania({ ...newCampania, nombre: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Inicio
                    </label>
                    <input
                      type="date"
                      className="w-full border-slate-200 rounded-lg text-sm"
                      value={newCampania.fecha_inicio}
                      onChange={(e) =>
                        setNewCampania({ ...newCampania, fecha_inicio: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Cierre
                    </label>
                    <input
                      type="date"
                      className="w-full border-slate-200 rounded-lg text-sm"
                      value={newCampania.fecha_fin}
                      onChange={(e) =>
                        setNewCampania({ ...newCampania, fecha_fin: e.target.value })
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateCampania}
                  className="w-full bg-slate-900 text-white rounded-lg py-2 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                  <Plus size={16} /> Crear Ciclo
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
                  Campañas Históricas
                </h3>
                {campanias.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center p-3 bg-transparent rounded-lg border border-slate-100"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900">{c.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {c.fecha_inicio} a {c.fecha_fin}
                      </p>
                    </div>
                    {c.activa ? (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">
                        Activa
                      </span>
                    ) : (
                      <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                        Cerrada
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Banco de Preguntas</h2>

              <div className="space-y-4 mb-6 bg-transparent p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    className="w-full border-slate-200 rounded-lg text-sm"
                    placeholder="Ej. Liderazgo, Comunicación"
                    value={newPregunta.categoria}
                    onChange={(e) => setNewPregunta({ ...newPregunta, categoria: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Pregunta / Afirmación
                  </label>
                  <textarea
                    className="w-full border-slate-200 rounded-lg text-sm"
                    rows={2}
                    placeholder="Ej. Mi superior tiene en cuenta mis sugerencias"
                    value={newPregunta.pregunta}
                    onChange={(e) => setNewPregunta({ ...newPregunta, pregunta: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleCreatePregunta}
                  className="w-full bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg py-2 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Añadir Pregunta
                </button>
              </div>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {categorias.map((cat) => (
                  <div key={cat} className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-1">
                      {cat}
                    </h3>
                    {groupedPreguntas[cat].map((q) => (
                      <div
                        key={q.id}
                        className="flex justify-between items-start gap-3 p-3 bg-white border border-slate-100 shadow-sm rounded-lg group hover:border-red-200"
                      >
                        <p className="text-sm text-slate-600 flex-1 leading-tight">{q.pregunta}</p>
                        <button
                          onClick={() => handleDeletePregunta(q.id)}
                          className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
                {preguntas.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">
                    No hay preguntas configuradas
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
