import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { prisma } from '../prisma';

export const generatePayrollPDF = (res: Response, data: any): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            // Fetch Company Name from DB
            const config = await prisma.sys_config.findUnique({ where: { key: 'COMPANY_NAME' } });
            const companyName = config?.value || 'STARTIA';

            const doc = new PDFDocument({ 
                margin: 40, 
                size: 'LETTER',
            });

            // Handle stream errors
            res.on('error', (err) => reject(err));
            doc.on('error', (err) => reject(err));

            doc.pipe(res);

            // --- Header Section ---
            doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text(companyName.toUpperCase(), 40, 40);
            
            doc.fillColor('#64748b').fontSize(8).font('Helvetica');
            doc.text('RFC: STR1240325A1B | Calle Principal #123, Ciudad de México', 40, 65);
            doc.text('Registro Patronal IMSS: A12-34567-89-0', 40, 77);

            doc.fillColor('#A7313A').fontSize(16).font('Helvetica-Bold').text('RECIBO DE PAGO (NÓMINA REAL)', 40, 100);

            doc.moveTo(40, 125).lineTo(572, 125).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

            // --- Employee & Period Info (Side by Side) ---
            const infoY = 145;
            
            doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('DATOS DEL EMPLEADO', 40, infoY);
            doc.moveTo(40, infoY + 12).lineTo(280, infoY + 12).strokeColor('#1e293b').lineWidth(1).stroke();
            
            doc.font('Helvetica').fontSize(9).fillColor('#000000');
            doc.text(`Nombre: ${data.empleados?.nombre_completo_empleado || 'No registrado'}`, 40, infoY + 22);
            doc.text(`RFC: ${data.empleados?.rfc || 'N/A'}`, 40, infoY + 34);
            doc.text(`CURP: ${data.empleados?.curp || 'N/A'}`, 40, infoY + 46);

            doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b').text('PERIODO DE PAGO', 350, infoY);
            doc.moveTo(350, infoY + 12).lineTo(572, infoY + 12).strokeColor('#1e293b').lineWidth(1).stroke();
            
            doc.font('Helvetica').fontSize(9).fillColor('#000000');
            doc.text(`Del: ${new Date(data.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`, 350, infoY + 22);
            doc.text(`Al: ${new Date(data.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`, 350, infoY + 34);
            doc.text(`Folio: #${String(data.idnomina).padStart(6, '0')}`, 350, infoY + 46);

            // --- Concepts Table ---
            const tableTop = 230;
            doc.rect(40, tableTop, 532, 22).fill('#A7313A');
            doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
            doc.text('Concepto', 55, tableTop + 7);
            doc.text('Percepciones (+)', 280, tableTop + 7, { align: 'center', width: 140 });
            doc.text('Deducciones (-)', 430, tableTop + 7, { align: 'center', width: 140 });

            let currentY = tableTop + 22;
            doc.fillColor('#000000').font('Helvetica').fontSize(9);

            const rows = [
                { label: 'Sueldo Base', p: Number(data.sueldo_base), d: 0 },
                { label: 'Compensaciones y Bonos', p: Number(data.bonos), d: 0 },
                { label: 'Deducciones Generales', p: 0, d: Number(data.deducciones) }
            ];

            rows.forEach((row, i) => {
                if (row.p > 0 || row.d > 0) {
                    doc.rect(40, currentY, 532, 22).fill(i % 2 === 0 ? '#ffffff' : '#f8fafc');
                    doc.fillColor('#000000').text(row.label, 55, currentY + 7);
                    doc.text(row.p > 0 ? `$${row.p.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-', 280, currentY + 7, { align: 'center', width: 140 });
                    doc.text(row.d > 0 ? `$${row.d.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-', 430, currentY + 7, { align: 'center', width: 140 });
                    currentY += 22;
                }
            });

            doc.rect(40, currentY, 532, 30).fill('#f1f5f9');
            doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text('NETO A RECIBIR', 55, currentY + 10);
            doc.fillColor('#A7313A').text(`$${Number(data.total_pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 280, currentY + 10, { align: 'center', width: 140 });
            doc.fillColor('#1e293b').text('-', 430, currentY + 10, { align: 'center', width: 140 });

            doc.moveDown(5);
            doc.fillColor('#64748b').fontSize(8.5).font('Helvetica');
            doc.text('DECLARACIÓN: Recibí a mi entera satisfacción la cantidad neta indicada en este documento por concepto de mis salarios y prestaciones devengados en el periodo señalado. No se me adeuda cantidad alguna por ningún concepto hasta la fecha.', 40, doc.y, { align: 'justify', width: 532, lineGap: 2 });

            const signatureY = 600;
            doc.moveTo(190, signatureY).lineTo(422, signatureY).strokeColor('#1e293b').lineWidth(0.8).stroke();
            doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(data.empleados?.nombre_completo_empleado || 'No registrado', 190, signatureY + 8, { align: 'center', width: 232 });
            doc.fontSize(8.5).font('Helvetica').text('FIRMA DE CONFORMIDAD DEL EMPLEADO', 190, signatureY + 22, { align: 'center', width: 232 });

            doc.end();

            // Wait for the stream to finish
            res.on('finish', () => resolve());
            
        } catch (error) {
            console.error('PDF Generation Error:', error);
            reject(error);
        }
    });
};
