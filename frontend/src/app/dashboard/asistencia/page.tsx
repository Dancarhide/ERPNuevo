'use client';

import React, { useState, useEffect } from 'react';
import {
  FaClipboardList,
  FaCheckCircle,
  FaExclamationCircle,
  FaNetworkWired,
  FaPlus,
  FaPlug,
  FaTrash,
} from 'react-icons/fa';
import { asistenciasApi, dispositivosApi } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

interface Asistencia {
  id: number;
  empleado_id: number;
  empleado_nombre: string;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  tipo: string;
  justificacion: string | null;
}

interface Dispositivo {
  id: number;
  nombre: string;
  marca: string;
  metodo_conexion: string;
  ip_address: string | null;
  puerto: number | null;
  token_auth: string | null;
  ultima_sincronizacion: string | null;
  activo: boolean;
}

export default function GestionAsistenciaPage() {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'asistencias' | 'dispositivos'>('asistencias');

  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    nombre: '',
    marca: 'ZKTECO',
    metodo_conexion: 'PULL_IP',
    ip_address: '',
    puerto: 4370,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'asistencias') {
        const data = await asistenciasApi.getAll();
        setAsistencias(data);
      } else {
        const data = await dispositivosApi.getAll();
        setDispositivos(data);
      }
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.permisos.includes('ver_asistencia')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewMode]);

  if (authLoading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  if (!user?.permisos?.includes('ver_asistencia')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <FaClipboardList className="text-6xl text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
        <p className="text-gray-500">No tienes permisos para gestionar asistencias.</p>
      </div>
    );
  }

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispositivosApi.create(newDevice);
      setShowModal(false);
      fetchData();
    } catch {
      alert('Error al crear dispositivo');
    }
  };

  const handleDeleteDevice = async (id: number) => {
    if (confirm('¿Seguro que deseas eliminar este dispositivo?')) {
      try {
        await dispositivosApi.delete(id);
        fetchData();
      } catch {
        alert('Error al eliminar');
      }
    }
  };

  const handlePing = async (id: number) => {
    try {
      const res = await dispositivosApi.ping(id);
      alert(res.message || 'Conexión exitosa');
    } catch (error: unknown) {
      const err = error as Error;
      alert('Error de conexión: ' + (err.message || 'Fallo el SDK local'));
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaClipboardList className="text-[#A7313A]" /> Gestión de Asistencias
          </h1>
          <p className="text-gray-500">
            Control global de asistencia y sincronización de checadores físicos
          </p>
        </div>
        <div className="flex gap-3 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => setViewMode('asistencias')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${viewMode === 'asistencias' ? 'bg-[#A7313A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Registros
          </button>
          <button
            onClick={() => setViewMode('dispositivos')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'dispositivos' ? 'bg-[#A7313A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FaNetworkWired /> Dispositivos
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {viewMode === 'asistencias' ? (
          /* VISTA ASISTENCIAS */
          loading ? (
            <div className="p-12 text-center text-gray-500">Cargando historial global...</div>
          ) : asistencias.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No hay registros de asistencia.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="p-4 font-medium border-b border-gray-100">Empleado</th>
                    <th className="p-4 font-medium border-b border-gray-100">Fecha</th>
                    <th className="p-4 font-medium border-b border-gray-100">Entrada</th>
                    <th className="p-4 font-medium border-b border-gray-100">Salida</th>
                    <th className="p-4 font-medium border-b border-gray-100">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <td className="p-4 font-bold text-gray-800">{a.empleado_nombre}</td>
                      <td className="p-4 font-medium text-gray-600">
                        {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-4">
                        {a.hora_entrada || (
                          <span className="text-gray-400 text-sm italic">Sin registro</span>
                        )}
                      </td>
                      <td className="p-4">
                        {a.hora_salida || (
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
            </div>
          )
        ) : (
          /* VISTA DISPOSITIVOS */
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Checadores Biométricos</h2>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#A7313A] text-white rounded-lg hover:bg-[#85252e] font-medium"
              >
                <FaPlus /> Agregar Dispositivo
              </button>
            </div>
            {loading ? (
              <div className="p-12 text-center text-gray-500">Cargando dispositivos...</div>
            ) : dispositivos.length === 0 ? (
              <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                No tienes checadores físicos configurados. Añade uno para comenzar a recibir
                asistencias.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dispositivos.map((d) => (
                  <div
                    key={d.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-800 text-lg">{d.nombre}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full ${d.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {d.activo ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      <strong>Marca:</strong> {d.marca}
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                      <strong>Modo:</strong> {d.metodo_conexion}
                    </p>

                    {d.metodo_conexion === 'PULL_IP' && (
                      <p className="text-sm text-gray-500 mb-4">
                        <strong>IP Local:</strong> {d.ip_address}:{d.puerto}
                      </p>
                    )}
                    {d.metodo_conexion === 'PUSH_WEBHOOK' && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-bold">Webhook Token:</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                          {d.token_auth}
                        </code>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mb-4">
                      Última sync:{' '}
                      {d.ultima_sincronizacion
                        ? new Date(d.ultima_sincronizacion).toLocaleString()
                        : 'Nunca'}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      {d.metodo_conexion === 'PULL_IP' && (
                        <button
                          onClick={() => handlePing(d.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                        >
                          <FaPlug /> Ping
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDevice(d.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 ml-auto"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add Device */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Nuevo Checador</h2>
            <form onSubmit={handleCreateDevice}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Ubicación
                  </label>
                  <input
                    type="text"
                    required
                    value={newDevice.nombre}
                    onChange={(e) => setNewDevice({ ...newDevice, nombre: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Ej. Entrada Principal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca del Equipo
                  </label>
                  <select
                    value={newDevice.marca}
                    onChange={(e) => setNewDevice({ ...newDevice, marca: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ZKTECO">ZKTeco (o compatible)</option>
                    <option value="HIKVISION">Hikvision</option>
                    <option value="SUPREMA">Suprema</option>
                    <option value="OTRA">Otra (Genérico)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modo de Conexión
                  </label>
                  <select
                    value={newDevice.metodo_conexion}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, metodo_conexion: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {newDevice.marca === 'ZKTECO' && (
                      <option value="PULL_IP">Modo Pasivo (IP Local TCP/IP)</option>
                    )}
                    <option value="PUSH_WEBHOOK">Modo Activo (ADMS / Webhook)</option>
                  </select>
                </div>

                {newDevice.metodo_conexion === 'PULL_IP' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección IP Local
                      </label>
                      <input
                        type="text"
                        required
                        value={newDevice.ip_address}
                        onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="192.168.1.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                      <input
                        type="number"
                        required
                        value={newDevice.puerto}
                        onChange={(e) =>
                          setNewDevice({ ...newDevice, puerto: Number(e.target.value) })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
                {newDevice.metodo_conexion === 'PUSH_WEBHOOK' && (
                  <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    Se generará un Token criptográfico automáticamente al guardar para que
                    configures el ADMS del equipo.
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#A7313A] text-white rounded-lg hover:bg-[#85252e] font-medium"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
