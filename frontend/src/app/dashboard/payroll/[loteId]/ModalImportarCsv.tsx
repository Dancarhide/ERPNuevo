'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { nominaApi } from '@/lib/api';

interface ModalImportarCsvProps {
  loteId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalImportarCsv({ loteId, onClose, onSuccess }: ModalImportarCsvProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo CSV.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await nominaApi.importarCsv(loteId, file);
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Ocurrió un error al importar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="font-bold text-[#44474A] text-lg">Importar Layout (CONTPAQi / NOI)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-gray-600">
            <p>
              Sube un archivo CSV con las percepciones y deducciones de los empleados. El formato
              debe contener exactamente estas tres columnas (con encabezado):
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 font-medium">
              <li>Empleado ID (El ID numérico del empleado)</li>
              <li>Clave Concepto (La clave SAT o clave interna del concepto)</li>
              <li>Monto (El valor numérico de la percepción o deducción)</li>
            </ul>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Upload className="text-gray-400 mb-3" size={32} />
            {file ? (
              <span className="text-sm font-medium text-blue-600">{file.name}</span>
            ) : (
              <span className="text-sm text-gray-500">
                Haz clic para seleccionar o arrastra un archivo .CSV aquí
              </span>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#A7313A] text-white rounded-lg hover:bg-[#8e2931] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Importar Datos
          </button>
        </div>
      </div>
    </div>
  );
}
