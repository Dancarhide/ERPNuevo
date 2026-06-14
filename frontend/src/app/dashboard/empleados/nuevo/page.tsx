'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { empleadosApi, areasApi, puestosApi } from '@/lib/api';
import { Save, ArrowLeft, Loader2, Copy, CheckCircle2 } from 'lucide-react';

type CatalogItem = { id: number; nombre_area?: string; nombre_puesto?: string; area_id?: number };

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<CatalogItem[]>([]);
  const [puestos, setPuestos] = useState<CatalogItem[]>([]);
  const [successData, setSuccessData] = useState<{ password_temporal: string; id: number } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    rfc: '',
    telefono: '',
    curp: '',
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
  });

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [resAreas, resPuestos] = await Promise.all([areasApi.getAll(), puestosApi.getAll()]);
        setAreas(resAreas || []);
        setPuestos(resPuestos || []);
      } catch (err) {
        console.error('Error al cargar catálogos', err);
      }
    };
    fetchCatalogs();
  }, []);

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
        sexo: formData.sexo || null,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
        puesto_id: formData.puesto_id ? parseInt(formData.puesto_id) : null,
        sueldo: formData.sueldo || '0.00',
        sueldo_fiscal: formData.sueldo_fiscal || '0.00',
        familiares: [] as Record<string, unknown>[],
        datos_salud: {
          nss: formData.salud_nss || null,
          tipo_sangre: formData.salud_tipo_sangre || null,
          discapacidad: formData.salud_discapacidad,
        },
        turno_entrada: formData.turno_entrada,
        turno_salida: formData.turno_salida,
      };

      if (formData.familiar_nombre || formData.familiar_telefono || formData.familiar_parentesco) {
        (payload.familiares as Record<string, unknown>[]).push({
          nombre_completo: formData.familiar_nombre,
          telefono: formData.familiar_telefono,
          parentesco: formData.familiar_parentesco,
        });
      }

      const createdEmp = await empleadosApi.create(payload);
      if (createdEmp?.password_temporal) {
        setSuccessData({
          password_temporal: createdEmp.password_temporal,
          id: createdEmp.id,
        });
      } else {
        router.push('/dashboard/empleados');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al guardar';
      alert(msg);
      setLoading(false);
    }
  };

  const puestosFiltrados = formData.area_id
    ? puestos.filter((p) => String(p.area_id) === String(formData.area_id))
    : puestos;

  const copyToClipboard = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.password_temporal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (successData) {
    return (
      <div className="p-8 max-w-2xl mx-auto w-full mt-10">
        <div className="bg-white border border-[#E1DFE0] rounded-2xl p-10 text-center shadow-lg">
          <CheckCircle2 size={64} className="mx-auto text-green-500 mb-6" />
          <h2 className="text-[1.75rem] font-bold text-[#44474A] mb-4">¡Empleado Creado!</h2>
          <p className="text-[#858789] mb-8">
            El empleado ha sido registrado correctamente. Por favor, copia la contraseña generada a
            continuación y compártela con el empleado, ya que no podrá visualizarse de nuevo.
          </p>

          <div className="bg-transparent rounded-xl p-6 mb-8 border border-[#E1DFE0] max-w-md mx-auto">
            <p className="text-sm text-[#858789] mb-2 font-semibold uppercase tracking-wider">
              Contraseña Temporal
            </p>
            <div className="flex items-center justify-between bg-white border border-[#E1DFE0] rounded-lg px-4 py-3">
              <span className="font-mono text-xl tracking-wider text-[#A7313A] font-bold">
                {successData.password_temporal}
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
              <p className="text-xs text-green-600 mt-2 font-medium">¡Copiado al portapapeles!</p>
            )}
          </div>

          <button
            onClick={() => router.push('/dashboard/empleados')}
            className="bg-[#A7313A] hover:bg-[#8F2930] text-white px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            Ir a la lista de empleados
          </button>
        </div>
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
            Alta de Empleado
          </h1>
          <p className="text-[#858789] text-[1rem]">Registra un nuevo colaborador en el sistema.</p>
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
              Sueldo Base Mensual
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
              Sueldo Fiscal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858789]">$</span>
              <input
                type="text"
                name="sueldo_fiscal"
                pattern="^\d+(\.\d{1,2})?$"
                title="Debe ser un número válido, opcionalmente con 2 decimales"
                value={formData.sueldo_fiscal}
                onChange={handleChange}
                placeholder="Ej. 10000.00"
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
        </div>

        <h2 className="text-[1.25rem] font-bold text-[#44474A] mb-6 mt-4 pb-4 border-b border-[#F3F4F6]">
          Contacto de Emergencia
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Nombre del Familiar
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
              Parentesco
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
              Teléfono de Emergencia
            </label>
            <input
              type="text"
              name="familiar_telefono"
              value={formData.familiar_telefono}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
        </div>

        <h2 className="text-[1.25rem] font-bold text-[#44474A] mb-6 pb-4 border-b border-[#F3F4F6]">
          Seguridad y Salud
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              NSS (Seguro Social)
            </label>
            <input
              type="text"
              name="salud_nss"
              maxLength={11}
              value={formData.salud_nss}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.9rem] font-semibold text-[#44474A] mb-2">
              Tipo de Sangre
            </label>
            <input
              type="text"
              name="salud_tipo_sangre"
              maxLength={10}
              value={formData.salud_tipo_sangre}
              onChange={handleChange}
              placeholder="Ej. O+"
              className="w-full px-4 py-2.5 border border-[#E1DFE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7313A]/20 focus:border-[#A7313A] transition-all uppercase"
            />
          </div>
          <div className="flex items-center gap-3 h-[46px] px-2">
            <input
              type="checkbox"
              id="discapacidad"
              name="salud_discapacidad"
              checked={formData.salud_discapacidad}
              onChange={handleChange}
              className="w-5 h-5 text-[#A7313A] rounded border-[#E1DFE0] focus:ring-[#A7313A]"
            />
            <label
              htmlFor="discapacidad"
              className="text-[0.9rem] font-semibold text-[#44474A] cursor-pointer"
            >
              ¿Tiene alguna discapacidad?
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[#F3F4F6]">
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
            {loading ? 'Guardando...' : 'Guardar Empleado'}
          </button>
        </div>
      </form>
    </div>
  );
}
