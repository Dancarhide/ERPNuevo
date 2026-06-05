import { Request, Response } from 'express';
import { prisma } from '../prisma';

/**
 * GET /api/organigrama
 *
 * Devuelve la estructura jerárquica completa de la empresa:
 * - Todos los empleados activos con su rol (hierarchy_level) y área
 * - Agrupados por área
 * - Cada área incluye su jefe (jefe_area) si está definido
 * - Se ordenan los empleados por hierarchy_level ASC (más senior primero)
 * - Los empleados sin área se incluyen en un grupo especial "sinArea"
 */
export const getOrganigrama = async (_req: Request, res: Response) => {
    try {
        // 1. Cargar áreas con su jefe y sus empleados (activos)
        const areas = await prisma.areas.findMany({
            include: {
                // Jefe definido en el campo jefe_area del área
                empleados_areas_jefe_areaToempleados: {
                    include: { roles: true }
                },
                // Todos los empleados cuyo idarea = este área
                empleados_empleados_idareaToareas: {
                    where: {
                        estatus_empleado: 'Activo',
                        // Excluir super admin (hierarchy_level = 0)
                        roles: { hierarchy_level: { gt: 0 } },
                    },
                    include: { roles: true },
                    orderBy: [
                        // Ordenar por hierarchy_level del rol (ASC = más senior primero)
                        { roles: { hierarchy_level: 'asc' } },
                        { nombre_completo_empleado: 'asc' },
                    ],
                }
            },
            orderBy: { idarea: 'asc' },
        });

        // 2. Empleados activos SIN área asignada
        const sinAreaEmpleados = await prisma.empleados.findMany({
            where: {
                estatus_empleado: 'Activo',
                idarea: null,
                // Excluir super admin (hierarchy_level = 0)
                roles: { hierarchy_level: { gt: 0 } },
            },
            include: { roles: true },
            orderBy: [
                { roles: { hierarchy_level: 'asc' } },
                { nombre_completo_empleado: 'asc' },
            ],
        });

        // 3. Formatear áreas
        const orgAreas = areas.map(area => ({
            id:     area.idarea,
            nombre: area.nombre_area ?? 'Sin nombre',
            // El jefe del área — omitir si es super admin (hierarchy_level = 0)
            jefe: (() => {
                const j = area.empleados_areas_jefe_areaToempleados;
                if (!j) return null;
                if ((j.roles?.hierarchy_level ?? 1) <= 0) return null;
                return {
                    id:             j.idempleado,
                    nombre:         j.nombre_completo_empleado,
                    puesto:         j.puesto ?? null,
                    rol:            j.roles?.nombre_rol ?? null,
                    hierarchyLevel: j.roles?.hierarchy_level ?? null,
                    id_jefe_directo: j.id_jefe_directo,
                };
            })(),
            // Todos los empleados del área, ordenados por jerarquía
            empleados: area.empleados_empleados_idareaToareas.map(emp => ({
                id:             emp.idempleado,
                nombre:         emp.nombre_completo_empleado,
                puesto:         emp.puesto ?? null,
                rol:            emp.roles?.nombre_rol ?? null,
                hierarchyLevel: emp.roles?.hierarchy_level ?? 99,
                id_jefe_directo: emp.id_jefe_directo,
            })),
        }));

        // 4. Formatear empleados sin área
        const sinArea = sinAreaEmpleados.map(emp => ({
            id:             emp.idempleado,
            nombre:         emp.nombre_completo_empleado,
            puesto:         emp.puesto ?? null,
            rol:            emp.roles?.nombre_rol ?? null,
            hierarchyLevel: emp.roles?.hierarchy_level ?? 99,
                id_jefe_directo: emp.id_jefe_directo,
        }));

        res.status(200).json({ areas: orgAreas, sinArea });
    } catch (error) {
        console.error('Error al obtener organigrama:', error);
        res.status(500).json({ error: 'Error al obtener organigrama' });
    }
};

