import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getCyiProgress = async (_req: Request, res: Response) => {
    try {
        const progress = await prisma.cyi_progreso.findMany();
        res.json(progress);
    } catch (error) {
        console.error('Error fetching CyI progress:', error);
        res.status(500).json({ error: 'Error al obtener el progreso de CyI' });
    }
};

export const updateCyiProgress = async (req: Request, res: Response) => {
    try {
        const { etapa_id, status, items, notas } = req.body;

        if (!etapa_id) {
            return res.status(400).json({ error: 'ID de etapa es requerido' });
        }

        const updated = await prisma.cyi_progreso.upsert({
            where: { etapa_id },
            update: {
                status,
                items,
                notas
            },
            create: {
                etapa_id,
                status,
                items,
                notas
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating CyI progress:', error);
        res.status(500).json({ error: 'Error al actualizar el progreso de CyI' });
    }
};
