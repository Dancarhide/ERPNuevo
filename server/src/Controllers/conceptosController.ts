import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getConceptos = async (req: Request, res: Response) => {
    try {
        const conceptos = await prisma.conceptos_nomina.findMany({
            where: { activo: true },
            orderBy: { nombre_concepto: 'asc' }
        });
        res.json(conceptos);
    } catch (error) {
        console.error('Error fetching conceptos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const createConcepto = async (req: Request, res: Response) => {
    try {
        const { clave, nombre_concepto, tipo, monto_defecto } = req.body;
        const nuevo = await prisma.conceptos_nomina.create({
            data: {
                clave,
                nombre_concepto,
                tipo,
                monto_defecto: monto_defecto || 0,
                es_fiscal: req.body.es_fiscal || false
            }
        });
        res.status(201).json(nuevo);
    } catch (error) {
        console.error('Error creating concepto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const updateConcepto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { clave, nombre_concepto, tipo, monto_defecto, activo } = req.body;
        
        const actualizado = await prisma.conceptos_nomina.update({
            where: { idconcepto: Number(id) },
            data: {
                clave,
                nombre_concepto,
                tipo,
                monto_defecto,
                activo,
                es_fiscal: req.body.es_fiscal
            }
        });
        res.json(actualizado);
    } catch (error) {
        console.error('Error updating concepto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const deleteConcepto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await prisma.conceptos_nomina.update({
            where: { idconcepto: Number(id) },
            data: { activo: false }
        });
        res.json(deleted);
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor' });
    }
};
