'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nominaApi } from '@/lib/api';
import {
  Plus,
  Loader2,
  Wallet,
  ChevronRight,
  Calendar,
  Users,
  CircleDollarSign,
  FileText,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface Lote {
  id: string;
  descripcion?: string;
  periodicidad: string;
  tipo_nomina?: string;
  periodo_inicio: string;
  periodo_fin: string;
  numero_empleados: number;
  total_percepciones: number;
  total_deducciones: number;
  total_neto: number;
  estatus: string;
}

const ESTATUS_BADGE: Record<string, { label: string; style: string }> = {
  Borrador: { label: 'Borrador', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  Procesado: { label: 'Procesado', style: 'bg-blue-100 text-blue-800 border-blue-200' },
  Cerrado: { label: 'Cerrado', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const PERIODICIDADES = ['Semanal', 'Quincenal', 'Mensual'];
const TIPOS_NOMINA = ['Ordinaria', 'Aguinaldo', 'Finiquito', 'PTU', 'Bono', 'Prima Vacacional'];

const currentYear = new Date().getFullYear();

export default function PayrollPage() {
  const router = useRouter();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [filtroAño, setFiltroAño] = useState<number | ''>('');
  const [savingLote, setSavingLote] = useState(false);

  const [form, setForm] = useState({
    id: '',
    descripcion: '',
    periodicidad: 'Quincenal',
    tipo_nomina: 'Ordinaria',
    periodo_inicio: '',
    periodo_fin: '',
    numero_periodo: '',
    año: currentYear.toString(),
  });

  const fetchLotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await nominaApi.getLotes({
        estatus: filtroEstatus || undefined,
        año: filtroAño || undefined,
      });
      setLotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroEstatus, filtroAño]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLotes();
  }, [fetchLotes]);

  const handleCreateLote = async () => {
    if (!form.id || !form.periodo_inicio || !form.periodo_fin) {
      alert('ID del lote, fecha inicio y fecha fin son requeridos.');
      return;
    }
    setSavingLote(true);
    try {
      const payload = {
        id: form.id,
        descripcion: form.descripcion || undefined,
        periodicidad: form.periodicidad,
        tipo_nomina: form.tipo_nomina,
        periodo_inicio: form.periodo_inicio,
        periodo_fin: form.periodo_fin,
        numero_periodo: form.numero_periodo ? parseInt(form.numero_periodo) : undefined,
        año: form.año ? parseInt(form.año) : currentYear,
      };
      const lote = await nominaApi.createLote(payload);
      setShowModal(false);
      router.push(`/dashboard/payroll/${lote.id}`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(`Error: ${e.message}`);
      } else {
        alert('Ocurrió un error inesperado');
      }
    } finally {
      setSavingLote(false);
    }
  };

  const totalGlobal = lotes.reduce((a, l) => a + l.total_neto, 0);
  const totalEmpleados = lotes.reduce((a, l) => a + l.numero_empleados, 0);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#44474A] mb-1">Gestión de Nómina</h1>
          <p className="text-[#858789] text-sm">
            Administración de lotes de nómina, recibos y conceptos de pago.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLotes}
            className="p-2 text-[#858789] hover:text-[#44474A] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#A7313A] text-white px-4 py-2 rounded-lg hover:bg-[#8B2830] transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={18} /> Nuevo Lote de Nómina
          </button>
        </div>
      </div>

      {/* KPI Global */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Lotes Totales',
            value: lotes.length.toString(),
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Empleados Cubiertos',
            value: totalEmpleados.toString(),
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Lotes Cerrados',
            value: lotes.filter((l) => l.estatus === 'Cerrado').length.toString(),
            icon: CircleDollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Neto Total Pagado',
            value: fmt(totalGlobal),
            icon: Wallet,
            color: 'text-[#A7313A]',
            bg: 'bg-[#A7313A]/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white border border-black/5 rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#858789] uppercase tracking-wide">
                {label}
              </p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg} ${color}`}>
                <Icon size={18} />
              </div>
            </div>
            <p className="text-xl font-extrabold text-[#44474A] truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-[#858789]">
          <Filter size={16} />
          <span className="font-medium">Filtrar:</span>
        </div>
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#44474A] bg-white focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
        >
          <option value="">Todos los estados</option>
          <option value="Borrador">Borrador</option>
          <option value="Procesado">Procesado</option>
          <option value="Cerrado">Cerrado</option>
        </select>
        <select
          value={filtroAño}
          onChange={(e) => setFiltroAño(e.target.value ? parseInt(e.target.value) : '')}
          className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#44474A] bg-white focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
        >
          <option value="">Todos los años</option>
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Lotes */}
      <div className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-[#F3F4F6]">
          <h2 className="font-bold text-[#44474A] text-base">Lotes de Nómina</h2>
          <p className="text-xs text-[#858789] mt-0.5">{lotes.length} lote(s) encontrados</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#A7313A]" size={28} />
          </div>
        ) : lotes.length === 0 ? (
          <div className="text-center py-16 text-[#858789]">
            <Wallet size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No hay lotes de nómina</p>
            <p className="text-xs mt-1">
              Crea el primer lote haciendo clic en &quot;Nuevo Lote de Nómina&quot;
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                  <th className="text-left text-xs font-semibold text-[#858789] uppercase tracking-wide px-6 py-3">
                    Lote / Período
                  </th>
                  <th className="text-left text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                    Tipo
                  </th>
                  <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                    Empleados
                  </th>
                  <th className="text-right text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                    Percepciones
                  </th>
                  <th className="text-right text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                    Deducciones
                  </th>
                  <th className="text-right text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                    Neto
                  </th>
                  <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                    Estado
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {lotes.map((lote) => {
                  const badge = ESTATUS_BADGE[lote.estatus] || {
                    label: lote.estatus,
                    style: 'bg-gray-100 text-gray-600',
                  };
                  return (
                    <tr
                      key={lote.id}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/payroll/${lote.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#44474A]">{lote.id}</div>
                        <div className="text-xs text-[#858789] flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {fmtDate(lote.periodo_inicio)} — {fmtDate(lote.periodo_fin)}
                        </div>
                        {lote.descripcion && (
                          <div className="text-xs text-[#858789] mt-0.5">{lote.descripcion}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-[#44474A] font-medium text-xs">
                          {lote.tipo_nomina || '—'}
                        </div>
                        <div className="text-xs text-[#858789]">{lote.periodicidad}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-[#44474A] font-semibold">
                          <Users size={13} className="text-[#858789]" />
                          {lote.numero_empleados}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                        {fmt(lote.total_percepciones)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-red-500">
                        {fmt(lote.total_deducciones)}
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-[#A7313A]">
                        {fmt(lote.total_neto)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight size={16} className="text-[#858789]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Lote */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#F3F4F6]">
              <h2 className="font-bold text-[#44474A] text-lg">Nuevo Lote de Nómina</h2>
              <p className="text-xs text-[#858789] mt-0.5">
                Define el período y características del lote.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    ID del Lote *
                  </label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="Ej: 2025-Q01"
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={form.año}
                    onChange={(e) => setForm({ ...form, año: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Primera quincena de enero 2025"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    Periodicidad *
                  </label>
                  <select
                    value={form.periodicidad}
                    onChange={(e) => setForm({ ...form, periodicidad: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  >
                    {PERIODICIDADES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    Tipo de Nómina
                  </label>
                  <select
                    value={form.tipo_nomina}
                    onChange={(e) => setForm({ ...form, tipo_nomina: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  >
                    {TIPOS_NOMINA.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    value={form.periodo_inicio}
                    onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#858789] uppercase tracking-wide mb-1">
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    value={form.periodo_fin}
                    onChange={(e) => setForm({ ...form, periodo_fin: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#44474A] focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-[#858789] hover:text-[#44474A] font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLote}
                disabled={savingLote}
                className="flex items-center gap-2 bg-[#A7313A] text-white px-5 py-2 rounded-lg hover:bg-[#8B2830] transition-colors text-sm font-medium disabled:opacity-60"
              >
                {savingLote ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Crear Lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
