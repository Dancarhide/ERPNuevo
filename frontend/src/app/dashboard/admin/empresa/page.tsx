'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaBuilding, FaSave, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';
import { TipTapEditor } from '@/components/TipTapEditor';
import { empresaApi } from '@/lib/api';

interface InfoEmpresa {
  mision: string;
  vision: string;
  historia: string;
  valores: string[];
  logo_url: string;
  banner_url: string;
}

export default function AdminEmpresaPage() {
  const [info, setInfo] = useState<InfoEmpresa>({
    mision: '',
    vision: '',
    historia: '',
    valores: [],
    logo_url: '',
    banner_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [nuevoValor, setNuevoValor] = useState('');

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await empresaApi.getInfo();
      if (data) {
        setInfo({
          mision: data.mision || '',
          vision: data.vision || '',
          historia: data.historia || '',
          valores: data.valores || [],
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Error al cargar la información', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchInfo();
  }, [fetchInfo]);

  const saveInfo = async () => {
    setSaving(true);
    try {
      await empresaApi.updateInfo(info as unknown as Parameters<typeof empresaApi.updateInfo>[0]);
      showToast('Información guardada exitosamente', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al guardar la información', 'error');
    } finally {
      setSaving(false);
    }
  };
  const handleAddValor = () => {
    if (!nuevoValor.trim()) return;
    setInfo((prev) => ({ ...prev, valores: [...prev.valores, nuevoValor.trim()] }));
    setNuevoValor('');
  };

  const handleRemoveValor = (index: number) => {
    setInfo((prev) => ({
      ...prev,
      valores: prev.valores.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <FaSpinner className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4">Cargando información de la empresa...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <FaBuilding className="text-primary" /> Identidad de la Empresa
          </h1>
          <p className="mt-2 text-gray-500">
            Configura la Misión, Visión, Valores e Historia que verán tus colaboradores.
          </p>
        </div>
        <button
          onClick={saveInfo}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-white bg-primary hover:bg-primary-dark rounded-xl font-semibold shadow-md shadow-primary/30 transition-all disabled:opacity-50"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Misión y Visión */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Misión y Visión</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Nuestra Misión
                </label>
                <textarea
                  value={info.mision}
                  onChange={(e) => setInfo({ ...info, mision: e.target.value })}
                  className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={4}
                  placeholder="Escribe la misión de la empresa..."
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Nuestra Visión
                </label>
                <textarea
                  value={info.vision}
                  onChange={(e) => setInfo({ ...info, vision: e.target.value })}
                  className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={4}
                  placeholder="Escribe la visión de la empresa..."
                />
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Valores Corporativos</h3>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={nuevoValor}
                onChange={(e) => setNuevoValor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddValor()}
                className="flex-1 p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ej. Trabajo en equipo, Honestidad..."
              />
              <button
                onClick={handleAddValor}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <FaPlus /> Agregar
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {info.valores.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  No hay valores agregados.
                </p>
              ) : (
                info.valores.map((valor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group"
                  >
                    <span className="text-sm font-medium text-gray-700">{valor}</span>
                    <button
                      onClick={() => handleRemoveValor(index)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Historia con TipTap */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex-1 flex flex-col">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              Nuestra Historia / Sobre Nosotros
            </h3>
            <div className="flex-1 min-h-[300px]">
              <TipTapEditor
                value={info.historia}
                onChange={(val) => setInfo({ ...info, historia: val })}
              />
            </div>
          </div>

          {/* URLs */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Recursos Visuales (URLs)</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">Logo URL</label>
                <input
                  type="text"
                  value={info.logo_url}
                  onChange={(e) => setInfo({ ...info, logo_url: e.target.value })}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">Banner URL</label>
                <input
                  type="text"
                  value={info.banner_url}
                  onChange={(e) => setInfo({ ...info, banner_url: e.target.value })}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://ejemplo.com/banner.jpg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
