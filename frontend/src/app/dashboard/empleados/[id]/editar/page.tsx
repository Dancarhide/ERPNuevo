'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { empleadosApi, areasApi, puestosApi } from '@/lib/api';
import { Save, ArrowLeft, Loader2, KeyRound, Copy, CheckCircle2, X } from 'lucide-react';

type CatalogItem = {
  id: number;
  nombre_area?: string;
  nombre_puesto?: string;
  area_id?: number | null;
};

export default function EditarEmpleadoPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [areas, setAreas] = useState<CatalogItem[]>([]);
  const [puestos, setPuestos] = useState<CatalogItem[]>([]);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    rfc: '',
    telefono: '',
    curp: '',
    cp: '',
    sexo: '',
    area_id: '',
    puesto_id: '',
    sueldo: '',
    sueldo_fiscal: '',
    familiar_nombre: '',
    familiar_parentesco: '',
    familiar_telefono: '',
    salud_nss: '',
    salud_tipo_sangre: '',
    salud_discapacidad: false,
    turno_entrada: '09:00',
    turno_salida: '18:00',
    infonavit_tipo_descuento: '',
    infonavit_valor_descuento: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAreas, resPuestos, resEmp] = await Promise.all([
          areasApi.getAll(),
          puestosApi.getAll(),
          empleadosApi.getById(parseInt(unwrappedParams.id)),
        ]);
        setAreas(resAreas || []);
        setPuestos(resPuestos || []);

        if (resEmp) {
          const fam = (
            resEmp.familiares && resEmp.familiares.length > 0 ? resEmp.familiares[0] : null
          ) as { nombre_completo?: string; parentesco?: string; telefono?: string } | null;
          const salud = (resEmp.datos_salud || null) as {
            nss?: string;
            tipo_sangre?: string;
            discapacidad?: boolean;
          } | null;

          setFormData({
            nombre_completo: resEmp.nombre_completo || '',
            email: resEmp.email || '',
            rfc: resEmp.rfc || '',
            telefono: resEmp.telefono || '',
            curp: resEmp.curp || '',
            cp: resEmp.cp || '',
            sexo: resEmp.sexo || '',
            area_id: resEmp.area_id ? String(resEmp.area_id) : '',
            puesto_id: resEmp.puesto_id ? String(resEmp.puesto_id) : '',
            sueldo: resEmp.sueldo ? String(resEmp.sueldo) : '',
            sueldo_fiscal: resEmp.sueldo_fiscal ? String(resEmp.sueldo_fiscal) : '',
            familiar_nombre: fam?.nombre_completo || '',
            familiar_parentesco: fam?.parentesco || '',
            familiar_telefono: fam?.telefono || '',
            salud_nss: salud?.nss || '',
            salud_tipo_sangre: salud?.tipo_sangre || '',
            salud_discapacidad: salud?.discapacidad || false,
            turno_entrada: resEmp.turno_entrada || '09:00',
            turno_salida: resEmp.turno_salida || '18:00',
            infonavit_tipo_descuento: resEmp.infonavit_tipo_descuento || '',
            infonavit_valor_descuento: resEmp.infonavit_valor_descuento
              ? String(resEmp.infonavit_valor_descuento)
              : '',
          });
        }
      } catch (err) {
        console.error('Error al cargar datos', err);
        alert('No se pudo cargar la información del empleado');
        router.push('/dashboard/empleados');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [unwrappedParams.id, router]);

  const handleResetPassword = async () => {
    if (
      !confirm(
        '¿Estás seguro de querer generar una nueva contraseña para este empleado? La anterior dejará de funcionar.'
      )
    )
      return;

    setResettingPassword(true);
    try {
      const res = await empleadosApi.resetPassword(parseInt(unwrappedParams.id));
      if (res?.password_temporal) {
        setNewPassword(res.password_temporal);
      }
    } catch (err: unknown) {
      alert(
        'Error al restablecer la contraseña: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const copyToClipboard = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        rfc: formData.rfc,
        telefono: formData.telefono,
        curp: formData.curp,
        cp: formData.cp,
        sexo: formData.sexo || null,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
        puesto_id: formData.puesto_id ? parseInt(formData.puesto_id) : null,
        sueldo: formData.sueldo || '0.00',
        sueldo_fiscal: formData.sueldo_fiscal || '0.00',
        familiares: formData.familiar_nombre
          ? [
              {
                nombre_completo: formData.familiar_nombre,
                parentesco: formData.familiar_parentesco,
                telefono: formData.familiar_telefono,
              },
            ]
          : [],
        datos_salud: {
          nss: formData.salud_nss,
          tipo_sangre: formData.salud_tipo_sangre,
          discapacidad: formData.salud_discapacidad,
        },
        turno_entrada: formData.turno_entrada,
        turno_salida: formData.turno_salida,
        infonavit_tipo_descuento: formData.infonavit_tipo_descuento || null,
        infonavit_valor_descuento: formData.infonavit_valor_descuento
          ? parseFloat(formData.infonavit_valor_descuento)
          : null,
      };

      await empleadosApi.update(parseInt(unwrappedParams.id), payload);
      router.push('/dashboard/empleados');
    } catch (err: unknown) {
      console.error('Error al actualizar empleado:', err);
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al actualizar';
      toast.error(msg);
      setLoading(false);
    }
  };

  const puestosFiltrados = formData.area_id
    ? puestos.filter((p) => String(p.area_id) === String(formData.area_id))
    : puestos;

  if (fetching) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#A7313A]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white border border-[#E1DFE0] rounded-xl text-[#858789] hover:text-[#44474A] hover:bg-transparent transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#44474A] tracking-[-0.02em] mb-1">
            Editar Empleado
          </h1>
          <p className="text-[#858789] text-[1rem]">Actualiza la información del colaborador.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8"
      >
        <h2 className="text-[1.25rem] font-bold text-[#44474A] mb-6 pb-4 border-b border-[#F3F4F6]">
          Información Personal
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Nombre Completo *
            </label>
            <input
              required
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Correo Electrónico *
            </label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">RFC</label>
            <input
              type="text"
              name="rfc"
              maxLength={13}
              value={formData.rfc}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all uppercase"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">CURP</label>
            <input
              type="text"
              name="curp"
              maxLength={18}
              value={formData.curp}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all uppercase"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Teléfono
            </label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Código Postal (CP)
            </label>
            <input
              type="text"
              name="cp"
              maxLength={5}
              value={formData.cp}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">Sexo</label>
            <select
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
            >
              <option value="">Selecciona...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <h2 className="text-[1.25rem] font-bold text-[#44474A] mb-6 pb-4 border-b border-[#F3F4F6]">
          Información Laboral
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">Área *</label>
            <select
              required
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
            >
              <option value="">Selecciona un área...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_area}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Puesto *
            </label>
            <select
              required
              name="puesto_id"
              value={formData.puesto_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
            >
              <option value="">Selecciona un puesto...</option>
              {puestosFiltrados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_puesto}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Sueldo Base Total
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858789]">$</span>
              <input
                type="text"
                name="sueldo"
                pattern="^\d+(\.\d{1,2})?$"
                title="Debe ser un número válido, opcionalmente con 2 decimales"
                value={formData.sueldo}
                onChange={handleChange}
                placeholder="Ej. 15000.00"
                className="w-full pl-8 pr-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Turno Entrada *
            </label>
            <input
              type="time"
              required
              name="turno_entrada"
              value={formData.turno_entrada}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Turno Salida *
            </label>
            <input
              type="time"
              required
              name="turno_salida"
              value={formData.turno_salida}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Tipo Descuento Infonavit
            </label>
            <select
              name="infonavit_tipo_descuento"
              value={formData.infonavit_tipo_descuento}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
            >
              <option value="">No aplica</option>
              <option value="Porcentaje">Porcentaje</option>
              <option value="Cuota Fija">Cuota Fija</option>
              <option value="VSM">VSM / UMI</option>
            </select>
          </div>
          {formData.infonavit_tipo_descuento && (
            <div>
              <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
                Valor Descuento Infonavit
              </label>
              <input
                type="number"
                step="0.0001"
                name="infonavit_valor_descuento"
                value={formData.infonavit_valor_descuento}
                onChange={handleChange}
                placeholder="Ej. 15.5 o 1500.00"
                className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
              />
            </div>
          )}
        </div>

        {/* Sección de Salud y Familiar */}
        <h2 className="text-[1.25rem] font-bold text-[#44474A] mb-6 mt-8 pb-4 border-b border-[#F3F4F6]">
          Información Adicional (Salud y Familiar)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Contacto de Emergencia (Nombre)
            </label>
            <input
              type="text"
              name="familiar_nombre"
              value={formData.familiar_nombre}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Contacto de Emergencia (Parentesco)
            </label>
            <input
              type="text"
              name="familiar_parentesco"
              value={formData.familiar_parentesco}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Contacto de Emergencia (Teléfono)
            </label>
            <input
              type="text"
              name="familiar_telefono"
              value={formData.familiar_telefono}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Número de Seguro Social (NSS)
            </label>
            <input
              type="text"
              name="salud_nss"
              value={formData.salud_nss}
              onChange={handleChange}
              maxLength={11}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Tipo de Sangre
            </label>
            <select
              name="salud_tipo_sangre"
              value={formData.salud_tipo_sangre}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all bg-white"
            >
              <option value="">Seleccionar...</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="salud_discapacidad"
              name="salud_discapacidad"
              checked={formData.salud_discapacidad}
              onChange={handleChange}
              className="w-5 h-5 text-[#A7313A] rounded border-[#E1DFE0] focus:ring-[#A7313A]"
            />
            <label
              htmlFor="salud_discapacidad"
              className="text-[0.9rem] font-semibold text-[#44474A] cursor-pointer"
            >
              ¿Tiene alguna discapacidad?
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#F3F4F6]">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resettingPassword}
            className="text-[#A7313A] border border-[#A7313A]/20 bg-[#A7313A]/5 hover:bg-[#A7313A]/10 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {resettingPassword ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <KeyRound size={18} />
            )}
            Generar Nueva Contraseña
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 text-[#44474A] font-semibold hover:bg-transparent rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#A7313A] hover:bg-[#8F2930] text-white px-8 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {loading ? 'Guardando...' : 'Actualizar Empleado'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal para mostrar nueva contraseña */}
      {newPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3 text-[#A7313A]">
                <KeyRound size={24} />
                <h3 className="text-xl font-bold text-[#44474A]">Contraseña Generada</h3>
              </div>
              <button
                onClick={() => setNewPassword(null)}
                className="text-[#858789] hover:text-[#44474A] p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[#858789] mb-6 text-sm">
                Se ha generado una nueva contraseña temporal. Cópiala y entrégala al empleado.
                <strong className="text-[#44474A] block mt-2">
                  Esta contraseña no podrá ser vista de nuevo.
                </strong>
              </p>

              <div className="bg-transparent rounded-xl p-5 border border-[#E1DFE0] mb-6">
                <div className="flex items-center justify-between bg-white border border-[#E1DFE0] rounded-lg px-4 py-3">
                  <span className="font-mono text-xl tracking-wider text-[#A7313A] font-bold">
                    {newPassword}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="text-[#858789] hover:text-[#44474A] transition-colors p-2 rounded-md hover:bg-gray-100"
                    title="Copiar contraseña"
                  >
                    {copied ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <Copy size={20} />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-3 font-medium text-center">
                    ¡Copiado al portapapeles!
                  </p>
                )}
              </div>

              <button
                onClick={() => setNewPassword(null)}
                className="w-full bg-[#A7313A] hover:bg-[#8F2930] text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
