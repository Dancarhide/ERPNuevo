import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEventos = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        // Fetch all events
        const allEventos = await prisma.eventos_empresa.findMany({
            orderBy: { fecha_inicio: 'asc' }
        });

        // Filter events based on targeting
        const filteredEventos = allEventos.filter(ev => {
            // Admin and RH see everything
            if (['Admin', 'RH'].includes(user.rol)) return true;

            // Global events
            if (ev.target_type === 'TODOS' || !ev.target_type) return true;

            // Department targeting
            if (ev.target_type === 'DEPARTAMENTO' && ev.idarea_target === (user as any).idarea) return true;

            // Individual targeting
            if (ev.target_type === 'INDIVIDUALES' && Array.isArray(ev.empleados_target)) {
                return (ev.empleados_target as number[]).includes(user.id);
            }

            return false;
        });

        res.status(200).json(filteredEventos);
    } catch (error: any) {
        console.error('Error fetching eventos:', error);
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
};

export const createEvento = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            titulo, descripcion, fecha_inicio, fecha_fin, 
            hora_inicio, hora_fin, tipo, color, 
            target_type, idarea_target, empleados_target,
            creado_por 
        } = req.body;
        
        if (!titulo || !fecha_inicio || !fecha_fin) {
            res.status(400).json({ error: 'Faltan campos obligatorios' });
            return;
        }

        const nuevoEvento = await prisma.eventos_empresa.create({
            data: {
                titulo,
                descripcion,
                fecha_inicio: new Date(fecha_inicio),
                fecha_fin: new Date(fecha_fin),
                hora_inicio,
                hora_fin,
                tipo: tipo || 'Evento',
                color: color || '#A7313A',
                target_type: target_type || 'TODOS',
                idarea_target: idarea_target ? parseInt(idarea_target.toString()) : null,
                empleados_target: empleados_target || null,
                creado_por: creado_por ? parseInt(creado_por.toString()) : null
            }
        });

        res.status(201).json(nuevoEvento);
    } catch (error: any) {
        console.error('Error creating evento:', error);
        res.status(500).json({ error: 'Error al crear evento' });
    }
};

export const deleteEvento = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.eventos_empresa.delete({
            where: { id: parseInt(id as string) }
        });
        res.status(200).json({ message: 'Evento eliminado correctamente' });
    } catch (error: any) {
        console.error('Error deleting evento:', error);
        res.status(500).json({ error: 'Error al eliminar evento' });
    }
};
