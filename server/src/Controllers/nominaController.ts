import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getEmpleadosParaNomina = async (req: Request, res: Response): Promise<void> => {
    try {
        const empleados = await prisma.empleados.findMany({
            where: { estatus_empleado: 'Activo' },
            select: {
                idempleado: true,
                nombre_completo_empleado: true,
                sueldo: true,
                sueldo_fiscal: true,
                puesto: true,
                curp: true,
                rfc: true
            }
        });
        res.json(empleados);
    } catch (error) {
        console.error('Error fetching empleados para nómina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const crearNominasBulk = async (req: Request, res: Response): Promise<void> => {
    try {
        const nominasArray = req.body.nominas;

        if (!Array.isArray(nominasArray) || nominasArray.length === 0) {
            res.status(400).json({ error: 'Se requiere un arreglo de nóminas válido.' });
            return;
        }

        // Necesitamos usar una transacción porque createMany no soporta relaciones anidadas
        await prisma.$transaction(async (tx) => {
            for (const n of nominasArray) {
                await tx.nominas.create({
                    data: {
                        idempleado: n.idempleado,
                        fecha_inicio: new Date(n.fecha_inicio),
                        fecha_fin: new Date(n.fecha_fin),
                        sueldo_base: n.sueldo_base,
                        bonos: n.bonos || 0,
                        deducciones: n.deducciones || 0,
                        total_pagado: n.total_pagado,
                        monto_reportado_fiscal: n.monto_reportado_fiscal || 0,
                        monto_variacion_complemento: n.monto_variacion_complemento || 0,
                        dias_trabajados: n.dias_trabajados || 15,
                        metodo_pago: n.metodo_pago || 'Transferencia',
                        estado: 'Pagado',
                        detalles_nomina: {
                            create: n.detalles ? n.detalles.map((d: any) => ({
                                idconcepto: d.idconcepto,
                                monto_aplicado: d.monto_aplicado
                            })) : []
                        }
                    }
                });
            }
        });

        res.json({ success: true, count: nominasArray.length, message: 'Nóminas generadas correctamente' });
    } catch (error) {
        console.error('Error creando nóminas en bulk:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear nóminas' });
    }
};

export const misNominas = async (req: Request, res: Response): Promise<void> => {
    try {
        // Obtenemos el empleado desde req.user (asumiendo middleware de auth)
        const user = (req as any).user;
        if (!user || !user.id) {
            res.status(401).json({ error: 'No autorizado' });
            return;
        }

        const nominas = await prisma.nominas.findMany({
            where: { idempleado: user.id },
            orderBy: { fecha_emision: 'desc' },
            include: {
                detalles_nomina: {
                    include: {
                        conceptos_nomina: {
                            select: { nombre_concepto: true, clave: true, tipo: true }
                        }
                    }
                }
            }
        });

        res.json(nominas);
    } catch (error) {
        console.error('Error fetching mis nóminas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const obtenerHistorialNominas = async (req: Request, res: Response): Promise<void> => {
    try {
        const nominas = await prisma.nominas.findMany({
            orderBy: [{ fecha_inicio: 'desc' }, { fecha_emision: 'desc' }],
            include: {
                empleados: {
                    select: { nombre_completo_empleado: true, curp: true, rfc: true, idarea: true, puesto: true }
                },
                detalles_nomina: {
                    include: {
                        conceptos_nomina: {
                            select: { nombre_concepto: true, clave: true, tipo: true }
                        }
                    }
                }
            }
        });
        res.json(nominas);
    } catch (error) {
        console.error('Error fetching historial de nóminas:', error);
        res.status(500).json({ error: 'Error interno al obtener el historial' });
    }
};
