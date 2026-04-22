import { Request, Response } from 'express';
import { prisma } from '../prisma'; // Usar el singleton compartido — no crear nueva instancia
import { timbrarNominaSimulation, saveXmlToStorage } from '../Services/timbradoService';
import { generateNominaPDF } from '../Services/pdfService';

// --- Helper privado para no duplicar la lógica de timbrado ---
async function _procesarUnaNomina(id: number): Promise<void> {
    const nomina = await prisma.nominas.findUnique({
        where: { idnomina: id },
        include: {
            empleados: {
                select: {
                    nombre_completo_empleado: true,
                    rfc: true,
                    curp: true
                }
            },
            detalles_nomina: {
                include: { conceptos_nomina: true }
            }
        }
    });

    if (!nomina || nomina.uuid_sat) return; // Ya timbrada o no existe — skip silencioso

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
}

/**
 * Timbra una nómina individual por ID.
 */
export const timbrarNomina = async (req: Request, res: Response): Promise<void> => {
    const { idnomina } = req.params;

    try {
        const idNomNum = parseInt(idnomina as string);
        if (isNaN(idNomNum)) {
            res.status(400).json({ error: 'ID de nómina inválido' });
            return;
        }

        // Verificar existencia y estado antes de procesar
        const nomina = await prisma.nominas.findUnique({ where: { idnomina: idNomNum } });
        if (!nomina) {
            res.status(404).json({ error: 'Nómina no encontrada' });
            return;
        }
        if (nomina.uuid_sat) {
            res.status(400).json({ error: 'Esta nómina ya ha sido timbrada' });
            return;
        }

        await _procesarUnaNomina(idNomNum);

        const updatedNomina = await prisma.nominas.findUnique({ where: { idnomina: idNomNum } });
        res.json({
            message: 'Nómina timbrada exitosamente',
            uuid: updatedNomina?.uuid_sat,
            pdfUrl: updatedNomina?.pdf_url,
            xmlUrl: updatedNomina?.xml_url
        });
    } catch (error) {
        console.error('Error al timbrar nómina:', error);
        res.status(500).json({ error: 'Error interno al procesar el timbrado' });
    }
};

/**
 * Timbrado masivo para una lista de IDs de nómina.
 */
export const timbrarNominasBulk = async (req: Request, res: Response): Promise<void> => {
    const { idsnominas } = req.body;

    if (!Array.isArray(idsnominas) || idsnominas.length === 0) {
        res.status(400).json({ error: 'Se requiere un array de IDs de nómina' });
        return;
    }

    const results: number[] = [];
    const errors: { id: number; error: string }[] = [];

    for (const id of idsnominas) {
        try {
            await _procesarUnaNomina(id);
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
 * Timbra todas las nóminas pendientes de un lote completo.
 */
export const timbrarLote = async (req: Request, res: Response): Promise<void> => {
    const { loteId } = req.params;

    try {
        const nominasPendientes = await prisma.nominas.findMany({
            where: { lote_id: loteId as string, uuid_sat: null },
            select: { idnomina: true }
        });

        if (nominasPendientes.length === 0) {
            res.status(404).json({ error: 'No hay nóminas pendientes de timbrar en este lote o el lote no existe.' });
            return;
        }

        const results: number[] = [];
        const errors: { id: number; error: string }[] = [];

        for (const { idnomina } of nominasPendientes) {
            try {
                await _procesarUnaNomina(idnomina);
                results.push(idnomina);
            } catch (err) {
                errors.push({ id: idnomina, error: (err as Error).message });
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
