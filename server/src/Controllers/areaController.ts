import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getAreas = async (_req: Request, res: Response) => {
    try {
        const areas = await prisma.areas.findMany({
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
            return res.status(400).json({ error: 'Nombre de área es requerido' });
        }

        const nuevaArea = await prisma.areas.create({
            data: {
                nombre_area
            }
        });
        res.status(201).json(nuevaArea);
    } catch (error) {
        console.error('Error creating area:', error);
        res.status(500).json({ error: 'Error al crear el área' });
    }
};
