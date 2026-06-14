'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { nominaApi } from '@/lib/api';
import {
  ChevronLeft,
  Loader2,
  Users,
  Wallet,
  TrendingDown,
  CircleDollarSign,
  Play,
  Lock,
  FileText,
  Download,
  X,
} from 'lucide-react';

interface NominaItem {
  id: number;
  empleado_id: number;
  empleado_nombre: string;
  sueldo_base: number;
  subtotal_percepciones: number;
  subtotal_deducciones: number;
  neto_pagar: number;
  dias_trabajados: number;
  estado: string;
  estatus_sat: string;
}

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
  nominas: NominaItem[];
}

const ESTATUS_BADGE: Record<string, string> = {
  Borrador: 'bg-amber-100 text-amber-800 border-amber-200',
  Procesado: 'bg-blue-100 text-blue-800 border-blue-200',
  Cerrado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const ESTATUS_SAT_BADGE: Record<string, string> = {
  Pendiente: 'bg-gray-100 text-gray-600',
  Timbrado: 'bg-emerald-100 text-emerald-700',
  Cancelado: 'bg-red-100 text-red-700',
};

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0);
const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function DetalleLotePage() {
  const params = useParams();
  const router = useRouter();
  const loteId = params.loteId as string;

  const [lote, setLote] = useState<Lote | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [xmlModal, setXmlModal] = useState<{ content: string } | null>(null);
  const [pdfModal, setPdfModal] = useState<{ html: string } | null>(null);

  const fetchLote = async () => {
    setLoading(true);
    try {
      const data = await nominaApi.getLote(loteId);
      setLote(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteId]);

  const handleProcesar = async () => {
    if (
      !confirm(
        '¿Procesar el lote? Se generarán los recibos para todos los empleados activos con la periodicidad del lote.'
      )
    )
      return;
    setProcesando(true);
    try {
      await nominaApi.procesarLote(loteId);
      await fetchLote();
    } catch (e) {
      alert(`Error al procesar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrar = async () => {
    if (
      !confirm(
        '¿Cerrar y autorizar el lote? Los recibos quedarán como "Pagado" y no podrán modificarse.'
      )
    )
      return;
    setCerrando(true);
    try {
      await nominaApi.cerrarLote(loteId);
      await fetchLote();
    } catch (e) {
      alert(`Error al cerrar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCerrando(false);
    }
  };

  const handleVerXML = async (nominaId: number) => {
    try {
      const data = await nominaApi.getReciboXML(nominaId);
      setXmlModal({ content: data.xml_content });
    } catch (e) {
      alert(`Error al generar XML: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleVerPDF = async (nominaId: number) => {
    try {
      const data = await nominaApi.getReciboPDF(nominaId);
      setPdfModal({ html: data.html_content });
    } catch (e) {
      alert(`Error al generar recibo: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const downloadXML = (content: string, nominaId: number) => {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomina_${nominaId}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = (html: string) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => win.print();
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#A7313A]" size={36} />
      </div>
    );

  if (!lote) return <div className="p-8 text-center text-gray-500">Lote no encontrado.</div>;

  const puedeCerrar = lote.estatus === 'Procesado';

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Encabezado */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/payroll')}
          className="flex items-center gap-1 text-[#858789] hover:text-[#44474A] text-sm mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> Volver a Nóminas
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#44474A]">Lote {lote.id}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${ESTATUS_BADGE[lote.estatus] || 'bg-gray-100 text-gray-600'}`}
              >
                {lote.estatus}
              </span>
            </div>
            <p className="text-[#858789] text-sm">
              {lote.descripcion || lote.tipo_nomina} • {lote.periodicidad} •{' '}
              {fmtDate(lote.periodo_inicio)} — {fmtDate(lote.periodo_fin)}
            </p>
          </div>
          <div className="flex gap-2">
            {lote.estatus === 'Borrador' && (
              <button
                onClick={handleProcesar}
                disabled={procesando}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm font-medium"
              >
                {procesando ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Procesar Lote
              </button>
            )}
            {puedeCerrar && (
              <button
                onClick={handleCerrar}
                disabled={cerrando}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 text-sm font-medium"
              >
                {cerrando ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Cerrar y Autorizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards del Lote */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Empleados',
            value: lote.numero_empleados.toString(),
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Total Percepciones',
            value: fmt(lote.total_percepciones),
            icon: Wallet,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Total Deducciones',
            value: fmt(lote.total_deducciones),
            icon: TrendingDown,
            color: 'text-red-500',
            bg: 'bg-red-50',
          },
          {
            label: 'Neto a Pagar',
            value: fmt(lote.total_neto),
            icon: CircleDollarSign,
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
            <p className="text-xl font-extrabold text-[#44474A]">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla de Nóminas */}
      <div className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-[#F3F4F6]">
          <h2 className="font-bold text-[#44474A] text-lg">Recibos del Lote</h2>
          <p className="text-xs text-[#858789] mt-0.5">
            {lote.nominas.length} recibos generados — Haz clic en una fila para ver el detalle
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                <th className="text-left text-xs font-semibold text-[#858789] uppercase tracking-wide px-6 py-3">
                  Empleado
                </th>
                <th className="text-right text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                  Días
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
                  SAT
                </th>
                <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                  Estado
                </th>
                <th className="text-center text-xs font-semibold text-[#858789] uppercase tracking-wide px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {lote.nominas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[#858789] py-16">
                    <Play size={32} className="mx-auto mb-3 text-gray-300" />
                    <p>El lote aún no ha sido procesado.</p>
                    <p className="text-xs mt-1">
                      Haz clic en &quot;Procesar Lote&quot; para generar los recibos
                      automáticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                lote.nominas.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/payroll/${loteId}/recibo/${n.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#44474A]">{n.empleado_nombre}</div>
                      <div className="text-xs text-[#858789]">ID #{n.empleado_id}</div>
                    </td>
                    <td className="px-4 py-4 text-right text-[#44474A] font-medium">
                      {n.dias_trabajados}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                      {fmt(n.subtotal_percepciones)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-red-500">
                      {fmt(n.subtotal_deducciones)}
                    </td>
                    <td className="px-4 py-4 text-right font-extrabold text-[#A7313A]">
                      {fmt(n.neto_pagar)}
                    </td>
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTATUS_SAT_BADGE[n.estatus_sat] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {n.estatus_sat}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.estado === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : n.estado === 'Borrador' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {n.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleVerPDF(n.id)}
                          title="Ver Recibo"
                          className="p-1.5 text-[#858789] hover:text-[#A7313A] hover:bg-[#A7313A]/10 rounded-md transition-colors"
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          onClick={() => handleVerXML(n.id)}
                          title="Generar XML CFDI"
                          className="p-1.5 text-[#858789] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal XML */}
      {xmlModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setXmlModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-[#44474A]">XML CFDI Generado</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadXML(xmlModal.content, 0)}
                  className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                >
                  <Download size={14} /> Descargar XML
                </button>
                <button
                  onClick={() => setXmlModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-auto p-5 flex-1">
              <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {xmlModal.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {pdfModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPdfModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-[#44474A]">Recibo de Nómina</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => printPDF(pdfModal.html)}
                  className="flex items-center gap-1 text-sm bg-[#A7313A] text-white px-3 py-1.5 rounded-lg hover:bg-[#8B2830]"
                >
                  <FileText size={14} /> Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => setPdfModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-4 bg-gray-100">
              <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                <iframe
                  srcDoc={pdfModal.html}
                  className="w-full h-[600px] border-0"
                  title="Recibo de Nómina"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
