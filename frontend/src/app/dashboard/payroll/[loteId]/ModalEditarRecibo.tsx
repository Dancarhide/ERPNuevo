'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Save } from 'lucide-react';
import { nominaApi } from '@/lib/api';

interface Concepto {
  id: number;
  clave: string;
  nombre_concepto: string;
  tipo: string;
  monto_defecto: number;
}

interface DetalleNomina {
  id?: number;
  concepto_id: number;
  monto_aplicado: number;
  descripcion_extra?: string;
}

interface NominaFull {
  id: number;
  empleado_id: number;
  empleado: { nombres: string; apellido_paterno: string };
  detalles: DetalleNomina[];
  subtotal_percepciones: number;
  subtotal_deducciones: number;
  neto_pagar: number;
}

interface ModalEditarReciboProps {
  nominaId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarRecibo({
  nominaId,
  onClose,
  onSuccess,
}: ModalEditarReciboProps) {
  const [nomina, setNomina] = useState<NominaFull | null>(null);
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [detalles, setDetalles] = useState<DetalleNomina[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nominaData, conceptosData] = await Promise.all([
          nominaApi.getRecibo(nominaId),
          nominaApi.getConceptos(),
        ]);
        setNomina(nominaData);
        setConceptos(conceptosData);
        // Filtramos detalles válidos
        setDetalles(nominaData.detalles || []);
      } catch (err: unknown) {
        console.error(err);
        setError('Error al cargar datos del recibo.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nominaId]);

  const handleUpdateMonto = (index: number, value: string) => {
    const newDetalles = [...detalles];
    newDetalles[index].monto_aplicado = parseFloat(value) || 0;
    setDetalles(newDetalles);
  };

  const handleRemoveDetalle = (index: number) => {
    const newDetalles = [...detalles];
    newDetalles.splice(index, 1);
    setDetalles(newDetalles);
  };

  const handleAddDetalle = (tipo: string) => {
    // Buscar el primer concepto de ese tipo que no esté ya agregado
    const conceptosTipo = conceptos.filter((c) => c.tipo === tipo);
    const available = conceptosTipo.find((c) => !detalles.some((d) => d.concepto_id === c.id));
    if (available) {
      setDetalles([
        ...detalles,
        { concepto_id: available.id, monto_aplicado: available.monto_defecto || 0 },
      ]);
    }
  };

  const handleConceptoChange = (index: number, conceptoId: number) => {
    const newDetalles = [...detalles];
    newDetalles[index].concepto_id = conceptoId;
    setDetalles(newDetalles);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await nominaApi.updateRecibo(nominaId, { detalles });
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Error al guardar el recibo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[#A7313A] mb-4" size={32} />
          <p className="text-gray-500">Cargando recibo...</p>
        </div>
      </div>
    );
  }

  if (!nomina) return null;

  const percepciones = detalles
    .map((d, i) => ({ ...d, index: i, concepto: conceptos.find((c) => c.id === d.concepto_id) }))
    .filter((d) => d.concepto?.tipo === 'Percepcion');
  const deducciones = detalles
    .map((d, i) => ({ ...d, index: i, concepto: conceptos.find((c) => c.id === d.concepto_id) }))
    .filter((d) => d.concepto?.tipo === 'Deduccion');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <div>
            <h2 className="font-bold text-[#44474A] text-lg">Editar Recibo</h2>
            <p className="text-sm text-gray-500">
              {nomina.empleado.nombres} {nomina.empleado.apellido_paterno}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* PERCEPCIONES */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-emerald-700">Percepciones</h3>
                <button
                  onClick={() => handleAddDetalle('Percepcion')}
                  className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded"
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>

              <div className="space-y-3">
                {percepciones.map((item) => (
                  <div
                    key={item.index}
                    className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm"
                  >
                    <select
                      className="flex-1 text-sm border-gray-200 rounded-md py-1.5 focus:border-emerald-500 focus:ring-emerald-500"
                      value={item.concepto_id}
                      onChange={(e) => handleConceptoChange(item.index, parseInt(e.target.value))}
                    >
                      <option value={item.concepto_id}>
                        {item.concepto?.nombre_concepto || 'Concepto no encontrado'}
                      </option>
                      {conceptos
                        .filter(
                          (c) =>
                            c.tipo === 'Percepcion' &&
                            (c.id === item.concepto_id ||
                              !detalles.some((d) => d.concepto_id === c.id))
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre_concepto}
                          </option>
                        ))}
                    </select>
                    <div className="relative w-32">
                      <span className="absolute left-2 top-1.5 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full text-right text-sm pl-6 pr-2 py-1.5 border-gray-200 rounded-md focus:border-emerald-500 focus:ring-emerald-500"
                        value={item.monto_aplicado}
                        onChange={(e) => handleUpdateMonto(item.index, e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveDetalle(item.index)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {percepciones.length === 0 && (
                  <p className="text-sm text-gray-400 italic text-center py-4">
                    No hay percepciones
                  </p>
                )}
              </div>
            </div>

            {/* DEDUCCIONES */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-red-600">Deducciones</h3>
                <button
                  onClick={() => handleAddDetalle('Deduccion')}
                  className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 font-medium bg-red-50 px-2 py-1 rounded"
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>

              <div className="space-y-3">
                {deducciones.map((item) => (
                  <div
                    key={item.index}
                    className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm"
                  >
                    <select
                      className="flex-1 text-sm border-gray-200 rounded-md py-1.5 focus:border-red-500 focus:ring-red-500"
                      value={item.concepto_id}
                      onChange={(e) => handleConceptoChange(item.index, parseInt(e.target.value))}
                    >
                      <option value={item.concepto_id}>
                        {item.concepto?.nombre_concepto || 'Concepto no encontrado'}
                      </option>
                      {conceptos
                        .filter(
                          (c) =>
                            c.tipo === 'Deduccion' &&
                            (c.id === item.concepto_id ||
                              !detalles.some((d) => d.concepto_id === c.id))
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre_concepto}
                          </option>
                        ))}
                    </select>
                    <div className="relative w-32">
                      <span className="absolute left-2 top-1.5 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full text-right text-sm pl-6 pr-2 py-1.5 border-gray-200 rounded-md focus:border-red-500 focus:ring-red-500"
                        value={item.monto_aplicado}
                        onChange={(e) => handleUpdateMonto(item.index, e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveDetalle(item.index)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {deducciones.length === 0 && (
                  <p className="text-sm text-gray-400 italic text-center py-4">
                    No hay deducciones
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-white flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Los totales globales del lote se actualizarán al guardar.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#A7313A] text-white rounded-lg hover:bg-[#8e2931] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
