import React, { useState, useEffect } from 'react';
import { FaHistory, FaFilePdf, FaSearch, FaSpinner, FaArrowLeft, FaFileCode } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import './styles/Dashboard.css';
import './styles/Payroll.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface NominaHistorial {
  idnomina: number;
  idempleado: number;
  fecha_emision: string;
  fecha_inicio: string;
  fecha_fin: string;
  sueldo_base: string | number;
  bonos: string | number;
  deducciones: string | number;
  total_pagado: string | number;
  monto_reportado_fiscal: string | number;
  monto_variacion_complemento: string | number;
  estado: string;
  lote_id?: string;
  uuid_sat?: string;
  pdf_url?: string;
  xml_url?: string;
  empleados: {
    nombre_completo_empleado: string;
    curp: string;
    rfc: string;
  };
  detalles_nomina?: DetalleHistorial[];
}

interface DetalleHistorial {
  monto_aplicado: string | number;
  conceptos_nomina: {
    nombre_concepto: string;
    clave: string;
    tipo: string;
    es_fiscal: boolean;
  };
}

const PayrollHistory: React.FC = () => {
  const [nominas, setNominas] = useState<NominaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [filterLote, setFilterLote] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const loteParam = params.get('lote');
    if (loteParam) {
        setFilterLote(loteParam);
    }
  }, [location]);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
      const host = window.location.hostname;
      
      const res = await fetch(`http://${host}:4000/api/nominas/historial`, {
        headers: { 'Authorization': `Bearer ${sessionData?.token}` }
      });
      
      if (res.ok) {
        setNominas(await res.json());
      }
    } catch (error) {
      console.error('Error fetching historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor: string | number) => {
    return `$${parseFloat(String(valor) || '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };
  const formatearFecha = (fechaStr: string) => {
    return new Date(fechaStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredNominas = nominas.filter(n => {
    let match = true;
    if (filterNombre && !n.empleados.nombre_completo_empleado.toLowerCase().includes(filterNombre.toLowerCase())) match = false;
    if (filterMes) {
      const mesEmision = new Date(n.fecha_emision).toISOString().substring(0, 7); // YYYY-MM
      if (mesEmision !== filterMes) match = false;
    }
    if (filterLote && n.lote_id !== filterLote) match = false;
    return match;
  });

  const exportarPDFGlobal = () => {
    if (filteredNominas.length === 0) return alert('No hay registros para exportar');
    
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.setTextColor(167, 49, 58);
    doc.text('Reporte Global de Nóminas (Listado de Raya)', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-MX')}`, 14, 28);
    if (filterMes) doc.text(`Periodo filtrado: ${filterMes}`, 14, 33);

    let totalBase = 0;
    let totalBonos = 0;
    let totalDed = 0;
    let totalNeto = 0;
    let totalFiscal = 0;
    let totalVar = 0;

    const bodyRows = filteredNominas.map(n => {
      const base = parseFloat(String(n.sueldo_base)) || 0;
      const bono = parseFloat(String(n.bonos)) || 0;
      const ded = parseFloat(String(n.deducciones)) || 0;
      const neto = parseFloat(String(n.total_pagado)) || 0;
      const fiscal = parseFloat(String(n.monto_reportado_fiscal)) || 0;
      const vari = parseFloat(String(n.monto_variacion_complemento)) || 0;

      totalBase += base;
      totalBonos += bono;
      totalDed += ded;
      totalNeto += neto;
      totalFiscal += fiscal;
      totalVar += vari;

      return [
        n.idnomina,
        n.empleados.nombre_completo_empleado,
        `${formatearFecha(n.fecha_inicio)} al ${formatearFecha(n.fecha_fin)}`,
        formatearMoneda(base),
        formatearMoneda(bono),
        formatearMoneda(ded),
        formatearMoneda(neto),
        formatearMoneda(fiscal),
        formatearMoneda(vari)
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['Folio', 'Empleado', 'Periodo', 'Base', 'Bono', 'Ded', 'T. Neto', 'Fiscal', 'Variación']],
      body: bodyRows,
      foot: [
        ['', 'TOTALES', '', formatearMoneda(totalBase), formatearMoneda(totalBonos), formatearMoneda(totalDed), formatearMoneda(totalNeto), formatearMoneda(totalFiscal), formatearMoneda(totalVar)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [167, 49, 58], textColor: 255 },
      footStyles: { fillColor: [248, 249, 250], textColor: 0, fontStyle: 'bold' }
    });

    doc.save(`Reporte_Global_Nominas_${new Date().getTime()}.pdf`);
  };

  const exportarRecibosLote = (tipo: 'Fiscal' | 'Real' | 'Efectivo') => {
    if (filteredNominas.length === 0) return alert('No hay registros para exportar');
    
    const doc = new jsPDF();
    
    filteredNominas.forEach((nomina, index) => {
      if (index > 0) doc.addPage();
      
      // --- Encabezado Corporativo ---
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('ERP NUEVO - SOLUCIONES EMPRESARIALES', 14, 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('RFC: ENE240325A1B | Calle Principal #123, Ciudad de México', 14, 22);
      doc.text('Registro Patronal IMSS: A12-34567-89-0', 14, 27);
      
      doc.setFontSize(14);
      doc.setTextColor(167, 49, 58);
      let titulo = 'RECIBO DE PAGO (NÓMINA REAL)';
      if (tipo === 'Fiscal') titulo = 'COMPROBANTE DE PAGO (NÓMINA FISCAL)';
      if (tipo === 'Efectivo') titulo = 'COMPROBANTE DE COMPLEMENTO (EFECTIVO)';
      doc.text(titulo, 14, 35);
      
      // --- Datos del Empleado & Periodo ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DEL EMPLEADO', 14, 50);
      doc.line(14, 52, 100, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${nomina.empleados.nombre_completo_empleado}`, 14, 58);
      doc.text(`RFC: ${nomina.empleados.rfc || 'N/A'}`, 14, 63);
      doc.text(`CURP: ${nomina.empleados.curp || 'N/A'}`, 14, 68);
      
      doc.setFont('helvetica', 'bold');
      doc.text('PERIODO DE PAGO', 120, 50);
      doc.line(120, 52, 190, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Del: ${formatearFecha(nomina.fecha_inicio)}`, 120, 58);
      doc.text(`Al: ${formatearFecha(nomina.fecha_fin)}`, 120, 63);
      doc.text(`Folio: #${nomina.idnomina.toString().padStart(6, '0')}`, 120, 68);

      const bodyRowsRecibo: any[] = [];
      let totalPagar = 0;

      if (tipo === 'Fiscal') {
          // Obtener el neto fiscal guardado (lo que se deposita al banco)
          const fiscalNeto = parseFloat(nomina.monto_reportado_fiscal as any) || 0;
          
          let totalDedFiscal = 0;
          let totalPercepFiscal = 0;
          const detallesFiscales: any[] = [];

          if (nomina.detalles_nomina && nomina.detalles_nomina.length > 0) {
            nomina.detalles_nomina.forEach(d => {
              // Solo procesar conceptos que tengan la marca 'es_fiscal' en el catálogo
              if (d.conceptos_nomina && d.conceptos_nomina.es_fiscal) {
                const montoConcepto = parseFloat(d.monto_aplicado as any) || 0;
                const nombre = `${d.conceptos_nomina.clave} - ${d.conceptos_nomina.nombre_concepto}`;
                
                if (d.conceptos_nomina.tipo === 'Percepcion') {
                  totalPercepFiscal += montoConcepto;
                  detallesFiscales.push([nombre, formatearMoneda(montoConcepto), '']);
                } else {
                  totalDedFiscal += montoConcepto;
                  detallesFiscales.push([nombre, '', formatearMoneda(montoConcepto)]);
                }
              }
            });
          }

          // Bruto Fiscal = Neto + Deducciones - Percepciones (Todas fiscales)
          const brutoFiscalCalculado = Math.max(0, fiscalNeto + totalDedFiscal - totalPercepFiscal);
          
          // Fila del sueldo base fiscal (sin horas extras ni bonos privados)
          bodyRowsRecibo.push(['Sueldo Base del Periodo (Fiscal)', formatearMoneda(brutoFiscalCalculado), '']);
          
          // Si hubo otros conceptos fiscales (bonos fiscales o impuestos FISCALES como ISR/IMSS)
          if (detallesFiscales.length > 0) {
              bodyRowsRecibo.push(...detallesFiscales);
          }
          
          totalPagar = fiscalNeto;
      } else if (tipo === 'Efectivo') {
          // Lote de EFECTIVO (diferencia entre real y fiscal)
          const varEfectivo = parseFloat(String(nomina.monto_variacion_complemento)) || 0;
          
          // La base en efectivo es sueldo_base - sueldo_fiscal (ej. bono de asistencia, horas extras no fiscales)
          const baseReal = parseFloat(String(nomina.sueldo_base)) || 0;
          const fiscal = parseFloat(String(nomina.monto_reportado_fiscal)) || 0;
          const difBase = Math.max(0, baseReal - fiscal);
          
          if (difBase > 0) bodyRowsRecibo.push(['Diferencia de Base / Horas Extras', formatearMoneda(difBase), '']);
          
          if (nomina.detalles_nomina && nomina.detalles_nomina.length > 0) {
            nomina.detalles_nomina.forEach(d => {
              // Solo mostrar conceptos QUE NO SEAN FISCALES
              if (!d.conceptos_nomina.es_fiscal) {
                const nombre = `${d.conceptos_nomina.clave} - ${d.conceptos_nomina.nombre_concepto}`;
                if (d.conceptos_nomina.tipo === 'Percepcion') {
                  bodyRowsRecibo.push([nombre, formatearMoneda(d.monto_aplicado), '']);
                } else {
                  bodyRowsRecibo.push([nombre, '', formatearMoneda(d.monto_aplicado)]);
                }
              }
            });
          }
          totalPagar = varEfectivo;
      } else {
          // Lote Real (El completo, suma de Base, consideraciones y deducciones reales)
          const baseReal = parseFloat(String(nomina.sueldo_base)) || 0;
          bodyRowsRecibo.push(['Sueldo Base', formatearMoneda(baseReal), '']);
          
          let totalPercep = 0;
          let totalDed = 0;
          if (nomina.detalles_nomina && nomina.detalles_nomina.length > 0) {
            nomina.detalles_nomina.forEach(d => {
              const nombre = `${d.conceptos_nomina.clave} - ${d.conceptos_nomina.nombre_concepto}`;
              if (d.conceptos_nomina.tipo === 'Percepcion') {
                bodyRowsRecibo.push([nombre, formatearMoneda(d.monto_aplicado), '']);
                totalPercep += parseFloat(String(d.monto_aplicado)) || 0;
              } else {
                bodyRowsRecibo.push([nombre, '', formatearMoneda(d.monto_aplicado)]);
                totalDed += parseFloat(String(d.monto_aplicado)) || 0;
              }
            });
          } else {
             const bonos = parseFloat(String(nomina.bonos)) || 0;
             const deducciones = parseFloat(String(nomina.deducciones)) || 0;
             if (bonos > 0) bodyRowsRecibo.push(['Aumentos/Bonos Extra', formatearMoneda(bonos), '']);
             if (deducciones > 0) bodyRowsRecibo.push(['Deducciones / Retenciones', '', formatearMoneda(deducciones)]);
             totalPercep = bonos;
             totalDed = deducciones;
          }
          
          totalPagar = Math.max(0, baseReal + totalPercep - totalDed);
      }

      // Table of details
      autoTable(doc, {
        startY: 75,
        head: [['Concepto', 'Percepciones (+)', 'Deducciones (-)']],
        body: bodyRowsRecibo,
        foot: [
          ['NETO A RECIBIR', formatearMoneda(totalPagar), '-']
        ],
        theme: 'striped',
        headStyles: { fillColor: tipo === 'Fiscal' ? [44, 62, 80] : [167, 49, 58], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 9 }
      });

      // --- Pie de Recibo & Firma ---
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('DECLARACIÓN: Recibí a mi entera satisfacción la cantidad neta indicada en este documento por concepto de mis salarios y prestaciones', 14, finalY);
      doc.text('devengados en el periodo señalado. No se me adeuda cantidad alguna por ningún concepto hasta la fecha.', 14, finalY + 4);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(70, finalY + 35, 140, finalY + 35);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(nomina.empleados.nombre_completo_empleado, 105, finalY + 40, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('FIRMA DE CONFORMIDAD DEL EMPLEADO', 105, finalY + 45, { align: 'center' });
    });

    doc.save(`Lote_Recibos_${tipo === 'Fiscal' ? 'Fiscales' : 'Real'}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="payroll-dashboard">
      <div className="dashboard-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2rem', margin: '0 0 5px 0' }}>
            <FaHistory style={{ color: 'var(--payroll-accent)' }}/> Historial Global de Nóminas
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Listado de Raya consolidado y descarga de recibos corporativos.</p>
          <Link to="/payroll-admin" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: 'var(--payroll-info)', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '10px' }}>
            <FaArrowLeft /> Volver a Generación de Nóminas
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => exportarRecibosLote('Fiscal')} className="btn-payroll btn-payroll-outline" style={{ borderColor: '#2c3e50', color: '#2c3e50' }}>
            <FaFilePdf /> Lote Fiscal
          </button>
          <button onClick={() => exportarRecibosLote('Real')} className="btn-payroll btn-payroll-outline" style={{ borderColor: 'var(--payroll-success)', color: 'var(--payroll-success)' }}>
            <FaFilePdf /> Lote Real
          </button>
          <button onClick={exportarPDFGlobal} className="btn-payroll btn-payroll-primary">
            <FaFilePdf /> Descargar Listado de Raya
          </button>
        </div>
      </div>

      <div className="payroll-summary-grid">
        <div className="payroll-summary-card">
          <h3>Costo Total Real</h3>
          <p>{formatearMoneda(filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.total_pagado)) || 0), 0))}</p>
        </div>
        <div className="payroll-summary-card">
          <h3>Costo Social (Est.)</h3>
          <p style={{ color: 'var(--payroll-info)' }}>{formatearMoneda(filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.monto_reportado_fiscal)) || 0), 0) * 0.32)}</p>
        </div>
        <div className="payroll-summary-card">
          <h3>Desembolso Total</h3>
          <p style={{ color: 'var(--payroll-success)' }}>{formatearMoneda(filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.total_pagado)) || 0), 0) + (filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.monto_reportado_fiscal)) || 0), 0) * 0.32))}</p>
        </div>
        <div className="payroll-summary-card">
          <h3>Dispersion Bancaria</h3>
          <p style={{ color: '#2c3e50' }}>{formatearMoneda(filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.monto_reportado_fiscal)) || 0), 0))}</p>
        </div>
      </div>

      <div className="payroll-focus-toolbar" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" placeholder="Buscar empleado..." value={filterNombre} onChange={e => setFilterNombre(e.target.value)}
              className="payroll-input-currency" style={{ width: '100%', paddingLeft: '35px', boxSizing: 'border-box' }}
            />
          </div>
          <input 
            type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)}
            className="payroll-input-currency" style={{ minWidth: '160px' }}
          />
        </div>
        <button onClick={() => { setFilterNombre(''); setFilterMes(''); }} className="btn-payroll btn-payroll-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Limpiar Filtros
        </button>
      </div>

      <div className="payroll-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><FaSpinner className="spin" /> Cargando bitácora de nóminas...</div>
        ) : (
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Emisión</th>
                <th>Periodo</th>
                <th>Empleado</th>
                <th style={{ textAlign: 'right' }}>Total Pagado ($)</th>
                <th style={{ textAlign: 'right', color: 'var(--payroll-success)' }}>Fiscal Banco ($)</th>
                <th style={{ textAlign: 'right', color: 'var(--payroll-accent)' }}>CASH ($)</th>
                <th style={{ textAlign: 'center' }}>SAT</th>
              </tr>
            </thead>
            <tbody>
              {filteredNominas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No se han generado nóminas en este periodo.</td></tr>
              ) : (
                filteredNominas.map(n => (
                  <tr key={n.idnomina}>
                    <td style={{ fontWeight: 'bold', color: '#64748b' }}>#{n.idnomina.toString().padStart(5, '0')}</td>
                    <td>{new Date(n.fecha_emision).toLocaleDateString('es-MX')}</td>
                    <td style={{ fontSize: '0.85rem' }}>{formatearFecha(n.fecha_inicio)} al {formatearFecha(n.fecha_fin)}</td>
                    <td style={{ fontWeight: '600' }}>{n.empleados.nombre_completo_empleado}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatearMoneda(n.total_pagado)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--payroll-success)', fontWeight: 'bold' }}>{formatearMoneda(n.monto_reportado_fiscal)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--payroll-accent)', fontWeight: 'bold' }}>{formatearMoneda(n.monto_variacion_complemento)}</td>
                    <td style={{ textAlign: 'center' }}>
                        {n.uuid_sat ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <a href={`http://${window.location.hostname}:4000${n.pdf_url}`} target="_blank" rel="noreferrer" title="Ver PDF" style={{ color: '#ef4444' }}><FaFilePdf /></a>
                                <a href={`http://${window.location.hostname}:4000${n.xml_url}`} target="_blank" rel="noreferrer" title="Bajar XML" style={{ color: '#3b82f6' }}><FaFileCode /></a>
                            </div>
                        ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PayrollHistory;
