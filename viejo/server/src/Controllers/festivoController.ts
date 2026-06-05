import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFestivos = async (_req: Request, res: Response) => {
    try {
        const festivos = await prisma.dias_festivos.findMany({
            orderBy: { fecha: 'asc' }
        });
        res.json(festivos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener días festivos' });
    }
};

export const createFestivo = async (req: Request, res: Response) => {
    try {
        const { fecha, nombre, tipo_ley, paga_doble, nota_ley } = req.body;
        const newFestivo = await prisma.dias_festivos.create({
            data: {
                fecha: new Date(fecha),
                nombre,
                tipo_ley: tipo_ley || 'Obligatorio',
                paga_doble: paga_doble ?? true,
                nota_ley
            }
        });
        res.status(201).json(newFestivo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear día festivo' });
    }
};

export const deleteFestivo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.dias_festivos.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Día festivo eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar día festivo' });
    }
};
