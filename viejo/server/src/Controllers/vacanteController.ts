import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getVacantes = async (_req: Request, res: Response) => {
    try {
        const vacantes = await (prisma as any).vacantes.findMany({
            include: {
                areas: true,
                roles: true,
                puestos: true
            },
            orderBy: {
                fecha_creacion: 'desc'
            }
        });
        res.json(vacantes);
    } catch (error) {
        console.error('Error fetching vacantes:', error);
        res.status(500).json({ error: 'Error al obtener las vacantes' });
    }
};

export const createVacante = async (req: Request, res: Response) => {
    try {
        const { titulo, idarea, idrol, idpuesto, cantidad_solicitada, descripcion } = req.body;

        if (!titulo || !cantidad_solicitada) {
            return res.status(400).json({ error: 'Título y cantidad solicitada son requeridos' });
        }

        const nuevaVacante = await (prisma as any).vacantes.create({
            data: {
                titulo,
                idarea: idarea ? parseInt(idarea) : null,
                idrol: idrol ? parseInt(idrol) : null,
                idpuesto: idpuesto ? parseInt(idpuesto) : null,
                cantidad_solicitada: parseInt(cantidad_solicitada),
                descripcion,
                estatus: 'Abierta',
                cantidad_contratada: 0
            }
        });

        res.status(201).json(nuevaVacante);
    } catch (error) {
        console.error('Error creating vacante:', error);
        res.status(500).json({ error: 'Error al crear la vacante' });
    }
};


export const updateVacante = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, cantidad_contratada } = req.body;

        const updated = await (prisma as any).vacantes.update({
            where: { idvacante: parseInt(id as string) },
            data: {
                estatus: status,
                cantidad_contratada: cantidad_contratada !== undefined ? parseInt(cantidad_contratada) : undefined
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating vacante:', error);
        res.status(500).json({ error: 'Error al actualizar la vacante' });
    }
};
