'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { empleadosApi, areasApi, puestosApi } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  Printer,
  User,
  Briefcase,
  Building2,
  MapPin,
  HeartPulse,
  Phone,
  Mail,
  FileText,
  AlertCircle,
} from 'lucide-react';

type CatalogItem = { id: number; nombre_area?: string; nombre_puesto?: string; area_id?: number };

export default function ExpedienteEmpleadoPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [empleado, setEmpleado] = useState<Record<string, any> | null>(null);
  const [areas, setAreas] = useState<CatalogItem[]>([]);
  const [puestos, setPuestos] = useState<CatalogItem[]>([]);

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
        setEmpleado(resEmp);
      } catch (err) {
        console.error('Error al cargar datos', err);
        alert('No se pudo cargar el expediente del empleado');
        router.push('/dashboard/empleados');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [unwrappedParams.id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (fetching) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#A7313A]" />
      </div>
    );
  }

  if (!empleado) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-[#858789]">
        <AlertCircle size={48} className="mb-4" />
        <p>No se encontró el empleado.</p>
        <button onClick={() => router.back()} className="mt-4 text-[#A7313A] hover:underline">
          Volver
        </button>
      </div>
    );
  }

  const area = areas.find((a) => a.id === empleado.area_id)?.nombre_area || 'Sin Área';
  const puesto = puestos.find((p) => p.id === empleado.puesto_id)?.nombre_puesto || 'Sin Puesto';
  const familiar = empleado.familiares?.[0] || {};
  const salud = empleado.datos_salud || {};

  return (
    <div className="p-8 max-w-5xl mx-auto w-full print:p-0 print:max-w-none print:bg-white bg-gray-50 min-h-screen pb-12">
      {/* Botones de acción (Ocultos al imprimir) */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white border border-[#E1DFE0] rounded-xl text-[#858789] hover:text-[#44474A] hover:bg-transparent transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={handlePrint}
          className="bg-[#A7313A] hover:bg-[#8F2930] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
        >
          <Printer size={20} />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Contenedor principal del PDF */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#E1DFE0] print:border-none print:shadow-none print:m-0 overflow-hidden">
        {/* Cabecera del Expediente */}
        <div className="bg-gradient-to-r from-[#A7313A] to-[#8F2930] p-8 text-white flex justify-between items-center print:p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">EXPEDIENTE DIGITAL</h1>
            <p className="text-white/80 font-medium">Información corporativa confidencial</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg text-white/90">
              ID: EMP-{empleado.id.toString().padStart(4, '0')}
            </p>
            <p className="text-sm text-white/70">{new Date().toLocaleDateString('es-MX')}</p>
          </div>
        </div>

        {/* Info Principal del Empleado */}
        <div className="p-8 border-b border-[#F3F4F6] print:p-6 bg-[#FAFAFA]">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md text-[#A7313A] flex items-center justify-center font-bold text-4xl shrink-0 uppercase">
              {empleado.nombre_completo.substring(0, 2)}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#1e293b] mb-2">{empleado.nombre_completo}</h2>
              <div className="flex flex-wrap items-center gap-3 text-[0.95rem]">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 border border-blue-200 shadow-sm">
                  <Briefcase size={14} /> {puesto}
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 border border-emerald-200 shadow-sm">
                  <Building2 size={14} /> {area}
                </span>
                <span
                  className={`px-3 py-1 rounded-full font-bold shadow-sm border ${empleado.estatus === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                >
                  {empleado.estatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 print:p-6">
          {/* Columna 1 */}
          <div className="space-y-10">
            {/* Identidad */}
            <section>
              <h3 className="text-lg font-bold text-[#A7313A] border-b-2 border-[#A7313A]/20 pb-2 mb-4 flex items-center gap-2">
                <User size={20} /> Datos de Identidad
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium flex items-center gap-2">
                    <Mail size={16} /> Correo:
                  </span>
                  <span className="font-semibold text-[#44474A]">
                    {empleado.email || 'No registrado'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium flex items-center gap-2">
                    <Phone size={16} /> Teléfono:
                  </span>
                  <span className="font-semibold text-[#44474A]">
                    {empleado.telefono || 'No registrado'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium flex items-center gap-2">
                    <MapPin size={16} /> Dirección:
                  </span>
                  <span className="font-semibold text-[#44474A]">
                    {empleado.direccion_empleado || 'No registrado'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium flex items-center gap-2">
                    <User size={16} /> Sexo:
                  </span>
                  <span className="font-semibold text-[#44474A]">
                    {empleado.sexo || 'No registrado'}
                  </span>
                </div>
              </div>
            </section>

            {/* Fiscal y Nómina */}
            <section>
              <h3 className="text-lg font-bold text-[#A7313A] border-b-2 border-[#A7313A]/20 pb-2 mb-4 flex items-center gap-2">
                <FileText size={20} /> Información Fiscal y Nómina
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium">CURP:</span>
                  <span className="font-bold text-[#44474A] uppercase tracking-wider">
                    {empleado.curp || 'No registrado'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium">RFC:</span>
                  <span className="font-bold text-[#44474A] uppercase tracking-wider">
                    {empleado.rfc || 'No registrado'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium">Fecha Ingreso:</span>
                  <span className="font-semibold text-[#44474A]">
                    {empleado.fecha_ingreso
                      ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX')
                      : 'No registrado'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2 bg-gray-50 p-2 rounded-lg mt-2">
                  <span className="text-[#858789] font-bold">Sueldo Base (Mensual):</span>
                  <span className="font-bold text-emerald-600 text-base">
                    ${Number(empleado.sueldo || 0).toFixed(2)} MXN
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[#858789] font-medium">Sueldo Fiscal (IMSS):</span>
                  <span className="font-semibold text-[#44474A]">
                    ${Number(empleado.sueldo_fiscal || 0).toFixed(2)} MXN
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Columna 2 */}
          <div className="space-y-10">
            {/* Emergencias */}
            <section>
              <h3 className="text-lg font-bold text-[#A7313A] border-b-2 border-[#A7313A]/20 pb-2 mb-4 flex items-center gap-2">
                <AlertCircle size={20} /> Contactos de Emergencia
              </h3>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 shadow-sm">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-rose-200/50 pb-2">
                    <span className="text-rose-800/80 font-medium">Nombre:</span>
                    <span className="font-bold text-rose-900">
                      {familiar.nombre_completo || 'No registrado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-rose-200/50 pb-2">
                    <span className="text-rose-800/80 font-medium">Parentesco:</span>
                    <span className="font-semibold text-rose-900">
                      {familiar.parentesco || 'No registrado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-rose-800/80 font-medium">Teléfono:</span>
                    <span className="font-bold text-rose-900 flex items-center gap-1">
                      <Phone size={14} /> {familiar.telefono || 'No registrado'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Salud */}
            <section>
              <h3 className="text-lg font-bold text-[#A7313A] border-b-2 border-[#A7313A]/20 pb-2 mb-4 flex items-center gap-2">
                <HeartPulse size={20} /> Datos Médicos y Salud
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-blue-200/50 pb-2">
                    <span className="text-blue-800/80 font-medium">NSS (Seguro Social):</span>
                    <span className="font-bold text-blue-900 tracking-widest">
                      {salud.nss || 'No registrado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-200/50 pb-2">
                    <span className="text-blue-800/80 font-medium">Tipo de Sangre:</span>
                    <span className="font-bold text-blue-900 text-base">
                      {salud.tipo_sangre || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-800/80 font-medium">Discapacidad:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${salud.discapacidad ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-blue-800'}`}
                    >
                      {salud.discapacidad ? 'SÍ REGISTRA' : 'NINGUNA'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer del PDF */}
        <div className="bg-transparent p-6 text-center text-xs text-[#858789] border-t border-[#E1DFE0] mt-4 print:mt-auto">
          <p className="mb-1">Este documento es de uso interno y confidencial.</p>
          <p>Generado por el Sistema ERP Corporativo - Módulo de Recursos Humanos.</p>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          /* Seleccionamos el div principal de la página, asumiendo su estructura. */
          .max-w-5xl, .max-w-5xl * {
            visibility: visible;
          }
          .max-w-5xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `,
        }}
      />
    </div>
  );
}
