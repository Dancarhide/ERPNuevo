import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getEmpleados = async (req: Request, res: Response) => {
    try {
        const empleados = await prisma.empleados.findMany({
            include: {
                roles: true,
                areas_empleados_idareaToareas: true,
            },
            orderBy: {
                idempleado: 'asc'
            }
        });
        res.status(200).json(empleados);
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
};

export const updateEmpleado = async (req: Request, res: Response) => {
    console.log('Update Empleado hit with ID:', req.params.id);
    const { id } = req.params;
    const { 
        nombre_completo_empleado, 
        curp, 
        rfc, 
        email_empleado, 
        telefono_empleado, 
        direccion_empleado, 
        estatus_empleado, 
        puesto 
    } = req.body;

    try {
        const updated = await prisma.empleados.update({
            where: { idempleado: parseInt(id as string) },
            data: {
                nombre_completo_empleado,
                curp,
                rfc,
                email_empleado,
                telefono_empleado,
                direccion_empleado,
                estatus_empleado,
                puesto
            }
        });
        res.status(200).json(updated);
    } catch (error) {
        console.error('Error al actualizar empleado:', error);
        res.status(500).json({ error: 'Error al actualizar empleado' });
    }
};

export const createEmpleado = async (req: Request, res: Response) => {
    const { 
        nombre_completo_empleado, 
        curp, 
        rfc, 
        email_empleado, 
        telefono_empleado, 
        direccion_empleado, 
        estatus_empleado, 
        puesto,
        idrol,
        idarea,
        idvacante
    } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const nuevoEmpleado = await tx.empleados.create({
                data: {
                    nombre_completo_empleado,
                    curp,
                    rfc,
                    email_empleado,
                    telefono_empleado,
                    direccion_empleado,
                    estatus_empleado: estatus_empleado || 'Activo',
                    puesto,
                    idrol: idrol ? parseInt(idrol) : null,
                    idarea: idarea ? parseInt(idarea) : null,
                    dias_vacaciones_disponibles: 12
                }
            });

            // Crear credenciales por defecto (username es el email o parte del nombre)
            const username = email_empleado ? email_empleado.split('@')[0] : nombre_completo_empleado.split(' ')[0].toLowerCase() + nuevoEmpleado.idempleado;
            
            await tx.credenciales.create({
                data: {
                    idempleado: nuevoEmpleado.idempleado,
                    username,
                    user_password: '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq' // "12345" por defecto
                }
            });

            // Si hay una vacante vinculada, incrementar contador
            if (idvacante) {
                const vacanteId = parseInt(idvacante);
                const vacante = await (tx as any).vacantes.findUnique({ where: { idvacante: vacanteId } });
                
                if (vacante) {
                    const nuevaCantidad = (vacante.cantidad_contratada || 0) + 1;
                    const nuevoEstatus = nuevaCantidad >= vacante.cantidad_solicitada ? 'Cubierta' : 'Abierta';
                    
                    await (tx as any).vacantes.update({
                        where: { idvacante: vacanteId },
                        data: {
                            cantidad_contratada: nuevaCantidad,
                            estatus: nuevoEstatus
                        }
                    });
                }
            }

            return nuevoEmpleado;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error al crear empleado:', error);
        res.status(500).json({ error: 'Error al crear empleado' });
    }
};

