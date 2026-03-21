import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getOrganigrama = async (req: Request, res: Response) => {
    try {
        const areas = await prisma.areas.findMany({
            include: {
                empleados_areas_jefe_areaToempleados: true,
                empleados_empleados_idareaToareas: {
                    include: {
                        roles: true
                    }
                }
            }
        });

        // Formatear para el frontend
        const orgData = areas.map(area => ({
            id: area.idarea,
            nombre: area.nombre_area,
            jefe: area.empleados_areas_jefe_areaToempleados ? {
                id: area.empleados_areas_jefe_areaToempleados.idempleado,
                nombre: area.empleados_areas_jefe_areaToempleados.nombre_completo_empleado,
                puesto: area.empleados_areas_jefe_areaToempleados.puesto
            } : null,
            empleados: area.empleados_empleados_idareaToareas.map(emp => ({
                id: emp.idempleado,
                nombre: emp.nombre_completo_empleado,
                puesto: emp.puesto,
                rol: emp.roles?.nombre_rol,
                hierarchy: emp.roles?.hierarchy_level
            }))
        }));

        res.status(200).json(orgData);
    } catch (error) {
        console.error('Error al obtener organigrama:', error);
        res.status(500).json({ error: 'Error al obtener organigrama' });
    }
};
