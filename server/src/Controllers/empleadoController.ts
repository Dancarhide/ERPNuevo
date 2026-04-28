import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { recountPuesto } from '../Services/puestoService';
import { crearCredenciales } from '../models/credenciales';

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
        id_jefe_directo,
        familiar,
        salud
    } = req.body;

    try {
        const updated = await prisma.empleados.update({
            where: { idempleado: parseInt(id as string) },
            data: {
                nombre_completo_empleado: nombre_completo_empleado?.substring(0, 255),
                curp: curp?.substring(0, 18),
                rfc: rfc?.substring(0, 13),
                email_empleado: email_empleado?.substring(0, 50),
                telefono_empleado: telefono_empleado?.substring(0, 12),
                direccion_empleado: direccion_empleado?.substring(0, 255),
                estatus_empleado,
                puesto,
                idpuesto: idpuesto ? parseInt(idpuesto) : undefined,
                idrol: idrol ? parseInt(idrol) : undefined,
                idarea: idarea ? parseInt(idarea) : undefined,
                id_jefe_directo: id_jefe_directo ? parseInt(id_jefe_directo) : null,
                sueldo,
                sueldo_fiscal,
                infonavit_mensual,
                vales_despensa_pct,
                fondo_ahorro_pct,
                fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : undefined,
                empleados_familiar: familiar ? {
                    deleteMany: {},
                    create: {
                        nombre_completo_familiar: familiar.nombre?.substring(0, 255),
                        telefono_familiar: familiar.telefono?.substring(0, 12),
                        parentesco_familiar: familiar.parentesco?.substring(0, 30),
                    }
                } : undefined,
                empleados_salud: salud ? {
                    deleteMany: {},
                    create: {
                        nss: salud.nss?.substring(0, 11),
                        tipo_sangre: salud.tipo_sangre?.substring(0, 10),
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
        id_jefe_directo,
        familiar,
        salud
    } = req.body;

    try {
        const nuevoEmpleado = await prisma.$transaction(async (tx) => {
            const emp = await (tx.empleados as any).create({
                data: {
                    nombre_completo_empleado: nombre_completo_empleado?.substring(0, 255),
                    curp: curp?.substring(0, 18),
                    rfc: rfc?.substring(0, 13),
                    email_empleado: email_empleado?.substring(0, 50),
                    telefono_empleado: telefono_empleado?.substring(0, 12),
                    direccion_empleado: direccion_empleado?.substring(0, 255),
                    estatus_empleado: estatus_empleado || 'Activo',
                    puesto,
                    idpuesto: idpuesto ? parseInt(idpuesto) : null,
                    idrol: idrol ? parseInt(idrol) : null,
                    idarea: idarea ? parseInt(idarea) : null,
                    idvacante: idvacante ? parseInt(idvacante) : null,
                    id_jefe_directo: id_jefe_directo ? parseInt(id_jefe_directo) : null,
                    sueldo,
                    sueldo_fiscal,
                    infonavit_mensual,
                    vales_despensa_pct,
                    fondo_ahorro_pct,
                    fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : new Date(),
                    dias_vacaciones_disponibles: 12,
                    empleados_familiar: familiar ? {
                        create: {
                            nombre_completo_familiar: familiar.nombre?.substring(0, 255),
                            telefono_familiar: familiar.telefono?.substring(0, 12),
                            parentesco_familiar: familiar.parentesco?.substring(0, 30),
                        }
                    } : undefined,
                    empleados_salud: salud ? {
                        create: {
                            nss: salud.nss?.substring(0, 11),
                            tipo_sangre: salud.tipo_sangre?.substring(0, 10),
                            discapacidad: salud.discapacidad === 'true' || salud.discapacidad === true
                        }
                    } : undefined
                }
            });

            // Crear credenciales usando el helper del modelo:
            // - genera username único basado en el nombre
            // - usa la contraseña configurable por env (DEFAULT_EMPLOYEE_PASSWORD)
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let passwordInicial = '';
            for (let i = 0; i < 8; i++) {
                passwordInicial += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const usernameGenerado = await crearCredenciales(emp.idempleado, nombre_completo_empleado, passwordInicial, tx, email_empleado);

            if (idvacante) {
                const vacanteId = parseInt(idvacante);
                const vacante = await (tx.vacantes as any).findUnique({ where: { idvacante: vacanteId } });
                if (vacante) {
                    const nuevaCantidad = (vacante.cantidad_contratada || 0) + 1;
                    await (tx.vacantes as any).update({
                        where: { idvacante: vacanteId },
                        data: {
                            cantidad_contratada: nuevaCantidad,
                            estatus: nuevaCantidad >= vacante.cantidad_solicitada ? 'Cubierta' : 'Abierta'
                        }
                    });
                }
            }

            return { ...emp, _credencialesGeneradas: { username: usernameGenerado, password: passwordInicial } };
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

export const deleteEmpleado = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idEmpleado = parseInt(id as string);
        
        const emp = await prisma.empleados.findUnique({
            where: { idempleado: idEmpleado }
        });

        if (!emp) {
            res.status(404).json({ error: 'Empleado no encontrado' });
            return;
        }

        await prisma.empleados.delete({
            where: { idempleado: idEmpleado }
        });

        if (emp.idpuesto) {
            await recountPuesto(emp.idpuesto);
        }

        res.status(200).json({ message: 'Empleado eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar empleado:', error);
        res.status(500).json({ error: 'Error al eliminar empleado' });
    }
};

