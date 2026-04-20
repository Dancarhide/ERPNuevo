import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaSave, FaCheckCircle, FaSpinner, FaArchive, FaChartPie, FaDownload, FaMagic, FaExclamationCircle, FaExclamationTriangle, FaFilePdf, FaFileCode, FaPaperPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { calcularISR, calcularIMSSObrero, obtenerFactorIntegracion, calcularSDI, calcularSubsidio2024, calcularCostoPatronal, calcularProvisionAguinaldo, calcularProvisionVacaciones, calcularValesDespensa, calcularFondoAhorro, validarRFC, validarCURP } from '../utils/PayrollUtils';

import './styles/Dashboard.css';
import './styles/Payroll.css';

interface ConceptoNomina {
  idconcepto: number;
  clave: string;
  nombre_concepto: string;
  tipo: string;
  monto_defecto: number;
  es_fiscal: boolean;
}

interface EmpleadoNomina {
  idempleado: number;
  nombre_completo_empleado: string;
  sueldo: number;
  sueldo_fiscal: number;
  idarea: number | null;
  fecha_ingreso: string;
  infonavit_mensual: number;
  vales_despensa_pct: number;
  fondo_ahorro_pct: number;
  curp: string | null;
  rfc: string | null;
  prestamos: {
    idprestamo: number;
    saldo_pendiente: number;
    abono_periodo: number;
  }[];
}

interface DetalleDraft {
  idconcepto: number;
  monto_aplicado: number;
}

interface NominaDraft {
  idempleado: number;
  nombre_completo_empleado: string;
  sueldo_base: number;
  bonos: number;
  deducciones: number;
  total_pagado: number;
  monto_reportado_fiscal: number;
  monto_variacion_complemento: number;
  dias_trabajados: number; // = diasTotales = dias_periodo - faltas, guardado en BD
  dias_periodo: number;
  faltas: number;
  horas_extras: number;
  sdi: number;
  factor_integracion: number;
  costo_patronal: number;
  provision_aguinaldo: number;
  provision_vacaciones: number;
  monto_vales: number;
  monto_fondo: number;
  audit_errors: string[];
  idarea: number | null;
  detalles: DetalleDraft[];
  // Campos de préstamos
  idprestamo?: number;
  saldo_prestamo?: number;
  abono_prestamo?: number;
  saldo_prestamo_restante?: number;
  // Campos SAT
  uuid_sat?: string;
  estatus_sat?: string;
  pdf_url?: string;
  xml_url?: string;
}


