import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaSave, FaUsers, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import './styles/Dashboard.css';

interface ConceptoNomina {
  idconcepto: number;
  clave: string;
  nombre_concepto: string;
  tipo: string;
  monto_defecto: number;
}

interface EmpleadoNomina {
  idempleado: number;
  nombre_completo_empleado: string;
  sueldo: number;
  sueldo_fiscal: number;
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
  detalles: DetalleDraft[];
}

const calcularISREstimado = (baseQ: number) => {
  if (baseQ <= 374.85) return 0;
  if (baseQ <= 3180) return (baseQ - 374.85) * 0.064 + 7.11;
  if (baseQ <= 5577) return (baseQ - 3180) * 0.1088 + 186.6;
  if (baseQ <= 6483) return (baseQ - 5577) * 0.16 + 447.4;
  if (baseQ <= 7760) return (baseQ - 6483) * 0.1792 + 592.3;
  if (baseQ <= 15650) return (baseQ - 7760) * 0.2136 + 821.2;
  return (baseQ - 15650) * 0.2352 + 2507;
};

const calcularIMSSEstimado = (base: number, dias: number) => {
  const sbc = (base / dias) * 1.0452;
  return sbc * dias * 0.0275;
};

const PayrollAdmin: React.FC = () => {
  const [empleados, setEmpleados] = useState<EmpleadoNomina[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoNomina[]>([]);
  const [nominas, setNominas] = useState<NominaDraft[]>([]);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const [empRes, conRes] = await Promise.all([
        fetch(`http://${host}:4000/api/nominas/empleados`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`http://${host}:4000/api/conceptos-nomina`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (empRes.ok && conRes.ok) {
        const empData = await empRes.json();
        const conData = await conRes.json();
        setEmpleados(empData);
        setConceptos(conData);
        
        const drafts = empData.map((emp: EmpleadoNomina) => {
          const diasPeriodo = 15;
          const faltas = 0;
          const horasExtras = 0;
          
          const diasPagados = Math.max(0, diasPeriodo - faltas);
          
          const sueldoBaseMensual = parseFloat(emp.sueldo as any) || 0;
          const sueldoFiscalMensual = parseFloat(emp.sueldo_fiscal as any) || 0;
          
          const sueldoBaseDiario = sueldoBaseMensual / 30;
          const pagoHorasExtras = (sueldoBaseDiario / 8) * 2 * horasExtras;
          
          const sueldoBase = (sueldoBaseDiario * diasPagados) + pagoHorasExtras;
          const sueldoFiscal = (sueldoFiscalMensual / 30) * diasPagados;

          const isrConcept = conData.find((c: any) => c.clave.toUpperCase().includes('ISR'));
          const imssConcept = conData.find((c: any) => c.clave.toUpperCase().includes('IMSS'));
          
          let bonosIniciales = 0;
          let dedIniciales = 0;
          
          const detallesBase = conData.map((c: ConceptoNomina) => {
            let monto = parseFloat(String(c.monto_defecto)) || 0;
            
            // Inyectar formulas estimatorias
            if (isrConcept && c.idconcepto === isrConcept.idconcepto && sueldoFiscal > 0) monto = calcularISREstimado(sueldoFiscal);
            if (imssConcept && c.idconcepto === imssConcept.idconcepto && sueldoFiscal > 0) monto = calcularIMSSEstimado(sueldoFiscal, diasPagados);

            if (monto > 0) {
              if (c.tipo === 'Percepcion') bonosIniciales += monto;
              if (c.tipo === 'Deduccion') dedIniciales += monto;
            }
            return { idconcepto: c.idconcepto, monto_aplicado: monto };
          });

          const totalPagado = sueldoBase + bonosIniciales - dedIniciales;
          return {
            idempleado: emp.idempleado,
            nombre_completo_empleado: emp.nombre_completo_empleado,
            sueldo_base: sueldoBase,
            bonos: bonosIniciales,
            deducciones: dedIniciales,
            total_pagado: totalPagado,
            monto_reportado_fiscal: sueldoFiscal,
            monto_variacion_complemento: totalPagado - sueldoFiscal,
            dias_trabajados: diasPagados,
            dias_periodo: diasPeriodo,
            faltas: faltas,
            horas_extras: horasExtras,
            detalles: detallesBase
          };
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
      const sfm = parseFloat(String(emp?.sueldo_fiscal)) || 0;
      
      const sBaseDiario = sbm / 30;
      const pagoHrExtra = (sBaseDiario / 8) * 2 * horasExtras;
      
      const sBase = (sBaseDiario * diasT) + pagoHrExtra;
      const sFisc = (sfm / 30) * diasT;

      let b = 0;
      let d = 0;
      newDetalles.forEach(det => {
        const c = conceptos.find(x => x.idconcepto === det.idconcepto);
        if (c?.tipo === 'Percepcion') b += det.monto_aplicado;
        if (c?.tipo === 'Deduccion') d += det.monto_aplicado;
      });

      const tot = Math.max(0, sBase + b - d);
      return {
        ...n,
        sueldo_base: sBase,
        monto_reportado_fiscal: sFisc,
        dias_trabajados: diasT,
        detalles: newDetalles,
        bonos: b,
        deducciones: d,
        total_pagado: tot,
        monto_variacion_complemento: tot - sFisc
      };
  };

  const handleDiasHRChange = (idempleado: number, tipo: 'periodo'|'faltas'|'horas', value: string) => {
    let val = parseInt(value) || 0;
    if (val < 0) val = 0;
    
    setNominas(prev => prev.map(n => {
      if (n.idempleado !== idempleado) return n;
      
      const newDPeriodo = tipo === 'periodo' ? val : n.dias_periodo;
      const newFaltas = tipo === 'faltas' ? val : n.faltas;
      const newHrs = tipo === 'horas' ? val : n.horas_extras;
      
      const diasT = Math.max(0, newDPeriodo - newFaltas);
      
      const emp = empleados.find(e => e.idempleado === idempleado);
      const sfm = parseFloat(String(emp?.sueldo_fiscal)) || 0;
      const nwFisc = (sfm / 30) * diasT;

      const isrC = conceptos.find(c => c.clave.toUpperCase().includes('ISR'));
      const imssC = conceptos.find(c => c.clave.toUpperCase().includes('IMSS'));
      
      const newDetalles = n.detalles.map(d => {
        if (isrC && d.idconcepto === isrC.idconcepto && nwFisc > 0) return { ...d, monto_aplicado: calcularISREstimado(nwFisc) };
        if (imssC && d.idconcepto === imssC.idconcepto && nwFisc > 0) return { ...d, monto_aplicado: calcularIMSSEstimado(nwFisc, diasT) };
        return d;
      });

      return recalcularNomina({ ...n, dias_periodo: newDPeriodo, faltas: newFaltas, horas_extras: newHrs, dias_trabajados: diasT }, newDetalles, newDPeriodo, newFaltas, newHrs);
    }));
  };

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
          detalles: n.detalles.filter(d => d.monto_aplicado > 0)
        }))
      };

      const res = await fetch(`http://${host}:4000/api/nominas/bulk`, {
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

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaMoneyBillWave style={{ color: 'var(--color-accent)' }}/> Generación Masiva de Nóminas
          </h1>
          <p>Crea pagos para todos los trabajadores aplicando conceptos de manera veloz.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCheckCircle /> {successMsg}
        </div>
      )}

      <div className="dashboard-panel" style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Inicio del Periodo</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Fin del Periodo</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ flex: 1, minWidth: '200px', textAlign: 'right' }}>
            <button 
                onClick={handleSubmitBulk} disabled={isSubmitting || nominas.length === 0}
                style={{
                    backgroundColor: 'var(--color-accent)', color: 'white', border: 'none', padding: '12px 24px',
                    borderRadius: '8px', fontWeight: 'bold', cursor: (isSubmitting || nominas.length === 0) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: (isSubmitting || nominas.length === 0) ? 0.7 : 1
                }}
            >
                <FaSave /> {isSubmitting ? 'Generando...' : `Generar ${nominas.length} Nóminas`}
            </button>
        </div>
      </div>

      <div className="dashboard-panel" style={{ overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <FaUsers style={{ color: 'var(--color-primary)' }}/> Captura Detallada Excel ({empleados.length} Empleados)
        </h2>
        
        {isLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}><FaSpinner className="spin" /> Cargando catálogo y empleados...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-bg-light)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '12px 8px' }}>Empleado</th>
                      <th style={{ padding: '12px 0px', textAlign: 'center', minWidth: '70px', color: '#666' }}>Días Período</th>
                      <th style={{ padding: '12px 0px', textAlign: 'center', minWidth: '70px', color: '#d9534f' }}>Faltas</th>
                      <th style={{ padding: '12px 0px', textAlign: 'center', minWidth: '70px', color: '#1f854b' }}>Hrs. Ext.</th>
                      <th style={{ padding: '12px 8px' }}>Sueldo Real ($)</th>
                      <th style={{ padding: '12px 8px', color: '#1f854b' }}>Fiscal Reportado ($)</th>
                      
                      {/* Generar columnas dinámicas por cada concepto */}
                      {conceptos.map(c => (
                          <th key={c.idconcepto} style={{ padding: '12px 8px', minWidth: '120px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: c.tipo === 'Percepcion' ? '#1f854b' : '#d9534f' }}>
                                {c.tipo === 'Percepcion' ? '(+) ' : '(-) '} {c.clave}
                            </div>
                            {c.nombre_concepto}
                          </th>
                      ))}

                      <th style={{ padding: '12px 8px', textAlign: 'right', minWidth: '100px', color: '#a7313a' }}>Variación Efectivo ($)</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', minWidth: '120px' }}>Total Pagado</th>
                  </tr>
              </thead>
              <tbody>
                  {nominas.map((nomina) => (
                      <tr key={nomina.idempleado} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{nomina.nombre_completo_empleado}</td>
                          <td style={{ padding: '12px 0px', textAlign: 'center' }}>
                            <input type="number" min="0" value={nomina.dias_periodo} onChange={(e) => handleDiasHRChange(nomina.idempleado, 'periodo', e.target.value)}
                            style={{ width: '45px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f8f9fa', fontWeight: 'bold' }} title="Días que abarca la quincena (ej. 15, 16)" />
                          </td>
                          <td style={{ padding: '12px 0px', textAlign: 'center' }}>
                            <input type="number" min="0" max={nomina.dias_periodo} value={nomina.faltas} onChange={(e) => handleDiasHRChange(nomina.idempleado, 'faltas', e.target.value)}
                            style={{ width: '45px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ffb3b3', backgroundColor: '#fff5f5', fontWeight: 'bold' }} title="Días que el empleado no trabajó" />
                          </td>
                          <td style={{ padding: '12px 0px', textAlign: 'center' }}>
                            <input type="number" min="0" value={nomina.horas_extras} onChange={(e) => handleDiasHRChange(nomina.idempleado, 'horas', e.target.value)}
                            style={{ width: '45px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #a3d9b5', backgroundColor: '#f2fdf5', fontWeight: 'bold' }} title="Horas pagadas x2 al Salario Base Real" />
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                              ${nomina.sueldo_base.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 8px', color: '#1f854b', fontWeight: 'bold' }}>
                              ${nomina.monto_reportado_fiscal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          
                          {/* Inputs dinámicos */}
                          {conceptos.map(c => {
                              const detalle = nomina.detalles.find(d => d.idconcepto === c.idconcepto);
                              return (
                                  <td key={c.idconcepto} style={{ padding: '12px 8px' }}>
                                      <input 
                                          type="number" min="0" step="any"
                                          value={detalle?.monto_aplicado || ''} 
                                          onChange={(e) => handleConceptoChange(nomina.idempleado, c.idconcepto, e.target.value)}
                                          placeholder="0.00"
                                          style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                      />
                                  </td>
                              );
                          })}

                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#a7313a' }}>
                              ${nomina.monto_variacion_complemento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                              ${nomina.total_pagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                      </tr>
                  ))}
                  {nominas.length === 0 && (
                      <tr><td colSpan={3 + conceptos.length} style={{ textAlign: 'center', padding: '30px' }}>No hay empleados activos.</td></tr>
                  )}
              </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PayrollAdmin;
