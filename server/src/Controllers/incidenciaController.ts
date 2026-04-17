import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getIncidencias = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }

        const hasFullAccess = ['Admin', 'RH', 'Administrador', 'Recursos Humanos'].includes(user.rol);

        let where: any = {};

        if (!hasFullAccess) {
            const areaComoJefe = await prisma.areas.findFirst({
                where: { jefe_area: user.id }
            });

            if (areaComoJefe) {
                // Jefe can see incidents from their area
                where = {
                    OR: [
                        { id_reportante: user.id },
                        {
                            empleados_incidencias_id_empleado_reportadoToempleados: {
                                idarea: areaComoJefe.idarea
                            }
                        }
                    ]
                };
            } else {
                // Regular employee: only incidents they reported
                where = { id_reportante: user.id };
            }
        }

        const incidencias = await (prisma as any).incidencias.findMany({
            where,
            include: {
                empleados_incidencias_id_empleado_reportadoToempleados: {
                    select: { nombre_completo_empleado: true, puesto: true, idarea: true }
                },
                empleados_incidencias_id_reportanteToempleados: {
                    select: { nombre_completo_empleado: true }
                }
            },
            orderBy: { fecha_registro: 'desc' }
        });

        res.json(incidencias);
    } catch (error) {
        console.error('Error al obtener incidencias:', error);
        res.status(500).json({ error: 'Error al obtener incidencias' });
    }
};

export const createIncidencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }

        const { id_empleado_reportado, titulo, descripcion, tipo, gravedad } = req.body;

        if (!id_empleado_reportado || !titulo) {
            res.status(400).json({ error: 'Empleado reportado y título son requeridos' });
            return;
        }

        const nueva = await (prisma as any).incidencias.create({
            data: {
                id_empleado_reportado: parseInt(id_empleado_reportado),
                id_reportante: user.id,
                titulo,
                descripcion,
                tipo: tipo || 'General',
                gravedad: gravedad || 'Leve',
                estatus: 'Pendiente'
            }
        });

        res.status(201).json(nueva);
    } catch (error) {
        console.error('Error al crear incidencia:', error);
        res.status(500).json({ error: 'Error al crear incidencia' });
    }
};

export const updateIncidenciaStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { estatus } = req.body;

        const validStatuses = ['Pendiente', 'En Revisión', 'Resuelto', 'Archivado'];
        if (!validStatuses.includes(estatus)) {
            res.status(400).json({ error: `Estatus inválido. Use: ${validStatuses.join(', ')}` });
            return;
        }

        const updated = await (prisma as any).incidencias.update({
            where: { idincidencia: parseInt(id as string) },
            data: { estatus }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error al actualizar estatus de incidencia:', error);
        res.status(500).json({ error: 'Error al actualizar incidencia' });
    }
};

export const deleteIncidencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await (prisma as any).incidencias.delete({
            where: { idincidencia: parseInt(id as string) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar incidencia:', error);
        res.status(500).json({ error: 'Error al eliminar incidencia' });
    }
};
