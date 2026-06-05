import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getTareas(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const employeeId = Number(id);
        console.log('Fetching tasks for employee ID:', employeeId);

        if (isNaN(employeeId)) {
            return res.status(400).json({ error: 'ID de empleado inválido' });
        }

        const tasks = await prisma.tareas.findMany({
            where: { idempleado: employeeId },
            orderBy: { fecha_creacion: 'desc' }
        });

        // Tarea de depuración (solo si la lista está vacía)
        if (tasks.length === 0) {
            console.log('Sending dummy debug task');
            return res.json([{
                idtarea: 9999,
                idempleado: employeeId,
                titulo: '📊 Prueba de Conexión',
                descripcion: 'Si ves esto, el sistema está conectado al servidor pero no encontró tareas en la DB.',
                prioridad: 'Alta',
                completada: false,
                fecha_creacion: new Date()
            }]);
        }

        console.log(`Found ${tasks.length} tasks for employee ${employeeId}`);
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function createTarea(req: Request, res: Response) {
    try {
        const { idempleado, titulo, descripcion, prioridad, fecha_vencimiento, asignado_por } = req.body;
        
        const newTask = await prisma.tareas.create({
            data: {
                idempleado: Number(idempleado),
                titulo,
                descripcion,
                prioridad: prioridad || 'Media',
                fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
                asignado_por: asignado_por ? Number(asignado_por) : null
            }
        });

        res.json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function toggleTarea(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const task = await prisma.tareas.findUnique({ where: { idtarea: Number(id) } });
        
        if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

        const updatedTask = await prisma.tareas.update({
            where: { idtarea: Number(id) },
            data: { completada: !task.completada }
        });

        res.json(updatedTask);
    } catch (error) {
        console.error('Error toggling task:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function deleteTarea(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await prisma.tareas.delete({ where: { idtarea: Number(id) } });
        res.json({ message: 'Tarea eliminada' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
