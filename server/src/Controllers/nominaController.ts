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
                idarea: true,
                fecha_ingreso: true,
                infonavit_mensual: true,
                vales_despensa_pct: true,
                fondo_ahorro_pct: true,
                puesto: true,
                curp: true,
                rfc: true,
                prestamos: {
                    where: { estatus: 'Activo', saldo_pendiente: { gt: 0 } },
                    select: {
                        idprestamo: true,
                        saldo_pendiente: true,
                        abono_periodo: true
                    }
                }

            }
        });
        res.json(empleados);
    } catch (error) {
        console.error('Error fetching empleados para nómina (FULL STACK):', error);
        res.status(500).json({ 
            error: 'Error interno del servidor', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }

};

export const crearNominasBulk = async (req: Request, res: Response): Promise<void> => {
    try {
        const nominasArray = req.body.nominas;

        if (!Array.isArray(nominasArray) || nominasArray.length === 0) {
            res.status(400).json({ error: 'Se requiere un arreglo de nóminas válido.' });
            return;
        }

        const loteId = `LOTE-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

        // Necesitamos usar una transacción porque createMany no soporta relaciones anidadas
        await prisma.$transaction(async (tx) => {
            for (const n of nominasArray) {
                // 1. Crear la nómina principal
                const nominaCreada = await tx.nominas.create({
                    data: {
                        idempleado: n.idempleado,
                        lote_id: loteId,
                        fecha_inicio: new Date(n.fecha_inicio),
                        fecha_fin: new Date(n.fecha_fin),
                        sueldo_base: n.sueldo_base,
                        bonos: n.bonos || 0,
                        deducciones: n.deducciones || 0,
                        total_pagado: n.total_pagado,
                        monto_reportado_fiscal: n.monto_reportado_fiscal || 0,
                        monto_variacion_complemento: n.monto_variacion_complemento || 0,
                        dias_trabajados: n.dias_trabajados || 15,
                        sdi: n.sdi || 0,
                        factor_integracion: n.factor_integracion || 1.0493,
                        costo_patronal: n.costo_patronal || 0,
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

                // 2. Si hay abono a préstamo, descontarlo del saldo
                if (n.abono_prestamo && n.abono_prestamo > 0 && n.idprestamo) {
                    await tx.prestamos.update({
                        where: { idprestamo: n.idprestamo },
                        data: {
                            saldo_pendiente: { decrement: n.abono_prestamo },
                            estatus: {
                                set: (n.saldo_prestamo_restante === 0) ? 'Pagado' : 'Activo'
                            }
                        }
                    });
                }
            }
        });

        res.json({ success: true, count: nominasArray.length, message: 'Nóminas generadas correctamente y préstamos actualizados.' });
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
                            select: { nombre_concepto: true, clave: true, tipo: true, es_fiscal: true }
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

export const getLotesNominas = async (req: Request, res: Response): Promise<void> => {
    try {
        const lotes = await prisma.nominas.groupBy({
            by: ['lote_id', 'fecha_emision', 'fecha_inicio', 'fecha_fin'],
            _count: { idnomina: true },
            _sum: { total_pagado: true, monto_reportado_fiscal: true },
            orderBy: { fecha_emision: 'desc' },
            where: { lote_id: { not: null } }
        });

        // Mapping to more friendly format
        const response = lotes.map(l => ({
            lote_id: l.lote_id,
            fecha_creacion: l.fecha_emision,
            periodo: `${l.fecha_inicio.toISOString().split('T')[0]} - ${l.fecha_fin.toISOString().split('T')[0]}`,
            empleados: l._count.idnomina,
            total_real: Number(l._sum.total_pagado),
            total_fiscal: Number(l._sum.monto_reportado_fiscal)
        }));

        res.json(response);
    } catch (error) {
        console.error('Error fetching lotes:', error);
        res.status(500).json({ error: 'Error al obtener lotes de nómina' });
    }
};
