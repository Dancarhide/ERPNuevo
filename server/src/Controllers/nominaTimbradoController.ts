import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { timbrarNominaSimulation, saveXmlToStorage } from '../Services/timbradoService';
import { generateNominaPDF } from '../Services/pdfService';

const prisma = new PrismaClient();

/**
 * Stamps a payroll record, generating XML and PDF.
 */
export const timbrarNomina = async (req: Request, res: Response): Promise<void> => {
    const { idnomina } = req.params;

    try {
        const idNomNum = parseInt(idnomina as string);
        if (isNaN(idNomNum)) {
            res.status(400).json({ error: 'ID de nómina inválido' });
            return;
        }

        // 1. Fetch payroll data including employee and concepts
        const nomina = await prisma.nominas.findUnique({
            where: { idnomina: idNomNum },
            include: {
                empleados: {
                    select: {
                        nombre_completo_empleado: true,
                        rfc: true,
                        curp: true
                    }
                },
                detalles_nomina: {
                    include: {
                        conceptos_nomina: true
                    }
                }
            }
        });

        if (!nomina) {
            res.status(404).json({ error: 'Nómina no encontrada' });
            return;
        }

        if (nomina.uuid_sat) {
            res.status(400).json({ error: 'Esta nómina ya ha sido timbrada' });
            return;
        }

        // 2. Map data for the services
        const payoutData = {
            idnomina: nomina.idnomina,
            idempleado: nomina.idempleado,
            empleado_nombre: nomina.empleados.nombre_completo_empleado,
            empleado_rfc: nomina.empleados.rfc,
            empleado_curp: nomina.empleados.curp,
            fecha_emision: nomina.fecha_emision,
            fecha_inicio: nomina.fecha_inicio,
            fecha_fin: nomina.fecha_fin,
            sueldo_base: Number(nomina.sueldo_base),
            deducciones: Number(nomina.deducciones),
            total_pagado: Number(nomina.total_pagado),
            dias_trabajados: nomina.dias_trabajados,
            sdi: Number(nomina.sdi),
            detalles_nomina: nomina.detalles_nomina
        };

        // 3. Simulate Stamping (Timbrado)
        const timbradoResult = await timbrarNominaSimulation(payoutData);

        // 4. Generate XML and PDF files
        const xmlUrl = await saveXmlToStorage(nomina.idnomina, timbradoResult.xml);
        const pdfUrl = await generateNominaPDF(payoutData, timbradoResult);

        // 5. Update Database
        const updatedNomina = await prisma.nominas.update({
            where: { idnomina: idNomNum },
            data: {
                uuid_sat: timbradoResult.uuid,
                xml_url: xmlUrl,
                pdf_url: pdfUrl,
                estatus_sat: 'Timbrado',
                fecha_timbrado: timbradoResult.fechaTimbrado,
                sello_sat: timbradoResult.sello,
                certificado_sat: timbradoResult.certificado
            }
        });

        res.json({
            message: 'Nómina timbrada exitosamente',
            uuid: updatedNomina.uuid_sat,
            pdfUrl: updatedNomina.pdf_url,
            xmlUrl: updatedNomina.xml_url
        });
    } catch (error) {
        console.error('Error al timbrar nómina:', error);
        res.status(500).json({ error: 'Error interno al procesar el timbrado' });
    }
};

/**
 * Bulk stamping for a list of payroll IDs.
 */