const PayrollAdmin: React.FC = () => {
  const [empleados, setEmpleados] = useState<EmpleadoNomina[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoNomina[]>([]);
  const [areas, setAreas] = useState<{ idarea: number, nombre_area: string }[]>([]);
  const [nominas, setNominas] = useState<NominaDraft[]>([]);
  const [showFiscalOnly, setShowFiscalOnly] = useState(false);
  const [showCashOnly, setShowCashOnly] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<string>('');

  const [fechaFin, setFechaFin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimbrando, setIsTimbrando] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const host = window.location.hostname;
  const sessionData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const token = sessionData?.token;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empRes, conRes, areaRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/nominas/empleados`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/conceptos-nomina`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/areas`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (empRes.ok && conRes.ok && areaRes.ok) {
        const empData = await empRes.json();
        const conData = await conRes.json();
        const areaData = await areaRes.json();
        setEmpleados(empData);
        setConceptos(conData);
        setAreas(areaData);

        
        const drafts = empData.map((emp: EmpleadoNomina) => {
          const diasPeriodo = 15;
          const faltas = 0;
          const horasExtras = 0;
          
          const diasPagados = Math.max(0, diasPeriodo - faltas);
          
          const sueldoBaseMensual = parseFloat(emp.sueldo as any) || 0;
          const sueldoBaseDiario = sueldoBaseMensual / 30;
          const pagoHorasExtras = (sueldoBaseDiario / 8) * 2 * horasExtras;
          
          const sueldoBase = (sueldoBaseDiario * diasPagados) + pagoHorasExtras;
          
          let draft: NominaDraft = {
            idempleado: emp.idempleado,
            nombre_completo_empleado: emp.nombre_completo_empleado,
            sueldo_base: sueldoBase,
            bonos: 0,
            deducciones: 0,
            total_pagado: 0,
            monto_reportado_fiscal: 0,
            monto_variacion_complemento: 0,
            dias_trabajados: diasPagados,
            dias_periodo: diasPeriodo,
            faltas: faltas,
            horas_extras: horasExtras,
            sdi: 0,
            factor_integracion: 1.0493,
            costo_patronal: 0,
            provision_aguinaldo: 0,
            provision_vacaciones: 0,
            idarea: emp.idarea,
            monto_vales: 0,
            monto_fondo: 0,
            audit_errors: [],
            detalles: conData.map((c: ConceptoNomina) => ({ idconcepto: c.idconcepto, monto_aplicado: parseFloat(String(c.monto_defecto)) || 0 })),
            estatus_sat: 'Pendiente'
          };

          return recalcularNomina(draft, draft.detalles);
        });
        setNominas(drafts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recalcularNomina = (n: NominaDraft, newDetalles: DetalleDraft[], dp?: number, fs?: number, he?: number): NominaDraft => {
      const diasPeriodo = dp !== undefined ? dp : n.dias_periodo;
      const faltas = fs !== undefined ? fs : n.faltas;
      const horasExtras = he !== undefined ? he : n.horas_extras;
      
      const diasT = Math.max(0, diasPeriodo - faltas);
      
      const emp = empleados.find(e => e.idempleado === n.idempleado);
      const sbm = parseFloat(String(emp?.sueldo)) || 0;
      const sfm = parseFloat(String(emp?.sueldo_fiscal)) || 0; // Ahora usamos el sueldo fiscal real de la BD
      
      const sBaseDiario = sbm / 30;
      const pagoHrExtra = (sBaseDiario / 8) * 2 * horasExtras;
      
      const sBase = (sBaseDiario * diasT) + pagoHrExtra;
      let sFiscGross = (sfm / 30) * diasT; // Solo sueldo base proporcional, sin horas extras para el cálculo fiscal

      let b = 0;
      let d = 0;

      // 1. Sumar percepciones (fiscales y no fiscales)
      newDetalles.forEach(det => {
        const c = conceptos.find(x => x.idconcepto === det.idconcepto);
        if (c?.tipo === 'Percepcion') {
          b += det.monto_aplicado;
          if (c.es_fiscal) sFiscGross += det.monto_aplicado;
        }
      });

      // 2. Cálculos Fiscales Avanzados (CONTPAQi Style)
      const factor = obtenerFactorIntegracion(emp?.fecha_ingreso || new Date().toISOString());
      const sBaseFiscalDiario = sfm / 30;
      const sdi = calcularSDI(sBaseFiscalDiario, factor);
      
      // ISR sobre el ingreso fiscal mensual estimado (proyectado a 30 días)
      const ingresoMensualProyectado = (sFiscGross / (diasT || 1)) * 30.4;
      const isrMensual = calcularISR(ingresoMensualProyectado);
      const subsidioMensual = calcularSubsidio2024(ingresoMensualProyectado);
      
      const isrPeriodo = Math.max(0, (isrMensual - subsidioMensual) * (diasT / 30.4));
      
      // IMSS Obrero basado en SDI
      const imssPeriodo = calcularIMSSObrero(sdi, diasT);
      
      // Infonavit (Deducción fija si el empleado tiene crédito)
      const infonavitPeriodo = (parseFloat(String(emp?.infonavit_mensual)) || 0) / 2;

      // Costo Patronal (Lo que paga la empresa)
      const cPatronal = calcularCostoPatronal(sdi, diasT, sFiscGross);

      // Provisiones (Estratégico)
      const provAgui = calcularProvisionAguinaldo(sfm, diasT);
      const provVac = calcularProvisionVacaciones(sfm, factor, diasT);

      const isrC = conceptos.find(c => c.clave.toUpperCase().includes('ISR'));
      const imssC = conceptos.find(c => c.clave.toUpperCase().includes('IMSS'));
      const infonavitC = conceptos.find(c => c.clave.toUpperCase().includes('INFONAVIT'));
      
      const updatedDetalles = newDetalles.map(det => {
        if (isrC && det.idconcepto === isrC.idconcepto && sFiscGross > 0) return { ...det, monto_aplicado: isrPeriodo };
        if (imssC && det.idconcepto === imssC.idconcepto && sFiscGross > 0) return { ...det, monto_aplicado: imssPeriodo };
        if (infonavitC && det.idconcepto === infonavitC.idconcepto && infonavitPeriodo > 0) return { ...det, monto_aplicado: infonavitPeriodo };
        return det;
      });

      // 3. Sumar deducciones finales y calcular neto fiscal
      let sFiscNet = sFiscGross;
      updatedDetalles.forEach(det => {
        const c = conceptos.find(x => x.idconcepto === det.idconcepto);
        if (c?.tipo === 'Deduccion') {
          d += det.monto_aplicado;
          if (c.es_fiscal) sFiscNet -= det.monto_aplicado;
        }
      });

      // 4. Cálculos Corporativos Avanzados
      const montoVales = calcularValesDespensa(sFiscGross, parseFloat(String(emp?.vales_despensa_pct)) || 0);
      const montoFondo = calcularFondoAhorro(sFiscGross, parseFloat(String(emp?.fondo_ahorro_pct)) || 0);

      const totPreLoan = Math.max(0, sBase + b - d);

      // 5. Gestión de Préstamos (Automatizada)
      let abonoPrestamo = 0;
      let idPrestamoRef = undefined;
      let saldoAct = 0;
      let saldoRest = 0;

      if (emp?.prestamos && emp.prestamos.length > 0) {
        const p = emp.prestamos[0]; // Tomamos el préstamo más antiguo activo
        idPrestamoRef = p.idprestamo;
        saldoAct = parseFloat(String(p.saldo_pendiente));
        // El abono no puede superar el saldo ni el monto pagable
        abonoPrestamo = Math.min(saldoAct, parseFloat(String(p.abono_periodo)), totPreLoan);
        saldoRest = Math.max(0, saldoAct - abonoPrestamo);
        d += abonoPrestamo; // Se suma a las deducciones totales
      }

      const netFinal = Math.max(0, sBase + b - d);


      // Audit Errors
      const errors: string[] = [];
      if (emp?.rfc && !validarRFC(emp.rfc)) errors.push('RFC Inválido');
      if (emp?.curp && !validarCURP(emp.curp)) errors.push('CURP Inválida');
      if (netFinal <= 0) errors.push('Neto $0 o Negativo');

      return {
        ...n,
        sueldo_base: sBase,
        monto_reportado_fiscal: Math.max(0, sFiscNet),
        dias_trabajados: diasT,
        detalles: updatedDetalles,
        bonos: b,
        deducciones: d,
        total_pagado: netFinal,
        monto_variacion_complemento: Math.max(0, netFinal - sFiscNet),
        dias_periodo: diasPeriodo,
        faltas: faltas,
        horas_extras: horasExtras,
        sdi: sdi,
        factor_integracion: factor,
        costo_patronal: cPatronal + montoVales + montoFondo, // El costo patronal sube con beneficios
        provision_aguinaldo: provAgui,
        provision_vacaciones: provVac,
        monto_vales: montoVales,
        monto_fondo: montoFondo,
        audit_errors: errors,
        idarea: emp?.idarea || null,
        idprestamo: idPrestamoRef,
        saldo_prestamo: saldoAct,
        abono_prestamo: abonoPrestamo,
        saldo_prestamo_restante: saldoRest
      };



  };

  const handleDiasHRChange = (idempleado: number, tipo: 'periodo'|'faltas'|'horas', value: string) => {
    let val = parseInt(value) || 0;
    if (val < 0) val = 0;
    
    // Validar cantidad máxima de días si hay fechas seleccionadas
    if (tipo === 'periodo' && fechaInicio && fechaFin) {
      const start = new Date(fechaInicio);
      const end = new Date(fechaFin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (val > diffDays) val = diffDays;
    }
    
    setNominas(prev => prev.map(n => {
      if (n.idempleado !== idempleado) return n;
      
      const newDPeriodo = tipo === 'periodo' ? val : n.dias_periodo;
      const newFaltas = tipo === 'faltas' ? val : n.faltas;
      const newHrs = tipo === 'horas' ? val : n.horas_extras;
      
      return recalcularNomina(n, n.detalles, newDPeriodo, newFaltas, newHrs);
    }));
  };

  // Efecto para actualizar días automáticamente al cambiar fechas
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const start = new Date(fechaInicio);
      const end = new Date(fechaFin);
      if (start <= end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        setNominas(prev => prev.map(n => recalcularNomina(n, n.detalles, diffDays, n.faltas, n.horas_extras)));
      }
    }
  }, [fechaInicio, fechaFin]);

  const totalReal = nominas.reduce((acc, n) => acc + n.total_pagado, 0);
  const totalFiscal = nominas.reduce((acc, n) => acc + n.monto_reportado_fiscal, 0);
  const totalComplemento = nominas.reduce((acc, n) => acc + n.monto_variacion_complemento, 0);
  const totalPatronal = nominas.reduce((acc, n) => acc + (n.costo_patronal || 0), 0);
  const totalProvisiones = nominas.reduce((acc, n) => acc + (n.provision_aguinaldo || 0) + (n.provision_vacaciones || 0), 0);
  const totalEstrategico = totalReal + totalPatronal;

  const applyBulkValue = (tipo: 'periodo' | 'faltas' | 'horas', value: number) => {
    if (!window.confirm(`¿Aplicar ${value} a todos los empleados en la columna ${tipo}?`)) return;
    setNominas(prev => prev.map(n => {
        const newDP = tipo === 'periodo' ? value : n.dias_periodo;
        const newF = tipo === 'faltas' ? value : n.faltas;
        const newH = tipo === 'horas' ? value : n.horas_extras;
        return recalcularNomina(n, n.detalles, newDP, newF, newH);
    }));
  };

  const auditAlerts = nominas.filter(n => 
    (n.monto_reportado_fiscal / (n.dias_trabajados || 1)) < 248 || 
    n.audit_errors.length > 0
  ).map(n => n.nombre_completo_empleado);

  const downloadBankLayout = () => {
    const headers = ['Nombre Completo', 'RFC', 'Banco', 'Cuenta/CLABE', 'Monto Fiscal (Banco)', 'Concepto'];
    const rows = nominas.map(n => [
        n.nombre_completo_empleado,
        '', // RFC (En un sistema real vendría del emp)
        '', // Banco
        '', // Cuenta
        n.monto_reportado_fiscal.toFixed(2),
        `NOMINA ${new Date().toLocaleDateString()}`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dispersion_bancaria_${fechaInicio}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const [showDenominations, setShowDenominations] = useState(false);
  const [showAudit, setShowAudit] = useState(true);

  const calculateDenominations = () => {
    const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5];
    const results: { [key: number]: number } = {};
    denominations.forEach(d => results[d] = 0);

    nominas.forEach(n => {
      let amount = n.monto_variacion_complemento;
      denominations.forEach(d => {
        const count = Math.floor(amount / d);
        results[d] += count;
        amount = parseFloat((amount % d).toFixed(2));
      });
    });
    return results;
  };

  const denominationsResult = calculateDenominations();


  const handleConceptoChange = (idempleado: number, idconcepto: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setNominas(prev => prev.map(n => {
      if (n.idempleado !== idempleado) return n;
      const newDetalles = n.detalles.map(d => d.idconcepto === idconcepto ? { ...d, monto_aplicado: numValue } : d);
      return recalcularNomina(n, newDetalles);
    }));
  };

  const handleSubmitBulk = async () => {
    if (!fechaInicio || !fechaFin) { return alert('Selecciona las fechas del periodo.'); }
    if (new Date(fechaInicio) > new Date(fechaFin)) { return alert('Rango de fechas inválido.'); }
    if (!window.confirm(`¿Generar ${nominas.length} nóminas?`)) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      // Filtrar los detalles que tengan un monto > 0 (para no guardar registros en 0 en la BD)
      const payload = {
        nominas: nominas.map(n => ({
          ...n,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          detalles: n.detalles.filter(d => d.monto_aplicado > 0),
          sdi: n.sdi,
          factor_integracion: n.factor_integracion,
          costo_patronal: n.costo_patronal
        }))
      };

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/nominas/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`¡Éxito! Se generaron ${data.count} nóminas con sus conceptos.`);
        // Reiniciar
        fetchData();
        setFechaInicio('');
        setFechaFin('');
      } else {
        alert('Error en servidor.');
      }
    } catch (err) {
      alert('Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    if (nominas.length === 0) return;
    
    // Header
    const headers = ['Nombre', 'Días', 'Sueldo Real', 'Fiscal Neto', 'Complemento Cash', 'Total', 'Estatus SAT'];
    const rows = nominas.map(n => [
        n.nombre_completo_empleado,
        n.dias_periodo,
        n.sueldo_base,
        n.monto_reportado_fiscal,
        n.monto_variacion_complemento,
        n.total_pagado,
        n.uuid_sat ? 'Timbrado' : 'Pendiente'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Nomina_Ocotlan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTimbrarBulk = async () => {
    const idsnominas = nominas.map(n => (n as any).idnomina).filter(id => id && !nominas.find(nx => (nx as any).idnomina === id)?.uuid_sat);
    if (idsnominas.length === 0) return alert('No hay nóminas pendientes de timbrar (asegúrese de haberlas generado primero).');
    if (!window.confirm(`¿Timbrar ${idsnominas.length} nóminas ante el SAT?`)) return;

    setIsTimbrando(true);
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/nominas/timbrar-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ idsnominas })
        });
        if (res.ok) {
            const data = await res.json();
            alert(`Proceso terminado: ${data.processed} timbradas, ${data.failed} fallidas.`);
            fetchData();
        } else {
            alert('Error en conexión con el SAT.');
        }
    } catch (err) {
        alert('Error de red.');
    } finally {
        setIsTimbrando(false);
    }
  };

  const handleTimbrarIndividual = async (idnomina: number) => {
    if (!idnomina) return;
    setIsTimbrando(true);
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/nominas/${idnomina}/timbrar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Nómina timbrada correctamente.');
            fetchData();
        } else {
            const err = await res.json();
            alert('Error SAT: ' + err.error);
        }
    } catch (err) {
        alert('Error de red.');
    } finally {
        setIsTimbrando(false);
    }
  };

  return (
    <div className="payroll-dashboard">
      <div className="dashboard-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>
            Suite de Nómina Empresarial
          </h1>
          <p style={{ margin: 0 }}>Gestión integral de nómina Dual (Fiscal & Real) con cumplimiento legal 2024.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={exportToCSV} className="btn-payroll btn-payroll-outline" style={{ height: '42px' }}>
            <FaDownload /> Exportar CSV
          </button>
          <Link to="/payroll-history" className="btn-payroll btn-payroll-outline" style={{ textDecoration: 'none', height: '42px' }}>
            <FaArchive /> Historial
          </Link>
          <button onClick={handleTimbrarBulk} disabled={isTimbrando || nominas.length === 0} className="btn-payroll btn-payroll-outline" style={{ height: '42px', borderColor: '#4f46e5', color: '#4f46e5' }}>
            {isTimbrando ? <FaSpinner className="spin" /> : <FaPaperPlane />} Timbrar SAT (Masivo)
          </button>
          <button onClick={handleSubmitBulk} disabled={isSubmitting || nominas.length === 0} className="btn-payroll btn-payroll-primary" style={{ height: '42px' }}>
            <FaCheckCircle /> {isSubmitting ? 'Procesando...' : `Generar Nómina (${nominas.length})`}
          </button>
        </div>
      </div>


      {successMsg && (
        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #bbf7d0', fontWeight: '500' }}>
          <FaCheckCircle /> {successMsg}
        </div>
      )}

      {/* Herramientas de Enfoque Professional */}
      <div className="payroll-focus-toolbar">
        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Enfoque Operativo:</span>
        <button 
          onClick={() => { setShowFiscalOnly(!showFiscalOnly); setShowCashOnly(false); }}
          className={`btn-payroll btn-fiscal-mode ${showFiscalOnly ? 'active' : ''}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {showFiscalOnly ? 'Mostrando Todo' : 'Solo Fiscal (Banco)'}
        </button>
        <button 
          onClick={() => { setShowCashOnly(!showCashOnly); setShowFiscalOnly(false); }}
          className={`btn-payroll btn-cash-mode ${showCashOnly ? 'active' : ''}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {showCashOnly ? 'Mostrando Todo' : 'Solo Efectivo (Cash)'}
        </button>

        <button 
          onClick={() => setShowAudit(!showAudit)}
          className={`btn-payroll btn-payroll-outline`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', color: showAudit ? '#92400e' : '#64748b' }}
        >
          {showAudit ? <><FaExclamationTriangle /> Ocultar Alertas</> : <><FaExclamationTriangle /> Mostrar Alertas</>}
        </button>
      </div>



      <div className="dashboard-panel" style={{ 
        marginBottom: '25px', 
        display: 'flex', 
        gap: '24px', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid var(--payroll-border)',
        boxShadow: 'var(--payroll-shadow)'
      }}>
        <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '400px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--payroll-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inicio del Periodo</label>
            <input type="date" className="payroll-input-currency" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{ width: '100%', height: '42px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--payroll-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fin del Periodo</label>
            <input type="date" className="payroll-input-currency" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{ width: '100%', height: '42px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
                onClick={downloadBankLayout} 
                disabled={nominas.length === 0}
                className="btn-payroll btn-payroll-outline"
                style={{ height: '42px', color: '#059669', borderColor: '#d1fae5' }}
            >
                <FaDownload /> Layout
            </button>
            <button 
                onClick={() => setShowDenominations(!showDenominations)} 
                disabled={nominas.length === 0}
                className="btn-payroll btn-payroll-outline"
                style={{ height: '42px', color: '#4f46e5', borderColor: '#e0e7ff' }}
            >
                <FaChartPie /> Desglose Efectivo
            </button>
        </div>
      </div>


      {showDenominations && (
        <div className="dashboard-panel step-content-fade" style={{ marginBottom: '20px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#5b21b6' }}>Desglose de Efectivo (Para el Complemento/Variación)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {Object.entries(denominationsResult).sort((a,b) => parseFloat(b[0]) - parseFloat(a[0])).map(([val, count]) => (
              count > 0 && (
                <div key={val} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>{parseFloat(val) >= 20 ? 'BILLETE' : 'MONEDA'}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#4338ca' }}>${val}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>x {count}</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {showAudit && auditAlerts.length > 0 && (
          <div className="payroll-audit-banner">
            <FaExclamationTriangle /> 
            <div>
              <strong>Alerta de Auditoría:</strong> {auditAlerts.length} empleados (ej: {auditAlerts[0]}) detectados con Neto Fiscal por debajo del Salario Mínimo Legal 2024 ($248.93 diario).
            </div>
            <button onClick={() => setShowAudit(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>
      )}



      <div className="payroll-summary-grid">
        <div className="payroll-summary-card">
          <h3>Costo Operativo Real</h3>
          <p>${totalEstrategico.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="payroll-summary-card">
          <h3>Carga Social IMSS</h3>
          <p style={{ color: 'var(--payroll-info)' }}>${totalPatronal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="payroll-summary-card">
          <h3>Sobrante (Cash)</h3>
          <p style={{ color: 'var(--payroll-accent)' }}>${totalComplemento.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="payroll-summary-card">
          <h3>Dispersión Fiscal</h3>
          <p style={{ color: 'var(--payroll-success)' }}>${totalFiscal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>


      <div className="payroll-table-container">
        {isLoading ? (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Sincronizando nómina corporativa...</p>
            </div>
        ) : (
          <table className="payroll-table">
              <thead>
                  <tr>
                      <th className="sticky-col">Colaborador</th>
                      <th style={{ textAlign: 'center' }}>
                        Días <FaMagic style={{ cursor: 'pointer', color: 'var(--payroll-info)' }} onClick={() => applyBulkValue('periodo', 15)} />
                      </th>
                      <th style={{ textAlign: 'center' }}>Faltas</th>
                      <th style={{ textAlign: 'center' }}>EXT.</th>
                      <th>Sueldo Real ($)</th>
                      <th style={{ color: 'var(--payroll-success)', display: showCashOnly ? 'none' : 'table-cell' }}>Fiscal Neto</th>
                      <th style={{ color: 'var(--payroll-accent)', textAlign: 'center' }}>Préstamos (Abono)</th>

                      
                      {conceptos.filter(c => {
                          if (showFiscalOnly) return c.es_fiscal;
                          if (showCashOnly) return !c.es_fiscal;
                          return true;
                      }).map(c => (
                          <th key={c.idconcepto} style={{ borderLeft: '1px solid var(--payroll-border)' }}>
                            <span className={`concept-tag ${c.es_fiscal ? 'fiscal' : 'cash'}`}>
                                {c.es_fiscal ? 'Fiscal' : 'Cash'}
                            </span>
                            <div>{c.nombre_concepto}</div>
                          </th>
                      ))}
                      <th style={{ textAlign: 'right', color: 'var(--payroll-accent)' }}>CASH ($)</th>
                      <th style={{ textAlign: 'right', color: 'var(--payroll-accent)' }}>CASH ($)</th>
                      <th style={{ textAlign: 'right' }}>Total ($)</th>
                      <th style={{ textAlign: 'center' }}>SAT</th>
                  </tr>
              </thead>
              <tbody>
                  {nominas.map((nomina) => (
                      <tr key={nomina.idempleado} className={nomina.audit_errors.length > 0 ? 'row-has-errors' : ''}>
                      <td className="sticky-col">
                          <div className="collaborator-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="collaborator-name">{nomina.nombre_completo_empleado}</span>
                                  {showAudit && nomina.audit_errors.length > 0 && (
                                      <FaExclamationCircle 
                                          title={nomina.audit_errors.join(', ')} 
                                          style={{ color: '#f59e0b', fontSize: '0.8rem' }} 
                                      />
                                  )}

                              </div>
                              <span className="collaborator-meta">{areas.find(a => a.idarea === nomina.idarea)?.nombre_area || 'Operativo'}</span>
                          </div>
                      </td>

                          <td style={{ textAlign: 'center' }}>
                            <input type="number" className="payroll-input-mini" value={nomina.dias_periodo} onChange={(e) => handleDiasHRChange(nomina.idempleado, 'periodo', e.target.value)} />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input type="number" className="payroll-input-mini" value={nomina.faltas} onChange={(e) => handleDiasHRChange(nomina.idempleado, 'faltas', e.target.value)} />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input type="number" className="payroll-input-mini" value={nomina.horas_extras} onChange={(e) => handleDiasHRChange(nomina.idempleado, 'horas', e.target.value)} />
                          </td>
                          <td>${nomina.sueldo_base.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td style={{ color: 'var(--payroll-success)', fontWeight: 'bold', display: showCashOnly ? 'none' : 'table-cell' }}>
                              ${nomina.monto_reportado_fiscal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {nomina.abono_prestamo && nomina.abono_prestamo > 0 ? (
                                <div className="loan-indicator">
                                    <div className="loan-abono">-${nomina.abono_prestamo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                                    <div className="loan-saldo">Saldo: ${nomina.saldo_prestamo_restante?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                                </div>
                            ) : (
                                <span style={{ color: '#e2e8f0' }}>-</span>
                            )}
                          </td>


                          
                          {conceptos.filter(c => {
                              if (showFiscalOnly) return c.es_fiscal;
                              if (showCashOnly) return !c.es_fiscal;
                              return true;
                          }).map(c => {
                              const detalle = nomina.detalles.find(d => d.idconcepto === c.idconcepto);
                              return (
                                  <td key={c.idconcepto} style={{ borderLeft: '1px solid var(--payroll-border)' }}>
                                      <input 
                                          type="number" className="payroll-input-currency"
                                          value={detalle?.monto_aplicado || ''} 
                                          onChange={(e) => handleConceptoChange(nomina.idempleado, c.idconcepto, e.target.value)}
                                          placeholder="0.00"
                                      />
                                  </td>
                              );
                          })}

                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--payroll-accent)' }}>
                              ${nomina.monto_variacion_complemento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--payroll-primary)' }}>
                              ${nomina.total_pagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                              {nomina.uuid_sat ? (
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <a href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}${nomina.pdf_url}`} target="_blank" rel="noreferrer" title="Ver PDF" style={{ color: '#ef4444' }}><FaFilePdf /></a>
                                      <a href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}${nomina.xml_url}`} target="_blank" rel="noreferrer" title="Bajar XML" style={{ color: '#3b82f6' }}><FaFileCode /></a>
                                  </div>
                              ) : (nomina as any).idnomina ? (
                                  <button 
                                      onClick={() => handleTimbrarIndividual((nomina as any).idnomina)}
                                      disabled={isTimbrando}
                                      className="btn-payroll btn-payroll-outline"
                                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                                  >
                                      Timbrar
                                  </button>
                              ) : (
                                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Pend. Gen</span>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        )}
      </div>

      {/* Resumen por Área (Estilo CONTPAQi) */}
      {!isLoading && nominas.length > 0 && (
        <div className="dashboard-panel" style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <FaChartPie style={{ color: 'var(--color-primary)' }}/> Análisis de Costos por Departamento
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {Array.from(new Set(nominas.map(n => n.idarea))).map(areaId => {
               const areaNominas = nominas.filter(n => n.idarea === areaId);
               const areaObj = areas.find(a => a.idarea === areaId);
               const areaName = areaObj ? areaObj.nombre_area : 'Sin Asignar';
               
               const costArea = areaNominas.reduce((acc, n) => acc + n.total_pagado, 0);
               const fiscalArea = areaNominas.reduce((acc, n) => acc + n.monto_reportado_fiscal, 0);
               
               return (
                 <div key={areaId || 0} style={{ padding: '15px', borderRadius: '10px', border: '1px solid #eee', backgroundColor: '#fcfcfc' }}>
                   <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                     {areaName}
                   </div>



                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                     <span>Costo Real:</span>
                     <span style={{ fontWeight: 'bold' }}>${costArea.toLocaleString('es-MX')}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#1f854b' }}>
                     <span>Fiscal (Banco):</span>
                     <span>${fiscalArea.toLocaleString('es-MX')}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                     <span>Empleados:</span>
                     <span>{areaNominas.length}</span>
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollAdmin;
