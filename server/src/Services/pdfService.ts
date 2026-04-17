import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export const generateNominaPDF = async (payoutData: any, timbradoData: any): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const storageDir = path.join(process.cwd(), 'storage', 'cfdi', 'pdf');
            
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }

            const fileName = `nomina_${payoutData.idnomina}_${Date.now()}.pdf`;
            const filePath = path.join(storageDir, fileName);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // --- Header ---
            doc.fontSize(16).text('EMPRESA MUEBLERA OCOTLAN SA DE CV', { align: 'center' });
            doc.fontSize(10).text('RFC: AAA010101AAA | Registro Patronal: MOCK-REG-123', { align: 'center' });
            doc.text('Regimen Fiscal: 601 - General de Ley Personas Morales', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text('RECIBO DE NÓMINA', { align: 'center', underline: true });
            doc.moveDown();

            // --- Employee Info ---
            doc.fontSize(10);
            doc.text(`Empleado: ${payoutData.empleado_nombre} (${payoutData.idempleado})`);
            doc.text(`RFC: ${payoutData.empleado_rfc || 'N/A'} | CURP: ${payoutData.empleado_curp || 'N/A'}`);
            doc.text(`Periodo: ${payoutData.fecha_inicio.toLocaleDateString()} al ${payoutData.fecha_fin.toLocaleDateString()}`);
            doc.text(`Días Pagados: ${payoutData.dias_trabajados} | SDI: $${payoutData.sdi}`);
            doc.moveDown();

            // --- Concepts Table ---
            const tableTop = 230;
            doc.text('Concepto', 50, tableTop, { bold: true });
            doc.text('Percepciones', 300, tableTop, { align: 'right' });
            doc.text('Deducciones', 450, tableTop, { align: 'right' });
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            let currentY = tableTop + 25;
            
            // Sueldo Base
            doc.text('Sueldo Base', 50, currentY);
            doc.text(`$${payoutData.sueldo_base}`, 300, currentY, { align: 'right' });
            currentY += 15;

            // Details
            if (payoutData.detalles_nomina) {
                for (const det of payoutData.detalles_nomina) {
                    doc.text(det.conceptos_nomina.nombre_concepto, 50, currentY);
                    if (det.conceptos_nomina.tipo === 'Percepcion') {
                        doc.text(`$${det.monto_applied || det.monto_aplicado}`, 300, currentY, { align: 'right' });
                    } else {
                        doc.text(`$${det.monto_applied || det.monto_aplicado}`, 450, currentY, { align: 'right' });
                    }
                    currentY += 15;
                }
            }

            doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).stroke();
            currentY += 20;

            doc.fontSize(11).text('TOTAL NETO:', 300, currentY, { bold: true });
            doc.text(`$${payoutData.total_pagado}`, 450, currentY, { align: 'right', bold: true });

            // --- SAT Metadata ---
            const satY = 550;
            doc.fontSize(8);
            doc.text(`Folio Fiscal (UUID): ${timbradoData.uuid}`, 50, satY);
            doc.text(`No. Certificado SAT: ${timbradoData.certificado}`, 50, satY + 12);
            doc.text(`Fecha Timbrado: ${timbradoData.fechaTimbrado.toLocaleString()}`, 50, satY + 24);
            
            // QR Code
            const qrData = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${timbradoData.uuid}&re=AAA010101AAA&rr=${payoutData.empleado_rfc}&tt=${payoutData.total_pagado}`;
            const qrBuffer = await QRCode.toBuffer(qrData);
            doc.image(qrBuffer, 460, satY - 20, { width: 80 });

            // Footer
            doc.fontSize(7).text('Este documento es una representación impresa de un CFDI 4.0', 50, doc.page.height - 50, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve(`/storage/cfdi/pdf/${fileName}`));
            stream.on('error', (err) => reject(err));
        } catch (error) {
            reject(error);
        }
    });
};
