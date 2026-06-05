import { Request, Response } from 'express';
import { prisma } from '../prisma';

// ── GET /api/asistencia?mes=6&year=2026 ────────────────────────────────────
export const getAsistencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const mes = parseInt(req.query.mes as string) || (new Date().getMonth() + 1);
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const idarea = req.query.idarea ? parseInt(req.query.idarea as string) : undefined;

        const fechaInicio = new Date(year, mes - 1, 1);
        const fechaFin = new Date(year, mes, 0); // último día del mes

        const registros = await (prisma as any).asistencia.findMany({
            where: {
                fecha: {
                    gte: fechaInicio,
                    lte: fechaFin
                },
                ...(idarea ? {
                    empleados: { idarea }
                } : {})
            },
            include: {
                empleados: {
                    select: {
                        idempleado: true,
                        nombre_completo_empleado: true,
                        idarea: true,
                        areas_empleados_idareaToareas: { select: { nombre_area: true } }
                    }
                }
            },
            orderBy: [{ fecha: 'asc' }, { idempleado: 'asc' }]
        });

        res.json(registros);
    } catch (error) {
        console.error('Error al obtener asistencia:', error);
        res.status(500).json({ error: 'Error al obtener registros de asistencia' });
    }
};

// ── POST /api/asistencia — crear o actualizar (upsert) ────────────────────
export const upsertAsistencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idempleado, fecha, hora_entrada, hora_salida, tipo, justificacion } = req.body;
        const registrado_por = (req as any).user?.id ?? null;

        if (!idempleado || !fecha) {
            res.status(400).json({ error: 'idempleado y fecha son requeridos' });
            return;
        }

        const fechaDate = new Date(fecha);

        const record = await (prisma as any).asistencia.upsert({
            where: {
                idempleado_fecha: {
                    idempleado: parseInt(idempleado),
                    fecha: fechaDate
                }
            },
            update: {
                hora_entrada: hora_entrada ?? undefined,
                hora_salida: hora_salida ?? undefined,
                tipo: tipo ?? 'Normal',
                justificacion: justificacion ?? null,
                registrado_por
            },
            create: {
                idempleado: parseInt(idempleado),
                fecha: fechaDate,
                hora_entrada: hora_entrada ?? null,
                hora_salida: hora_salida ?? null,
                tipo: tipo ?? 'Normal',
                justificacion: justificacion ?? null,
                registrado_por
            }
        });

        res.json(record);
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        res.status(500).json({ error: 'Error al guardar registro de asistencia' });
    }
};

// ── POST /api/asistencia/bulk — registrar múltiples en un solo request ────
export const bulkUpsertAsistencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const { registros } = req.body as {
            registros: { idempleado: number; fecha: string; tipo: string; hora_entrada?: string; hora_salida?: string; justificacion?: string }[]
        };
        const registrado_por = (req as any).user?.id ?? null;

        if (!Array.isArray(registros) || registros.length === 0) {
            res.status(400).json({ error: 'Se requiere un array de registros' });
            return;
        }

        const results = await Promise.all(
            registros.map(r =>
                (prisma as any).asistencia.upsert({
                    where: {
                        idempleado_fecha: {
                            idempleado: r.idempleado,
                            fecha: new Date(r.fecha)
                        }
                    },
                    update: { tipo: r.tipo, hora_entrada: r.hora_entrada, hora_salida: r.hora_salida, justificacion: r.justificacion, registrado_por },
                    create: {
                        idempleado: r.idempleado,
                        fecha: new Date(r.fecha),
                        tipo: r.tipo ?? 'Normal',
                        hora_entrada: r.hora_entrada ?? null,
                        hora_salida: r.hora_salida ?? null,
                        justificacion: r.justificacion ?? null,
                        registrado_por
                    }
                })
            )
        );

        res.json({ ok: true, count: results.length });
    } catch (error) {
        console.error('Error en bulk asistencia:', error);
        res.status(500).json({ error: 'Error al guardar registros de asistencia' });
    }
};

// ── GET /api/asistencia/resumen/:id — KPIs de un empleado en el mes actual ─
export const getResumenAsistencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const idempleado = parseInt(String(req.params.id));
        const mes = parseInt(req.query.mes as string) || (new Date().getMonth() + 1);
        const year = parseInt(req.query.year as string) || new Date().getFullYear();

        const fechaInicio = new Date(year, mes - 1, 1);
        const fechaFin = new Date(year, mes, 0);

        const registros = await (prisma as any).asistencia.findMany({
            where: {
                idempleado,
                fecha: { gte: fechaInicio, lte: fechaFin }
            }
        });

        const resumen = {
            presentes: registros.filter((r: any) => r.tipo === 'Normal' || r.tipo === 'HomeOffice').length,
            faltas: registros.filter((r: any) => r.tipo === 'Falta').length,
            retardos: registros.filter((r: any) => r.tipo === 'Retardo').length,
            homeoffice: registros.filter((r: any) => r.tipo === 'HomeOffice').length,
            total_registros: registros.length,
        };

        res.json(resumen);
    } catch (error) {
        console.error('Error al obtener resumen de asistencia:', error);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
};

// ── DELETE /api/asistencia/:id ────────────────────────────────────────────
export const deleteAsistencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        await (prisma as any).asistencia.delete({ where: { idasistencia: id } });
        res.json({ ok: true });
    } catch (error) {
        console.error('Error al eliminar registro de asistencia:', error);
        res.status(500).json({ error: 'Error al eliminar registro' });
    }
};
