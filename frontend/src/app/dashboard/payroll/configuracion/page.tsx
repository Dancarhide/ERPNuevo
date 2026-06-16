'use client';

import { useEffect, useState } from 'react';
import { parametrosFiscalesApi, nominaApi } from '@/lib/api';
import {
  Save,
  Loader2,
  Settings2,
  FileJson,
  DollarSign,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

interface Parametro {
  id: number;
  ejercicio: number;
  uma: string;
  salario_minimo_general: string;
  salario_minimo_frontera: string;
  tabla_isr_mensual: string;
}

interface Concepto {
  id: number;
  clave: string;
  nombre_concepto: string;
  tipo: string;
  clave_sat?: string;
}

export default function ConfiguracionFiscalPage() {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'parametros' | 'conceptos'>('parametros');

  // Formulario Parametros
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear());
  const [uma, setUma] = useState('');
  const [umi, setUmi] = useState('');
  const [smg, setSmg] = useState('');
  const [smf, setSmf] = useState('');
  const [tablaISR, setTablaISR] = useState('');

  // Conceptos
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [loadingConceptos, setLoadingConceptos] = useState(false);

  // Modal Conceptos
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    clave: '',
    nombre_concepto: '',
    tipo: 'Percepcion',
    clave_sat: '',
  });

  const fetchParametros = async () => {
    try {
      const data = await parametrosFiscalesApi.getAll();
      setParametros(data);
      if (data.length > 0) {
        const p = data[0];
        setEjercicio(p.ejercicio);
        setUma(p.uma);
        setUmi(p.umi || '');
        setSmg(p.salario_minimo_general);
        setSmf(p.salario_minimo_frontera);
        setTablaISR(p.tabla_isr_mensual);
      } else {
        setTablaISR(
          '[\n  {"limite_inferior": 0.01, "limite_superior": 746.04, "cuota_fija": 0.00, "porcentaje": 1.92}\n]'
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchParametros();
  }, []);

  const fetchConceptos = async () => {
    setLoadingConceptos(true);
    try {
      const data = await nominaApi.getConceptos();
      setConceptos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConceptos(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'conceptos' && conceptos.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchConceptos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSeedConceptos = async () => {
    if (confirm('¿Deseas cargar los conceptos base del SAT? Esto no borrará los existentes.')) {
      setLoadingConceptos(true);
      try {
        await nominaApi.seedConceptos();
        await fetchConceptos();
        alert('Conceptos base cargados correctamente.');
      } catch {
        alert('Error al cargar conceptos base.');
        setLoadingConceptos(false);
      }
    }
  };

  const handleSaveParametros = async () => {
    setSaving(true);
    try {
      JSON.parse(tablaISR);
      const payload = {
        ejercicio,
        uma: parseFloat(uma),
        umi: parseFloat(umi),
        salario_minimo_general: parseFloat(smg),
        salario_minimo_frontera: parseFloat(smf),
        tabla_isr_mensual: tablaISR,
      };

      const existe = parametros.find((p) => p.ejercicio === ejercicio);
      if (existe) {
        await parametrosFiscalesApi.update(existe.id, payload);
        alert('Parámetros actualizados correctamente');
      } else {
        await parametrosFiscalesApi.create(payload);
        alert('Parámetros creados correctamente');
        fetchParametros();
      }
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : 'Verifique el formato JSON de la tabla ISR';
      alert('Error: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenModal = (concepto: Concepto | null = null) => {
    if (concepto) {
      setEditingId(concepto.id);
      setFormData({
        clave: concepto.clave,
        nombre_concepto: concepto.nombre_concepto,
        tipo: concepto.tipo,
        clave_sat: concepto.clave_sat || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        clave: '',
        nombre_concepto: '',
        tipo: 'Percepcion',
        clave_sat: '',
      });
    }
    setShowModal(true);
  };

  const handleSaveConcepto = async () => {
    try {
      if (editingId) {
        await nominaApi.updateConcepto(editingId, formData);
      } else {
        await nominaApi.createConcepto(formData);
      }
      setShowModal(false);
      fetchConceptos();
    } catch {
      alert('Error al guardar el concepto.');
    }
  };

  const handleDeleteConcepto = async (id: number, clave: string) => {
    if (['P001', 'D001', 'D002', 'D003'].includes(clave)) {
      alert(
        'No puedes eliminar conceptos base del sistema (Sueldo, IMSS, ISR, Infonavit) porque el motor matemático depende de ellos.'
      );
      return;
    }
    if (confirm('¿Estás seguro de eliminar este concepto?')) {
      try {
        await nominaApi.deleteConcepto(id);
        fetchConceptos();
      } catch {
        alert('Error al eliminar. Puede que el concepto ya esté siendo usado en una nómina.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración de Nómina</h1>
          <p className="text-sm text-gray-500">
            Administra los valores fiscales y el catálogo interno del SAT.
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('parametros')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'parametros'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <DollarSign className="inline-block w-4 h-4 mr-2" />
            Parámetros Fiscales
          </button>
          <button
            onClick={() => setActiveTab('conceptos')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'conceptos'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Settings2 className="inline-block w-4 h-4 mr-2" />
            Catálogo de Conceptos
          </button>
        </nav>
      </div>

      {activeTab === 'parametros' && (
        <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Valores requeridos por la ley mexicana
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    El Motor Matemático utiliza estos valores para calcular el ISR, el Salario Base
                    de Cotización (SBC) y las cuotas del IMSS. Actualiza estos valores cada vez que
                    el SAT publique la tabla anual.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ejercicio (Año)</label>
              <input
                type="number"
                value={ejercicio}
                onChange={(e) => setEjercicio(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">UMA Diaria</label>
              <input
                type="number"
                step="0.01"
                value={uma}
                onChange={(e) => setUma(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">UMI Diaria</label>
              <input
                type="number"
                step="0.01"
                value={umi}
                onChange={(e) => setUmi(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Salario Mínimo General
              </label>
              <input
                type="number"
                step="0.01"
                value={smg}
                onChange={(e) => setSmg(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Salario Mínimo Frontera
              </label>
              <input
                type="number"
                step="0.01"
                value={smf}
                onChange={(e) => setSmf(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileJson className="w-4 h-4 inline-block mr-1" />
              Tabla ISR Mensual (Formato JSON)
            </label>
            <textarea
              rows={15}
              value={tablaISR}
              onChange={(e) => setTablaISR(e.target.value)}
              className="block w-full font-mono text-sm rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
            ></textarea>
            <p className="mt-2 text-xs text-gray-500">
              Pega aquí el arreglo JSON con las columnas: limite_inferior, limite_superior,
              cuota_fija y porcentaje.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveParametros}
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Parámetros'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'conceptos' && (
        <div className="bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold leading-7 text-gray-900">
                Catálogo de Conceptos SAT
              </h3>
              <p className="text-sm text-gray-500">
                Administra las percepciones y deducciones aplicables a los empleados.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSeedConceptos}
                className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              >
                <Settings2 className="h-4 w-4" />
                Cargar Base SAT
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 rounded-md bg-[#A7313A] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#A7313A]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7313A]"
              >
                <Plus className="h-4 w-4" />
                Nuevo Concepto
              </button>
            </div>
          </div>

          {loadingConceptos ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Clave
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nombre
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tipo
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      SAT
                    </th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {conceptos.map((concepto) => (
                    <tr key={concepto.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {concepto.clave}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {concepto.nombre_concepto}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            concepto.tipo === 'Percepcion'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                              : concepto.tipo === 'Deduccion'
                                ? 'bg-red-50 text-red-700 ring-red-600/20'
                                : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                          }`}
                        >
                          {concepto.tipo}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {concepto.clave_sat}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(concepto)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Pencil className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteConcepto(concepto.id, concepto.clave)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Agregar/Editar Concepto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Editar Concepto' : 'Nuevo Concepto'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Clave Interna</label>
                <input
                  type="text"
                  value={formData.clave}
                  onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                  placeholder="ej. P038"
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre del Concepto
                </label>
                <input
                  type="text"
                  value={formData.nombre_concepto}
                  onChange={(e) => setFormData({ ...formData, nombre_concepto: e.target.value })}
                  placeholder="ej. Aguinaldo"
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="Percepcion">Percepción</option>
                  <option value="Deduccion">Deducción</option>
                  <option value="OtroPago">Otro Pago</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Clave SAT</label>
                <input
                  type="text"
                  value={formData.clave_sat}
                  onChange={(e) => setFormData({ ...formData, clave_sat: e.target.value })}
                  placeholder="ej. 002"
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConcepto}
                disabled={!formData.clave || !formData.nombre_concepto}
                className="rounded-md border border-transparent bg-[#A7313A] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#A7313A]/90 focus:outline-none focus:ring-2 focus:ring-[#A7313A] focus:ring-offset-2 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