export const timbrarNominasBulk = async (req: Request, res: Response): Promise<void> => {
    const { idsnominas } = req.body; // Array of IDs

    if (!Array.isArray(idsnominas) || idsnominas.length === 0) {
        res.status(400).json({ error: 'Se requiere un array de IDs de nómina' });
        return;
    }

    const results = [];
    const errors = [];

    for (const id of idsnominas) {
        try {
            // Reusing the logic (abstracted would be better, but for speed keeping it here)
            // Note: In production, this should be an async queue or highly optimized
            const nomina = await prisma.nominas.findUnique({
                where: { idnomina: id },
                include: { empleados: true, detalles_nomina: { include: { conceptos_nomina: true } } }
            });

            if (!nomina || nomina.uuid_sat) continue;

            const payoutData = {
                idnomina: nomina.idnomina,
                idempleado: nomina.idempleado,
                empleado_nombre: nomina.empleados.nombre_completo_empleado,
                empleado_rfc: nomina.empleados.rfc,
                empleado_curp: nomina.empleados.curp,
                fecha_emision: nomina.fecha_emision,
                fecha_inicio: nomina.fecha_inicio,
                fecha_fin: nomina.fecha_fin,
                sueldo_base: Number(nomina.sueldo_base),
                deducciones: Number(nomina.deducciones),
                total_pagado: Number(nomina.total_pagado),
                dias_trabajados: nomina.dias_trabajados,
                sdi: Number(nomina.sdi),
                detalles_nomina: nomina.detalles_nomina
            };

            const timbradoResult = await timbrarNominaSimulation(payoutData);
            const xmlUrl = await saveXmlToStorage(nomina.idnomina, timbradoResult.xml);
            const pdfUrl = await generateNominaPDF(payoutData, timbradoResult);

            await prisma.nominas.update({
                where: { idnomina: id },
                data: {
                    uuid_sat: timbradoResult.uuid,
                    xml_url: xmlUrl,
                    pdf_url: pdfUrl,
                    estatus_sat: 'Timbrado',
                    fecha_timbrado: timbradoResult.fechaTimbrado,
                    sello_sat: timbradoResult.sello,
                    certificado_sat: timbradoResult.certificado
                }
            });
            results.push(id);
        } catch (err) {
            errors.push({ id, error: (err as Error).message });
        }
    }

    res.json({
        processed: results.length,
        failed: errors.length,
        ids: results,
        errors
    });
};

/**
 * Stamps an entire batch (lote) of payroll IDs.
 */
export const timbrarLote = async (req: Request, res: Response): Promise<void> => {
    const { loteId } = req.params;

    try {
        const nominas = await prisma.nominas.findMany({
            where: { lote_id: loteId as string, uuid_sat: null },
            select: { idnomina: true }
        });

        if (nominas.length === 0) {
            res.status(404).json({ error: 'No hay nóminas pendientes de timbrar en este lote o el lote no existe.' });
            return;
        }

        const idsnominas = nominas.map(n => n.idnomina);
        
        // Use an internal function call approach or reuse the bulk logic
        // For simplicity and to avoid circular deps or complex refactoring, we use the bulk logic logic:
        const results = [];
        const errors = [];

        for (const id of idsnominas) {
            try {
                const nFull = await prisma.nominas.findUnique({
                    where: { idnomina: id },
                    include: { empleados: true, detalles_nomina: { include: { conceptos_nomina: true } } }
                });

                if (!nFull) continue;

                const payoutData = {
                    idnomina: nFull.idnomina,
                    idempleado: nFull.idempleado,
                    empleado_nombre: nFull.empleados.nombre_completo_empleado,
                    empleado_rfc: nFull.empleados.rfc,
                    empleado_curp: nFull.empleados.curp,
                    fecha_emision: nFull.fecha_emision,
                    fecha_inicio: nFull.fecha_inicio,
                    fecha_fin: nFull.fecha_fin,
                    sueldo_base: Number(nFull.sueldo_base),
                    deducciones: Number(nFull.deducciones),
                    total_pagado: Number(nFull.total_pagado),
                    dias_trabajados: nFull.dias_trabajados,
                    sdi: Number(nFull.sdi),
                    detalles_nomina: nFull.detalles_nomina
                };

                const timbradoResult = await timbrarNominaSimulation(payoutData);
                const xmlUrl = await saveXmlToStorage(nFull.idnomina, timbradoResult.xml);
                const pdfUrl = await generateNominaPDF(payoutData, timbradoResult);

                await prisma.nominas.update({
                    where: { idnomina: id },
                    data: {
                        uuid_sat: timbradoResult.uuid,
                        xml_url: xmlUrl,
                        pdf_url: pdfUrl,
                        estatus_sat: 'Timbrado',
                        fecha_timbrado: timbradoResult.fechaTimbrado,
                        sello_sat: timbradoResult.sello,
                        certificado_sat: timbradoResult.certificado
                    }
                });
                results.push(id);
            } catch (err) {
                errors.push({ id, error: (err as Error).message });
            }
        }

        res.json({
            message: `Lote ${loteId} procesado.`,
            processed: results.length,
            failed: errors.length,
            ids: results,
            errors
        });

    } catch (error) {
        console.error('Error al timbrar lote:', error);
        res.status(500).json({ error: 'Error interno al timbrar lote' });
    }
};

