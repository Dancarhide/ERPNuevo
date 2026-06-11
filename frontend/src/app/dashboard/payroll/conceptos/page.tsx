'use client';

import { useEffect, useState } from 'react';
import { nominaApi } from '@/lib/api';
import {
  Plus,
  Loader2,
  Pencil,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Search,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Concepto {
  id: number;
  clave: string;
  nombre_concepto: string;
  tipo: 'Percepcion' | 'Deduccion' | 'OtroPago';
  clave_sat?: string;
  tipo_sat?: string;
  es_exento: boolean;
  es_obligatorio: boolean;
  monto_defecto: number;
  activo: boolean;
}

const TIPO_META: Record<
  string,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
  }
> = {
  Percepcion: {
    label: 'Percepción',
    icon: TrendingUp,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  Deduccion: {
    label: 'Deducción',
    icon: TrendingDown,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  OtroPago: {
    label: 'Otro Pago',
    icon: CreditCard,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

// SAT claves de percepciones más usadas (Complemento 1.2)
const CLAVES_SAT_PERC = [
  { v: '001', l: '001 — Sueldos y Salarios' },
  { v: '002', l: '002 — Jubilación, pensión, retiro' },
  { v: '003', l: '003 — Liquidación' },
  { v: '004', l: '004 — Fondo de Ahorro' },
  { v: '009', l: '009 — Viáticos' },
  { v: '010', l: '010 — Premios por puntualidad' },
  { v: '011', l: '011 — Primas vacacionales' },
  { v: '019', l: '019 — Horas extra' },
  { v: '023', l: '023 — Tiempo extra doble' },
  { v: '036', l: '036 — Vales de despensa' },
  { v: '044', l: '044 — Subsidio para el empleo' },
  { v: '047', l: '047 — Compensación' },
];

const CLAVES_SAT_DED = [
  { v: '001', l: '001 — Seguridad Social (IMSS)' },
  { v: '002', l: '002 — ISR' },
  { v: '003', l: '003 — Aportaciones a pensiones voluntarias' },
  { v: '004', l: '004 — Otros' },
  { v: '005', l: '005 — INFONAVIT' },
  { v: '006', l: '006 — Descuento por incapacidad' },
  { v: '007', l: '007 — Pensión alimenticia' },
  { v: '008', l: '008 — Renta' },
  { v: '009', l: '009 — Préstamos propiamente dichos' },
  { v: '013', l: '013 — Fondo de ahorro' },
];

// ─── Componente Principal ──────────────────────────────────────────────────────

const EMPTY_FORM = {
  clave: '',
  nombre_concepto: '',
  tipo: 'Percepcion' as Concepto['tipo'],
  clave_sat: '',
  tipo_sat: 'P',
  es_exento: false,
  es_obligatorio: false,
  monto_defecto: 0,
  activo: true,
};

export default function ConceptosNominaPage() {
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');

  const fetchConceptos = async () => {
    setLoading(true);
    try {
      const data = await nominaApi.getConceptos();
      setConceptos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchConceptos();
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: Concepto) => {
    setForm({
      clave: c.clave,
      nombre_concepto: c.nombre_concepto,
      tipo: c.tipo,
      clave_sat: c.clave_sat || '',
      tipo_sat: c.tipo_sat || (c.tipo === 'Percepcion' ? 'P' : c.tipo === 'Deduccion' ? 'D' : 'O'),
      es_exento: c.es_exento,
      es_obligatorio: c.es_obligatorio,
      monto_defecto: c.monto_defecto,
      activo: c.activo,
    });
    setEditId(c.id);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.clave || !form.nombre_concepto) {
      setError('La clave y el nombre son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await nominaApi.updateConcepto(editId, form);
      } else {
        await nominaApi.createConcepto(form);
      }
      setShowModal(false);
      await fetchConceptos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (c: Concepto) => {
    try {
      await nominaApi.updateConcepto(c.id, { activo: !c.activo });
      setConceptos((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo: !x.activo } : x)));
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSeed = async () => {
    if (
      !confirm(
        '¿Deseas cargar el catálogo estándar del SAT? No se sobreescribirán los conceptos existentes.'
      )
    )
      return;
    setLoading(true);
    try {
      const res = await nominaApi.seedConceptos();
      alert(`Catálogo cargado: ${res.creados} nuevos, ${res.omitidos} omitidos (ya existían).`);
      await fetchConceptos();
    } catch (e) {
      alert(`Error al cargar catálogo: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  };

  // Filtrado

  const filtered = conceptos.filter((c) => {
    const matchSearch =
      !search ||
      c.nombre_concepto.toLowerCase().includes(search.toLowerCase()) ||
      c.clave.toLowerCase().includes(search.toLowerCase());
    const matchTipo = !filterTipo || c.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  // Agrupados por tipo para la vista de tarjetas
  const grupos = ['Percepcion', 'Deduccion', 'OtroPago']
    .map((tipo) => ({
      tipo,
      items: filtered.filter((c) => c.tipo === tipo),
    }))
    .filter((g) => g.items.length > 0 || !filterTipo);

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  // Claves SAT según tipo seleccionado
  const clavesSatOptions =
    form.tipo === 'Percepcion' ? CLAVES_SAT_PERC : form.tipo === 'Deduccion' ? CLAVES_SAT_DED : [];

  return (
    <div className="p-6 md:p-8 max-w-[1300px] mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#44474A] mb-1">
            Catálogo de Conceptos de Nómina
          </h1>
          <p className="text-[#858789] text-sm">
            Define las percepciones, deducciones y otros pagos que aplican a tu empresa. Estos
            conceptos se usarán al generar los recibos de nómina.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeed}
            className="flex items-center gap-2 bg-white text-[#44474A] border border-[#E5E7EB] px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
          >
            <Loader2 size={18} className={loading ? 'animate-spin' : 'hidden'} />
            Cargar Catálogo SAT
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#A7313A] text-white px-4 py-2.5 rounded-lg hover:bg-[#8B2830] transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
          >
            <Plus size={18} /> Nuevo Concepto
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(TIPO_META).map(([tipo, meta]) => {
          const Icon = meta.icon;
          const count = conceptos.filter((c) => c.tipo === tipo).length;
          const active = conceptos.filter((c) => c.tipo === tipo && c.activo).length;
          return (
            <div key={tipo} className={`${meta.bg} border ${meta.border} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={meta.color} />
                <span className={`text-xs font-bold uppercase tracking-wide ${meta.color}`}>
                  {meta.label}s
                </span>
              </div>
              <p className={`text-2xl font-extrabold ${meta.color}`}>{count}</p>
              <p className="text-xs text-[#858789] mt-0.5">{active} activos</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858789]" />
          <input
            type="text"
            placeholder="Buscar por nombre o clave…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
          />
        </div>
        <div className="flex gap-2">
          {['', 'Percepcion', 'Deduccion', 'OtroPago'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFilterTipo(tipo)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                filterTipo === tipo
                  ? 'bg-[#44474A] text-white border-[#44474A]'
                  : 'bg-white text-[#858789] border-[#E5E7EB] hover:border-[#44474A] hover:text-[#44474A]'
              }`}
            >
              {tipo === '' ? 'Todos' : TIPO_META[tipo]?.label + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#A7313A]" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-2xl">
          <CreditCard size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#858789] font-medium">No hay conceptos registrados</p>
          <p className="text-xs text-[#858789] mt-1">
            Crea el primer concepto haciendo clic en &quot;Nuevo Concepto&quot;. <br />
            Define percepciones (sueldo, bonos) y deducciones (ISR, IMSS, INFONAVIT) de tu empresa.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 bg-[#A7313A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#8B2830]"
          >
            <Plus size={16} /> Crear primer concepto
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(({ tipo, items }) => {
            const meta = TIPO_META[tipo];
            const Icon = meta.icon;
            if (items.length === 0) return null;
            return (
              <div key={tipo}>
                <div className={`flex items-center gap-2 mb-3`}>
                  <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center`}>
                    <Icon size={14} className={meta.color} />
                  </div>
                  <h2 className={`font-bold text-base ${meta.color}`}>{meta.label}s</h2>
                  <span className="text-xs text-[#858789] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                        <th className="text-left text-xs font-semibold text-[#858789] uppercase tracking-wide px-5 py-3">
                          Clave
                        </th>
                        <th className="text-left text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                          Concepto
                        </th>
                        <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                          Clave SAT
                        </th>
                        <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                          Exento
                        </th>
                        <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                          Obligatorio
                        </th>
                        <th className="text-right text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                          Monto Default
                        </th>
                        <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                          Activo
                        </th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {items.map((c) => (
                        <tr
                          key={c.id}
                          className={`transition-colors hover:bg-[#FAFAFA] ${!c.activo ? 'opacity-50' : ''}`}
                        >
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs bg-[#F3F4F6] text-[#44474A] px-2 py-0.5 rounded-md font-bold">
                              {c.clave}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#44474A]">{c.nombre_concepto}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {c.clave_sat ? (
                              <span className="font-mono text-xs text-[#858789]">
                                {c.clave_sat}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.es_exento ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              {c.es_exento ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.es_obligatorio ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              {c.es_obligatorio ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#44474A]">
                            {c.monto_defecto > 0 ? (
                              fmt(c.monto_defecto)
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleActivo(c)}
                              className={`transition-colors ${c.activo ? 'text-emerald-500 hover:text-emerald-700' : 'text-gray-300 hover:text-gray-500'}`}
                              title={c.activo ? 'Desactivar' : 'Activar'}
                            >
                              {c.activo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 text-[#858789] hover:text-[#44474A] hover:bg-[#F3F4F6] rounded-md transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───── Modal Crear / Editar ───── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-5 border-b border-[#F3F4F6] flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-[#44474A] text-lg">
                  {editId ? 'Editar Concepto' : 'Nuevo Concepto'}
                </h2>
                <p className="text-xs text-[#858789] mt-0.5">
                  {editId
                    ? 'Modifica los datos del concepto de nómina.'
                    : 'Define un nuevo concepto para el catálogo de tu empresa.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-2">
                  Tipo de Concepto *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Percepcion', 'Deduccion', 'OtroPago'] as const).map((tipo) => {
                    const meta = TIPO_META[tipo];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            tipo,
                            tipo_sat:
                              tipo === 'Percepcion' ? 'P' : tipo === 'Deduccion' ? 'D' : 'O',
                            clave_sat: '',
                          }));
                        }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                          form.tipo === tipo
                            ? `${meta.bg} ${meta.border} ${meta.color}`
                            : 'border-[#E5E7EB] text-[#858789] hover:border-[#D1D5DB]'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-xs font-bold">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clave y Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    Clave Interna *
                  </label>
                  <input
                    type="text"
                    value={form.clave}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, clave: e.target.value.toUpperCase() }))
                    }
                    placeholder="Ej: P001, D003"
                    disabled={!!editId}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] font-mono focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 disabled:bg-[#F9FAFB] disabled:text-[#858789]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    Clave SAT
                  </label>
                  {clavesSatOptions.length > 0 ? (
                    <select
                      value={form.clave_sat}
                      onChange={(e) => setForm((f) => ({ ...f, clave_sat: e.target.value }))}
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                    >
                      <option value="">— Sin clave SAT —</option>
                      {clavesSatOptions.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.l}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.clave_sat}
                      onChange={(e) => setForm((f) => ({ ...f, clave_sat: e.target.value }))}
                      placeholder="999"
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] font-mono focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                  Nombre del Concepto *
                </label>
                <input
                  type="text"
                  value={form.nombre_concepto}
                  onChange={(e) => setForm((f) => ({ ...f, nombre_concepto: e.target.value }))}
                  placeholder="Ej: Sueldo Base, ISR Retenido, Vales de Despensa…"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                />
              </div>

              {/* Monto por defecto */}
              <div>
                <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                  Monto por Defecto
                  <span className="ml-1 font-normal text-[#858789] normal-case">
                    (0 = se captura manualmente en cada recibo)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858789] text-sm font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto_defecto}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, monto_defecto: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full pl-7 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#44474A] text-right font-semibold focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    {
                      key: 'es_obligatorio',
                      label: 'Obligatorio',
                      desc: 'Se aplica automáticamente a todos los empleados al procesar el lote',
                      color: 'blue',
                    },
                    {
                      key: 'es_exento',
                      label: 'Exento de ISR',
                      desc: 'No forma parte de la base gravable para el cálculo del ISR',
                      color: 'emerald',
                    },
                  ] as const
                ).map(({ key, label, desc, color }) => (
                  <label
                    key={key}
                    className={`flex flex-col gap-1.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      form[key]
                        ? color === 'blue'
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-emerald-50 border-emerald-300'
                        : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${form[key] ? (color === 'blue' ? 'text-blue-700' : 'text-emerald-700') : 'text-[#44474A]'}`}
                      >
                        {label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          form[key]
                            ? color === 'blue'
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-emerald-600 border-emerald-600'
                            : 'border-[#D1D5DB]'
                        }`}
                        onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                      >
                        {form[key] && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-[#858789] leading-tight">{desc}</p>
                  </label>
                ))}
              </div>

              {/* Activo */}
              {editId && (
                <label className="flex items-center justify-between p-3.5 rounded-xl border-2 border-[#E5E7EB] cursor-pointer hover:border-[#D1D5DB]">
                  <div>
                    <p className="text-sm font-semibold text-[#44474A]">Concepto Activo</p>
                    <p className="text-xs text-[#858789]">
                      Solo los conceptos activos aparecen al generar nóminas
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      form.activo ? 'bg-[#A7313A] border-[#A7313A]' : 'border-[#D1D5DB]'
                    }`}
                    onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
                  >
                    {form.activo && <Check size={12} className="text-white" />}
                  </div>
                </label>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white px-5 pb-5 pt-3 border-t border-[#F3F4F6] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-[#858789] hover:text-[#44474A] font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#A7313A] text-white px-5 py-2 rounded-lg hover:bg-[#8B2830] transition-colors text-sm font-medium disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editId ? 'Guardar Cambios' : 'Crear Concepto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
