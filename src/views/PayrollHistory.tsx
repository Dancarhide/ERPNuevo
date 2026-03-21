import React, { useState, useEffect } from 'react';
import { FaHistory, FaFilePdf, FaSearch, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import './styles/Dashboard.css';
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
  };
}

const PayrollHistory: React.FC = () => {
  const [nominas, setNominas] = useState<NominaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterMes, setFilterMes] = useState('');

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

  const exportarRecibosLote = (tipo: 'Fiscal' | 'Real') => {
    if (filteredNominas.length === 0) return alert('No hay registros para exportar');
    
    const doc = new jsPDF();
    
    filteredNominas.forEach((nomina, index) => {
      if (index > 0) doc.addPage(); // Añadir página nueva para el siguiente empleado
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(167, 49, 58); // var(--color-accent)
      doc.text(tipo === 'Fiscal' ? 'Recibo de Nómina (Fiscal)' : 'Recibo de Pago (Complemento/Real)', 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Folio de Recibo: #${nomina.idnomina.toString().padStart(6, '0')}`, 14, 30);
      doc.text(`Fecha de Emisión: ${formatearFecha(nomina.fecha_emision)}`, 14, 35);
      
      // Employee Data
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Datos del Empleado:', 14, 45);
      doc.setFontSize(10);
      doc.text(`Nombre: ${nomina.empleados.nombre_completo_empleado}`, 14, 52);
      doc.text(`CURP: ${nomina.empleados.curp || 'N/A'}`, 14, 57);
      
      doc.setFontSize(12);
      doc.text('Periodo de Pago:', 120, 45);
      doc.setFontSize(10);
      doc.text(`Del: ${formatearFecha(nomina.fecha_inicio)}`, 120, 52);
      doc.text(`Al: ${formatearFecha(nomina.fecha_fin)}`, 120, 57);
      doc.text(`Estado: ${nomina.estado}`, 120, 62);

      const bodyRowsRecibo: any[] = [];
      let totalPagar = 0;

      if (tipo === 'Fiscal') {
          const fiscal = parseFloat(String(nomina.monto_reportado_fiscal)) || 0;
          bodyRowsRecibo.push(['Sueldo Base del Periodo (Fiscal)', formatearMoneda(fiscal), '']);
          
          let totalDed = 0;
          if (nomina.detalles_nomina && nomina.detalles_nomina.length > 0) {
            nomina.detalles_nomina.forEach(d => {
              if (d.conceptos_nomina.tipo === 'Deduccion') {
                const nombre = `${d.conceptos_nomina.clave} - ${d.conceptos_nomina.nombre_concepto}`;
                bodyRowsRecibo.push([nombre, '', formatearMoneda(d.monto_aplicado)]);
                totalDed += parseFloat(String(d.monto_aplicado)) || 0;
              }
            });
          } else {
             const deducciones = parseFloat(String(nomina.deducciones)) || 0;
             if (deducciones > 0) {
               bodyRowsRecibo.push(['Deducciones / Retenciones', '', formatearMoneda(deducciones)]);
             }
             totalDed = deducciones;
          }
          
          totalPagar = Math.max(0, fiscal - totalDed);
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
        head: [['Concepto', 'Percepciones', 'Deducciones']],
        body: bodyRowsRecibo,
        foot: [
          ['TOTAL NETO A PAGAR', formatearMoneda(totalPagar), '-']
        ],
        theme: 'grid',
        headStyles: { fillColor: tipo === 'Fiscal' ? [44, 62, 80] : [167, 49, 58], textColor: 255 },
        footStyles: { fillColor: [248, 249, 250], textColor: 0, fontStyle: 'bold' }
      });

      // Final total text
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      doc.setFontSize(14);
      doc.setTextColor(31, 133, 75); // success green
      doc.text(`Total Depositado: ${formatearMoneda(totalPagar)}`, 14, finalY + 15);
      
      // Signature line
      doc.setLineWidth(0.5);
      doc.line(70, finalY + 50, 140, finalY + 50);
      doc.text('Firma del Empleado', 90, finalY + 55);
    });

    doc.save(`Lote_Recibos_${tipo === 'Fiscal' ? 'Fiscales' : 'Real'}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem', margin: '0 0 5px 0' }}>
            <FaHistory style={{ color: 'var(--color-accent)' }}/> Historial Global de Nóminas
          </h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Consulta todos los pagos realizados e imprime el Listado de Raya (Reporte Consolidado) o los Recibos Individuales.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => exportarRecibosLote('Fiscal')}
            style={{
              backgroundColor: 'white', color: '#2c3e50', border: '2px solid #2c3e50', padding: '10px 16px',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.95rem',
              transition: 'all 0.1s'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#2c3e50'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#2c3e50'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <FaFilePdf size={16} /> Lote Fiscal (IMSS)
          </button>
          
          <button 
            onClick={() => exportarRecibosLote('Real')}
            style={{
              backgroundColor: 'white', color: 'var(--color-accent)', border: '2px solid var(--color-accent)', padding: '10px 16px',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.95rem',
              transition: 'all 0.1s'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <FaFilePdf size={16} /> Lote Efectivo/Real
          </button>
          
          <button 
            onClick={exportarPDFGlobal}
            style={{
              backgroundColor: 'var(--color-accent)', color: 'white', border: 'none', padding: '12px 24px',
              borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1rem',
              boxShadow: '0 4px 6px rgba(167, 49, 58, 0.25)', transition: 'transform 0.1s, boxShadow 0.1s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FaFilePdf size={18} /> Descargar Reporte Global (Listado)
          </button>
        </div>
      </div>

      <div className="dashboard-panel" style={{ marginBottom: '25px', display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '20px', backgroundColor: '#f8f9fa', borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666' }}>Resumen Neto (Suma de Listado)</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {formatearMoneda(filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.total_pagado)) || 0), 0))}
          </p>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666' }}>Carga Patronal (Aprox. 27% s/Fiscal)</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#a7313a' }}>
            {formatearMoneda(filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.monto_reportado_fiscal)) || 0), 0) * 0.27)} 
            <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: '#666', marginLeft: '5px'}}>(IMSS, ISN, Infonavit)</span>
          </p>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666' }}>Costo Total Empresa</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f854b' }}>
            {formatearMoneda(filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.total_pagado)) || 0), 0) + (filteredNominas.reduce((acc, n) => acc + (parseFloat(String(n.monto_reportado_fiscal)) || 0), 0) * 0.27))}
          </p>
        </div>
      </div>

      <div className="dashboard-panel" style={{ marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap', padding: '20px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Buscar por Empleado</label>
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
            <input 
              type="text" placeholder="Ej. Juan Pérez" value={filterNombre} onChange={e => setFilterNombre(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', fontSize: '1rem' }} 
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Filtrar por Mes (Emisión)</label>
          <input 
            type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)}
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s', fontSize: '1rem', color: '#333' }} 
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = '#ddd'}
          />
        </div>
        <div>
            <button 
              onClick={() => { setFilterNombre(''); setFilterMes(''); }} 
              style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f9fa', color: '#555', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', fontSize: '0.95rem' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e9ecef'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; }}
            >
              Limpiar Filtros
            </button>
        </div>
      </div>

      <div className="dashboard-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}><FaSpinner className="spin" /> Cargando historial...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-accent)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '12px 8px' }}>Folio</th>
                <th style={{ padding: '12px 8px' }}>Fecha Emisión</th>
                <th style={{ padding: '12px 8px' }}>Periodo (Inicio - Fin)</th>
                <th style={{ padding: '12px 8px' }}>Empleado</th>
                <th style={{ padding: '12px 8px' }}>T. Pagado ($)</th>
                <th style={{ padding: '12px 8px', color: '#1f854b' }}>Fiscal Reportado ($)</th>
                <th style={{ padding: '12px 8px', color: '#a7313a' }}>Variación Efectivo ($)</th>
              </tr>
            </thead>
            <tbody>
              {filteredNominas.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron registros de nómina.</td></tr>
              ) : (
                filteredNominas.map(n => (
                  <tr key={n.idnomina} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>#{n.idnomina.toString().padStart(5, '0')}</td>
                    <td style={{ padding: '12px 8px' }}>{new Date(n.fecha_emision).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td style={{ padding: '12px 8px', fontSize: '0.9rem' }}>{formatearFecha(n.fecha_inicio)} - {formatearFecha(n.fecha_fin)}</td>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{n.empleados.nombre_completo_empleado}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatearMoneda(n.total_pagado)}</td>
                    <td style={{ padding: '12px 8px', color: '#1f854b', fontWeight: 'bold' }}>{formatearMoneda(n.monto_reportado_fiscal)}</td>
                    <td style={{ padding: '12px 8px', color: '#a7313a', fontWeight: 'bold' }}>{formatearMoneda(n.monto_variacion_complemento)}</td>
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
