import React, { useState, useEffect } from 'react';
import { FaFileInvoiceDollar, FaDownload, FaHistory, FaCheckCircle } from 'react-icons/fa';
import './styles/Dashboard.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Nomina {
  idnomina: number;
  fecha_emision: string;
  fecha_inicio: string;
  fecha_fin: string;
  sueldo_base: string;
  bonos: string;
  deducciones: string;
  total_pagado: string;
  metodo_pago: string;
  estado: string;
  detalles_nomina?: DetalleNomina[];
}

interface DetalleNomina {
  monto_aplicado: string | number;
  conceptos_nomina: {
    nombre_concepto: string;
    clave: string;
    tipo: string;
  };
}

const MyPayroll: React.FC = () => {
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener nombre del usuario desde localStorage para el PDF
  const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
  const userName = sessionData?.user?.nombre_completo_empleado || sessionData?.nombre || 'Empleado';

  useEffect(() => {
    fetchMisNominas();
  }, []);

  const fetchMisNominas = async () => {
    try {
      const token = sessionData?.token;
      const host = window.location.hostname;
      
      const res = await fetch(`http://${host}:4000/api/nominas/mis-nominas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNominas(data);
      }
    } catch (error) {
      console.error('Error fetching mis nóminas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor: string | number) => {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    return `$${(num || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatearFecha = (fechaStr: string) => {
    const date = new Date(fechaStr);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const descargarPDF = (nomina: Nomina) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(167, 49, 58); // var(--color-accent)
    doc.text('Recibo de Nómina Corporativo', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Folio de Recibo: #${nomina.idnomina.toString().padStart(6, '0')}`, 14, 30);
    doc.text(`Fecha de Emisión: ${formatearFecha(nomina.fecha_emision)}`, 14, 35);
    
    // Employee Data
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Datos del Empleado:', 14, 45);
    doc.setFontSize(10);
    doc.text(`Nombre: ${userName}`, 14, 52);
    // You could put RFC/CURP here if you fetch it
    
    doc.setFontSize(12);
    doc.text('Periodo de Pago:', 120, 45);
    doc.setFontSize(10);
    doc.text(`Del: ${formatearFecha(nomina.fecha_inicio)}`, 120, 52);
    doc.text(`Al: ${formatearFecha(nomina.fecha_fin)}`, 120, 57);
    doc.text(`Estado: ${nomina.estado}`, 120, 62);

    const bodyRows: any[] = [
      ['Sueldo Base del Periodo', formatearMoneda(nomina.sueldo_base), '']
    ];

    if (nomina.detalles_nomina && nomina.detalles_nomina.length > 0) {
      nomina.detalles_nomina.forEach(d => {
        const nombre = `${d.conceptos_nomina.clave} - ${d.conceptos_nomina.nombre_concepto}`;
        if (d.conceptos_nomina.tipo === 'Percepcion') {
          bodyRows.push([nombre, formatearMoneda(d.monto_aplicado), '']);
        } else {
          bodyRows.push([nombre, '', formatearMoneda(d.monto_aplicado)]);
        }
      });
    } else {
      if (parseFloat(nomina.bonos) > 0) bodyRows.push(['Bonos / Compensaciones', formatearMoneda(nomina.bonos), '']);
      if (parseFloat(nomina.deducciones) > 0) bodyRows.push(['Deducciones / Retenciones', '', formatearMoneda(nomina.deducciones)]);
    }

    // Table of details
    autoTable(doc, {
      startY: 75,
      head: [['Concepto', 'Percepciones', 'Deducciones']],
      body: bodyRows,
      foot: [
        ['TOTAL NETO A PAGAR', formatearMoneda(parseFloat(nomina.sueldo_base) + parseFloat(nomina.bonos)), formatearMoneda(nomina.deducciones)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [167, 49, 58], textColor: 255 },
      footStyles: { fillColor: [248, 249, 250], textColor: 0, fontStyle: 'bold' }
    });

    // Final total text
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.setTextColor(31, 133, 75); // success green
    doc.text(`Total Depositado: ${formatearMoneda(nomina.total_pagado)}`, 14, finalY + 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Método de Pago: ${nomina.metodo_pago}`, 14, finalY + 22);

    // Signature line
    doc.setLineWidth(0.5);
    doc.line(70, finalY + 50, 140, finalY + 50);
    doc.text('Firma del Empleado', 90, finalY + 55);

    doc.save(`Recibo_Nomina_${nomina.idnomina}_${userName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaFileInvoiceDollar style={{ color: 'var(--color-accent)' }}/> Mis Recibos de Nómina
          </h1>
          <p>Consulta el historial de tus pagos y descarga tus comprobantes.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)' }}>Cargando tus nóminas...</div>
      ) : nominas.length === 0 ? (
        <div className="dashboard-panel" style={{ textAlign: 'center', padding: '50px' }}>
          <FaHistory style={{ fontSize: '3rem', color: '#ccc', marginBottom: '15px' }} />
          <h3 style={{ color: 'var(--color-primary)' }}>Aún no tienes nóminas registradas</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Tus recibos de pago aparecerán aquí conforme el área contable los genere.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {nominas.map(nomina => (
            <div key={nomina.idnomina} className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', padding: '20px', borderTop: '4px solid var(--color-accent)', transition: 'transform 0.2s', cursor: 'default' }} 
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Periodo</div>
                  <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                    {formatearFecha(nomina.fecha_inicio)} al {formatearFecha(nomina.fecha_fin)}
                  </div>
                </div>
                <div style={{ backgroundColor: '#e2f5e9', color: '#1f854b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCheckCircle /> {nomina.estado}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Sueldo Base:</span>
                <span>{formatearMoneda(nomina.sueldo_base)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Bonos:</span>
                <span style={{ color: 'var(--color-accent)' }}>+ {formatearMoneda(nomina.bonos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Deducciones:</span>
                <span style={{ color: '#d9534f' }}>- {formatearMoneda(nomina.deducciones)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-light)', padding: '12px', borderRadius: '8px', marginTop: 'auto', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Total Depositado:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f854b' }}>{formatearMoneda(nomina.total_pagado)}</span>
              </div>

              <button 
                onClick={() => descargarPDF(nomina)}
                style={{
                  width: '100%',
                  backgroundColor: 'white',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = 'var(--color-accent)';
                }}
              >
                <FaDownload /> Descargar Recibo PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPayroll;
