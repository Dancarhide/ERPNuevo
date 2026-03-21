import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getVacaciones = async (req: Request, res: Response) => {
    try {
        const idempleadoRaw = req.query.idempleado ? String(req.query.idempleado) : null;
        const idSolicitado = idempleadoRaw ? parseInt(idempleadoRaw) : null;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // --- Lógica de Seguridad ---
        // Roles con acceso total
        const hasFullAccess = user.rol === 'Admin' || user.rol === 'RH' || user.rol === 'Administrador' || user.rol === 'Recursos Humanos';
        
        // Si no tiene acceso total, aplicar filtros
        let where: any = {};

        if (hasFullAccess) {
            // Admin/RH: puede filtrar por empleado o ver todos
            if (idSolicitado) where.idempleado = idSolicitado;
        } else {
            // Usuario normal o Jefe
            // Primero, ver si es jefe de algún área
            const areaComoJefe = await prisma.areas.findFirst({
                where: { jefe_area: user.id }
            });

            if (areaComoJefe) {
                // Es jefe: puede ver sus propias vacaciones O las de su área
                if (idSolicitado) {
                    // Si pide un empleado específico, verificar que sea él mismo o de su área
                    const empleadoDestino = await prisma.empleados.findUnique({
                        where: { idempleado: idSolicitado }
                    });
                    
                    if (idSolicitado === user.id || (empleadoDestino && empleadoDestino.idarea === areaComoJefe.idarea)) {
                        where.idempleado = idSolicitado;
                    } else {
                        return res.status(403).json({ error: 'No tienes permiso para ver las vacaciones de este empleado' });
                    }
                } else {
                    // Si pide todos, mostrar los de su área + las suyas (aunque las suyas ya deberían estar en su área)
                    where.empleados = { idarea: areaComoJefe.idarea };
                }
            } else {
                // No es jefe ni admin: solo puede ver las suyas
                if (idSolicitado && idSolicitado !== user.id) {
                    return res.status(403).json({ error: 'Solo puedes consultar tus propias vacaciones' });
                }
                where.idempleado = user.id;
            }
        }

        const vacaciones = await prisma.vacaciones.findMany({
            where,
            include: {
                empleados: {
                    select: {
                        nombre_completo_empleado: true,
                        puesto: true,
                        idarea: true,
                        dias_vacaciones_disponibles: true
                    }
                }
            },
            orderBy: {
                fecha_inicio: 'desc'
            }
        });
        res.status(200).json(vacaciones);
    } catch (error) {
        console.error('Error al obtener vacaciones:', error);
        res.status(500).json({ error: 'Error al obtener vacaciones' });
    }
};

export const createVacacion = async (req: Request, res: Response) => {
    const { idempleado, fecha_inicio, fecha_fin, motivo, tipo_solicitud } = req.body;

    try {
        // Basic validation
        if (!idempleado || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const nuevaVacacion = await prisma.vacaciones.create({
            data: {
                idempleado: parseInt(idempleado),
                fecha_inicio: new Date(fecha_inicio),
                fecha_fin: new Date(fecha_fin),
                motivo,
                tipo_solicitud: tipo_solicitud || 'Vacaciones',
                estatus_vacacion: 'Pendiente'
            }
        });

        res.status(201).json(nuevaVacacion);
    } catch (error) {
        console.error('Error al solicitar vacaciones:', error);
        res.status(500).json({ error: 'Error al solicitar vacaciones' });
    }
};

export const updateVacacionStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const estatus_vacacion = req.body.estatus_vacacion as string;
        const motivo_rechazo = req.body.motivo_rechazo as string | undefined;
        
        const vacId = parseInt(id);
        if (isNaN(vacId)) {
            console.error(`ID de vacación inválido: ${id}`);
            return res.status(400).json({ error: 'ID de vacación inválido' });
        }

        if (estatus_vacacion === 'Rechazado' && (!motivo_rechazo || String(motivo_rechazo).trim() === '')) {
            return res.status(400).json({ error: 'Se requiere un motivo para rechazar la solicitud' });
        }

        const vacacionOriginal = await prisma.vacaciones.findUnique({
            where: { idvacacion: vacId }
        });

        if (!vacacionOriginal) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Si se aprueba, descontar los días del empleado
        if (estatus_vacacion === 'Aprobado' && vacacionOriginal.estatus_vacacion !== 'Aprobado') {
            const inicio = new Date(vacacionOriginal.fecha_inicio);
            const fin = new Date(vacacionOriginal.fecha_fin);
            const diffTime = Math.abs(fin.getTime() - inicio.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (isNaN(diffDays)) {
                console.error('Error calculando días de vacaciones: Fecha inválida');
                return res.status(400).json({ error: 'Las fechas de la solicitud son inválidas' });
            }

            await prisma.empleados.update({
                where: { idempleado: vacacionOriginal.idempleado },
                data: {
                    dias_vacaciones_disponibles: {
                        decrement: diffDays
                    },
                    estatus_empleado: 'Vacaciones'
                }
            });
        }

        const updated = await prisma.vacaciones.update({
            where: { idvacacion: vacId },
            data: {
                estatus_vacacion,
                motivo_rechazo: estatus_vacacion === 'Rechazado' ? (motivo_rechazo || null) : null
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error('Error al actualizar estatus de vacaciones:', error);
        res.status(500).json({ error: 'Error interno al actualizar estatus. Revisa la consola para más detalles.' });
    }
};

