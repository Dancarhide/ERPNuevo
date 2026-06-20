'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaBuilding, FaSave, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';
import { TipTapEditor } from '@/components/TipTapEditor';
import { empresaApi } from '@/lib/api';

interface InfoEmpresa {
  nombre: string;
  rfc: string;
  regimen_fiscal: string;
  cp_fiscal: string;
  registro_patronal: string;
  mision: string;
  vision: string;
  historia: string;
  valores: string[];
  logo_url: string;
  banner_url: string;
}

export default function AdminEmpresaPage() {
  const [info, setInfo] = useState<InfoEmpresa>({
    nombre: '',
    rfc: '',
    regimen_fiscal: '',
    cp_fiscal: '',
    registro_patronal: '',
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
          nombre: data.nombre || '',
          rfc: data.rfc || '',
          regimen_fiscal: data.regimen_fiscal || '',
          cp_fiscal: data.cp_fiscal || '',
          registro_patronal: data.registro_patronal || '',
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

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'banner_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await empresaApi.uploadImage(file);
      setInfo((prev) => ({
        ...prev,
        [field]: (res as { url: string }).url,
      }));
      showToast('Imagen subida. No olvides guardar cambios.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al subir imagen', 'error');
    }
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
          className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 ${
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
          {/* Fiscal y Nómina */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Datos Fiscales y Patronales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={info.nombre}
                  onChange={(e) => setInfo({ ...info, nombre: e.target.value })}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej. Empresa S.A. de C.V."
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">RFC</label>
                <input
                  type="text"
                  value={info.rfc}
                  onChange={(e) => setInfo({ ...info, rfc: e.target.value.toUpperCase() })}
                  maxLength={13}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                  placeholder="Ej. EMP120304XYZ"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Régimen Fiscal (Clave SAT)
                </label>
                <input
                  type="text"
                  value={info.regimen_fiscal}
                  onChange={(e) => setInfo({ ...info, regimen_fiscal: e.target.value })}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej. 601 (General de Ley Personas Morales)"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Código Postal Fiscal
                </label>
                <input
                  type="text"
                  value={info.cp_fiscal}
                  onChange={(e) => setInfo({ ...info, cp_fiscal: e.target.value })}
                  maxLength={5}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej. 06000"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Registro Patronal (IMSS)
                </label>
                <input
                  type="text"
                  value={info.registro_patronal}
                  onChange={(e) => setInfo({ ...info, registro_patronal: e.target.value })}
                  maxLength={11}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej. Y1234567890"
                />
              </div>
            </div>
          </div>

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
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              Recursos Visuales (URLs o Subida)
            </h3>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Logo (URL o Archivo)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={info.logo_url}
                    onChange={(e) => setInfo({ ...info, logo_url: e.target.value })}
                    className="flex-1 p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                    onChange={(e) => handleUpload(e, 'logo_url')}
                    className="hidden"
                    id="upload-logo"
                  />
                  <label
                    htmlFor="upload-logo"
                    className="cursor-pointer px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition-colors flex items-center"
                  >
                    Subir
                  </label>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-600">
                  Banner (URL o Archivo)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={info.banner_url}
                    onChange={(e) => setInfo({ ...info, banner_url: e.target.value })}
                    className="flex-1 p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="https://ejemplo.com/banner.jpg"
                  />
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                    onChange={(e) => handleUpload(e, 'banner_url')}
                    className="hidden"
                    id="upload-banner"
                  />
                  <label
                    htmlFor="upload-banner"
                    className="cursor-pointer px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition-colors flex items-center"
                  >
                    Subir
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
