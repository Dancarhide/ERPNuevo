import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Run all queries in parallel for performance
        const [
            empleadosActivos,
            vacacionesPendientes,
            vacantesAbiertas,
            ultimaNomina,
            ultimasVacaciones,
            ultimasIncidencias
        ] = await Promise.all([
            // Count active employees
            prisma.empleados.count({
                where: { estatus_empleado: 'Activo' }
            }),
            // Count pending vacation requests
            prisma.vacaciones.count({
                where: { estatus_vacacion: 'Pendiente' }
            }),
            // Count open job openings
            (prisma as any).vacantes.count({
                where: { estatus: 'Abierta' }
            }),
            // Get the most recent payroll period total
            prisma.nominas.aggregate({
                _sum: { total_pagado: true },
                where: {
                    fecha_inicio: {
                        gte: (() => {
                            const d = new Date();
                            d.setDate(1);
                            d.setHours(0, 0, 0, 0);
                            return d;
                        })()
                    }
                }
            }),
            // Last 5 vacation requests
            prisma.vacaciones.findMany({
                take: 5,
                orderBy: { fecha_inicio: 'desc' },
                include: {
                    empleados: {
                        select: { nombre_completo_empleado: true }
                    }
                }
            }),
            // Last 5 incidents
            (prisma as any).incidencias.findMany({
                take: 5,
                orderBy: { fecha_registro: 'desc' },
                include: {
                    empleados_incidencias_id_empleado_reportadoToempleados: {
                        select: { nombre_completo_empleado: true }
                    }
                }
            })
        ]);

        // Build activity feed from vacaciones + incidencias, sorted by date
        const actividadVacaciones = ultimasVacaciones.map((v: any) => ({
            tipo: 'vacacion',
            descripcion: `${v.empleados?.nombre_completo_empleado || 'Empleado'} solicitó ${v.tipo_solicitud || 'vacaciones'}`,
            estatus: v.estatus_vacacion,
            fecha: v.fecha_inicio
        }));

        const actividadIncidencias = ultimasIncidencias.map((i: any) => ({
            tipo: 'incidencia',
            descripcion: `Incidencia "${i.titulo || 'Sin título'}" registrada`,
            estatus: i.estatus,
            fecha: i.fecha_registro
        }));

        const actividadReciente = [...actividadVacaciones, ...actividadIncidencias]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 8);

        res.json({
            empleadosActivos,
            vacacionesPendientes,
            vacantesAbiertas,
            nominaMesActual: Number(ultimaNomina._sum.total_pagado || 0),
            actividadReciente
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
    }
};
