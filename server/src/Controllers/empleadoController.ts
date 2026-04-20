import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { recountPuesto } from '../Services/puestoService';

export const getEmpleados = async (req: Request, res: Response) => {
    try {
        const empleados = await prisma.empleados.findMany({
            include: {
                roles: true,
                areas_empleados_idareaToareas: true,
                empleados_familiar: true,
                empleados_salud: true
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

export const getEmpleadoById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const empleado = await prisma.empleados.findUnique({
            where: { idempleado: parseInt(id as string) },
            include: {
                empleados_familiar: true,
                empleados_salud: true
            }
        });

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        const formatted = {
            ...empleado,
            familiar: empleado.empleados_familiar[0] || null,
            salud: empleado.empleados_salud[0] || null
        };

        res.status(200).json(formatted);
    } catch (error) {
        console.error('Error al obtener empleado:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const updateEmpleado = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        nombre_completo_empleado,
        curp,
        rfc,
        email_empleado,
        telefono_empleado,
        direccion_empleado,
        estatus_empleado,
        puesto,
        idpuesto,
        idrol,
        idarea,
        sueldo,
        sueldo_fiscal,
        infonavit_mensual,
        vales_despensa_pct,
        fondo_ahorro_pct,
        fecha_ingreso,
        familiar,
        salud
    } = req.body;

    try {
        const updated = await (prisma.empleados as any).update({
            where: { idempleado: parseInt(id as string) },
            data: {
                nombre_completo_empleado,
                curp,
                rfc,
                email_empleado,
                telefono_empleado,
                direccion_empleado,
                estatus_empleado,
                puesto,
                idpuesto: idpuesto ? parseInt(idpuesto) : undefined,
                idrol: idrol ? parseInt(idrol) : undefined,
                idarea: idarea ? parseInt(idarea) : undefined,
                sueldo,
                sueldo_fiscal,
                infonavit_mensual,
                vales_despensa_pct,
                fondo_ahorro_pct,
                fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : undefined,
                empleados_familiar: familiar ? {
                    deleteMany: {},
                    create: {
                        nombre_completo_familiar: familiar.nombre,
                        telefono_familiar: familiar.telefono,
                        parentesco_familiar: familiar.parentesco,
                    }
                } : undefined,
                empleados_salud: salud ? {
                    deleteMany: {},
                    create: {
                        nss: salud.nss,
                        tipo_sangre: salud.tipo_sangre,
                        discapacidad: salud.discapacidad === 'true' || salud.discapacidad === true
                    }
                } : undefined
            }
        });

        if (updated.idpuesto) {
            await recountPuesto(updated.idpuesto);
        }
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
        idpuesto,
        idrol,
        idarea,
        idvacante,
        sueldo,
        sueldo_fiscal,
        infonavit_mensual,
        vales_despensa_pct,
        fondo_ahorro_pct,
        fecha_ingreso,
        familiar,
        salud
    } = req.body;

    try {
        const nuevoEmpleado = await prisma.$transaction(async (tx) => {
            const emp = await (tx.empleados as any).create({
                data: {
                    nombre_completo_empleado,
                    curp,
                    rfc,
                    email_empleado,
                    telefono_empleado,
                    direccion_empleado,
                    estatus_empleado: estatus_empleado || 'Activo',
                    puesto,
                    idpuesto: idpuesto ? parseInt(idpuesto) : null,
                    idrol: idrol ? parseInt(idrol) : null,
                    idarea: idarea ? parseInt(idarea) : null,
                    idvacante: idvacante ? parseInt(idvacante) : null,
                    sueldo,
                    sueldo_fiscal,
                    infonavit_mensual,
                    vales_despensa_pct,
                    fondo_ahorro_pct,
                    fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : new Date(),
                    dias_vacaciones_disponibles: 12,
                    empleados_familiar: familiar ? {
                        create: {
                            nombre_completo_familiar: familiar.nombre,
                            telefono_familiar: familiar.telefono,
                            parentesco_familiar: familiar.parentesco,
                        }
                    } : undefined,
                    empleados_salud: salud ? {
                        create: {
                            nss: salud.nss,
                            tipo_sangre: salud.tipo_sangre,
                            discapacidad: salud.discapacidad === 'true' || salud.discapacidad === true
                        }
                    } : undefined
                }
            });

            const username = email_empleado ? email_empleado.split('@')[0] : nombre_completo_empleado.split(' ')[0].toLowerCase() + emp.idempleado;
            await tx.credenciales.create({
                data: {
                    idempleado: emp.idempleado,
                    username,
                    user_password: '$2b$10$BYdSFdIjkNzlc3JE983QS.ho41mdZPqLXk.FN8XvmOilfLVa.hfYq'
                }
            });

            if (idvacante) {
                const vacanteId = parseInt(idvacante);
                const vacante = await (tx as any).vacantes.findUnique({ where: { idvacante: vacanteId } });
                if (vacante) {
                    const nuevaCantidad = (vacante.cantidad_contratada || 0) + 1;
                    await (tx as any).vacantes.update({
                        where: { idvacante: vacanteId },
                        data: {
                            cantidad_contratada: nuevaCantidad,
                            estatus: nuevaCantidad >= vacante.cantidad_solicitada ? 'Cubierta' : 'Abierta'
                        }
                    });
                }
            }

            return emp;
        });

        if (nuevoEmpleado.idpuesto) {
            await recountPuesto(nuevoEmpleado.idpuesto);
        }

        res.status(201).json(nuevoEmpleado);
    } catch (error) {
        console.error('Error al crear empleado:', error);
        res.status(500).json({ error: 'Error al crear empleado' });
    }
};