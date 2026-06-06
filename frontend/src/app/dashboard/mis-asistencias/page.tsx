'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { asistenciasApi } from '@/lib/api';
import { FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

interface Asistencia {
  id: number;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  tipo: string;
}

export default function MisAsistenciasPage() {
  useAuth();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [checando, setChecando] = useState(false);

  const fetchMisAsistencias = async () => {
    setLoading(true);
    try {
      const data = await asistenciasApi.getMisAsistencias();
      setAsistencias(data);
    } catch (error) {
      console.error('Error fetching asistencias', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMisAsistencias();
  }, []);

  const handleChecar = async () => {
    setChecando(true);
    try {
      await asistenciasApi.checar();
      alert('¡Checada registrada con éxito!');
      fetchMisAsistencias();
    } catch (error: unknown) {
      const err = error as Error;
      alert(err.message || 'Error al checar');
    } finally {
      setChecando(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaClock className="text-[#A7313A]" /> Mis Asistencias
          </h1>
          <p className="text-gray-500">Historial de tus entradas y salidas</p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleChecar}
            disabled={checando}
            className="flex items-center gap-2 px-8 py-4 bg-[#A7313A] text-white text-lg rounded-xl hover:bg-[#85252e] transition-colors shadow-md font-bold disabled:opacity-70"
          >
            {checando ? 'Registrando...' : 'Checar Ahora (Dev Only)'}
          </button>
        )}
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando historial...</div>
        ) : asistencias.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FaClock className="text-4xl text-gray-300 mx-auto mb-4" />
            No tienes registros de asistencia todavía.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-medium border-b border-gray-100">Fecha</th>
                <th className="p-4 font-medium border-b border-gray-100">Hora Entrada</th>
                <th className="p-4 font-medium border-b border-gray-100">Hora Salida</th>
                <th className="p-4 font-medium border-b border-gray-100">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <td className="p-4 font-medium text-gray-800">
                    {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-4">
                    {a.hora_entrada ? (
                      <span className="text-gray-800 font-medium">{a.hora_entrada}</span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Sin registro</span>
                    )}
                  </td>
                  <td className="p-4">
                    {a.hora_salida ? (
                      <span className="text-gray-800 font-medium">{a.hora_salida}</span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Sin registro</span>
                    )}
                  </td>
                  <td className="p-4">
                    {a.tipo === 'Normal' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                        <FaCheckCircle /> Normal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold">
                        <FaExclamationCircle /> {a.tipo}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
