import { Request, Response } from 'express';
import { prisma } from '../prisma'; // Usar el singleton compartido

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const idempleado = req.query.idempleado ? parseInt(req.query.idempleado as string) : null;
        
        const notifications = await prisma.notificaciones.findMany({
            where: {
                OR: [
                    { idempleado: idempleado },
                    { idempleado: null } // Global notifications
                ]
            },
            orderBy: {
                fecha_creacion: 'desc'
            },
            take: 20
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Error fetching notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.notificaciones.update({
            where: { idnotificacion: parseInt(id as string) },
            data: { leida: true }
        });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating notification' });
    }
};

export const createNotification = async (req: Request, res: Response) => {
    try {
        const { idempleado, titulo, mensaje, tipo, link } = req.body;
        const notification = await prisma.notificaciones.create({
            data: {
                idempleado,
                titulo,
                mensaje,
                tipo,
                link,
                fecha_creacion: new Date()
            }
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Error creating notification' });
    }
};

export const generateHRAlerts = async (req: Request, res: Response) => {
    try {
        const alerts = [];
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        // 1. Cumpleaños
        const birthdays = await prisma.empleados.findMany({
            where: {
                fecha_nacimiento: {
                    not: null
                }
            },
            select: {
                idempleado: true,
                nombre_completo_empleado: true,
                fecha_nacimiento: true
            }
        });

        for (const emp of birthdays) {
            const bday = new Date(emp.fecha_nacimiento!);
            if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
                alerts.push({
                    titulo: '🎂 Cumpleaños Hoy',
                    mensaje: `Hoy es el cumpleaños de ${emp.nombre_completo_empleado}. ¡No olvides felicitarlo!`,
                    tipo: 'cumpleaños',
                    link: '/organigrama'
                });
            }
        }

        // 2. Nóminas por autorizar
        const pendingPayrolls = await prisma.nominas.count({
            where: { estado: 'Pendiente' }
        });

        if (pendingPayrolls > 0) {
            alerts.push({
                titulo: '💰 Nóminas Pendientes',
                mensaje: `Hay ${pendingPayrolls} registros de nómina que requieren tu revisión y autorización.`,
                tipo: 'nomina',
                link: '/nomina'
            });
        }

        // 3. Candidato avanzado en C y I (Ejemplo: etapa 'Entrevista' completada)
        const recentCyi = await prisma.cyi_progreso.findMany({
          where: {
            updated_at: {
              gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) // Últimas 24h
            },
            status: 'completed'
          },
          include: {
            candidatos: true
          },
          take: 5
        });

        for (const prog of recentCyi) {
          if (prog.candidatos) {
            alerts.push({
              titulo: '🚀 Avance en Reclutamiento',
              mensaje: `El candidato ${prog.candidatos.nombre_completo} ha completado la etapa ${prog.etapa_id}.`,
              tipo: 'cyi',
              link: `/cyi?idcandidato=${prog.idcandidato}`
            });
          }
        }

        // Guardar las alertas generadas que sean nuevas (esto es una simplificación)
        for (const alert of alerts) {
            // Verificar si ya existe una similar hoy para evitar spam
            const exists = await prisma.notificaciones.findFirst({
                where: {
                    titulo: alert.titulo,
                    mensaje: alert.mensaje,
                    fecha_creacion: {
                        gte: new Date(today.setHours(0,0,0,0))
                    }
                }
            });

            if (!exists) {
                await prisma.notificaciones.create({
                    data: alert
                });
            }
        }

        res.json({ message: 'HR Alerts generated successfully', count: alerts.length });
    } catch (error) {
        console.error('Error generating HR alerts:', error);
        res.status(500).json({ error: 'Error generating HR alerts' });
    }
};
