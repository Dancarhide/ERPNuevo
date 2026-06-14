'use client';

import { useEffect, useState } from 'react';
import { nominaApi } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import {
  Loader2,
  Wallet,
  X,
  FileText,
  Download,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
} from 'lucide-react';

interface Concepto {
  id: number;
  nombre_concepto: string;
  tipo: string;
  clave: string;
}

interface Detalle {
  id: number;
  concepto: Concepto;
  monto_aplicado: number;
}

interface Nomina {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  periodicidad: string;
  sueldo_base: number;
  dias_trabajados: number;
  subtotal_percepciones: number;
  subtotal_deducciones: number;
  subtotal_otros: number;
  neto_pagar: number;
  estado: string;
  estatus_sat: string;
  uuid_sat?: string;
  detalles: Detalle[];
}

const fmt = (v: number | string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v) || 0);
const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const ESTADO_STYLE: Record<string, string> = {
  Pagado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Borrador: 'bg-amber-100 text-amber-700 border-amber-200',
  Cancelado: 'bg-red-100 text-red-700 border-red-200',
};

export default function MisComprobantesPage() {
  useAuth(); // ensure auth, but user not used directly
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNomina, setSelectedNomina] = useState<Nomina | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXml, setLoadingXml] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await nominaApi.getMisRecibos();
        setNominas(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const handlePrint = async (nominaId: number) => {
    setLoadingPdf(true);
    try {
      const data = await nominaApi.getReciboPDF(nominaId);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(data.html_content);
        win.document.close();
        win.onload = () => win.print();
      }
    } catch (e) {
      alert(`Error al generar recibo: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadXml = async (nominaId: number) => {
    setLoadingXml(true);
    try {
      const data = await nominaApi.getReciboXML(nominaId);
      const blob = new Blob([data.xml_content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina_${nominaId}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Error al generar XML: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingXml(false);
    }
  };

  // Calcular resumen total
  const totalNeto = nominas
    .filter((n) => n.estado === 'Pagado')
    .reduce((acc, n) => acc + Number(n.neto_pagar || 0), 0);
  const ultimoRecibo = nominas[0];

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#44474A] mb-1">Mis Comprobantes de Nómina</h1>
        <p className="text-[#858789] text-sm">
          Historial de recibos de pago y documentos fiscales.
        </p>
      </div>

      {/* Resumen Personal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] sm:col-span-1">
          <p className="text-xs font-semibold text-[#858789] uppercase tracking-wide mb-2">
            Total Recibido (historial)
          </p>
          <p className="text-2xl font-extrabold text-[#A7313A]">{fmt(totalNeto)}</p>
          <p className="text-xs text-[#858789] mt-1">
            {nominas.filter((n) => n.estado === 'Pagado').length} pagos procesados
          </p>
        </div>
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#858789] uppercase tracking-wide mb-2">
            Último Pago
          </p>
          <p className="text-2xl font-extrabold text-[#44474A]">
            {ultimoRecibo ? fmt(ultimoRecibo.neto_pagar) : '—'}
          </p>
          <p className="text-xs text-[#858789] mt-1">
            {ultimoRecibo
              ? `${ultimoRecibo.periodicidad} · ${fmtDate(ultimoRecibo.fecha_fin)}`
              : 'Sin recibos'}
          </p>
        </div>
        <div className="bg-white border border-black/5 rounded-xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold text-[#858789] uppercase tracking-wide mb-2">
            Sueldo Base Actual
          </p>
          <p className="text-2xl font-extrabold text-[#44474A]">
            {ultimoRecibo ? fmt(ultimoRecibo.sueldo_base) : '—'}
          </p>
          <p className="text-xs text-[#858789] mt-1">
            {ultimoRecibo
              ? `${ultimoRecibo.dias_trabajados} días · ${ultimoRecibo.periodicidad}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Lista de Recibos */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#A7313A]" size={28} />
        </div>
      ) : nominas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <Wallet size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-[#858789] font-medium">No tienes recibos de nómina aún</p>
          <p className="text-xs text-[#858789] mt-1">
            Tu contador procesará tu primer recibo próximamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {nominas.map((nomina) => (
            <div
              key={nomina.id}
              className="bg-white border border-black/5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
              onClick={() => setSelectedNomina(nomina)}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#A7313A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wallet size={20} className="text-[#A7313A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[#44474A] text-sm">
                        {fmtDate(nomina.fecha_inicio)} — {fmtDate(nomina.fecha_fin)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADO_STYLE[nomina.estado] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {nomina.estado}
                      </span>
                    </div>
                    <p className="text-xs text-[#858789]">
                      {nomina.periodicidad} · {nomina.dias_trabajados} días trabajados
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 justify-end">
                      <TrendingUp size={11} /> {fmt(nomina.subtotal_percepciones)}
                    </div>
                    <div className="text-xs text-red-500 font-medium flex items-center gap-1 justify-end">
                      <TrendingDown size={11} /> {fmt(nomina.subtotal_deducciones)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-[#A7313A]">
                      {fmt(nomina.neto_pagar)}
                    </p>
                    <p className="text-xs text-[#858789]">Neto a cobrar</p>
                  </div>
                  <ChevronRight size={18} className="text-[#858789] flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detalle Recibo */}
      {selectedNomina && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedNomina(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#44474A]">Detalle del Recibo</h2>
                <p className="text-xs text-[#858789]">
                  {fmtDate(selectedNomina.fecha_inicio)} — {fmtDate(selectedNomina.fecha_fin)} ·{' '}
                  {selectedNomina.periodicidad}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(selectedNomina.id)}
                  disabled={loadingPdf}
                  title="Imprimir / Guardar PDF"
                  className="flex items-center gap-1 text-xs bg-[#A7313A] text-white px-3 py-1.5 rounded-lg hover:bg-[#8B2830] disabled:opacity-60"
                >
                  {loadingPdf ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <FileText size={12} />
                  )}
                  PDF
                </button>
                <button
                  onClick={() => handleDownloadXml(selectedNomina.id)}
                  disabled={loadingXml}
                  title="Descargar XML CFDI"
                  className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {loadingXml ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  XML
                </button>
                <button
                  onClick={() => setSelectedNomina(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-6">
              {/* Percepciones */}
              <div>
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <TrendingUp size={13} /> Percepciones
                </h3>
                <div className="bg-emerald-50/50 rounded-xl overflow-hidden">
                  {selectedNomina.detalles
                    .filter((d) => d.concepto.tipo === 'Percepcion')
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center px-4 py-2.5 border-b border-emerald-100/50 last:border-0"
                      >
                        <span className="text-sm text-[#44474A]">{d.concepto.nombre_concepto}</span>
                        <span className="text-sm font-semibold text-emerald-700">
                          {fmt(d.monto_aplicado)}
                        </span>
                      </div>
                    ))}
                  {selectedNomina.detalles.filter((d) => d.concepto.tipo === 'Percepcion')
                    .length === 0 && (
                    <p className="text-center text-xs text-[#858789] py-4">
                      Sin conceptos de percepción
                    </p>
                  )}
                  <div className="flex justify-between items-center px-4 py-3 bg-emerald-100/60">
                    <span className="text-sm font-bold text-emerald-800">Total Percepciones</span>
                    <span className="text-sm font-bold text-emerald-800">
                      {fmt(selectedNomina.subtotal_percepciones)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deducciones */}
              <div>
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <TrendingDown size={13} /> Deducciones
                </h3>
                <div className="bg-red-50/50 rounded-xl overflow-hidden">
                  {selectedNomina.detalles
                    .filter((d) => d.concepto.tipo === 'Deduccion')
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center px-4 py-2.5 border-b border-red-100/50 last:border-0"
                      >
                        <span className="text-sm text-[#44474A]">{d.concepto.nombre_concepto}</span>
                        <span className="text-sm font-semibold text-red-600">
                          {fmt(d.monto_aplicado)}
                        </span>
                      </div>
                    ))}
                  {selectedNomina.detalles.filter((d) => d.concepto.tipo === 'Deduccion').length ===
                    0 && <p className="text-center text-xs text-[#858789] py-4">Sin deducciones</p>}
                  <div className="flex justify-between items-center px-4 py-3 bg-red-100/60">
                    <span className="text-sm font-bold text-red-700">Total Deducciones</span>
                    <span className="text-sm font-bold text-red-700">
                      {fmt(selectedNomina.subtotal_deducciones)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Neto a Pagar */}
              <div className="bg-[#A7313A]/5 border border-[#A7313A]/20 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#A7313A]/10 rounded-lg flex items-center justify-center">
                    <CircleDollarSign size={20} className="text-[#A7313A]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#858789] uppercase tracking-wide">
                      Neto a Pagar
                    </p>
                    <p className="text-xs text-[#858789]">
                      {selectedNomina.dias_trabajados} días · {selectedNomina.periodicidad}
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-black text-[#A7313A]">
                  {fmt(selectedNomina.neto_pagar)}
                </p>
              </div>

              {/* Info fiscal */}
              <div className="text-xs text-[#858789] space-y-1">
                <div className="flex justify-between">
                  <span>SDI</span>
                  <span className="font-medium text-[#44474A]">{fmt(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estatus SAT</span>
                  <span
                    className={`font-medium px-2 py-0.5 rounded-full ${selectedNomina.estatus_sat === 'Timbrado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {selectedNomina.estatus_sat}
                  </span>
                </div>
                {selectedNomina.uuid_sat && (
                  <div className="flex justify-between">
                    <span>UUID SAT</span>
                    <span className="font-mono text-xs text-[#44474A]">
                      {selectedNomina.uuid_sat}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
