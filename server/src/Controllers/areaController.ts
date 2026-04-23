import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getAreas = async (_req: Request, res: Response) => {
    try {
        const areas = await prisma.areas.findMany({
            include: {
                _count: { select: { empleados_empleados_idareaToareas: true } }
            },
            orderBy: { nombre_area: 'asc' }
        });
        res.json(areas);
    } catch (error) {
        console.error('Error fetching areas:', error);
        res.status(500).json({ error: 'Error al obtener las áreas' });
    }
};

export const createArea = async (req: Request, res: Response) => {
    try {
        const { nombre_area } = req.body;
        if (!nombre_area) {
            res.status(400).json({ error: 'Nombre de área es requerido' });
            return;
        }
        const nuevaArea = await prisma.areas.create({
            data: { nombre_area }
        });
        res.status(201).json(nuevaArea);
    } catch (error) {
        console.error('Error creating area:', error);
        res.status(500).json({ error: 'Error al crear el área' });
    }
};

export const updateArea = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params['id'] as string);
        const { nombre_area } = req.body;
        if (!nombre_area) {
            res.status(400).json({ error: 'Nombre de área es requerido' });
            return;
        }
        const updated = await prisma.areas.update({
            where: { idarea: id },
            data:  { nombre_area }
        });
        res.json(updated);
    } catch (error) {
        console.error('Error updating area:', error);
        res.status(500).json({ error: 'Error al actualizar el área' });
    }
};

export const deleteArea = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params['id'] as string);

        const count = await prisma.empleados.count({ where: { idarea: id } });
        if (count > 0) {
            res.status(400).json({ error: `No se puede eliminar: ${count} empleado(s) pertenecen a esta área` });
            return;
        }

        await prisma.areas.delete({ where: { idarea: id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting area:', error);
        res.status(500).json({ error: 'Error al eliminar el área' });
    }
};
