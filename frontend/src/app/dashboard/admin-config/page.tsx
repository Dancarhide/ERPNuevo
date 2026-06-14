'use client';

import React, { useState, useEffect } from 'react';
import {
  FaShieldAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUsers,
  FaLock,
  FaKey,
  FaCheckCircle,
} from 'react-icons/fa';
import { rolesApi, empleadosApi, areasApi } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

interface Permiso {
  id: number;
  accion: string;
  slug: string;
  nombre: string;
}

interface Recurso {
  id: number;
  clave: string;
  nombre: string;
  permisos: Permiso[];
}

interface Rol {
  id: number;
  nombre_rol: string;
  descripcion: string;
  es_sistema: boolean;
  nivel_jerarquia: number;
  area_id: number | null;
  area_nombre: string | null;
  empleados_count: number;
  permisos: number[];
}

export default function RolesConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<Rol[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [areas, setAreas] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRol, setCurrentRol] = useState<Rol | null>(null);
  const [formData, setFormData] = useState({
    nombre_rol: '',
    descripcion: '',
    nivel_jerarquia: 10,
    area_id: '' as number | '',
    permisos: [] as number[],
  });

  // Modal State for Assign Role
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignData, setAssignData] = useState({
    empleado_id: '',
    rol_id: '',
  });

  // Modal State for User Special Permissions
  const [isUserPermsOpen, setIsUserPermsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPermsLoading, setUserPermsLoading] = useState(false);
  const [userPerms, setUserPerms] = useState({
    heredados: [] as number[],
    concedidos: [] as number[],
    revocados: [] as number[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, areasRes, empRes, recRes] = await Promise.all([
        rolesApi.getAll(),
        areasApi.getAll(),
        empleadosApi.getAll(1, 100),
        rolesApi.getPermisos(),
      ]);
      setRoles(rolesRes);
      setAreas(areasRes);
      setEmpleados(empRes.items || []);
      setRecursos(recRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'nivel_jerarquia' || name === 'area_id' ? (value ? Number(value) : '') : value,
    }));
  };

  const togglePermiso = (permisoId: number) => {
    setFormData((prev) => {
      const isSelected = prev.permisos.includes(permisoId);
      return {
        ...prev,
        permisos: isSelected
          ? prev.permisos.filter((p) => p !== permisoId)
          : [...prev.permisos, permisoId],
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        area_id: formData.area_id === '' ? null : formData.area_id,
      };

      if (currentRol) {
        await rolesApi.update(currentRol.id, payload);
      } else {
        await rolesApi.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const e = error as Error;
      alert(e.message || 'Error al guardar el rol');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return;
    try {
      await rolesApi.delete(id);
      fetchData();
    } catch (error: unknown) {
      const e = error as Error;
      alert(e.message || 'Error al eliminar');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignData.empleado_id || !assignData.rol_id) return;

    try {
      await rolesApi.asignar(Number(assignData.empleado_id), Number(assignData.rol_id));
      setIsAssignOpen(false);
      setAssignData({ empleado_id: '', rol_id: '' });
      fetchData();
      alert('Rol asignado exitosamente');
    } catch (error: unknown) {
      const e = error as Error;
      alert(e.message || 'Error al asignar');
    }
  };

  const openNewRolModal = () => {
    setCurrentRol(null);
    setFormData({
      nombre_rol: '',
      descripcion: '',
      nivel_jerarquia: 10,
      area_id: '',
      permisos: [],
    });
    setIsModalOpen(true);
  };

  const openEditRolModal = (rol: Rol) => {
    setCurrentRol(rol);
    setFormData({
      nombre_rol: rol.nombre_rol,
      descripcion: rol.descripcion || '',
      nivel_jerarquia: rol.nivel_jerarquia,
      area_id: rol.area_id || '',
      permisos: rol.permisos || [],
    });
    setIsModalOpen(true);
  };

  const openUserPerms = async (empId: number) => {
    const emp = empleados.find((e) => e.id === empId);
    if (!emp) return;
    setSelectedUser(emp);
    setIsUserPermsOpen(true);
    setUserPermsLoading(true);
    try {
      const res = await rolesApi.getEmpleadoPermisos(empId);
      setUserPerms({
        heredados: res.heredados || [],
        concedidos: res.concedidos || [],
        revocados: res.revocados || [],
      });
    } catch (error) {
      console.error(error);
      alert('Error al cargar permisos del usuario');
    } finally {
      setUserPermsLoading(false);
    }
  };

  const toggleUserPermiso = (permisoId: number) => {
    setUserPerms((prev) => {
      const isInherited = prev.heredados.includes(permisoId);
      const isConcedido = prev.concedidos.includes(permisoId);
      const isRevocado = prev.revocados.includes(permisoId);

      // Lógica de toggle tridimensional:
      // Si está heredado: default -> revocado -> default
      // Si no está heredado: default -> concedido -> default

      const next = { ...prev };

      if (isInherited) {
        if (isRevocado) {
          next.revocados = next.revocados.filter((p) => p !== permisoId); // volver a default
        } else {
          next.revocados = [...next.revocados, permisoId]; // revocar
        }
      } else {
        if (isConcedido) {
          next.concedidos = next.concedidos.filter((p) => p !== permisoId); // volver a default
        } else {
          next.concedidos = [...next.concedidos, permisoId]; // conceder
        }
      }
      return next;
    });
  };

  const saveUserPerms = async () => {
    if (!selectedUser) return;

    // Preparar el payload: un diccionario de permiso_id -> booleano (true=concedido, false=revocado)
    const permisosDict: Record<number, boolean> = {};
    userPerms.concedidos.forEach((p) => (permisosDict[p] = true));
    userPerms.revocados.forEach((p) => (permisosDict[p] = false));

    try {
      await rolesApi.updateEmpleadoPermisos(selectedUser.id, permisosDict);
      setIsUserPermsOpen(false);
      alert('Permisos especiales guardados exitosamente');
    } catch (error) {
      console.error(error);
      alert('Error guardando permisos de usuario');
    }
  };

  if (authLoading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  if (!user?.permisos?.includes('ver_configuracion')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <FaShieldAlt className="text-6xl text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
        <p className="text-gray-500">No tienes permisos para ver la configuración del sistema.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaShieldAlt className="text-[#A7313A]" /> Roles y Permisos
          </h1>
          <p className="text-gray-500">Gestión de acceso y seguridad del sistema</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsAssignOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium w-full sm:w-auto"
          >
            <FaUsers /> Asignar Rol a Empleado
          </button>
          <button
            onClick={openNewRolModal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#A7313A] text-white rounded-xl hover:bg-[#85252e] transition-colors shadow-md font-medium w-full sm:w-auto"
          >
            <FaPlus /> Crear Rol
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium border-b border-gray-100 w-12"></th>
                  <th className="p-4 font-medium border-b border-gray-100">Nombre del Rol</th>
                  <th className="p-4 font-medium border-b border-gray-100">Área</th>
                  <th className="p-4 font-medium border-b border-gray-100">Permisos</th>
                  <th className="p-4 font-medium border-b border-gray-100">Usuarios</th>
                  <th className="p-4 font-medium border-b border-gray-100 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((rol) => (
                  <tr
                    key={rol.id}
                    className="hover:bg-gray-50 border-b border-gray-50 last:border-0 group"
                  >
                    <td className="p-4 text-center">
                      {rol.es_sistema ? (
                        <FaLock
                          className="text-red-400 mx-auto"
                          title="Rol de Sistema (Protegido)"
                        />
                      ) : (
                        <FaShieldAlt className="text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{rol.nombre_rol}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {rol.descripcion}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {rol.area_nombre || 'Global'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {rol.permisos?.length || 0} asignados
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold">
                          {rol.empleados_count}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditRolModal(rol)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        {!rol.es_sistema && (
                          <button
                            onClick={() => handleDelete(rol.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Rol */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="text-xl font-bold text-gray-800">
                {currentRol ? 'Editar Rol' : 'Nuevo Rol'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grow">
              <form id="role-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Rol
                    </label>
                    <input
                      type="text"
                      name="nombre_rol"
                      value={formData.nombre_rol}
                      onChange={handleFormChange}
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Área Específica
                    </label>
                    <select
                      name="area_id"
                      value={formData.area_id}
                      onChange={handleFormChange}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all"
                    >
                      <option value="">Global (Todas)</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre_area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleFormChange}
                    rows={2}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all resize-none"
                  ></textarea>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaKey className="text-gray-400" /> Permisos del Rol
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recursos.map((recurso) => (
                      <div
                        key={recurso.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <h5 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                          {recurso.nombre}
                        </h5>
                        <div className="space-y-2">
                          {recurso.permisos.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-3 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permisos.includes(perm.id)}
                                onChange={() => togglePermiso(perm.id)}
                                className="mt-1 w-4 h-4 text-[#A7313A] rounded border-gray-300 focus:ring-[#A7313A]"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                  {perm.nombre}
                                </div>
                                <div className="text-xs text-gray-400">{perm.slug}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="role-form"
                className="px-5 py-2.5 bg-[#A7313A] text-white rounded-xl hover:bg-[#85252e] font-medium"
              >
                Guardar Rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Rol */}
      {isAssignOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Asignar Rol a Empleado</h3>
              <button
                onClick={() => setIsAssignOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                <select
                  value={assignData.empleado_id}
                  onChange={(e) => {
                    setAssignData({ ...assignData, empleado_id: e.target.value });
                  }}
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all"
                >
                  <option value="">Seleccione un empleado...</option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol a Asignar
                </label>
                <select
                  value={assignData.rol_id}
                  onChange={(e) => setAssignData({ ...assignData, rol_id: e.target.value })}
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#A7313A] focus:ring-1 focus:ring-[#A7313A] transition-all"
                >
                  <option value="">Seleccione un rol...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre_rol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (assignData.empleado_id) {
                      setIsAssignOpen(false);
                      openUserPerms(Number(assignData.empleado_id));
                    } else {
                      alert('Selecciona un empleado primero para ver sus permisos especiales');
                    }
                  }}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Ver Permisos Especiales
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAssignOpen(false)}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                  >
                    Asignar Rol
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Permisos Especiales por Usuario */}
      {isUserPermsOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Permisos Especiales</h3>
                <p className="text-sm text-gray-500">
                  Excepciones de seguridad para {selectedUser.nombre_completo}
                </p>
              </div>
              <button
                onClick={() => setIsUserPermsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grow">
              {userPermsLoading ? (
                <div className="text-center py-10 text-gray-500">Cargando permisos...</div>
              ) : (
                <>
                  <div className="flex gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded bg-gray-200"></div> Sin acceso
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>{' '}
                      Heredado (Rol)
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded bg-green-100 border border-green-400"></div>{' '}
                      Concedido (Extra)
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded bg-red-100 border border-red-400"></div>{' '}
                      Revocado (Denegado)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recursos.map((recurso) => (
                      <div
                        key={recurso.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                      >
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-800">
                          {recurso.nombre}
                        </div>
                        <div className="p-3 space-y-1">
                          {recurso.permisos.map((perm) => {
                            const isInherited = userPerms.heredados.includes(perm.id);
                            const isConcedido = userPerms.concedidos.includes(perm.id);
                            const isRevocado = userPerms.revocados.includes(perm.id);

                            let bgClass = 'bg-white hover:bg-gray-50 text-gray-500';
                            let icon = <FaTimes className="text-gray-300" />;
                            let label = 'Sin acceso';

                            if (isInherited && !isRevocado) {
                              bgClass = 'bg-blue-50 border-blue-200 text-blue-700';
                              icon = <FaCheckCircle className="text-blue-500" />;
                              label = 'Heredado';
                            } else if (isInherited && isRevocado) {
                              bgClass = 'bg-red-50 border-red-200 text-red-700';
                              icon = <FaTimes className="text-red-500" />;
                              label = 'Revocado explícitamente';
                            } else if (!isInherited && isConcedido) {
                              bgClass = 'bg-green-50 border-green-200 text-green-700';
                              icon = <FaPlus className="text-green-500" />;
                              label = 'Concedido extra';
                            }

                            return (
                              <button
                                key={perm.id}
                                onClick={() => toggleUserPermiso(perm.id)}
                                className={`w-full text-left flex items-center justify-between p-2 rounded-lg border border-transparent transition-colors ${bgClass}`}
                                title={label}
                              >
                                <div>
                                  <div className="font-medium text-sm">{perm.nombre}</div>
                                  <div className="text-xs opacity-70">{perm.slug}</div>
                                </div>
                                <div>{icon}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsUserPermsOpen(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveUserPerms}
                disabled={userPermsLoading}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
              >
                Guardar Excepciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
