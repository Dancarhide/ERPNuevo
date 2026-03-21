import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getContacts(req: Request, res: Response) {
    try {
        const userId = Number(req.query.userId || 1); // Ideally get from token/session

        // Find current user's role and hierarchy level
        const currentUser = await prisma.empleados.findUnique({
            where: { idempleado: userId },
            include: { roles: true }
        });

        if (!currentUser || !currentUser.roles) {
            return res.status(404).json({ error: 'Usuario o rol no encontrado' });
        }

        // Find eligible employees: all active employees except current user
        const eligibleEmployees = await prisma.empleados.findMany({
            where: {
                idempleado: { not: userId },
                estatus_empleado: 'Activo'
            },
            select: {
                idempleado: true,
                nombre_completo_empleado: true,
                email_empleado: true,
                puesto: true,
                idarea: true,
                areas_empleados_idareaToareas: {
                    select: { nombre_area: true }
                },
                roles: {
                    select: { nombre_rol: true }
                }
            }
        });

        const contacts = eligibleEmployees.map(e => ({
            id: e.idempleado,
            nombre: e.nombre_completo_empleado,
            email: e.email_empleado,
            puesto: e.puesto,
            area: e.areas_empleados_idareaToareas?.nombre_area,
            rol: e.roles?.nombre_rol
        }));

        res.json({ contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function getConversation(req: Request, res: Response) {
    try {
        const { id } = req.params; // ID of the other user
        const userId = Number(req.query.userId || 1); // Current user

        const otherId = Number(id);

        // Find a conversation between these two
        let conversation = await prisma.conversaciones.findFirst({
            where: {
                tipo: 'privada',
                conversacion_participantes: {
                    every: {
                        empleado_id: { in: [userId, otherId] }
                    }
                }
            },
            include: {
                mensajes: {
                    orderBy: { fecha_envio: 'asc' }
                }
            }
        });

        if (!conversation) {
            return res.json({ conversation: [] });
        }

        res.json({ conversation: conversation.mensajes });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function sendMessage(req: Request, res: Response) {
    try {
        const { toId, message } = req.body;
        const fromId = Number(req.query.userId || 1); // Current user

        // Find or create private conversation
        let conversation = await prisma.conversaciones.findFirst({
            where: {
                tipo: 'privada',
                conversacion_participantes: {
                    every: {
                        empleado_id: { in: [fromId, Number(toId)] }
                    }
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversaciones.create({
                data: {
                    tipo: 'privada',
                    creado_por: fromId,
                    conversacion_participantes: {
                        create: [
                            { empleado_id: fromId },
                            { empleado_id: Number(toId) }
                        ]
                    }
                }
            });
        }

        const newMessage = await prisma.mensajes.create({
            data: {
                conversacion_id: conversation.id,
                emisor_id: fromId,
                contenido: message
            }
        });

        res.json({ message: 'Mensaje enviado', entry: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
